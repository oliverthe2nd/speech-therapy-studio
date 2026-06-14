import { CheckCircle2, Circle, Target } from 'lucide-react'
import { BaselineBanner } from '@/components/BaselineBanner'
import { GlassCard } from '@/components/dashboard/glass-card'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AppMode } from '@/constants/studio'
import { brandFocusArea, displayFocusArea, focusAreaSubtext } from '@/utils/focusAreaDisplay'
import {
  phaseFocusLabel,
  sortExercisesForPhaseFocus,
  type PhaseFocus,
} from '@/utils/phaseFocus'
import { parseCoachFeedback } from '@/utils/parseCoachFeedback'
import { sanitizeCoachMarkdown } from '@/utils/sanitizeCoachMarkdown'

type GoalsViewProps = {
  appMode: AppMode
  hasCompletedCheckIn: boolean
  focusAreas: string[]
  latestFeedback: string
  onOpenBaseline: () => void
  onStartPractice: () => void
}

export function GoalsView({
  appMode,
  hasCompletedCheckIn,
  focusAreas,
  latestFeedback,
  onOpenBaseline,
  onStartPractice,
}: GoalsViewProps) {
  const parsed = latestFeedback
    ? parseCoachFeedback(sanitizeCoachMarkdown(latestFeedback))
    : null

  return (
    <div className="space-y-6">
      <BaselineBanner
        appMode={appMode}
        hasCompletedCheckIn={hasCompletedCheckIn}
        onOpenBaseline={onOpenBaseline}
      />

      <GlassCard>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Clarity Metrics Focus</h2>
            <p className="text-sm text-muted-foreground">
              Priority acoustic targets from your latest executive check-in
            </p>
          </div>
        </div>

        {focusAreas.length > 0 ? (
          <ul className="space-y-3">
            {focusAreas.slice(0, 2).map((area) => (
              <li
                key={area}
                className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {displayFocusArea(area)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {focusAreaSubtext(area)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete your first check-in to unlock personalized clarity metrics.
          </p>
        )}
      </GlassCard>

      {parsed && parsed.metrics.length > 0 && (
        <GlassCard>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Latest executive score card
          </h3>
          <ul className="space-y-3">
            {parsed.metrics
              .filter(
                (metric) =>
                  /Pace|Filler|Clarity|Delivery Tone/i.test(metric.title),
              )
              .slice(0, 3)
              .map((metric) => {
                const branded = brandFocusArea(metric.title)
                return (
                  <li
                    key={metric.title}
                    className="rounded-xl border border-border/30 bg-secondary/30 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{branded.label}</span>
                      <Badge variant="secondary">{metric.statusLabel}</Badge>
                    </div>
                  </li>
                )
              })}
          </ul>
        </GlassCard>
      )}

      <Button type="button" className="w-full sm:w-auto" onClick={onStartPractice}>
        Go to practice drills
      </Button>
    </div>
  )
}

type ScheduleViewProps = {
  exercises: DashboardExercise[]
  latestFeedback: string
  activePhaseFocus?: PhaseFocus
  onSelectExercise: (exerciseId: string) => void
}

function isExecutiveScenario(exercise: DashboardExercise): boolean {
  return (
    exercise.category === 'executive' ||
    exercise.category === 'personalized' ||
    exercise.category === 'warmup'
  )
}

function DrillList({
  items,
  onSelectExercise,
}: {
  items: DashboardExercise[]
  onSelectExercise: (exerciseId: string) => void
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete your check-in to unlock tailored scenarios.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((exercise) => (
        <li key={exercise.id}>
          <button
            type="button"
            onClick={() => onSelectExercise(exercise.id)}
            className="flex w-full items-start gap-3 rounded-xl border border-border/30 bg-secondary/30 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
                {exercise.title}
              </span>
              <span className="mt-1 block text-sm text-foreground/90">
                &ldquo;{exercise.sentence.slice(0, 120)}
                {exercise.sentence.length > 120 ? '…' : ''}&rdquo;
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function ScheduleView({
  exercises,
  latestFeedback,
  activePhaseFocus = 1,
  onSelectExercise,
}: ScheduleViewProps) {
  const parsed = latestFeedback
    ? parseCoachFeedback(sanitizeCoachMarkdown(latestFeedback))
    : null
  const homework = parsed?.homework ?? []
  const dailyDrills = exercises.filter((e) => e.id !== 'check-in')
  const sortedDrills = sortExercisesForPhaseFocus(dailyDrills, activePhaseFocus)
  const executiveScenarios = sortedDrills.filter(isExecutiveScenario)
  const precisionDrills = sortedDrills.filter((e) => e.category === 'clinical')
  const phaseLabel = phaseFocusLabel(activePhaseFocus)

  return (
    <div className="space-y-6">
      <GlassCard>
        <h2 className="mb-1 font-semibold text-foreground">
          Coach homework
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Next steps from your most recent session
        </p>

        {homework.length > 0 ? (
          <ul className="space-y-2">
            {homework.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-border/30 bg-secondary/30 px-4 py-3"
              >
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground/90">{item.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Finish a practice drill to get personalized homework from your AI
            coach.
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-1 font-semibold text-foreground">
          Today&apos;s Executive Scenarios
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Premium business lines and pitch drills — prioritized for your{' '}
          <span className="font-medium text-primary">{phaseLabel}</span> phase focus
        </p>

        <DrillList
          items={executiveScenarios}
          onSelectExercise={onSelectExercise}
        />
      </GlassCard>

      <GlassCard>
        <h2 className="mb-1 font-semibold text-foreground">
          Precision Conditioning
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Brief articulation drills — surfaced first when your{' '}
          <span className="font-medium text-primary">{phaseLabel}</span> phase targets
          phonetic precision.
        </p>

        <DrillList
          items={precisionDrills}
          onSelectExercise={onSelectExercise}
        />
      </GlassCard>
    </div>
  )
}

export function SettingsView() {
  return (
    <GlassCard className="max-w-xl">
      <h2 className="mb-4 font-semibold text-foreground">Studio settings</h2>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">App</dt>
          <dd className="mt-1 text-foreground">SpeakFlow — AI Speech Therapy</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Coach analysis</dt>
          <dd className="mt-1 text-foreground">
            Powered by Supabase Edge Functions (Whisper + Claude)
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Session storage</dt>
          <dd className="mt-1 text-foreground">
            Recordings and feedback are saved to your Supabase project
          </dd>
        </div>
      </dl>
    </GlassCard>
  )
}

export function HelpView() {
  const steps = [
    {
      title: '1. Start with a check-in',
      body: 'Open Goals and run your Speech Pattern Check-In. This builds your personalized drill plan.',
    },
    {
      title: '2. Pick a drill',
      body: 'Go to Practice or Schedule, choose a sentence, and read it aloud.',
    },
    {
      title: '3. Tap the microphone',
      body: 'Record yourself, then tap again to stop. Whisper transcribes your speech securely via Supabase.',
    },
    {
      title: '4. Review AI feedback',
      body: 'Your coach score card appears on the Dashboard and in Progress after each session.',
    },
    {
      title: '5. Track your journey',
      body: 'Progress saves every session so you can reopen past score cards anytime.',
    },
  ]

  return (
    <GlassCard>
      <h2 className="mb-4 font-semibold text-foreground">How SpeakFlow works</h2>
      <ol className="space-y-4">
        {steps.map((step) => (
          <li
            key={step.title}
            className="rounded-xl border border-border/30 bg-secondary/20 px-4 py-3"
          >
            <p className="font-medium text-foreground">{step.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </GlassCard>
  )
}
