import { History, Loader2, TrendingUp } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SpeechSession } from '@/supabaseClient'
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
  const checkIn = isCheckIn(session)
  const sessionKey = session.id ?? session.created_at ?? 'session'

  return (
    <AccordionItem value={sessionKey} className="rounded-xl border px-4">
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex flex-1 items-start gap-3 text-left">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
              checkIn
                ? 'bg-checkin-muted text-checkin-foreground'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {checkIn ? '✓' : '★'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {sessionLabel(session)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatSessionDate(session.created_at)}
              </span>
            </span>
            {session.target_sentence && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                &ldquo;{session.target_sentence}&rdquo;
              </p>
            )}
          </span>
        </div>
      </AccordionTrigger>
      {session.feedback && (
        <AccordionContent className="pb-4 pt-0">
          <SpeechFeedbackDashboard
            mode={checkIn ? 'baseline' : 'practice'}
            targetSentence={session.target_sentence ?? ''}
            transcript={session.transcript ?? ''}
            feedback={session.feedback}
          />
        </AccordionContent>
      )}
    </AccordionItem>
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
    <Card id="practice-history" className="gap-0 py-0 shadow-studio">
      <CardHeader className="border-b pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-lg">Your practice journey</CardTitle>
              <CardDescription>
                Every recording is saved here so you can look back and see how
                far you&apos;ve come.
              </CardDescription>
            </div>
          </div>

          {!loading && sessions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                {practiceCount} practice drill{practiceCount === 1 ? '' : 's'}
              </Badge>
              {checkInCount > 0 && (
                <Badge className="border-checkin/30 bg-checkin-muted text-checkin-foreground hover:bg-checkin-muted">
                  {checkInCount} check-in{checkInCount === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-6">
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
          <p className="rounded-xl border border-dashed bg-muted/50 px-4 py-8 text-center text-sm leading-relaxed text-muted-foreground">
            No sessions yet. Complete a check-in or practice drill — your
            history will show up here automatically.
          </p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <Accordion type="multiple" className="space-y-3">
            {sessions.map((session) => (
              <SessionRow
                key={session.id ?? session.created_at}
                session={session}
              />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
