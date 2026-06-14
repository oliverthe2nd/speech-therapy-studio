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
import {
  buildProfessionalMetrics,
  parseProfessionalMetrics,
  professionalMetricsToScoreMetrics,
} from './professionalMetrics.ts'
import {
  patchFeedbackMarkdownMispronunciations,
  sanitizeMispronunciations,
  type MispronunciationItem,
} from './mispronunciationValidation.ts'
import type {
  AnalyzeSpeechRequest,
  AnalyzeSpeechResponse,
  ErrorResponse,
  ExecutiveDossier,
  GrowthRoadmap,
  SpeechAnalysis,
} from './types.ts'
import { normalizeCoachText } from './normalizeCoachText.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CLAUDE_MODEL = 'claude-sonnet-4-6'

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

  const baselineStepRaw = body.baselineStep
  const baselineStep =
    baselineStepRaw === 1 || baselineStepRaw === 2 || baselineStepRaw === 3
      ? baselineStepRaw
      : undefined

  let priorDossier: ExecutiveDossier | undefined
  if (body.priorDossier && typeof body.priorDossier === 'object') {
    const raw = body.priorDossier as Record<string, unknown>
    priorDossier = {
      name: typeof raw.name === 'string' ? raw.name : null,
      title: typeof raw.title === 'string' ? raw.title : null,
      industry: typeof raw.industry === 'string' ? raw.industry : null,
      professionalFocus:
        typeof raw.professionalFocus === 'string' ? raw.professionalFocus : null,
      audienceContext:
        typeof raw.audienceContext === 'string' ? raw.audienceContext : null,
    }
  }

  return {
    transcript: transcript.trim(),
    mode,
    targetSentence:
      typeof body.targetSentence === 'string'
        ? body.targetSentence
        : undefined,
    phonemeFocus,
    recordingDurationMs:
      typeof body.recordingDurationMs === 'number' &&
      Number.isFinite(body.recordingDurationMs) &&
      body.recordingDurationMs > 0
        ? Math.round(body.recordingDurationMs)
        : undefined,
    baselineStep,
    priorDossier,
    activePhaseFocus:
      body.activePhaseFocus === 1 ||
      body.activePhaseFocus === 2 ||
      body.activePhaseFocus === 3
        ? body.activePhaseFocus
        : undefined,
  }
}

/** Strip optional ```json fences if the model wraps output */
function extractJsonText(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  return (fenced?.[1] ?? trimmed).trim()
}

function normalizeMetricsArray(raw: unknown[]): SpeechAnalysis['metrics'] {
  const metrics: SpeechAnalysis['metrics'] = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    if (typeof record.title !== 'string') continue

    const maxScore =
      typeof record.maxScore === 'number' && record.maxScore > 0
        ? record.maxScore
        : 3
    const score =
      typeof record.score === 'number'
        ? record.score
        : Number(record.score) || 1
    const clampedScore = Math.min(maxScore, Math.max(1, score))
    const key = record.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const status =
      record.status === 'excellent' ||
      record.status === 'good' ||
      record.status === 'needs-practice'
        ? record.status
        : clampedScore >= maxScore
          ? 'excellent'
          : clampedScore >= maxScore - 1
            ? 'good'
            : 'needs-practice'

    metrics.push({
      title: record.title.trim(),
      score: clampedScore,
      maxScore,
      status,
      statusLabel:
        typeof record.statusLabel === 'string'
          ? record.statusLabel.trim()
          : status,
    })
  }

  return metrics
}

function parseExecutiveDossier(raw: unknown): ExecutiveDossier | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const record = raw as Record<string, unknown>
  const dossier: ExecutiveDossier = {}
  if (typeof record.name === 'string' && record.name.trim()) {
    dossier.name = record.name.trim()
  }
  if (typeof record.title === 'string' && record.title.trim()) {
    dossier.title = record.title.trim()
  }
  if (typeof record.industry === 'string' && record.industry.trim()) {
    dossier.industry = record.industry.trim()
  }
  if (typeof record.professionalFocus === 'string' && record.professionalFocus.trim()) {
    dossier.professionalFocus = record.professionalFocus.trim()
  }
  if (typeof record.audienceContext === 'string' && record.audienceContext.trim()) {
    dossier.audienceContext = record.audienceContext.trim()
  }
  return Object.keys(dossier).length > 0 ? dossier : undefined
}

function parseGrowthRoadmap(raw: unknown): GrowthRoadmap | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const record = raw as Record<string, unknown>

  const strengths = Array.isArray(record.strengths)
    ? record.strengths.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  const blindspots = Array.isArray(record.blindspots)
    ? record.blindspots.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
  const phases = Array.isArray(record.phases)
    ? record.phases
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const phase = item as Record<string, unknown>
          return {
            phase: typeof phase.phase === 'string' ? phase.phase.trim() : 'Phase',
            title: typeof phase.title === 'string' ? phase.title.trim() : '',
            focus: typeof phase.focus === 'string' ? phase.focus.trim() : '',
            duration: typeof phase.duration === 'string' ? phase.duration.trim() : '',
          }
        })
        .filter((item) => item.title || item.focus)
    : []

  if (strengths.length === 0 && blindspots.length === 0 && phases.length === 0) {
    return undefined
  }

  return { strengths, blindspots, phases }
}

