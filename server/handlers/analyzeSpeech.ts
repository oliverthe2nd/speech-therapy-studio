import {
  buildSystemPrompt,
  buildUserMessage,
  BASELINE_PRACTICE_SENTENCE,
} from '../../supabase/functions/analyze-speech/prompts.ts'
import {
  buildProfessionalMetrics,
  parseProfessionalMetrics,
  professionalMetricsToScoreMetrics,
} from '../../supabase/functions/analyze-speech/professionalMetrics.ts'
import {
  patchFeedbackMarkdownMispronunciations,
  sanitizeMispronunciations,
  type MispronunciationItem,
} from '../../supabase/functions/analyze-speech/mispronunciationValidation.ts'
import type {
  AnalyzeSpeechRequest,
  AnalyzeSpeechResponse,
  ExecutiveDossier,
  GrowthRoadmap,
  SpeechAnalysis,
} from '../../supabase/functions/analyze-speech/types.ts'
import { normalizeCoachText } from '../../supabase/functions/analyze-speech/normalizeCoachText.ts'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

function parseRequestBody(raw: Record<string, unknown>): AnalyzeSpeechRequest {
  const transcript =
    (typeof raw.transcript === 'string' ? raw.transcript : '') ||
    (typeof raw.text === 'string' ? raw.text : '')

  if (!transcript.trim()) {
    throw new Error('Missing required field: transcript or text.')
  }

  const mode = raw.mode
  if (mode !== 'baseline' && mode !== 'practice') {
    throw new Error('Missing or invalid field: mode ("baseline" | "practice").')
  }

  const phonemeFocus =
    raw.phonemeFocus === 'R' || raw.phonemeFocus === 'S'
      ? raw.phonemeFocus
      : raw.phonemeFocus === null
        ? null
        : undefined

  const baselineStepRaw = raw.baselineStep
  const baselineStep =
    baselineStepRaw === 1 || baselineStepRaw === 2 || baselineStepRaw === 3
      ? baselineStepRaw
      : undefined

  let priorDossier: ExecutiveDossier | undefined
  if (raw.priorDossier && typeof raw.priorDossier === 'object') {
    const dossierRaw = raw.priorDossier as Record<string, unknown>
    priorDossier = {
      name: typeof dossierRaw.name === 'string' ? dossierRaw.name : null,
      title: typeof dossierRaw.title === 'string' ? dossierRaw.title : null,
      industry:
        typeof dossierRaw.industry === 'string' ? dossierRaw.industry : null,
      professionalFocus:
        typeof dossierRaw.professionalFocus === 'string'
          ? dossierRaw.professionalFocus
          : null,
      audienceContext:
        typeof dossierRaw.audienceContext === 'string'
          ? dossierRaw.audienceContext
          : null,
    }
  }

  return {
    transcript: transcript.trim(),
    mode,
    targetSentence:
      typeof raw.targetSentence === 'string' ? raw.targetSentence : undefined,
    phonemeFocus,
    recordingDurationMs:
      typeof raw.recordingDurationMs === 'number' &&
      Number.isFinite(raw.recordingDurationMs) &&
      raw.recordingDurationMs > 0
        ? Math.round(raw.recordingDurationMs)
        : undefined,
    baselineStep,
    priorDossier,
    activePhaseFocus:
      raw.activePhaseFocus === 1 ||
      raw.activePhaseFocus === 2 ||
      raw.activePhaseFocus === 3
        ? raw.activePhaseFocus
        : undefined,
  }
}

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
  apiKey: string,
): Promise<SpeechAnalysis> {
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Add it to your .env file.',
    )
  }

  const maxTokens =
    request.mode === 'baseline' && (request.baselineStep === 1 || request.baselineStep === 2)
      ? 1024
      : request.mode === 'baseline'
        ? 2048
        : 1536

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
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
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Claude API error: ${detail.slice(0, 500)}`)
  }

  const message = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>
  }

  const textBlock = message.content?.find((block) => block.type === 'text')
  if (!textBlock?.text?.trim()) {
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

export async function handleAnalyzeSpeech(
  raw: Record<string, unknown>,
  apiKey: string,
): Promise<AnalyzeSpeechResponse> {
  const request = parseRequestBody(raw)
  const analysis = await analyzeWithClaude(request, apiKey)

  return {
    transcript: request.transcript ?? request.text ?? '',
    analysis,
  }
}
