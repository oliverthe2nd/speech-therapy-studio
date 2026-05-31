/**
 * Supabase Edge Function: analyze-speech
 *
 * Securely calls Claude with the speech-coach system prompt.
 * Set secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * Local serve (after Supabase CLI setup):
 *   supabase functions serve analyze-speech --env-file supabase/.env.local
 *
 * Deploy (when ready):
 *   supabase functions deploy analyze-speech
 */

import Anthropic from 'npm:@anthropic-ai/sdk@^0.52.0'
import { buildSystemPrompt, buildUserMessage, BASELINE_PRACTICE_SENTENCE } from './prompts.ts'
import type {
  AnalyzeSpeechRequest,
  AnalyzeSpeechResponse,
  ErrorResponse,
  SpeechAnalysis,
} from './types.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

function jsonResponse(body: AnalyzeSpeechResponse | ErrorResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function parseRequestBody(raw: unknown): AnalyzeSpeechRequest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Request body must be a JSON object.')
  }

  const body = raw as Record<string, unknown>
  const transcript =
    (typeof body.transcript === 'string' ? body.transcript : '') ||
    (typeof body.text === 'string' ? body.text : '')

  if (!transcript.trim()) {
    throw new Error('Missing required field: transcript or text.')
  }

  const mode = body.mode
  if (mode !== 'baseline' && mode !== 'practice') {
    throw new Error('Missing or invalid field: mode ("baseline" | "practice").')
  }

  const phonemeFocus =
    body.phonemeFocus === 'R' || body.phonemeFocus === 'S'
      ? body.phonemeFocus
      : body.phonemeFocus === null
        ? null
        : undefined

  return {
    transcript: transcript.trim(),
    mode,
    targetSentence:
      typeof body.targetSentence === 'string'
        ? body.targetSentence
        : undefined,
    phonemeFocus,
  }
}

/** Strip optional ```json fences if the model wraps output */
function extractJsonText(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  return (fenced?.[1] ?? trimmed).trim()
}

function validateAnalysis(
  parsed: unknown,
  fallbackTargetSentence: string,
): SpeechAnalysis {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Claude returned invalid JSON (not an object).')
  }

  const data = parsed as Record<string, unknown>

  const metrics = Array.isArray(data.metrics)
    ? data.metrics.filter(
        (m) =>
          m &&
          typeof m === 'object' &&
          typeof (m as Record<string, unknown>).title === 'string',
      )
    : []

  const mispronunciations = Array.isArray(data.mispronunciations)
    ? data.mispronunciations.filter(
        (item) =>
          item &&
          typeof item === 'object' &&
          typeof (item as Record<string, unknown>).expected === 'string' &&
          typeof (item as Record<string, unknown>).heard === 'string',
      )
    : []

  const homework = Array.isArray(data.homework)
    ? data.homework
        .filter(
          (item) =>
            item &&
            typeof item === 'object' &&
            typeof (item as Record<string, unknown>).label === 'string',
        )
        .map((item) => ({
          label: String((item as Record<string, unknown>).label),
        }))
    : []

  const feedbackMarkdown =
    typeof data.feedbackMarkdown === 'string'
      ? data.feedbackMarkdown.trim()
      : ''

  if (!feedbackMarkdown) {
    throw new Error('Claude JSON missing feedbackMarkdown.')
  }

  return {
    targetSentence:
      typeof data.targetSentence === 'string' && data.targetSentence.trim()
        ? data.targetSentence.trim()
        : fallbackTargetSentence,
    metrics: metrics as SpeechAnalysis['metrics'],
    coachHeardText:
      typeof data.coachHeardText === 'string' ? data.coachHeardText.trim() : '',
    mispronunciations: mispronunciations as SpeechAnalysis['mispronunciations'],
    coachingTip:
      typeof data.coachingTip === 'string' ? data.coachingTip.trim() : '',
    homework,
    feedbackMarkdown,
  }
}

async function analyzeWithClaude(
  request: AnalyzeSpeechRequest,
): Promise<SpeechAnalysis> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Run: npm run deploy:speech-functions (or supabase secrets set ANTHROPIC_API_KEY=sk-ant-...)',
    )
  }

  const anthropic = new Anthropic({ apiKey })
  const maxTokens = request.mode === 'baseline' ? 2048 : 1536

  let message
  try {
    message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: buildSystemPrompt(request.mode),
      messages: [
        {
          role: 'user',
          content: buildUserMessage(
            request.transcript ?? request.text ?? '',
            request.mode,
            request.targetSentence,
            request.phonemeFocus,
          ),
        },
      ],
    })
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'Anthropic API request failed.'
    throw new Error(`Claude API error: ${detail}`)
  }

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
    throw new Error('Claude returned an empty response.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(extractJsonText(textBlock.text))
  } catch {
    const fallbackTarget =
      request.targetSentence ??
      (request.mode === 'baseline' ? BASELINE_PRACTICE_SENTENCE : '')

    return {
      targetSentence: fallbackTarget,
      metrics: [],
      coachHeardText: textBlock.text.trim(),
      mispronunciations: [],
      coachingTip: '',
      homework: [],
      feedbackMarkdown: textBlock.text.trim(),
    }
  }

  const fallbackTarget =
    request.mode === 'baseline'
      ? request.targetSentence ?? ''
      : request.targetSentence ?? ''

  return validateAnalysis(parsed, fallbackTarget)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405)
  }

  try {
    const request = parseRequestBody(await req.json())
    const analysis = await analyzeWithClaude(request)

    const response: AnalyzeSpeechResponse = {
      transcript: request.transcript ?? request.text ?? '',
      analysis,
    }

    return jsonResponse(response)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    console.error('[analyze-speech]', message)
    return jsonResponse({ error: message }, 400)
  }
})
