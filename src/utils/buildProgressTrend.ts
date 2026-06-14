import type { SpeechSession } from '@/lib/database'
import { isClinicalMetric, isExecutiveMetric } from '@/utils/metricCategories'
import {
  mergeFocusAreasForPhase,
  type PhaseFocus,
} from '@/utils/phaseFocus'
import {
  extractClinicalMetrics,
  extractSessionMetrics,
} from '@/utils/parseCoachFeedback'

export type TrendDirection = 'improving' | 'steady' | 'declining' | 'insufficient'

export type SessionSnapshot = {
  id: string
  date: Date
  label: string
}

export type SoundAreaPoint = {
  sessionId: string
  date: Date
  rawScore: number | null
  smoothedScore: number | null
}

export type SoundAreaSeries = {
  key: string
  title: string
  color: string
  points: SoundAreaPoint[]
  latestSmoothed: number | null
  averageSmoothed: number | null
  delta: number
  direction: TrendDirection
  sessionCount: number
}

export type TargetDrillArea = {
  key: string
  title: string
  averageScore: number
  latestScore: number
  sessions: number
  delta: number
  direction: TrendDirection
}

export type ProgressTrendData = {
  sessions: SessionSnapshot[]
  series: SoundAreaSeries[]
  targetDrillArea: TargetDrillArea | null
  overallDirection: TrendDirection
  overallDelta: number
}

const ROLLING_WINDOW = 3

const SOUND_AREA_COLORS: Record<string, string> = {
  'pace (words per minute)': 'var(--chart-2)',
  'filler word counter': 'var(--chart-4)',
  'clarity score': 'var(--primary)',
  'r-sound strength': 'var(--primary)',
  's-sound clarity (lisp check)': 'var(--chart-2)',
  'th-sound clarity (this & think)': 'var(--chart-4)',
  'l-sound smoothness (long & clear)': 'var(--chart-5)',
  'v & f lip sounds (wish & voice)': 'var(--chart-3)',
  'blend boost (consonant clusters)': 'var(--chart-1)',
  'airflow focus (sides vs. center)': 'var(--info)',
  'back-of-throat sounds (k and g)': 'var(--warning)',
}

const FALLBACK_COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-3)',
  'var(--chart-1)',
]

export const PROGRESS_CHART_Y_MIN = 50
export const PROGRESS_CHART_Y_MAX = 100

function normalizeMetricTitle(title: string): string {
  return title.trim().toLowerCase()
}

function metricPercent(score: number, maxScore: number): number {
  return Math.round((score / maxScore) * 100)
}

function sessionLabel(session: SpeechSession): string {
  if (session.is_baseline || session.mode === 'baseline') {
    return 'Check-in'
  }
  if (session.phoneme_focus) {
    return `${session.phoneme_focus} drill`
  }
  return 'Practice'
}

function rollingAverage(rawValues: (number | null)[]): (number | null)[] {
  return rawValues.map((raw, index) => {
    if (raw === null) return null

    const window = rawValues
      .slice(Math.max(0, index - ROLLING_WINDOW + 1), index + 1)
      .filter((value): value is number => value !== null)

    if (window.length === 0) return null

    return Math.round(
      window.reduce((sum, value) => sum + value, 0) / window.length,
    )
  })
}

function trendFromDelta(delta: number, sessionCount: number): TrendDirection {
  if (sessionCount < 2) return 'insufficient'
  if (delta >= 8) return 'improving'
  if (delta <= -8) return 'declining'
  return 'steady'
}

