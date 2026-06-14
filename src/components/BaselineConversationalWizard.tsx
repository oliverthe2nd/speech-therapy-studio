import { Loader2, MessageCircle, Sparkles } from 'lucide-react'
import {
  BASELINE_FLOW_STEPS,
  BASELINE_STEP_COUNT,
  BASELINE_STRESS_TEST_PASSAGE,
  type BaselineStep,
} from '@/constants/baselineFlow'
import { AudioWaveform } from '@/components/dashboard/audio-waveform'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type BaselineConversationalWizardProps = {
  currentStep: BaselineStep
  isRecording: boolean
  isProcessing: boolean
  canRecord: boolean
  micStatusHint?: string
  onToggleRecording: () => void
  levels: number[]
  stepAcknowledgment?: string
  isLoading?: boolean
}

export function BaselineConversationalWizard({
  currentStep,
  isRecording,
  isProcessing,
  canRecord,
  micStatusHint,
  onToggleRecording,
  levels,
  stepAcknowledgment,
  isLoading = false,
}: BaselineConversationalWizardProps) {
  const stepConfig = BASELINE_FLOW_STEPS.find((item) => item.step === currentStep)!
  const progressValue = (currentStep / BASELINE_STEP_COUNT) * 100
  const isReadingStep = stepConfig.kind === 'reading'

  return (
    <GlassCard className="overflow-hidden border-primary/20">
      <div className="border-b border-border/30 bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Executive Coach · Baseline Check-in
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Step {currentStep} of {BASELINE_STEP_COUNT} — {stepConfig.title}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Live calibration
          </span>
        </div>
        <Progress value={progressValue} className="mt-4 h-2" />
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-muted/40 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your coach
              </p>
              <p className="mt-2 text-base leading-relaxed text-foreground">
                {stepConfig.coachPrompt}
              </p>
            </div>
          </div>

          {isReadingStep && (
            <blockquote className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-muted/20 to-primary/5 px-5 py-5 font-serif text-base italic leading-relaxed text-foreground shadow-inner">
              &ldquo;{BASELINE_STRESS_TEST_PASSAGE}&rdquo;
            </blockquote>
          )}

          {stepAcknowledgment && !isProcessing && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Coach response
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {stepAcknowledgment}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center lg:col-span-2">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {micStatusHint ?? 'Preparing your session…'}
            </div>
          ) : (
            <>
              <BaselineMicButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                canRecord={canRecord}
                statusHint={micStatusHint}
                onToggleRecording={onToggleRecording}
              />
              <div className="mt-6 w-full max-w-xs">
                <AudioWaveform isRecording={isRecording} levels={levels} />
              </div>
              <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
                {isReadingStep
                  ? 'Deliver with your natural executive presence — steady breath, clear consonants, confident pace.'
                  : 'Speak naturally. There is no script — just answer as you would in a 1-on-1 coaching session.'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/30 px-6 py-4">
        {BASELINE_FLOW_STEPS.map((item) => {
          const done = item.step < currentStep
          const active = item.step === currentStep
          return (
            <span
              key={item.step}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                done && 'bg-emerald-400/15 text-emerald-400',
                active && 'bg-primary/15 text-primary',
                !done && !active && 'bg-secondary/50 text-muted-foreground',
              )}
            >
              {item.step}. {item.title}
            </span>
          )
        })}
      </div>
    </GlassCard>
  )
}

function BaselineMicButton({
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
      ? 'Recording… tap to finish'
      : statusHint ?? 'Tap to record your answer'

  return (
    <div className="relative">
      {isRecording && (
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      )}

      <button
        type="button"
        onClick={onToggleRecording}
        disabled={isProcessing || (!canRecord && !isRecording)}
        className={cn(
          'relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500',
          'shadow-[0_0_60px_rgba(45,212,191,0.3)]',
          isRecording
            ? 'border-2 border-primary bg-primary'
            : 'border-2 border-border bg-gradient-to-br from-card to-secondary hover:border-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
        ) : isRecording ? (
          <svg
            className="h-12 w-12 text-primary-foreground"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg
            className="h-12 w-12 text-primary"
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

      <p className="mt-4 text-center text-sm font-medium text-foreground">
        {statusLabel}
      </p>
    </div>
  )
}
