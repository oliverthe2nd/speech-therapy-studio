import type { ProfessionalMetrics, ScoreStatus } from './types.ts'

const FILLER_PATTERN =
  /\b(um+|uh+|er+|ah+|hm+|like|you know|sort of|basically|actually|literally|i mean)\b/gi

export function countFillerWords(transcript: string): {
  count: number
  detected: string[]
} {
  const detected: string[] = []
  const matches = transcript.match(FILLER_PATTERN) ?? []
  for (const match of matches) {
    detected.push(match.toLowerCase())
  }
  return { count: detected.length, detected }
}

export function computeWpm(transcript: string, durationMs: number): number {
  if (durationMs <= 0) return 0
  const words = transcript.trim().split(/\s+/).filter(Boolean).length
  return Math.round(words / (durationMs / 60000))
}

function scoreFromBand(
  score: number,
  excellent: string,
  good: string,
  needs: string,
): { score: number; maxScore: 3; status: ScoreStatus; statusLabel: string } {
  if (score >= 3) {
    return { score: 3, maxScore: 3, status: 'excellent', statusLabel: excellent }
  }
  if (score === 2) {
    return { score: 2, maxScore: 3, status: 'good', statusLabel: good }
  }
  return { score: 1, maxScore: 3, status: 'needs-practice', statusLabel: needs }
}

export function scorePace(wpm: number) {
  let band = 1
  if (wpm >= 130 && wpm <= 160) band = 3
  else if (wpm >= 115 && wpm <= 175) band = 2

  return {
    wpm,
    idealRange: '130-160 WPM',
    ...scoreFromBand(
      band,
      'Executive Pace',
      'Slightly Off Target',
      'Slow Down or Speed Up',
    ),
  }
}

export function scoreFillers(count: number, detected: string[]) {
  let band = 1
  if (count <= 1) band = 3
  else if (count <= 4) band = 2

  return {
    count,
    detected: detected.slice(0, 12),
    ...scoreFromBand(
      band,
      'Minimal Fillers',
      'Light Filler Use',
      'Reduce Fillers',
    ),
  }
}

function readMetricBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  return raw as Record<string, unknown>
}

function readScoreBlock(raw: Record<string, unknown>) {
  const score = typeof raw.score === 'number' ? raw.score : 2
  const maxScore = typeof raw.maxScore === 'number' ? raw.maxScore : 3
  const status =
    raw.status === 'excellent' ||
    raw.status === 'good' ||
    raw.status === 'needs-practice'
      ? raw.status
      : 'good'
  const statusLabel =
    typeof raw.statusLabel === 'string' ? raw.statusLabel.trim() : 'On Track'

  return { score, maxScore, status, statusLabel }
}

export function parseProfessionalMetrics(raw: unknown): Partial<ProfessionalMetrics> {
  const block = readMetricBlock(raw)
  if (!block) return {}

  const paceRaw = readMetricBlock(block.pace)
  const fillerRaw = readMetricBlock(block.fillerWords)
  const clarityRaw = readMetricBlock(block.clarity)

  const result: Partial<ProfessionalMetrics> = {}

  if (paceRaw) {
    result.pace = {
      wpm: typeof paceRaw.wpm === 'number' ? paceRaw.wpm : 0,
      idealRange:
        typeof paceRaw.idealRange === 'string'
          ? paceRaw.idealRange
          : '130-160 WPM',
      ...readScoreBlock(paceRaw),
    }
  }

  if (fillerRaw) {
    result.fillerWords = {
      count: typeof fillerRaw.count === 'number' ? fillerRaw.count : 0,
      detected: Array.isArray(fillerRaw.detected)
        ? fillerRaw.detected.filter((item) => typeof item === 'string')
        : [],
      ...readScoreBlock(fillerRaw),
    }
  }

  if (clarityRaw) {
    result.clarity = {
      summary:
        typeof clarityRaw.summary === 'string'
          ? clarityRaw.summary.trim()
          : '',
      ...readScoreBlock(clarityRaw),
    }
  }

  return result
}

export function buildProfessionalMetrics(
  transcript: string,
  durationMs: number | undefined,
  aiMetrics: Partial<ProfessionalMetrics>,
): ProfessionalMetrics {
  const fillers = countFillerWords(transcript)
  const computedWpm =
    durationMs && durationMs > 0 ? computeWpm(transcript, durationMs) : 0

  const paceFromAi = aiMetrics.pace
  const wpm = computedWpm > 0 ? computedWpm : (paceFromAi?.wpm ?? 0)
  const paceScored = wpm > 0 ? scorePace(wpm) : scorePace(paceFromAi?.wpm ?? 140)

  const fillerScored = scoreFillers(
    fillers.count > 0 ? fillers.count : (aiMetrics.fillerWords?.count ?? 0),
    fillers.detected.length > 0
      ? fillers.detected
      : (aiMetrics.fillerWords?.detected ?? []),
  )

  const clarityAi = aiMetrics.clarity
  const clarityScored = clarityAi
    ? {
        summary: clarityAi.summary || 'Accent precision and articulation noted.',
        score: clarityAi.score,
        maxScore: clarityAi.maxScore ?? 3,
        status: clarityAi.status,
        statusLabel: clarityAi.statusLabel,
      }
    : {
        summary: 'Clarity reviewed against your target script.',
        score: 2,
        maxScore: 3,
        status: 'good' as ScoreStatus,
        statusLabel: 'Professional Clarity',
      }

  return {
    pace: {
      wpm: wpm || paceScored.wpm,
      idealRange: paceFromAi?.idealRange ?? paceScored.idealRange,
      score: paceFromAi?.score ?? paceScored.score,
      maxScore: 3,
      status: paceFromAi?.status ?? paceScored.status,
      statusLabel: paceFromAi?.statusLabel ?? paceScored.statusLabel,
    },
    fillerWords: {
      count: fillerScored.count,
      detected: fillerScored.detected,
      score: aiMetrics.fillerWords?.score ?? fillerScored.score,
      maxScore: 3,
      status: aiMetrics.fillerWords?.status ?? fillerScored.status,
      statusLabel:
        aiMetrics.fillerWords?.statusLabel ?? fillerScored.statusLabel,
    },
    clarity: clarityScored,
  }
}

export function professionalMetricsToScoreMetrics(
  metrics: ProfessionalMetrics,
) {
  return [
    {
      title: 'Pace (Words Per Minute)',
      score: metrics.pace.score,
      maxScore: metrics.pace.maxScore,
      status: metrics.pace.status,
      statusLabel: `${metrics.pace.statusLabel} (${metrics.pace.wpm} WPM)`,
    },
    {
      title: 'Filler Word Counter',
      score: metrics.fillerWords.score,
      maxScore: metrics.fillerWords.maxScore,
      status: metrics.fillerWords.status,
      statusLabel:
        metrics.fillerWords.count === 0
          ? 'No fillers detected'
          : `${metrics.fillerWords.count} filler${metrics.fillerWords.count === 1 ? '' : 's'} (${metrics.fillerWords.detected.slice(0, 3).join(', ') || 'detected'})`,
    },
    {
      title: 'Clarity Score',
      score: metrics.clarity.score,
      maxScore: metrics.clarity.maxScore,
      status: metrics.clarity.status,
      statusLabel: metrics.clarity.statusLabel,
    },
  ]
}
