import { Loader2, Mic, MicOff } from 'lucide-react'
import type { AppMode } from '../constants/studio'
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
    <section
      className={`flex flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card/90 p-6 shadow-studio backdrop-blur sm:p-8 ${className}`}
    >
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
            appMode === 'baseline'
              ? 'bg-checkin-muted text-checkin-foreground'
              : 'bg-primary-muted text-primary'
          }`}
        >
          {appMode === 'baseline' ? 'Check-in mode' : 'Practice mode'}
        </span>
      </div>

      {activeTargetSentence ? (
        <div className="w-full rounded-2xl border border-border bg-primary-muted px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Read this sentence aloud:
          </p>
          <p className="mt-2 text-base font-medium leading-relaxed text-foreground sm:text-lg">
            “{activeTargetSentence}”
          </p>
        </div>
      ) : (
        <p className="w-full rounded-2xl border border-dashed border-border bg-muted px-5 py-6 text-center text-sm text-muted-foreground">
          Select a practice card from the library to begin a drill.
        </p>
      )}

      <SoundwavePlaceholder isRecording={isRecording} levels={levels} />

      <button
        type="button"
        onClick={onToggleRecording}
        disabled={isProcessing || !canRecord}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        className={`group relative flex h-24 w-24 items-center justify-center rounded-full shadow-studio transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          isRecording
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90'
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
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {!canRecord
          ? 'Pick a drill or start your speech pattern check-in to enable recording.'
          : isProcessing
            ? 'Processing your session…'
            : isRecording
              ? 'Recording — tap to stop'
              : 'Tap to start recording'}
      </p>
    </section>
  )
}
