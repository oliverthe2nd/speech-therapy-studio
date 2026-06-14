import { Briefcase, Target } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import type { SpeechSession } from '@/lib/database'
import { brandFocusArea } from '@/utils/focusAreaDisplay'
import {
  displayExecutiveMetric,
  isClinicalMetric,
  isExecutiveMetric,
  metricPercent,
  pickWeakestClinicalArea,
  splitAssessmentMetrics,
} from '@/utils/metricCategories'
import {
  extractClinicalMetrics,
  extractSessionMetrics,
} from '@/utils/parseCoachFeedback'

type ExecutiveDashboardSummaryProps = {
  sessions: SpeechSession[]
  loading: boolean
}

function latestScoredSession(
  sessions: SpeechSession[],
): SpeechSession | null {
  for (const session of sessions) {
    if (session.feedback?.trim()) return session
  }
  return null
}

export function ExecutiveDashboardSummary({
  sessions,
  loading,
}: ExecutiveDashboardSummaryProps) {
  const latest = latestScoredSession(sessions)

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-xl border border-border/30 bg-secondary/20" />
        <div className="h-48 animate-pulse rounded-xl border border-border/30 bg-secondary/20" />
      </div>
    )
  }

  if (!latest?.feedback?.trim()) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="border-dashed border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Complete your first drill to unlock executive delivery metrics.
          </p>
        </GlassCard>
        <GlassCard className="border-dashed border-border/50 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Acoustic conditioning targets appear after your first scored session.
          </p>
        </GlassCard>
      </div>
    )
  }

  const storedJson =
    latest.mode === 'baseline' ? null : latest.ai_feedback ?? null
  const allMetrics = extractSessionMetrics(latest.feedback, storedJson)
  const clinicalFromStore = extractClinicalMetrics(latest.feedback, storedJson)
  const split = splitAssessmentMetrics(allMetrics)

  const executiveMetrics = (
    split.executive.length > 0 ? split.executive : allMetrics.filter((m) =>
      isExecutiveMetric(m.title),
    )
  ).map(displayExecutiveMetric)

  const clinicalMetrics =
    clinicalFromStore.length > 0
      ? clinicalFromStore
      : split.clinical.length > 0
        ? split.clinical
        : allMetrics.filter((m) => isClinicalMetric(m.title))

  const rankedClinical = [...clinicalMetrics].sort(
    (a, b) => metricPercent(a) - metricPercent(b),
  )
  const topAcousticTargets = rankedClinical.slice(0, 2)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GlassCard>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">
              Executive Delivery Metrics
            </h3>
            <p className="text-sm text-muted-foreground">
              Latest session · pacing, fillers, and brevity
            </p>
          </div>
        </div>

        {executiveMetrics.length > 0 ? (
          <ul className="space-y-3">
            {executiveMetrics.map((metric) => (
              <li
                key={metric.title}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/30 bg-secondary/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {metric.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {brandFocusArea(metric.title).subtext}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {metricPercent(metric)}%
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {metric.statusLabel}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Executive metrics will populate after your next analyzed recording.
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">
              Acoustic Conditioning Targets
            </h3>
            <p className="text-sm text-muted-foreground">
              Top priorities to sharpen professional delivery
            </p>
          </div>
        </div>

        {topAcousticTargets.length > 0 ? (
          <ul className="space-y-3">
            {topAcousticTargets.map((metric) => {
              const branded = brandFocusArea(metric.title)
              const weakest = pickWeakestClinicalArea(topAcousticTargets)
              const isPrimary = weakest?.title === metric.title

              return (
                <li
                  key={metric.title}
                  className={`rounded-xl border px-4 py-3 ${
                    isPrimary
                      ? 'border-amber-400/30 bg-amber-400/5'
                      : 'border-border/30 bg-secondary/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {branded.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {branded.subtext}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold tabular-nums text-amber-400">
                        {metricPercent(metric)}%
                      </p>
                      {isPrimary && (
                        <Badge
                          variant="outline"
                          className="mt-1 border-amber-400/30 text-[10px] text-amber-400"
                        >
                          Top priority
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete a check-in to unlock personalized acoustic targets.
          </p>
        )}
      </GlassCard>
    </div>
  )
}
