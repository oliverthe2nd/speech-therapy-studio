import { Loader2, Mic, MicOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AppMode } from '@/constants/studio'
import { SoundwavePlaceholder } from './SoundwavePlaceholder'
import type { FeedbackStatus } from './FeedbackCard'

type RecordingStudioProps = {
  className?: string
  appMode: AppMode
  activeTargetSentence: string
  feedbackStatus: FeedbackStatus
  isRecording: boolean
  levels: number[]
  canRecord: boolean
  onToggleRecording: () => void
}

export function RecordingStudio({
  className = '',
  appMode,
  activeTargetSentence,
  feedbackStatus,
  isRecording,
  levels,
  canRecord,
  onToggleRecording,
}: RecordingStudioProps) {
  const isProcessing = feedbackStatus === 'processing'

  return (
    <Card
      className={`gap-0 border-border/50 py-0 shadow-studio backdrop-blur ${className}`}
    >
      <CardContent className="flex flex-col items-center justify-center gap-6 px-6 py-8">
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <Badge
            variant="secondary"
            className={
              appMode === 'baseline'
                ? 'border-checkin/30 bg-checkin-muted text-checkin-foreground hover:bg-checkin-muted'
                : 'bg-primary/10 text-primary hover:bg-primary/10'
            }
          >
            {appMode === 'baseline' ? 'Check-in mode' : 'Practice mode'}
          </Badge>
        </div>

        {activeTargetSentence ? (
          <Card className="w-full gap-0 border-border/50 bg-muted/30 py-0 shadow-none">
            <CardContent className="px-5 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Read this sentence aloud:
              </p>
              <p className="mt-2 text-base font-medium leading-relaxed sm:text-lg">
                &ldquo;{activeTargetSentence}&rdquo;
              </p>
            </CardContent>
          </Card>
        ) : (
          <p className="w-full rounded-2xl border border-dashed bg-muted/50 px-5 py-6 text-center text-sm text-muted-foreground">
            Select a practice card from the library to begin a drill.
          </p>
        )}

        <SoundwavePlaceholder isRecording={isRecording} levels={levels} />

        <Button
          type="button"
          size="icon-lg"
          onClick={onToggleRecording}
          disabled={isProcessing || !canRecord}
          aria-pressed={isRecording}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`group relative h-24 w-24 rounded-full shadow-studio ${
            isRecording
              ? 'bg-destructive hover:bg-destructive/90'
              : 'hover:scale-105'
          }`}
        >
          {isRecording && (
            <span className="absolute inset-0 animate-ping rounded-full bg-destructive/40 opacity-30" />
          )}
          {isProcessing ? (
            <Loader2 className="relative h-10 w-10 animate-spin" />
          ) : isRecording ? (
            <MicOff className="relative h-10 w-10" />
          ) : (
            <Mic className="relative h-10 w-10" />
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {!canRecord
            ? 'Pick a drill or start your speech pattern check-in to enable recording.'
            : isProcessing
              ? 'Processing your session…'
              : isRecording
                ? 'Recording — tap to stop'
                : 'Tap to start recording'}
        </p>
      </CardContent>
    </Card>
  )
}
