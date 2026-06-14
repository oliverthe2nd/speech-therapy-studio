import { db } from '@/lib/dbClient'
import type { AppMode, PhonemeFocus } from '@/constants/studio'
import type { BaselineStep } from '@/constants/baselineFlow'
import type {
  ScoreMetric,
  ProfessionalMetrics,
  MispronunciationItem,
  ExecutiveDossier,
  GrowthRoadmap,
} from '@/types/analyzeSpeech'
import { buildSpeechAnalyticsPayload } from '@/utils/speechAnalytics'
import {
  DEFAULT_PHASE_FOCUS,
  parsePhaseFocus,
  type PhaseFocus,
} from '@/utils/phaseFocus'
export type { PhaseFocus } from '@/utils/phaseFocus'
export type { ScenarioCategory } from '@/utils/speechAnalytics'
import type { ScenarioCategory } from '@/utils/speechAnalytics'

export type SpeechSession = {
  id?: string
  mode: AppMode
  is_baseline?: boolean
  target_sentence: string | null
  phoneme_focus: PhonemeFocus | null
  transcript: string
  feedback: string
  ai_feedback?: string | null
  created_at?: string
}

export type BaselineProfile = {
  id: string
  aiFeedback: string
  createdAt: string
}

export type LogSpeechSessionInput = {
  mode: AppMode
  targetSentence: string | null
  phonemeFocus?: PhonemeFocus | null
  scenarioCategory?: ScenarioCategory | null
  transcript: string
  feedback: string
  coachMetrics?: ScoreMetric[]
  clinicalMetrics?: ScoreMetric[]
  professionalMetrics?: ProfessionalMetrics
  mispronunciations?: MispronunciationItem[]
  recordingDurationMs?: number
  baselineStep?: BaselineStep
}

export type StoredExecutiveDossier = ExecutiveDossier & {
  strengths: string[]
  blindspots: string[]
  growthPhases: GrowthRoadmap['phases']
  activePhaseFocus: PhaseFocus
  baselineCompletedAt: string | null
  updatedAt: string
}

const CLIENT_KEY_STORAGE = 'speakflow_client_key'

export function getSpeakFlowClientKey(): string {
  if (typeof window === 'undefined') return 'server'
  const existing = window.localStorage.getItem(CLIENT_KEY_STORAGE)
  if (existing?.trim()) return existing.trim()
  const created =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.localStorage.setItem(CLIENT_KEY_STORAGE, created)
  return created
}

type SessionRow = {
  id: string
  session_mode?: AppMode | null
  is_baseline?: boolean | null
  target_sentence?: string | null
  phoneme_focus?: PhonemeFocus | null
  transcript: string
  feedback: string
  ai_feedback?: string | null
  created_at: string
}

const SESSION_SELECT_WITH_MODE =
  'id, session_mode, is_baseline, target_sentence, phoneme_focus, transcript, feedback, ai_feedback, created_at'

const SESSION_SELECT_FALLBACK =
  'id, is_baseline, target_sentence, phoneme_focus, transcript, feedback, ai_feedback, created_at'

function isMissingSessionModeColumn(message: string): boolean {
  return /session_mode/i.test(message) && /does not exist/i.test(message)
}

function mapSessionRow(row: SessionRow): SpeechSession {
  const mode: AppMode =
    row.session_mode ??
    (row.is_baseline ? 'baseline' : 'practice')

  return {
    id: row.id,
    mode,
    is_baseline: row.is_baseline ?? undefined,
    target_sentence: row.target_sentence ?? null,
    phoneme_focus: row.phoneme_focus ?? null,
    transcript: row.transcript,
    feedback: row.feedback,
    ai_feedback: row.ai_feedback,
    created_at: row.created_at,
  }
}

function buildCoachMetricsPayload(
  session: LogSpeechSessionInput,
  isBaseline: boolean,
): string | null {
  if (isBaseline) return session.feedback
  if (session.coachMetrics?.length || session.clinicalMetrics?.length || session.professionalMetrics) {
    return JSON.stringify({
      v: 2,
      metrics: session.coachMetrics ?? [],
      clinicalMetrics: session.clinicalMetrics ?? [],
      professionalMetrics: session.professionalMetrics ?? null,
    })
  }
  return null
}

