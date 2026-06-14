import { Loader2 } from 'lucide-react'
import { GlassCard } from './glass-card'
import { AudioWaveform } from './audio-waveform'
import { cn } from '@/lib/utils'

export type DashboardExercise = {
  id: string
  title: string
  difficulty: string
  sentence: string
  category?: 'executive' | 'warmup' | 'clinical' | 'personalized' | 'check-in'
  /** Real-world corporate challenge shown above the script */
  prompt?: string
  durationLabel?: string
}

const MAX_VISIBLE_EXERCISES = 4

type RecordingSectionProps = {
  exercises: DashboardExercise[]
  selectedExercise: DashboardExercise
  targetSentence?: string
  onSelectExercise: (exercise: DashboardExercise) => void
  isRecording: boolean
  isProcessing: boolean
  isLoading?: boolean
  canRecord: boolean
  micStatusHint?: string
  onToggleRecording: () => void
  levels: number[]
  sectionTitle?: string
  focusAreas?: string[]
  hideExercisePicker?: boolean
  scrollableSentence?: boolean
  onBrowseMoreDrills?: () => void
  executiveMode?: boolean
}

export function RecordingSection({
  exercises,
  selectedExercise,
  targetSentence,
  onSelectExercise,
  isRecording,
  isProcessing,
  isLoading = false,
  canRecord,
  micStatusHint,
  onToggleRecording,
  levels,
  sectionTitle = 'Current Exercise',
  focusAreas = [],
  hideExercisePicker = false,
  scrollableSentence = false,
  onBrowseMoreDrills,
  executiveMode = false,
}: RecordingSectionProps) {
  const sentence = targetSentence?.trim() || selectedExercise.sentence
  const challengePrompt = selectedExercise.prompt?.trim()
  const isExecutiveSession =
    executiveMode ||
    selectedExercise.category === 'executive' ||
    selectedExercise.category === 'warmup' ||
    selectedExercise.category === 'personalized'
  const visibleExercises = exercises.slice(0, MAX_VISIBLE_EXERCISES)
  const hiddenExerciseCount = Math.max(0, exercises.length - MAX_VISIBLE_EXERCISES)
  const showLoadingShell = isLoading && !isRecording && !isProcessing

  return (
    <GlassCard className="flex h-full flex-col">
      {!hideExercisePicker && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {sectionTitle}
          </h3>
          {focusAreas.length > 0 && !executiveMode && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {focusAreas[0]}
              </span>
              {focusAreas.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{focusAreas.length - 1} more
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleExercises.map((exercise) => (
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
            {hiddenExerciseCount > 0 && onBrowseMoreDrills && (
              <button
                type="button"
                onClick={onBrowseMoreDrills}
                className="rounded-xl border border-dashed border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                +{hiddenExerciseCount} more drills →
              </button>
            )}
          </div>
        </div>
      )}

      {hideExercisePicker && focusAreas.length > 0 && !executiveMode && (
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-primary">
          {focusAreas[0]}
        </p>
      )}

      {isExecutiveSession && selectedExercise.durationLabel && (
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-sky-400">
          {selectedExercise.durationLabel} · Executive Warm-Up
        </p>
      )}

      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="relative mb-8 w-full max-w-md text-center">
          {showLoadingShell ? (
            <div
              className="space-y-3 rounded-xl border border-border/30 bg-secondary/20 px-4 py-8"
              aria-busy="true"
              aria-label="Loading drill"
            >
              <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mx-auto h-4 w-full animate-pulse rounded bg-muted" />
              <div className="mx-auto h-4 w-5/6 animate-pulse rounded bg-muted" />
              <p className="pt-2 text-sm text-muted-foreground">
                {micStatusHint ?? 'Loading your drill…'}
              </p>
            </div>
          ) : (
            <>
              {isExecutiveSession && challengePrompt && (
                <p className="mb-4 text-sm font-medium leading-relaxed text-primary">
                  {challengePrompt}
                </p>
              )}
              <div
                className={cn(
                  scrollableSentence &&
                    'max-h-48 overflow-y-auto rounded-xl border border-border/20 bg-secondary/10 px-3 py-3',
                  isExecutiveSession &&
                    'rounded-xl border border-border/30 bg-secondary/10 px-4 py-4',
                )}
              >
                {isExecutiveSession && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your script
                  </p>
                )}
                <p
                  className={cn(
                    'font-medium leading-relaxed text-foreground',
                    scrollableSentence ? 'text-base' : 'text-lg',
                  )}
                >
                  &ldquo;{sentence}&rdquo;
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isExecutiveSession ? 'Scenario' : 'Difficulty'}:{' '}
                {selectedExercise.difficulty}
                {selectedExercise.durationLabel
                  ? ` · ${selectedExercise.durationLabel}`
                  : ''}
              </p>
            </>
          )}
        </div>

        <div className="mb-8">
          <MicrophoneButtonWrapper
            isRecording={isRecording}
            isProcessing={isProcessing}
            canRecord={canRecord}
            statusHint={micStatusHint}
            onToggleRecording={onToggleRecording}
          />
        </div>

        <div className="w-full max-w-lg">
          <AudioWaveform isRecording={isRecording} levels={levels} />
        </div>
      </div>
    </GlassCard>
  )
}

function MicrophoneButtonWrapper({
  isRecording,
  isProcessing,
  canRecord,
  statusHint,
  onToggleRecording,
}: {
  isRecording: boolean
  isProcessing: boolean
  canRecord: boolean
  statusHint?: string
  onToggleRecording: () => void
}) {
  const statusLabel = isProcessing
    ? 'Analyzing your speech…'
    : isRecording
      ? 'Recording...'
      : statusHint ?? 'Tap to Start'

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
          <Loader2 className="relative z-10 h-14 w-14 animate-spin text-primary-foreground" />
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
