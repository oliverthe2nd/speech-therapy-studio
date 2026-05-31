import { GlassCard } from './glass-card'
import { AudioWaveform } from './audio-waveform'
import { Pause, SkipForward, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardExercise = {
  id: string
  title: string
  difficulty: string
  sentence: string
}

type RecordingSectionProps = {
  exercises: DashboardExercise[]
  selectedExercise: DashboardExercise
  onSelectExercise: (exercise: DashboardExercise) => void
  isRecording: boolean
  isProcessing: boolean
  canRecord: boolean
  onToggleRecording: () => void
  levels: number[]
}

export function RecordingSection({
  exercises,
  selectedExercise,
  onSelectExercise,
  isRecording,
  isProcessing,
  canRecord,
  onToggleRecording,
  levels,
}: RecordingSectionProps) {
  return (
    <GlassCard className="flex h-full flex-col">
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Current Exercise
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => onSelectExercise(exercise)}
              className={cn(
                'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all',
                selectedExercise.id === exercise.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary',
              )}
            >
              {exercise.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="mb-8 max-w-md text-center">
          <p className="text-lg font-medium leading-relaxed text-foreground">
            &ldquo;{selectedExercise.sentence}&rdquo;
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Difficulty: {selectedExercise.difficulty}
          </p>
        </div>

        <div className="mb-8">
          <MicrophoneButtonWrapper
            isRecording={isRecording}
            isProcessing={isProcessing}
            canRecord={canRecord}
            onToggleRecording={onToggleRecording}
          />
        </div>

        <div className="w-full max-w-lg">
          <AudioWaveform isRecording={isRecording} levels={levels} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-border/50 pt-4">
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2',
            'bg-secondary/50 text-muted-foreground',
            'transition-colors hover:bg-secondary hover:text-foreground',
          )}
        >
          <Volume2 className="h-4 w-4" />
          <span className="text-sm font-medium">Listen</span>
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2',
            'bg-secondary/50 text-muted-foreground',
            'transition-colors hover:bg-secondary hover:text-foreground',
          )}
        >
          <Pause className="h-4 w-4" />
          <span className="text-sm font-medium">Playback</span>
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2',
            'bg-secondary/50 text-muted-foreground',
            'transition-colors hover:bg-secondary hover:text-foreground',
          )}
        >
          <SkipForward className="h-4 w-4" />
          <span className="text-sm font-medium">Skip</span>
        </button>
      </div>
    </GlassCard>
  )
}

function MicrophoneButtonWrapper({
  isRecording,
  isProcessing,
  canRecord,
  onToggleRecording,
}: {
  isRecording: boolean
  isProcessing: boolean
  canRecord: boolean
  onToggleRecording: () => void
}) {
  const statusLabel = isProcessing
    ? 'Analyzing your speech…'
    : isRecording
      ? 'Recording...'
      : 'Tap to Start'

  return (
    <div className="relative">
      {isRecording && (
        <>
          <div
            className={cn(
              'absolute inset-0 scale-150 rounded-full bg-primary/20 blur-3xl',
              'animate-pulse',
            )}
          />
          <div
            className={cn(
              'absolute -inset-4 rounded-full border-2 border-primary/30',
              'animate-ping',
            )}
            style={{ animationDuration: '1.5s' }}
          />
          <div
            className={cn(
              'absolute -inset-8 rounded-full border border-primary/20',
              'animate-ping',
            )}
            style={{ animationDuration: '2s' }}
          />
        </>
      )}

      {!isRecording && (
        <div className="absolute inset-0 scale-125 rounded-full bg-primary/10 blur-2xl" />
      )}

      <button
        type="button"
        onClick={onToggleRecording}
        disabled={isProcessing || (!canRecord && !isRecording)}
        className={cn(
          'relative flex h-36 w-36 items-center justify-center rounded-full transition-all duration-500',
          'shadow-[0_0_60px_rgba(45,212,191,0.3)]',
          isRecording
            ? 'border-2 border-primary bg-primary shadow-[0_0_80px_rgba(45,212,191,0.5)]'
            : 'border-2 border-border bg-gradient-to-br from-card to-secondary hover:border-primary/50 hover:from-secondary hover:to-card',
          'group disabled:cursor-not-allowed disabled:opacity-60',
        )}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <div
          className={cn(
            'absolute inset-4 rounded-full',
            isRecording
              ? 'bg-primary/20'
              : 'bg-transparent group-hover:bg-primary/5',
            'transition-all duration-300',
          )}
        />

        {isProcessing ? (
          <svg
            className="relative z-10 h-14 w-14 animate-spin text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : isRecording ? (
          <svg
            className="relative z-10 h-14 w-14 text-primary-foreground"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg
            className={cn(
              'relative z-10 h-14 w-14 transition-colors duration-300',
              'text-primary group-hover:text-primary',
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </button>

      <div className="mt-4 text-center">
        <p
          className={cn(
            'text-sm font-medium transition-colors duration-300',
            isRecording || isProcessing ? 'text-primary' : 'text-foreground',
          )}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  )
}
