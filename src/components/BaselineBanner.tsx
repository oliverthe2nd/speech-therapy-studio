import { Activity, ChevronRight } from 'lucide-react'
import type { AppMode } from '../constants/studio'

type BaselineBannerProps = {
  appMode: AppMode
  hasCompletedCheckIn: boolean
  onOpenBaseline: () => void
}

export function BaselineBanner({
  appMode,
  hasCompletedCheckIn,
  onOpenBaseline,
}: BaselineBannerProps) {
  const isActive = appMode === 'baseline'

  const eyebrow = hasCompletedCheckIn
    ? 'Update your progress'
    : 'First-time check-in'

  const title = isActive
    ? hasCompletedCheckIn
      ? 'Updating your check-in'
      : 'Speech pattern check-in active'
    : hasCompletedCheckIn
      ? 'Retake Your Speech Pattern Check-In'
      : 'Start Your Speech Pattern Check-In'

  const description = isActive
    ? hasCompletedCheckIn
      ? 'Read the practice sentence below. When you finish, we will refresh your personalized daily drills.'
      : 'Read the practice sentence below, then tap the mic when you are ready.'
    : hasCompletedCheckIn
      ? 'A fresh recording updates your score card and rebuilds your daily drills for the sounds you are working on now.'
      : 'One quick recording unlocks your personalized daily drills.'

  const ctaLabel = hasCompletedCheckIn ? 'Refresh check-in' : "Let's go"

  return (
    <button
      type="button"
      onClick={onOpenBaseline}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        isActive
          ? 'border-checkin/40 bg-checkin-muted shadow-studio'
          : 'border-primary/30 bg-gradient-to-r from-primary via-chart-2 to-chart-4 text-primary-foreground shadow-studio hover:scale-[1.01]'
      }`}
    >
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isActive
                ? 'bg-checkin/20 text-checkin-foreground'
                : 'bg-primary-foreground/20 text-primary-foreground'
            }`}
          >
            <Activity className="h-6 w-6" />
          </span>
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-widest ${
                isActive ? 'text-checkin' : 'text-primary-foreground/80'
              }`}
            >
              {eyebrow}
            </p>
            <h2
              className={`mt-1 text-xl font-semibold sm:text-2xl ${
                isActive ? 'text-checkin-foreground' : 'text-primary-foreground'
              }`}
            >
              {title}
            </h2>
            <p
              className={`mt-1 max-w-2xl text-sm leading-relaxed ${
                isActive
                  ? 'text-checkin-foreground/80'
                  : 'text-primary-foreground/90'
              }`}
            >
              {description}
            </p>
          </div>
        </div>
        {!isActive && (
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur sm:self-center">
            {ctaLabel}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </button>
  )
}