function buildInsertPayload(session: LogSpeechSessionInput, isBaseline: boolean) {
  return {
    session_mode: session.mode,
    is_baseline: isBaseline,
    baseline_step: session.baselineStep ?? null,
    target_sentence: session.targetSentence,
    phoneme_focus: session.phonemeFocus ?? null,
    transcript: session.transcript,
    feedback: session.feedback,
    ai_feedback: buildCoachMetricsPayload(session, isBaseline),
  }
}

function buildInsertPayloadFallback(
  session: LogSpeechSessionInput,
  isBaseline: boolean,
) {
  return {
    is_baseline: isBaseline,
    target_sentence: session.targetSentence,
    phoneme_focus: session.phonemeFocus ?? null,
    transcript: session.transcript,
    feedback: session.feedback,
    ai_feedback: buildCoachMetricsPayload(session, isBaseline),
  }
}

function isMissingSpeechAnalyticsTable(message: string): boolean {
  return /speech_analytics/i.test(message) && /does not exist/i.test(message)
}

async function logSpeechAnalytics(session: LogSpeechSessionInput): Promise<void> {
  const payload = await buildSpeechAnalyticsPayload({
    mode: session.mode,
    phonemeFocus: session.phonemeFocus,
    scenarioCategory: session.scenarioCategory,
    transcript: session.transcript,
    targetSentence: session.targetSentence,
    coachMetrics: session.coachMetrics,
    clinicalMetrics: session.clinicalMetrics,
    professionalMetrics: session.professionalMetrics,
    mispronunciations: session.mispronunciations,
    recordingDurationMs: session.recordingDurationMs,
  })

  const { error } = await db.from('speech_analytics').insert(payload)

  if (error) {
    if (isMissingSpeechAnalyticsTable(error.message)) {
      console.warn(
        'speech_analytics table missing — run migration.sql against your Neon database.',
      )
      return
    }
    throw new Error(error.message)
  }
}

export async function logSpeechSession(session: LogSpeechSessionInput) {
  const isBenchmarkComplete =
    session.mode === 'baseline' && session.baselineStep === 3
  const isBaseline = isBenchmarkComplete

  let result = await db
    .from('sessions')
    .insert(buildInsertPayload(session, isBaseline))
    .select(SESSION_SELECT_WITH_MODE)
    .single()

  if (result.error && isMissingSessionModeColumn(result.error.message)) {
    result = await db
      .from('sessions')
      .insert(buildInsertPayloadFallback(session, isBaseline))
      .select(SESSION_SELECT_FALLBACK)
      .single()
  }

  if (result.error) {
    const missingBaselineStep =
      /baseline_step/i.test(result.error.message) &&
      /does not exist/i.test(result.error.message)
    if (missingBaselineStep) {
      const { baseline_step: _removed, ...withoutStep } = buildInsertPayload(
        session,
        isBaseline,
      )
      result = await db
        .from('sessions')
        .insert(withoutStep)
        .select(SESSION_SELECT_WITH_MODE)
        .single()
    }
  }

  if (result.error) {
    throw new Error(result.error.message)
  }

  try {
    await logSpeechAnalytics(session)
  } catch (analyticsError) {
    console.warn('Anonymous analytics write failed:', analyticsError)
  }

  return mapSessionRow(result.data as SessionRow)
}

