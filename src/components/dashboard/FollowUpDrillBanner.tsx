import { useEffect, useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { Badge } from '@/components/ui/badge'
import { normalizeCoachTextInline } from '@/utils/normalizeCoachText'

type FollowUpDrillBannerProps = {
  exercise: DashboardExercise
  coachingTip?: string
  visible: boolean
}

export function FollowUpDrillBanner({
  exercise,
  coachingTip,
  visible,
}: FollowUpDrillBannerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !ref.current) return
    ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visible, exercise.sentence])

  if (!visible) return null

  return (
    <div ref={ref}>
      <GlassCard className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 via-card/40 to-card/40">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              Your next scenario is ready
            </p>
            <Badge variant="outline" className="border-primary/30 text-primary">
              Based on feedback
            </Badge>
          </div>
          <p className="mt-2 text-lg font-medium leading-relaxed text-foreground">
            &ldquo;{exercise.sentence}&rdquo;
          </p>
          {coachingTip && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Coach tip: </span>
              {normalizeCoachTextInline(coachingTip)}
            </p>
          )}
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Tap the mic below to record this follow-up
            <ArrowRight className="h-4 w-4" />
          </p>
        </div>
      </div>
    </GlassCard>
    </div>
  )
}
