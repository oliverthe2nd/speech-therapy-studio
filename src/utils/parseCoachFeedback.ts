import { normalizeCoachText } from '@/utils/normalizeCoachText'

export type ScoreStatus = 'excellent' | 'good' | 'needs-practice'

export type ScoreMetric = {
  title: string
  score: number
  maxScore: number
  status: ScoreStatus
  statusLabel: string
}

export type MispronunciationItem = {
  expected: string
  heard: string
}

export type HomeworkItem = {
  id: string
  label: string
  completed: boolean
}

export type ParsedCoachFeedback = {
  metrics: ScoreMetric[]
  clinicalMetrics: ScoreMetric[]
  coachHeardText: string
  mispronunciations: MispronunciationItem[]
  coachingTip: string
  homework: HomeworkItem[]
  parseComplete: boolean
}

const SECTION_HEADERS = [
  {
    key: 'scorecard',
    pattern:
      /(?:📊\s*)?\*\*(?:My Quick Score Card|Executive Score Card)\*\*/i,
  },
  {
    key: 'clinical',
    pattern:
      /(?:🔬|🎯)\s*\*\*(?:Phonetic Sound Precision|Phonetic Precision Tracker|Clinical Sound Trackers)\*\*/i,
  },
  { key: 'heard', pattern: /(?:👂\s*)?\*\*What the Coach Heard\*\*/i },
  {
    key: 'tip',
    pattern:
      /(?:👅|👔)\s*\*\*(?:Try This Mouth Move!|Executive Delivery Tip)\*\*/i,
  },
  {
    key: 'steps',
    pattern:
      /(?:🗓️\s*)?\*\*(?:My Simple Next Steps|Your Next Business Drills)\*\*/i,
  },
] as const

const DEFAULT_LABELS: Record<ScoreStatus, string> = {
  excellent: 'Super Clear',
  good: 'Getting Close',
  'needs-practice': 'Needs Practice',
}

function countFilledStars(starChunk: string): number {
  return (starChunk.match(/⭐/g) ?? []).length
}

function scoreToStatus(score: number, maxScore: number): ScoreStatus {
  if (score >= maxScore) return 'excellent'
  if (score >= maxScore - 1) return 'good'
  return 'needs-practice'
}

function splitSections(feedback: string): Partial<Record<string, string>> {
  const hits: { key: string; start: number; contentStart: number }[] = []

  for (const { key, pattern } of SECTION_HEADERS) {
    const match = feedback.match(pattern)
    if (match?.index !== undefined) {
      hits.push({
        key,
        start: match.index,
        contentStart: match.index + match[0].length,
      })
    }
  }

  hits.sort((a, b) => a.start - b.start)

  const sections: Partial<Record<string, string>> = {}
  for (let i = 0; i < hits.length; i++) {
    const end =
      i + 1 < hits.length ? hits[i + 1].start : feedback.length
    sections[hits[i].key] = feedback.slice(hits[i].contentStart, end).trim()
  }

  return sections
}

function parseStatusLabel(raw: string, status: ScoreStatus): string {
  const cleaned = raw
    .replace(/^⭐+☆*\s*/u, '')
    .replace(/^[:\-–—]\s*/, '')
    .trim()

  if (!cleaned) return DEFAULT_LABELS[status]

  const lower = cleaned.toLowerCase()
  if (lower.includes('super clear')) return 'Super Clear'
  if (lower.includes('getting close')) return 'Getting Close'
  if (lower.includes('needs practice')) return 'Needs Practice'

  const dash = cleaned.split(/\s*[—–-]\s*/)
  return dash[0]?.trim() || cleaned
}

function pushMetric(
  metrics: ScoreMetric[],
  seen: Set<string>,
  title: string,
  score: number,
  maxScore: number,
  statusLabelRaw = '',
) {
  const normalizedTitle = title.trim()
  if (!normalizedTitle) return

  const key = normalizedTitle.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)

  const clampedScore = Math.min(maxScore, Math.max(1, score || 1))
  const status = scoreToStatus(clampedScore, maxScore)
  metrics.push({
    title: normalizedTitle,
    score: clampedScore,
    maxScore,
    status,
    statusLabel: parseStatusLabel(statusLabelRaw, status),
  })
}

