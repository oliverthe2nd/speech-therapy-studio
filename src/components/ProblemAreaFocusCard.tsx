import { Target, TrendingDown, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import { displayFocusArea } from '@/utils/focusAreaDisplay'
import type { TargetDrillArea, TrendDirection } from '@/utils/buildProgressTrend'

type ProblemAreaFocusCardProps = {
  target: TargetDrillArea | null
  hasSessions: boolean
}

function directionLabel(direction: TrendDirection): string {
  switch (direction) {
    case 'improving':
      return 'Trending up'
    case 'declining':
      return 'Needs work'
    case 'steady':
      return 'Holding steady'
    default:
      return 'Building baseline'
  }
}

export function ProblemAreaFocusCard({
  target,
  hasSessions,
}: ProblemAreaFocusCardProps) {
  if (!hasSessions) {
    return (
      <GlassCard className="h-full border-dashed border-border/50 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Complete drills with coach feedback to unlock your top acoustic
          conditioning target.
        </p>
      </GlassCard>
    )
  }

  if (!target) {
    return (
      <GlassCard className="h-full border-dashed border-border/50 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Score data is not available yet — record another drill with feedback.
        </p>
      </GlassCard>
    )
  }

  const TrendIcon =
    target.direction === 'improving'
      ? TrendingUp
      : target.direction === 'declining'
        ? TrendingDown
        : Target

  return (
    <GlassCard className="flex h-full flex-col border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-card/40 to-card/40">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400">
          <Target className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Executive growth edge
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
            {displayFocusArea(target.title)}
          </h3>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Lowest rolling average across your delivery metrics — prioritize this
        scenario area so one tough session does not skew your executive score.
      </p>

      <div className="mt-auto grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/30 bg-background/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Rolling avg</p>
          <p className="text-xl font-bold text-amber-400">{target.averageScore}%</p>
        </div>
        <div className="rounded-xl border border-border/30 bg-background/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Latest</p>
          <p className="text-xl font-bold text-foreground">{target.latestScore}%</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-amber-400/30 bg-amber-400/10 text-amber-400"
        >
          <TrendIcon className="mr-1 h-3.5 w-3.5" />
          {directionLabel(target.direction)}
          {target.sessions >= 2 && (
            <span className="ml-1 font-normal opacity-80">
              ({target.delta >= 0 ? '+' : ''}
              {target.delta}%)
            </span>
          )}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {target.sessions} session{target.sessions === 1 ? '' : 's'} tracked
        </span>
      </div>
    </GlassCard>
  )
}