export async function fetchLatestBaselineProfile(): Promise<BaselineProfile | null> {
  let query = db
    .from('sessions')
    .select('id, ai_feedback, feedback, created_at, is_baseline, session_mode, baseline_step')
    .or('is_baseline.eq.true,session_mode.eq.baseline')
    .order('created_at', { ascending: false })
    .limit(20)

  let { data, error } = await query

  if (error && isMissingSessionModeColumn(error.message)) {
    ;({ data, error } = await db
      .from('sessions')
      .select('id, ai_feedback, feedback, created_at, is_baseline')
      .eq('is_baseline', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle())
  }

  if (error) {
    throw new Error(error.message)
  }

  const rows = Array.isArray(data) ? data : data ? [data] : []
  const benchmark = rows.find((row) => {
    const step = row.baseline_step as number | null | undefined
    if (step === 3) return true
    if (step == null && row.is_baseline === true) return true
    return false
  })

  if (!benchmark) return null

  const aiFeedback =
    (benchmark.ai_feedback as string | null) ??
    (benchmark.feedback as string | null) ??
    ''

  if (!aiFeedback.trim()) return null

  return {
    id: benchmark.id as string,
    aiFeedback: aiFeedback.trim(),
    createdAt: benchmark.created_at as string,
  }
}

function isMissingExecutiveDossierTable(message: string): boolean {
  return /executive_dossier/i.test(message) && /does not exist/i.test(message)
}

type DossierRow = {
  name?: string | null
  title?: string | null
  industry?: string | null
  professional_focus?: string | null
  audience_context?: string | null
  strengths?: unknown
  blindspots?: unknown
  growth_phases?: unknown
  active_phase_focus?: number | null
  baseline_completed_at?: string | null
  updated_at?: string
}

function mapDossierRow(row: DossierRow): StoredExecutiveDossier {
  const strengths = Array.isArray(row.strengths)
    ? row.strengths.filter((item): item is string => typeof item === 'string')
    : []
  const blindspots = Array.isArray(row.blindspots)
    ? row.blindspots.filter((item): item is string => typeof item === 'string')
    : []
  const growthPhases = Array.isArray(row.growth_phases)
    ? row.growth_phases
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const phase = item as Record<string, unknown>
          return {
            phase: String(phase.phase ?? 'Phase'),
            title: String(phase.title ?? ''),
            focus: String(phase.focus ?? ''),
            duration: String(phase.duration ?? ''),
          }
        })
    : []

  return {
    name: row.name ?? null,
    title: row.title ?? null,
    industry: row.industry ?? null,
    professionalFocus: row.professional_focus ?? null,
    audienceContext: row.audience_context ?? null,
    strengths,
    blindspots,
    growthPhases,
    activePhaseFocus: parsePhaseFocus(
      row.active_phase_focus ?? DEFAULT_PHASE_FOCUS,
    ),
    baselineCompletedAt: row.baseline_completed_at ?? null,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

export async function fetchExecutiveDossier(): Promise<StoredExecutiveDossier | null> {
  const clientKey = getSpeakFlowClientKey()
  const { data, error } = await db
    .from('executive_dossier')
    .select(
      'name, title, industry, professional_focus, audience_context, strengths, blindspots, growth_phases, active_phase_focus, baseline_completed_at, updated_at',
    )
    .eq('client_key', clientKey)
    .maybeSingle()

  if (error) {
    if (isMissingExecutiveDossierTable(error.message)) {
      console.warn(
        'executive_dossier table missing — run migration.sql against your Neon database.',
      )
      return null
    }
    throw new Error(error.message)
  }

  if (!data) return null
  return mapDossierRow(data as DossierRow)
}

export type UpsertExecutiveDossierInput = {
  dossier?: ExecutiveDossier
  growthRoadmap?: GrowthRoadmap
  markBaselineComplete?: boolean
  activePhaseFocus?: PhaseFocus
}

export async function upsertExecutiveDossier(
  input: UpsertExecutiveDossierInput,
): Promise<void> {
  const clientKey = getSpeakFlowClientKey()
  const existing = await fetchExecutiveDossier()

  const mergedProfile: ExecutiveDossier = {
    name: input.dossier?.name ?? existing?.name ?? null,
    title: input.dossier?.title ?? existing?.title ?? null,
    industry: input.dossier?.industry ?? existing?.industry ?? null,
    professionalFocus:
      input.dossier?.professionalFocus ?? existing?.professionalFocus ?? null,
    audienceContext:
      input.dossier?.audienceContext ?? existing?.audienceContext ?? null,
  }

  const payload = {
    client_key: clientKey,
    name: mergedProfile.name,
    title: mergedProfile.title,
    industry: mergedProfile.industry,
    professional_focus: mergedProfile.professionalFocus,
    audience_context: mergedProfile.audienceContext,
    strengths: input.growthRoadmap?.strengths ?? existing?.strengths ?? [],
    blindspots: input.growthRoadmap?.blindspots ?? existing?.blindspots ?? [],
    growth_phases: input.growthRoadmap?.phases ?? existing?.growthPhases ?? [],
    active_phase_focus:
      input.activePhaseFocus ??
      existing?.activePhaseFocus ??
      DEFAULT_PHASE_FOCUS,
    baseline_completed_at: input.markBaselineComplete
      ? new Date().toISOString()
      : existing?.baselineCompletedAt ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await db.from('executive_dossier').upsert(payload, {
    onConflict: 'client_key',
  })

  if (error) {
    if (isMissingExecutiveDossierTable(error.message)) {
      console.warn(
        'executive_dossier table missing — run migration.sql against your Neon database.',
      )
      return
    }
    throw new Error(error.message)
  }
}

export async function updateActivePhaseFocus(phase: PhaseFocus): Promise<void> {
  const clientKey = getSpeakFlowClientKey()
  const existing = await fetchExecutiveDossier()

  const payload = {
    client_key: clientKey,
    name: existing?.name ?? null,
    title: existing?.title ?? null,
    industry: existing?.industry ?? null,
    professional_focus: existing?.professionalFocus ?? null,
    audience_context: existing?.audienceContext ?? null,
    strengths: existing?.strengths ?? [],
    blindspots: existing?.blindspots ?? [],
    growth_phases: existing?.growthPhases ?? [],
    active_phase_focus: phase,
    baseline_completed_at: existing?.baselineCompletedAt ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await db.from('executive_dossier').upsert(payload, {
    onConflict: 'client_key',
  })

  if (error) {
    if (isMissingExecutiveDossierTable(error.message)) {
      console.warn(
        'executive_dossier table missing — run migration.sql against your Neon database.',
      )
      return
    }
    throw new Error(error.message)
  }
}

export async function fetchSessionHistory(limit = 50): Promise<SpeechSession[]> {
  const primary = await db
    .from('sessions')
    .select(SESSION_SELECT_WITH_MODE)
    .order('created_at', { ascending: false })
    .limit(limit)

  let rows: SessionRow[] | null = (primary.data ?? null) as SessionRow[] | null
  let error = primary.error

  if (error && isMissingSessionModeColumn(error.message)) {
    const fallback = await db
      .from('sessions')
      .select(SESSION_SELECT_FALLBACK)
      .order('created_at', { ascending: false })
      .limit(limit)
    rows = (fallback.data ?? null) as SessionRow[] | null
    error = fallback.error
  }

  if (error) {
    throw new Error(
      `${error.message} — Run migration.sql in your Neon SQL editor.`,
    )
  }

  return ((rows ?? []) as SessionRow[]).map(mapSessionRow)
}

export type CachedPersonalizedDrills = {
  sentences: string[]
  focusAreas: string[]
  updatedAt: string
}

function isMissingDrillCacheTable(message: string): boolean {
  return /personalized_drill_cache/i.test(message) && /does not exist/i.test(message)
}

export async function fetchCachedPersonalizedDrills(
  baselineSessionId: string,
): Promise<CachedPersonalizedDrills | null> {
  const { data, error } = await db
    .from('personalized_drill_cache')
    .select('sentences, focus_areas, updated_at')
    .eq('baseline_session_id', baselineSessionId)
    .maybeSingle()

  if (error) {
    if (isMissingDrillCacheTable(error.message)) {
      console.warn(
        'personalized_drill_cache table missing — run migration.sql against your Neon database.',
      )
      return null
    }
    throw new Error(error.message)
  }

  if (!data) return null

  const sentences = Array.isArray(data.sentences)
    ? (data.sentences as unknown[]).filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : []

  const focusAreas = Array.isArray(data.focus_areas)
    ? (data.focus_areas as unknown[]).filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : []

  if (sentences.length === 0) return null

  return {
    sentences,
    focusAreas,
    updatedAt: (data.updated_at as string) ?? new Date().toISOString(),
  }
}

export async function upsertCachedPersonalizedDrills(
  baselineSessionId: string,
  sentences: string[],
  focusAreas: string[],
): Promise<void> {
  const { error } = await db.from('personalized_drill_cache').upsert(
    {
      baseline_session_id: baselineSessionId,
      sentences,
      focus_areas: focusAreas,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'baseline_session_id' },
  )

  if (error) {
    if (isMissingDrillCacheTable(error.message)) {
      console.warn(
        'personalized_drill_cache table missing — run migration.sql against your Neon database.',
      )
      return
    }
    throw new Error(error.message)
  }
}

export async function fetchPastPracticeSentences(limit = 80): Promise<string[]> {
  const { data, error } = await db
    .from('sessions')
    .select('target_sentence, session_mode, is_baseline')
    .not('target_sentence', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? [])
    .filter((row) => {
      const isBaseline =
        row.is_baseline === true || row.session_mode === 'baseline'
      return !isBaseline && typeof row.target_sentence === 'string'
    })
    .map((row) => (row.target_sentence as string).trim())
    .filter(Boolean)
}
