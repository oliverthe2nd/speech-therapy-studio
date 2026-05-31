import { useState } from 'react'
import { ChevronDown, ChevronUp, History, Loader2, TrendingUp } from 'lucide-react'
import type { SpeechSession } from '../supabaseClient'
import { SpeechFeedbackDashboard } from './SpeechFeedbackDashboard'

type SessionHistoryPanelProps = {
  sessions: SpeechSession[]
  loading: boolean
  error: string | null
  practiceCount: number
  checkInCount: number
}

function formatSessionDate(iso: string | undefined): string {
  if (!iso) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function isCheckIn(session: SpeechSession): boolean {
  return session.is_baseline === true || session.mode === 'baseline'
}

function sessionLabel(session: SpeechSession): string {
  if (isCheckIn(session)) return 'Speech pattern check-in'
  if (session.phoneme_focus) {
    return `${session.phoneme_focus}-sound practice drill`
  }
  return 'Personalized practice drill'
}

function SessionRow({ session }: { session: SpeechSession }) {
  const [expanded, setExpanded] = useState(false)
  const checkIn = isCheckIn(session)

  return (
    <li className="rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-5"
        aria-expanded={expanded}
      >
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
            checkIn
              ? 'bg-checkin-muted text-checkin-foreground'
              : 'bg-primary-muted text-primary'
          }`}
        >
          {checkIn ? '✓' : '★'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {sessionLabel(session)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatSessionDate(session.created_at)}
            </span>
          </span>
          {session.target_sentence && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              “{session.target_sentence}”
            </p>
          )}
          {session.transcript && (
            <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground">
              You said: “{session.transcript}”
            </p>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>

      {expanded && session.feedback && (
        <div className="border-t border-border px-2 pb-4 pt-2 sm:px-3 sm:pb-5">
          <SpeechFeedbackDashboard
            mode={checkIn ? 'baseline' : 'practice'}
            targetSentence={session.target_sentence ?? ''}
            transcript={session.transcript ?? ''}
            feedback={session.feedback}
          />
        </div>
      )}
    </li>
  )
}

export function SessionHistoryPanel({
  sessions,
  loading,
  error,
  practiceCount,
  checkInCount,
}: SessionHistoryPanelProps) {
  return (
    <section
      id="practice-history"
      className="rounded-3xl border border-border bg-card/90 p-5 shadow-studio sm:p-6"
    >
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
            <History className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Your practice journey
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Every recording is saved here so you can look back and see how far
              you&apos;ve come.
            </p>
          </div>
        </div>

        {!loading && sessions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-muted px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              {practiceCount} practice drill{practiceCount === 1 ? '' : 's'}
            </span>
            {checkInCount > 0 && (
              <span className="rounded-full bg-checkin-muted px-3 py-1 text-xs font-semibold text-checkin-foreground">
                {checkInCount} check-in{checkInCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        )}
      </header>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your past sessions…
        </div>
      )}

      {error && !loading && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-muted px-4 py-8 text-center text-sm leading-relaxed text-muted-foreground">
          No sessions yet. Complete a check-in or practice drill — your history
          will show up here automatically.
        </p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <SessionRow key={session.id ?? session.created_at} session={session} />
          ))}
        </ul>
      )}
    </section>
  )
}