function parseMetricLine(line: string, metrics: ScoreMetric[], seen: Set<string>) {
  const maxScore = 3

  const bulletMatch = line.match(
    /^\s*[•\-*]\s*\*\*(.+?)\*\*[:\s]+((?:⭐|☆)+)\s*(.*)$/u,
  )
  if (bulletMatch) {
    pushMetric(
      metrics,
      seen,
      bulletMatch[1],
      countFilledStars(bulletMatch[2]),
      maxScore,
      bulletMatch[3],
    )
    return
  }

  const plainMatch = line.match(
    /^\s*\*\*(.+?)\*\*[:\s]+((?:⭐|☆)+)\s*(.*)$/u,
  )
  if (plainMatch) {
    pushMetric(
      metrics,
      seen,
      plainMatch[1],
      countFilledStars(plainMatch[2]),
      maxScore,
      plainMatch[3],
    )
    return
  }

  const numericBullet = line.match(
    /^\s*[•\-*]\s*\*\*(.+?)\*\*[:\s]+(\d+)\s*\/\s*(\d+)\s*(.*)$/u,
  )
  if (numericBullet) {
    pushMetric(
      metrics,
      seen,
      numericBullet[1],
      Number(numericBullet[2]),
      Number(numericBullet[3]) || maxScore,
      numericBullet[4],
    )
    return
  }

  const numericPlain = line.match(
    /^\s*\*\*(.+?)\*\*[:\s]+(\d+)\s*\/\s*(\d+)\s*(.*)$/u,
  )
  if (numericPlain) {
    pushMetric(
      metrics,
      seen,
      numericPlain[1],
      Number(numericPlain[2]),
      Number(numericPlain[3]) || maxScore,
      numericPlain[4],
    )
  }
}

function parseMetrics(scorecardText: string): ScoreMetric[] {
  const metrics: ScoreMetric[] = []
  const seen = new Set<string>()

  for (const line of scorecardText.split('\n')) {
    parseMetricLine(line, metrics, seen)
  }

  return metrics
}

function parseMetricsLoose(text: string): ScoreMetric[] {
  const metrics: ScoreMetric[] = []
  const seen = new Set<string>()

  for (const line of text.split('\n')) {
    parseMetricLine(line, metrics, seen)
  }

  return metrics
}

function normalizeMetricsArray(raw: unknown[]): ScoreMetric[] {
  const metrics: ScoreMetric[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    if (typeof record.title !== 'string') continue

    const maxScore =
      typeof record.maxScore === 'number' && record.maxScore > 0
        ? record.maxScore
        : 3
    const score =
      typeof record.score === 'number' ? record.score : Number(record.score) || 1

    pushMetric(
      metrics,
      seen,
      record.title,
      score,
      maxScore,
      typeof record.statusLabel === 'string' ? record.statusLabel : '',
    )
  }

  return metrics
}

function parseMetricsFromJson(text: string): {
  metrics: ScoreMetric[]
  clinicalMetrics: ScoreMetric[]
} {
  const empty = { metrics: [] as ScoreMetric[], clinicalMetrics: [] as ScoreMetric[] }
  const trimmed = text.trim()
  if (!trimmed) return empty

  const tryParse = (parsed: Record<string, unknown>) => {
    const metrics = Array.isArray(parsed.metrics)
      ? normalizeMetricsArray(parsed.metrics)
      : []
    const clinicalMetrics = Array.isArray(parsed.clinicalMetrics)
      ? normalizeMetricsArray(parsed.clinicalMetrics)
      : []
    if (metrics.length > 0 || clinicalMetrics.length > 0) {
      return { metrics, clinicalMetrics }
    }
    return null
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      const direct = tryParse(parsed)
      if (direct) return direct
      if (
        parsed.analysis &&
        typeof parsed.analysis === 'object'
      ) {
        const nested = tryParse(parsed.analysis as Record<string, unknown>)
        if (nested) return nested
      }
    } catch {
      /* fall through */
    }
  }

  const match = text.match(/\{[\s\S]*?"metrics"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>
      const result = tryParse(parsed)
      if (result) return result
    } catch {
      /* ignore */
    }
  }

  return empty
}

function parseStoredCoachMetrics(raw: string): {
  metrics: ScoreMetric[]
  clinicalMetrics: ScoreMetric[]
} {
  const empty = { metrics: [] as ScoreMetric[], clinicalMetrics: [] as ScoreMetric[] }
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return empty

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    return {
      metrics: Array.isArray(parsed.metrics)
        ? normalizeMetricsArray(parsed.metrics)
        : [],
      clinicalMetrics: Array.isArray(parsed.clinicalMetrics)
        ? normalizeMetricsArray(parsed.clinicalMetrics)
        : [],
    }
  } catch {
    return empty
  }
}

/** Pull score metrics from markdown, JSON, or stored coach payload. */
export function extractSessionMetrics(
  feedback: string,
  storedMetricsJson?: string | null,
): ScoreMetric[] {
  if (storedMetricsJson?.trim()) {
    const stored = parseStoredCoachMetrics(storedMetricsJson)
    if (stored.metrics.length > 0) return stored.metrics
  }

  const sanitized = feedback.trim()
  if (!sanitized) return []

  const parsed = parseCoachFeedback(sanitized)
  if (parsed.metrics.length > 0) return parsed.metrics

  const loose = parseMetricsLoose(sanitized)
  if (loose.length > 0) return loose

  return parseMetricsFromJson(sanitized).metrics
}

