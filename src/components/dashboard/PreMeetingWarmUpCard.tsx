import { Briefcase, Clock, Mic, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PreMeetingWarmUpCardProps = {
  onStartWarmUp: () => void
  isActive?: boolean
}

export function PreMeetingWarmUpCard({
  onStartWarmUp,
  isActive = false,
}: PreMeetingWarmUpCardProps) {
  return (
    <GlassCard className="mb-8 border-sky-400/20 bg-gradient-to-br from-sky-400/10 via-card/40 to-card/40">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-400">
            <Mic className="h-6 w-6" />
          </span>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
              >
                Ready now
              </Badge>
              <Badge variant="outline" className="border-border/40 text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                60 seconds
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Pre-Meeting 60-Second Vocal Warm-Up
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              A guided executive warm-up before your next stand-up, client call,
              or keynote — breath, pace, and clarity cues tuned for boardroom
              presence.
            </p>
            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                Breath + posture reset
              </li>
              <li className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                Pace calibration
              </li>
              <li className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
                <Mic className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                Clarity opener line
              </li>
            </ul>
          </div>
        </div>
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          onClick={onStartWarmUp}
          className={
            isActive
              ? 'shrink-0 bg-sky-500 text-white hover:bg-sky-600'
              : 'shrink-0 border-sky-400/30 text-sky-400 hover:bg-sky-400/10'
          }
        >
          {isActive ? 'Warm-up selected' : 'Start warm-up'}
        </Button>
      </div>
    </GlassCard>
  )
}
