import { createClient } from '@supabase/supabase-js'
import type { AppMode, PhonemeFocus } from './constants/studio'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
)

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
  transcript: string
  feedback: string
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
  'id, session_mode, is_baseline, target_sentence, phoneme_focus, transcript, feedback, created_at'

const SESSION_SELECT_FALLBACK =
  'id, is_baseline, target_sentence, phoneme_focus, transcript, feedback, created_at'

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

function buildInsertPayload(session: LogSpeechSessionInput, isBaseline: boolean) {
  return {
    session_mode: session.mode,
    is_baseline: isBaseline,
    target_sentence: session.targetSentence,
    phoneme_focus: session.phonemeFocus ?? null,
    transcript: session.transcript,
    feedback: session.feedback,
    ai_feedback: isBaseline ? session.feedback : null,
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
    ai_feedback: isBaseline ? session.feedback : null,
  }
}

export async function logSpeechSession(session: LogSpeechSessionInput) {
  const isBaseline = session.mode === 'baseline'

  let result = await supabase
    .from('sessions')
    .insert(buildInsertPayload(session, isBaseline))
    .select(SESSION_SELECT_WITH_MODE)
    .single()

  if (result.error && isMissingSessionModeColumn(result.error.message)) {
    result = await supabase
      .from('sessions')
      .insert(buildInsertPayloadFallback(session, isBaseline))
      .select(SESSION_SELECT_FALLBACK)
      .single()
  }

  if (result.error) {
    throw new Error(result.error.message)
  }

  return mapSessionRow(result.data as SessionRow)
}

export async function fetchLatestBaselineProfile(): Promise<BaselineProfile | null> {
  let query = supabase
    .from('sessions')
    .select('id, ai_feedback, feedback, created_at, is_baseline, session_mode')
    .or('is_baseline.eq.true,session_mode.eq.baseline')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let { data, error } = await query

  if (error && isMissingSessionModeColumn(error.message)) {
    ;({ data, error } = await supabase
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

  if (!data) return null

  const aiFeedback =
    (data.ai_feedback as string | null) ??
    (data.feedback as string | null) ??
    ''

  if (!aiFeedback.trim()) return null

  return {
    id: data.id as string,
    aiFeedback: aiFeedback.trim(),
    createdAt: data.created_at as string,
  }
}

export async function fetchSessionHistory(limit = 50): Promise<SpeechSession[]> {
  const primary = await supabase
    .from('sessions')
    .select(SESSION_SELECT_WITH_MODE)
    .order('created_at', { ascending: false })
    .limit(limit)

  let rows: SessionRow[] | null = (primary.data ?? null) as SessionRow[] | null
  let error = primary.error

  if (error && isMissingSessionModeColumn(error.message)) {
    const fallback = await supabase
      .from('sessions')
      .select(SESSION_SELECT_FALLBACK)
      .order('created_at', { ascending: false })
      .limit(limit)
    rows = (fallback.data ?? null) as SessionRow[] | null
    error = fallback.error
  }

  if (error) {
    throw new Error(
      `${error.message} — Run supabase/migrations/005_fix_session_mode_column.sql in your Supabase SQL Editor.`,
    )
  }

  return ((rows ?? []) as SessionRow[]).map(mapSessionRow)
}

export async function fetchPastPracticeSentences(limit = 80): Promise<string[]> {
  const { data, error } = await supabase
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