export function extractClinicalMetrics(
  feedback: string,
  storedMetricsJson?: string | null,
): ScoreMetric[] {
  if (storedMetricsJson?.trim()) {
    const stored = parseStoredCoachMetrics(storedMetricsJson)
    if (stored.clinicalMetrics.length > 0) return stored.clinicalMetrics
  }

  const sanitized = feedback.trim()
  if (!sanitized) return []

  const parsed = parseCoachFeedback(sanitized)
  if (parsed.clinicalMetrics.length > 0) return parsed.clinicalMetrics

  return parseMetricsFromJson(sanitized).clinicalMetrics
}

function parseMispronunciations(heardText: string): MispronunciationItem[] {
  const items: MispronunciationItem[] = []

  const pairRegex =
    /Expected:\s*["']?([^"'\n]+?)["']?\s*(?:\n|.)*?Heard:\s*["']?([^"'\n]+?)["']?/gis
  let pairMatch: RegExpExecArray | null
  while ((pairMatch = pairRegex.exec(heardText)) !== null) {
    items.push({
      expected: pairMatch[1].trim(),
      heard: pairMatch[2].trim(),
    })
  }

  if (items.length > 0) return items

  const inlineRegex =
    /(?:expected|target|wanted)[:\s]+["']?([^"'\n,]+?)["']?\s*(?:,|—|–|-|\s)+\s*(?:heard|said|sounded like)[:\s]+["']?([^"'\n]+?)["']?/gi
  while ((pairMatch = inlineRegex.exec(heardText)) !== null) {
    items.push({
      expected: pairMatch[1].trim(),
      heard: pairMatch[2].trim(),
    })
  }

  const vsRegex = /["']([^"']+)["']\s+(?:vs\.?|versus|instead of)\s+["']([^"']+)["']/gi
  while ((pairMatch = vsRegex.exec(heardText)) !== null) {
    items.push({
      expected: pairMatch[1].trim(),
      heard: pairMatch[2].trim(),
    })
  }

  return items
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*[•\-*]\s*/, '')
    .trim()
}

function parseHomework(stepsText: string): HomeworkItem[] {
  const items: HomeworkItem[] = []

  for (const line of stepsText.split('\n')) {
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.+)$/)
    if (numbered) {
      const label = stripMarkdownInline(numbered[2])
      if (label) {
        items.push({
          id: `step-${numbered[1]}`,
          label,
          completed: false,
        })
      }
      continue
    }

    const bullet = line.match(/^\s*[•\-*]\s+(.+)$/)
    if (bullet) {
      const label = stripMarkdownInline(bullet[1])
      if (label) {
        items.push({
          id: `step-${items.length + 1}`,
          label,
          completed: false,
        })
      }
    }
  }

  return items
}

function cleanProseSection(text: string): string {
  return normalizeCoachText(text)
    .split('\n')
    .map((line) => stripMarkdownInline(line))
    .filter((line) => line.length > 0)
    .join('\n\n')
}

export function parseCoachFeedback(feedback: string): ParsedCoachFeedback {
  const sections = splitSections(feedback)
  let metrics = sections.scorecard ? parseMetrics(sections.scorecard) : []
  let clinicalMetrics = sections.clinical
    ? parseMetrics(sections.clinical)
    : []

  if (metrics.length === 0) {
    metrics = parseMetricsLoose(feedback)
  }

  const jsonParsed = parseMetricsFromJson(feedback)
  if (metrics.length === 0 && jsonParsed.metrics.length > 0) {
    metrics = jsonParsed.metrics
  }
  if (clinicalMetrics.length === 0 && jsonParsed.clinicalMetrics.length > 0) {
    clinicalMetrics = jsonParsed.clinicalMetrics
  }

  const heardRaw = sections.heard ?? ''
  const mispronunciations = parseMispronunciations(heardRaw)
  const coachHeardText = cleanProseSection(heardRaw)
  const coachingTip = cleanProseSection(sections.tip ?? '')
  const homework = sections.steps ? parseHomework(sections.steps) : []

  const parseComplete =
    (metrics.length > 0 || clinicalMetrics.length > 0) &&
    Boolean(coachingTip || coachHeardText || homework.length > 0)

  return {
    metrics,
    clinicalMetrics,
    coachHeardText,
    mispronunciations,
    coachingTip,
    homework,
    parseComplete,
  }
}

export function homeworkStorageKey(
  targetSentence: string,
  labels: string[],
): string {
  return `speech-homework:${targetSentence}:${labels.join('||')}`
}