function colorForMetric(key: string, index: number): string {
  return SOUND_AREA_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

export type CompositeIndexKey = 'executivePresence' | 'acousticPrecision'

export type CompositeIndexSeries = {
  key: CompositeIndexKey
  title: string
  color: string
  points: SoundAreaPoint[]
  latestSmoothed: number | null
  delta: number
  direction: TrendDirection
  sessionCount: number
}

export type CompositeProgressTrend = {
  sessions: SessionSnapshot[]
  indices: CompositeIndexSeries[]
  overallDirection: TrendDirection
  overallDelta: number
}

const COMPOSITE_INDEX_META: Record<
  CompositeIndexKey,
  { title: string; color: string }
> = {
  executivePresence: {
    title: 'Executive Presence Score',
    color: 'var(--primary)',
  },
  acousticPrecision: {
    title: 'Acoustic Precision Index',
    color: 'var(--chart-4)',
  },
}

function averagePercent(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function buildCompositeSeries(
  key: CompositeIndexKey,
  rawSessions: Array<{ snapshot: SessionSnapshot; score: number | null }>,
): CompositeIndexSeries {
  const rawScores = rawSessions.map((entry) => entry.score)
  const smoothedScores = rollingAverage(rawScores)
  const points: SoundAreaPoint[] = rawSessions.map((entry, index) => ({
    sessionId: entry.snapshot.id,
    date: entry.snapshot.date,
    rawScore: rawScores[index],
    smoothedScore:
      rawScores[index] === null ? null : smoothedScores[index],
  }))

  const smoothedValues = smoothedScores.filter(
    (value): value is number => value !== null,
  )
  const sessionCount = rawScores.filter((value) => value !== null).length
  const latestSmoothed =
    smoothedValues.length > 0
      ? smoothedValues[smoothedValues.length - 1]
      : null
  const firstSmoothed = smoothedValues[0] ?? null
  const delta =
    latestSmoothed !== null && firstSmoothed !== null
      ? latestSmoothed - firstSmoothed
      : 0

  const meta = COMPOSITE_INDEX_META[key]

  return {
    key,
    title: meta.title,
    color: meta.color,
    points,
    latestSmoothed,
    delta,
    direction: trendFromDelta(delta, sessionCount),
    sessionCount,
  }
}

/** Two high-level composite indices for the executive dashboard chart. */
export function buildCompositeProgressTrend(
  sessions: SpeechSession[],
): CompositeProgressTrend {
  type ScoredSession = {
    snapshot: SessionSnapshot
    executiveScore: number | null
    acousticScore: number | null
  }

  const scored: ScoredSession[] = []

  for (const session of sessions) {
    const feedback = session.feedback?.trim()
    if (!feedback) continue

    const allMetrics = extractSessionMetrics(
      feedback,
      session.mode === 'baseline' ? null : session.ai_feedback,
    )
    const clinicalMetrics = extractClinicalMetrics(
      feedback,
      session.mode === 'baseline' ? null : session.ai_feedback,
    )

    const executiveValues = allMetrics
      .filter((metric) => isExecutiveMetric(metric.title))
      .map((metric) => metricPercent(metric.score, metric.maxScore))

    const clinicalValues =
      clinicalMetrics.length > 0
        ? clinicalMetrics.map((metric) =>
            metricPercent(metric.score, metric.maxScore),
          )
        : allMetrics
            .filter((metric) => isClinicalMetric(metric.title))
            .map((metric) => metricPercent(metric.score, metric.maxScore))

    const date = session.created_at ? new Date(session.created_at) : new Date()
    const id = session.id ?? session.created_at ?? `${date.getTime()}`

    scored.push({
      snapshot: { id, date, label: sessionLabel(session) },
      executiveScore: averagePercent(executiveValues),
      acousticScore: averagePercent(clinicalValues),
    })
  }

  scored.sort((a, b) => a.snapshot.date.getTime() - b.snapshot.date.getTime())

  if (scored.length === 0) {
    return {
      sessions: [],
      indices: [],
      overallDirection: 'insufficient',
      overallDelta: 0,
    }
  }

  const snapshots = scored.map((entry) => entry.snapshot)
  const indices = [
    buildCompositeSeries(
      'executivePresence',
      scored.map((entry) => ({
        snapshot: entry.snapshot,
        score: entry.executiveScore,
      })),
    ),
    buildCompositeSeries(
      'acousticPrecision',
      scored.map((entry) => ({
        snapshot: entry.snapshot,
        score: entry.acousticScore,
      })),
    ),
  ].filter((series) => series.sessionCount > 0)

  const primary =
    indices.find((series) => series.key === 'executivePresence') ?? indices[0]

  return {
    sessions: snapshots,
    indices,
    overallDirection: primary?.direction ?? 'insufficient',
    overallDelta: primary?.delta ?? 0,
  }
}

export function buildCompositeChartRows(
  trend: CompositeProgressTrend,
): ProgressChartRow[] {
  return trend.sessions.map((session, index) => {
    const row: ProgressChartRow = {
      sessionId: session.id,
      sessionLabel: session.label,
      dateLabel: formatChartDate(session.date),
      executivePresence: null,
      acousticPrecision: null,
    }

    for (const series of trend.indices) {
      const point = series.points[index]
      row[series.key] =
        point?.rawScore !== null && point?.rawScore !== undefined
          ? point.smoothedScore
          : null
    }

    return row
  })
}

export function buildProgressTrend(
  sessions: SpeechSession[],
): ProgressTrendData {
  type RawSession = {
    snapshot: SessionSnapshot
    metrics: Map<string, { title: string; pct: number }>
  }

  const rawSessions: RawSession[] = []

  for (const session of sessions) {
    const feedback = session.feedback?.trim()
    if (!feedback) continue

    const parsedMetrics = extractSessionMetrics(
      feedback,
      session.mode === 'baseline' ? null : session.ai_feedback,
    )
    if (parsedMetrics.length === 0) continue

    const date = session.created_at ? new Date(session.created_at) : new Date()
    const id = session.id ?? session.created_at ?? `${date.getTime()}`
    const metricMap = new Map<string, { title: string; pct: number }>()

    for (const metric of parsedMetrics) {
      const key = normalizeMetricTitle(metric.title)
      metricMap.set(key, {
        title: metric.title,
        pct: metricPercent(metric.score, metric.maxScore),
      })
    }

    rawSessions.push({
      snapshot: { id, date, label: sessionLabel(session) },
      metrics: metricMap,
    })
  }

  rawSessions.sort(
    (a, b) => a.snapshot.date.getTime() - b.snapshot.date.getTime(),
  )

  if (rawSessions.length === 0) {
    return {
      sessions: [],
      series: [],
      targetDrillArea: null,
      overallDirection: 'insufficient',
      overallDelta: 0,
    }
  }

  const sessionSnapshots = rawSessions.map((entry) => entry.snapshot)

  const areaMeta = new Map<string, { title: string; index: number }>()
  let areaIndex = 0

  for (const entry of rawSessions) {
    for (const [key, { title }] of entry.metrics) {
      if (!areaMeta.has(key)) {
        areaMeta.set(key, { title, index: areaIndex++ })
      }
    }
  }

  const series: SoundAreaSeries[] = [...areaMeta.entries()]
    .sort((a, b) => a[1].index - b[1].index)
    .map(([key, meta]) => {
      const rawScores = rawSessions.map((entry) => {
        const metric = entry.metrics.get(key)
        return metric?.pct ?? null
      })

      const smoothedScores = rollingAverage(rawScores)

      const points: SoundAreaPoint[] = rawSessions.map((entry, index) => ({
        sessionId: entry.snapshot.id,
        date: entry.snapshot.date,
        rawScore: rawScores[index],
        smoothedScore:
          rawScores[index] === null ? null : smoothedScores[index],
      }))

      const smoothedValues = smoothedScores.filter(
        (value): value is number => value !== null,
      )
      const sessionCount = rawScores.filter((value) => value !== null).length
      const latestSmoothed =
        smoothedValues.length > 0
          ? smoothedValues[smoothedValues.length - 1]
          : null
      const averageSmoothed =
        smoothedValues.length > 0
          ? Math.round(
              smoothedValues.reduce((sum, value) => sum + value, 0) /
                smoothedValues.length,
            )
          : null

      const firstSmoothed = smoothedValues[0] ?? null
      const delta =
        latestSmoothed !== null && firstSmoothed !== null
          ? latestSmoothed - firstSmoothed
          : 0

      return {
        key,
        title: meta.title,
        color: colorForMetric(key, meta.index),
        points,
        latestSmoothed,
        averageSmoothed,
        delta,
        direction: trendFromDelta(delta, sessionCount),
        sessionCount,
      }
    })
    .filter((entry) => entry.sessionCount > 0)
    .sort((a, b) => (a.averageSmoothed ?? 100) - (b.averageSmoothed ?? 100))

  const targetDrillArea: TargetDrillArea | null =
    series.length > 0
      ? (() => {
          const weakest = series[0]
          return {
            key: weakest.key,
            title: weakest.title,
            averageScore: weakest.averageSmoothed ?? 0,
            latestScore: weakest.latestSmoothed ?? weakest.averageSmoothed ?? 0,
            sessions: weakest.sessionCount,
            delta: weakest.delta,
            direction: weakest.direction,
          }
        })()
      : null

  return {
    sessions: sessionSnapshots,
    series,
    targetDrillArea,
    overallDirection: targetDrillArea?.direction ?? 'insufficient',
    overallDelta: targetDrillArea?.delta ?? 0,
  }
}

export type ProgressChartRow = {
  sessionId: string
  sessionLabel: string
  dateLabel: string
  [seriesKey: string]: string | number | null
}

function formatChartDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/** Flatten trend series into Recharts rows — null when a sound was not scored. */
export function buildProgressChartRows(
  trend: ProgressTrendData,
): ProgressChartRow[] {
  return trend.sessions.map((session, index) => {
    const row: ProgressChartRow = {
      sessionId: session.id,
      sessionLabel: session.label,
      dateLabel: formatChartDate(session.date),
    }

    for (const series of trend.series) {
      const point = series.points[index]
      row[series.key] =
        point?.rawScore !== null && point?.rawScore !== undefined
          ? point.smoothedScore
          : null
    }

    return row
  })
}

/** Series that have at least one stored score in session history. */
export function chartableSeries(trend: ProgressTrendData): SoundAreaSeries[] {
  return trend.series.filter((series) => series.sessionCount > 0)
}

export type PracticeFocus = {
  focusAreas: string[]
  targetDrillArea: TargetDrillArea | null
  fromProgress: boolean
}

/** Merge progress-chart target area with check-in focus for drill selection. */
export function resolvePracticeFocus({
  sessions,
  checkInFocusAreas,
  activePhaseFocus,
}: {
  sessions: SpeechSession[]
  checkInFocusAreas: string[]
  activePhaseFocus?: PhaseFocus
}): PracticeFocus {
  const { targetDrillArea } = buildProgressTrend(sessions)

  const supplemental: string[] = []
  if (targetDrillArea) {
    supplemental.push(targetDrillArea.title)
  }
  supplemental.push(...checkInFocusAreas)

  if (activePhaseFocus) {
    return {
      focusAreas: mergeFocusAreasForPhase(activePhaseFocus, supplemental),
      targetDrillArea,
      fromProgress: Boolean(targetDrillArea),
    }
  }

  if (targetDrillArea) {
    const rest = checkInFocusAreas.filter(
      (area) =>
        area.trim().toLowerCase() !== targetDrillArea.title.trim().toLowerCase(),
    )
    return {
      focusAreas: [targetDrillArea.title, ...rest],
      targetDrillArea,
      fromProgress: true,
    }
  }

  if (checkInFocusAreas.length > 0) {
    return {
      focusAreas: checkInFocusAreas,
      targetDrillArea: null,
      fromProgress: false,
    }
  }

  return {
    focusAreas: ['R-Sound Strength'],
    targetDrillArea: null,
    fromProgress: false,
  }
}
