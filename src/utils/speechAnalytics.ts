import type { ScoreMetric, ProfessionalMetrics } from '@/types/analyzeSpeech'
import type { AppMode } from '@/constants/studio'
import {
  sanitizeMispronunciations,
  type MispronunciationItem,
} from '@/utils/mispronunciationValidation'

const MAX_PHONETIC_EVENTS = 24

export type ScenarioCategory =
  | 'executive'
  | 'warmup'
  | 'clinical'
  | 'personalized'
  | 'check-in'

export type PhoneticEvent = MispronunciationItem

export type SpeechAnalyticsInsert = {
  session_mode: AppMode
  phoneme_focus: 'R' | 'S' | null
  scenario_category: ScenarioCategory | null
  executive_metrics: ScoreMetric[]
  clinical_metrics: ScoreMetric[]
  professional_metrics: ProfessionalMetrics | null
  phonetic_events: PhoneticEvent[]
  executive_score_avg: number | null
  clinical_score_avg: number | null
  pace_wpm: number | null
  filler_word_count: number | null
  recording_duration_ms: number | null
  transcript_word_count: number | null
  target_sentence_word_count: number | null
  content_fingerprint: string | null
}

function averageMetricPercent(metrics: ScoreMetric[]): number | null {
  if (metrics.length === 0) return null
  const total = metrics.reduce(
    (sum, metric) =>
      sum + (metric.score / (metric.maxScore > 0 ? metric.maxScore : 3)) * 100,
    0,
  )
  return Math.round((total / metrics.length) * 100) / 100
}

function countWords(text: string | null | undefined): number | null {
  if (!text?.trim()) return null
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Strip transcript snippets and coach prose before persisting to speech_analytics. */
export function sanitizeProfessionalMetricsForResearch(
  metrics: ProfessionalMetrics | null | undefined,
): ProfessionalMetrics | null {
  if (!metrics) return null

  return {
    pace: metrics.pace,
    fillerWords: {
      count: metrics.fillerWords.count,
      detected: [],
      score: metrics.fillerWords.score,
      maxScore: metrics.fillerWords.maxScore,
      status: metrics.fillerWords.status,
      statusLabel: metrics.fillerWords.statusLabel,
    },
    clarity: {
      score: metrics.clarity.score,
      maxScore: metrics.clarity.maxScore,
      status: metrics.clarity.status,
      statusLabel: metrics.clarity.statusLabel,
      summary: '',
    },
  }
}

function buildPhoneticEvents(
  items: MispronunciationItem[] | undefined,
  targetSentence: string | null | undefined,
  transcript: string,
): PhoneticEvent[] {
  if (!items?.length) return []

  const target = targetSentence?.trim() ?? ''
  const sanitized = sanitizeMispronunciations(items, target, transcript)

  return sanitized.slice(0, MAX_PHONETIC_EVENTS).map((item) => ({
    expected: item.expected,
    heard: item.heard,
  }))
}

/** Stable, non-reversible fingerprint for dedup — never includes transcript text. */
async function buildContentFingerprint(
  payload: Omit<SpeechAnalyticsInsert, 'content_fingerprint'>,
): Promise<string | null> {
  const canonical = JSON.stringify({
    session_mode: payload.session_mode,
    phoneme_focus: payload.phoneme_focus,
    scenario_category: payload.scenario_category,
    executive_score_avg: payload.executive_score_avg,
    clinical_score_avg: payload.clinical_score_avg,
    pace_wpm: payload.pace_wpm,
    filler_word_count: payload.filler_word_count,
    recording_duration_ms: payload.recording_duration_ms,
    transcript_word_count: payload.transcript_word_count,
    target_sentence_word_count: payload.target_sentence_word_count,
    executive_metrics: payload.executive_metrics,
    clinical_metrics: payload.clinical_metrics,
    phonetic_events: payload.phonetic_events,
  })

  if (!globalThis.crypto?.subtle) return null

  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical),
  )

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export type BuildSpeechAnalyticsInput = {
  mode: AppMode
  phonemeFocus?: 'R' | 'S' | null
  scenarioCategory?: ScenarioCategory | null
  transcript: string
  targetSentence?: string | null
  coachMetrics?: ScoreMetric[]
  clinicalMetrics?: ScoreMetric[]
  professionalMetrics?: ProfessionalMetrics
  mispronunciations?: MispronunciationItem[]
  recordingDurationMs?: number
}

export async function buildSpeechAnalyticsPayload(
  input: BuildSpeechAnalyticsInput,
): Promise<SpeechAnalyticsInsert> {
  const executiveMetrics = input.coachMetrics ?? []
  const clinicalMetrics = input.clinicalMetrics ?? []
  const professionalMetrics = sanitizeProfessionalMetricsForResearch(
    input.professionalMetrics,
  )
  const phoneticEvents = buildPhoneticEvents(
    input.mispronunciations,
    input.targetSentence,
    input.transcript,
  )

  const base: Omit<SpeechAnalyticsInsert, 'content_fingerprint'> = {
    session_mode: input.mode,
    phoneme_focus: input.phonemeFocus ?? null,
    scenario_category: input.scenarioCategory ?? null,
    executive_metrics: executiveMetrics,
    clinical_metrics: clinicalMetrics,
    professional_metrics: professionalMetrics,
    phonetic_events: phoneticEvents,
    executive_score_avg: averageMetricPercent(executiveMetrics),
    clinical_score_avg: averageMetricPercent(clinicalMetrics),
    pace_wpm: professionalMetrics?.pace.wpm ?? null,
    filler_word_count: professionalMetrics?.fillerWords.count ?? null,
    recording_duration_ms: input.recordingDurationMs ?? null,
    transcript_word_count: countWords(input.transcript),
    target_sentence_word_count: countWords(input.targetSentence),
  }

  return {
    ...base,
    content_fingerprint: await buildContentFingerprint(base),
  }
}