function mergeDossier(
  prior: ExecutiveDossier | undefined,
  extracted: ExecutiveDossier | undefined,
): ExecutiveDossier | undefined {
  const merged: ExecutiveDossier = { ...prior, ...extracted }
  return Object.values(merged).some((value) => typeof value === 'string' && value.trim())
    ? merged
    : undefined
}

function validateAnalysis(
  parsed: unknown,
  fallbackTargetSentence: string,
  transcript: string,
  recordingDurationMs?: number,
  baselineStep?: 1 | 2 | 3,
  priorDossier?: ExecutiveDossier,
): SpeechAnalysis {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Claude returned invalid JSON (not an object).')
  }

  const data = parsed as Record<string, unknown>

  const metrics = Array.isArray(data.metrics)
    ? normalizeMetricsArray(data.metrics)
    : []

  const clinicalMetrics = Array.isArray(data.clinicalMetrics)
    ? normalizeMetricsArray(data.clinicalMetrics)
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

  const rawMispronunciations = mispronunciations as MispronunciationItem[]
  const targetSentence =
    fallbackTargetSentence.trim() ||
    (typeof data.targetSentence === 'string' ? data.targetSentence.trim() : '')

  const sanitizedMispronunciations = sanitizeMispronunciations(
    rawMispronunciations,
    targetSentence,
    transcript,
  )

  const removedMispronunciations = rawMispronunciations.filter(
    (item) =>
      !sanitizedMispronunciations.some(
        (kept) =>
          kept.expected === item.expected.trim() &&
          kept.heard === item.heard.trim(),
      ),
  )

  let feedbackMarkdown =
    typeof data.feedbackMarkdown === 'string'
      ? data.feedbackMarkdown.trim()
      : ''

  if (!feedbackMarkdown) {
    throw new Error('Claude JSON missing feedbackMarkdown.')
  }

  if (removedMispronunciations.length > 0) {
    feedbackMarkdown = patchFeedbackMarkdownMispronunciations(
      feedbackMarkdown,
      removedMispronunciations,
    )
  }

  const aiProfessional = parseProfessionalMetrics(data.professionalMetrics)
  const isProfileStep = baselineStep === 1 || baselineStep === 2

  const professionalMetrics = isProfileStep
    ? buildProfessionalMetrics(transcript, recordingDurationMs, {})
    : buildProfessionalMetrics(transcript, recordingDurationMs, aiProfessional)

  const mergedMetrics = isProfileStep
    ? []
    : metrics.length > 0
      ? (metrics as SpeechAnalysis['metrics'])
      : professionalMetricsToScoreMetrics(professionalMetrics)

  const executiveDossier = mergeDossier(
    priorDossier,
    parseExecutiveDossier(data.executiveDossier),
  )
  const growthRoadmap = parseGrowthRoadmap(data.growthRoadmap)

  return {
    targetSentence,
    metrics: mergedMetrics,
    clinicalMetrics: isProfileStep ? [] : clinicalMetrics,
    professionalMetrics,
    executiveDossier,
    growthRoadmap,
    coachHeardText: normalizeCoachText(
      typeof data.coachHeardText === 'string' ? data.coachHeardText : '',
    ),
    mispronunciations: sanitizedMispronunciations,
    coachingTip: normalizeCoachText(
      typeof data.coachingTip === 'string' ? data.coachingTip : '',
    ),
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
  const maxTokens =
    request.mode === 'baseline' && (request.baselineStep === 1 || request.baselineStep === 2)
      ? 1024
      : request.mode === 'baseline'
        ? 2048
        : 1536

  let message
  try {
    message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: buildSystemPrompt(request.mode, request.baselineStep),
      messages: [
        {
          role: 'user',
          content: buildUserMessage(
            request.transcript ?? request.text ?? '',
            request.mode,
            request.targetSentence,
            request.phonemeFocus,
            request.recordingDurationMs,
            request.baselineStep,
            request.priorDossier as Record<string, unknown> | undefined,
            request.activePhaseFocus,
          ),
        },
      ],
    })
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'Anthropic API request failed.'
    if (detail.includes('401') || detail.includes('authentication_error') || detail.includes('invalid x-api-key')) {
      throw new Error(
        'Anthropic API key rejected (401). Update Supabase secret, then redeploy speech functions.',
      )
    }
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
      clinicalMetrics: [],
      professionalMetrics: buildProfessionalMetrics(
        request.transcript ?? request.text ?? '',
        request.recordingDurationMs,
        {},
      ),
      coachHeardText: textBlock.text.trim(),
      mispronunciations: [],
      coachingTip: '',
      homework: [],
      feedbackMarkdown: textBlock.text.trim(),
    }
  }

  const fallbackTarget =
    request.mode === 'baseline'
      ? request.targetSentence?.trim() ||
        (request.baselineStep === 3 ? BASELINE_PRACTICE_SENTENCE : '')
      : request.targetSentence?.trim() ?? ''

  return validateAnalysis(
    parsed,
    fallbackTarget,
    request.transcript ?? request.text ?? '',
    request.recordingDurationMs,
    request.baselineStep,
    request.priorDossier,
  )
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
