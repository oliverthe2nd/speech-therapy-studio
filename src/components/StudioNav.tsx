import { ArrowLeft, Home } from 'lucide-react'
import type { AppMode } from '../constants/studio'
import type { FeedbackStatus } from './FeedbackCard'

type StudioNavProps = {
  appMode: AppMode
  hasActiveDrill: boolean
  sessionStatus: FeedbackStatus
  onReturnHome: () => void
}

export function StudioNav({
  appMode,
  hasActiveDrill,
  sessionStatus,
  onReturnHome,
}: StudioNavProps) {
  const showNav = hasActiveDrill || sessionStatus === 'done' || sessionStatus === 'error'

  if (!showNav) return null

  const label =
    appMode === 'baseline'
      ? 'Back to practice drills'
      : sessionStatus === 'done'
        ? 'Choose another drill'
        : 'Back to all drills'

  return (
    <nav
      className="sticky top-0 z-40 -mx-4 border-b border-border/80 bg-card/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
      aria-label="Session navigation"
    >
      <button
        type="button"
        onClick={onReturnHome}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto"
      >
        {sessionStatus === 'done' ? (
          <Home className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {label}
      </button>
    </nav>
  )
}
