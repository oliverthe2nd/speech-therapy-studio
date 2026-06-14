import { Briefcase } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type TodayFocusBannerProps = {
  scenarioTitle: string
  scenarioDifficulty: string
  practiceCount: number
  hasPersonalizedDrills: boolean
  onBrowseAll: () => void
}

export function TodayFocusBanner({
  scenarioTitle,
  scenarioDifficulty,
  practiceCount,
  hasPersonalizedDrills,
  onBrowseAll,
}: TodayFocusBannerProps) {
  return (
    <GlassCard className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-card/40 to-card/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Today&apos;s executive scenario
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {scenarioTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Session {practiceCount + 1} in your communication plan — real-world
              corporate speaking with clinical precision tracked behind the scenes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                {scenarioDifficulty}
              </Badge>
              {hasPersonalizedDrills && (
                <Badge
                  variant="outline"
                  className="border-amber-400/40 bg-amber-400/10 text-amber-400"
                >
                  AI-tailored scripts available
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onBrowseAll}>
          Browse all scenarios
        </Button>
      </div>
    </GlassCard>
  )
}
