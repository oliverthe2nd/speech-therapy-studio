import { useMemo } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExecutiveDashboardSummary } from '@/components/dashboard/ExecutiveDashboardSummary'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Badge } from '@/components/ui/badge'
import type { SpeechSession } from '@/lib/database'
import {
  PROGRESS_CHART_Y_MAX,
  PROGRESS_CHART_Y_MIN,
  buildCompositeChartRows,
  buildCompositeProgressTrend,
  type CompositeIndexSeries,
  type TrendDirection,
} from '@/utils/buildProgressTrend'

type ProgressTrendChartProps = {
  sessions: SpeechSession[]
  loading: boolean
  showSummary?: boolean
}

type ChartTooltipProps = {
  active?: boolean
  payload?: {
    color: string
    name: string
    value: number
  }[]
  label?: string
  seriesByKey: Map<string, CompositeIndexSeries>
}

function trendMeta(direction: TrendDirection) {
  switch (direction) {
    case 'improving':
      return {
        label: 'Overall trend improving',
        icon: TrendingUp,
        className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400',
      }
    case 'declining':
      return {
        label: 'Room to grow',
        icon: TrendingDown,
        className: 'border-amber-400/30 bg-amber-400/10 text-amber-400',
      }
    case 'steady':
      return {
        label: 'Holding steady',
        icon: Minus,
        className: 'border-primary/30 bg-primary/10 text-primary',
      }
    default:
      return {
        label: 'Building baseline',
        icon: Minus,
        className: 'border-border/50 bg-secondary/30 text-muted-foreground',
      }
  }
}

function CompositeChartTooltip({
  active,
  payload,
  label,
  seriesByKey,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const entries = payload.filter(
    (entry) => typeof entry.value === 'number' && Number.isFinite(entry.value),
  )
  if (entries.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {entries.map((entry) => {
          const series = seriesByKey.get(entry.name)
          return (
            <li
              key={entry.name}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="flex items-center gap-2 text-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {series?.title ?? entry.name}
              </span>
              <span className="font-semibold tabular-nums">{entry.value}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ProgressTrendChart({
  sessions,
  loading,
  showSummary = true,
}: ProgressTrendChartProps) {
  const trend = useMemo(
    () => buildCompositeProgressTrend(sessions),
    [sessions],
  )
  const chartRows = useMemo(() => buildCompositeChartRows(trend), [trend])
  const seriesByKey = useMemo(
    () => new Map(trend.indices.map((series) => [series.key, series])),
    [trend.indices],
  )

  const meta = trendMeta(trend.overallDirection)
  const TrendIcon = meta.icon
  const sessionCount = trend.sessions.length

  return (
    <div className="mb-8 space-y-6">
      <GlassCard>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Executive growth index
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Two composite scores — executive presence and acoustic precision
              — smoothed with a 3-session rolling average so you see overall
              momentum at a glance.
            </p>
          </div>
          <Badge variant="outline" className={`gap-1.5 ${meta.className}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {meta.label}
            {sessionCount >= 2 && (
              <span className="font-normal opacity-80">
                ({trend.overallDelta >= 0 ? '+' : ''}
                {trend.overallDelta}%)
              </span>
            )}
          </Badge>
        </div>

        {loading && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading your growth index…
          </p>
        )}

        {!loading && sessionCount === 0 && sessions.length > 0 && (
          <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
            Your session is saved, but score data is not available yet. Record
            another drill to populate your growth index.
          </p>
        )}

        {!loading && sessionCount === 0 && sessions.length === 0 && (
          <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
            Complete at least one drill with coach feedback — your composite
            index lines will appear here automatically.
          </p>
        )}

        {!loading && sessionCount > 0 && (
          <>
            {sessionCount === 1 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {trend.indices.map((series) => (
                  <div
                    key={series.key}
                    className="rounded-xl border border-border/30 bg-secondary/20 px-4 py-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {series.title}
                      </span>
                    </div>
                    <p className="text-3xl font-bold tabular-nums text-foreground">
                      {series.points[0]?.rawScore ?? '—'}
                      {series.points[0]?.rawScore !== null ? '%' : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      First session logged — keep practicing to draw your trend
                      line.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-4">
                  {trend.indices.map((series) => (
                    <div
                      key={series.key}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="font-medium text-foreground">
                        {series.title}
                      </span>
                      {series.latestSmoothed !== null && (
                        <span className="tabular-nums">
                          · {series.latestSmoothed}% latest
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border/30 bg-secondary/10 p-3 sm:p-4">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartRows}
                        margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid
                          stroke="currentColor"
                          strokeOpacity={0.08}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={[PROGRESS_CHART_Y_MIN, PROGRESS_CHART_Y_MAX]}
                          ticks={[50, 65, 80, 100]}
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                          width={40}
                        />
                        <Tooltip
                          content={
                            <CompositeChartTooltip seriesByKey={seriesByKey} />
                          }
                        />
                        {trend.indices.map((series) => (
                          <Line
                            key={series.key}
                            type="monotone"
                            dataKey={series.key}
                            name={series.key}
                            stroke={series.color}
                            strokeWidth={2.5}
                            dot={{
                              r: 4,
                              strokeWidth: 2,
                              fill: 'var(--background)',
                            }}
                            activeDot={{ r: 5 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </GlassCard>

      {showSummary && (
        <ExecutiveDashboardSummary sessions={sessions} loading={loading} />
      )}
    </div>
  )
}
