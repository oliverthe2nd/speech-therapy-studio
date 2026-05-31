import { ClipboardList, Loader2, Sparkles } from 'lucide-react'
import type { AppMode } from '../constants/studio'
import { SpeechFeedbackDashboard } from './SpeechFeedbackDashboard'

export type FeedbackStatus = 'idle' | 'recording' | 'processing' | 'done' | 'error'

type FeedbackCardProps = {
  className?: string
  mode: AppMode
  status: FeedbackStatus
  targetSentence: string
  transcript: string
  feedback: string
  errorMessage: string
  onReturnHome?: () => void
}

export function FeedbackCard({
  className = '',
  mode,
  status,
  targetSentence,
  transcript,
  feedback,
  errorMessage,
  onReturnHome,
}: FeedbackCardProps) {
  const title = mode === 'baseline' ? 'Your score card' : 'Coach feedback'
  const subtitle =
    mode === 'baseline'
      ? 'How your sounds are doing right now'
      : 'Warm, encouraging notes after each drill'

  return (
    <article
      id="feedback-card"
      className={`flex min-h-[320px] flex-col rounded-3xl border border-border bg-card p-6 shadow-studio scroll-mt-24 ${className}`}
    >
      {status !== 'done' && (
        <header className="mb-4 flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              mode === 'baseline'
                ? 'bg-checkin-muted text-checkin-foreground'
                : 'bg-primary-muted text-primary'
            }`}
          >
            {mode === 'baseline' ? (
              <ClipboardList className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </header>
      )}

      {status === 'idle' && (
        <p className="flex flex-1 items-center text-sm leading-relaxed text-muted-foreground">
          {mode === 'baseline'
            ? 'Finish your speech pattern check-in recording to see your score card and next steps.'
            : 'Choose a practice card, read the sentence aloud, then tap the microphone.'}
        </p>
      )}

      {status === 'recording' && (
        <p className="flex flex-1 items-center gap-2 text-sm text-primary">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-destructive" />
          Listening… tap the mic again when you are finished.
        </p>
      )}

      {status === 'processing' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium">
            {mode === 'baseline'
              ? 'Listening back and building your score card…'
              : 'Transcribing your drill and crafting feedback…'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <p className="flex flex-1 items-start rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      {status === 'done' && (
        <div className="flex flex-1 flex-col overflow-auto">
          <SpeechFeedbackDashboard
            mode={mode}
            targetSentence={targetSentence}
            transcript={transcript}
            feedback={feedback}
            onReturnHome={onReturnHome}
          />
        </div>
      )}

      {status === 'error' && onReturnHome && (
        <button
          type="button"
          onClick={onReturnHome}
          className="mt-3 w-full rounded-xl border border-border bg-primary-muted px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-muted/80"
        >
          ← Back to all drills
        </button>
      )}
    </article>
  )
}
