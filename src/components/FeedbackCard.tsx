import { ClipboardList, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { AppMode } from '@/constants/studio'
import { SpeechFeedbackDashboard } from './SpeechFeedbackDashboard'

export type FeedbackStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'done'
  | 'error'

type FeedbackCardProps = {
  id?: string
  className?: string
  embedded?: boolean
  mode: AppMode
  status: FeedbackStatus
  targetSentence: string
  transcript: string
  feedback: string
  errorMessage: string
  onReturnHome?: () => void
}

export function FeedbackCard({
  id = 'feedback-card',
  className = '',
  embedded = false,
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

  const body = (
    <>
      {status !== 'done' && !embedded && (
        <CardHeader className="border-b pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                mode === 'baseline'
                  ? 'bg-checkin-muted text-checkin-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {mode === 'baseline' ? (
                <ClipboardList className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </span>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent
        className={`flex flex-1 flex-col ${status === 'done' ? 'p-0' : embedded ? 'p-0 py-4' : 'py-6'}`}
      >
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
          <Button
            type="button"
            variant="outline"
            onClick={onReturnHome}
            className="mt-3 w-full"
          >
            ← Back to all drills
          </Button>
        )}
      </CardContent>
    </>
  )

  if (embedded) {
    return (
      <div id={id} className={`scroll-mt-24 ${className}`}>
        {body}
      </div>
    )
  }

  return (
    <Card
      id={id}
      className={`min-h-[320px] scroll-mt-24 gap-0 py-0 shadow-studio ${
        status === 'done' ? 'border-0 bg-transparent shadow-none' : ''
      } ${className}`}
    >
      {body}
    </Card>
  )
}
