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
  coachHeardText: string
  mispronunciations: MispronunciationItem[]
  coachingTip: string
  homework: HomeworkItem[]
  parseComplete: boolean
}

const SECTION_HEADERS = [
  { key: 'scorecard', pattern: /📊\s*\*\*My Quick Score Card\*\*/i },
  { key: 'heard', pattern: /👂\s*\*\*What the Coach Heard\*\*/i },
  { key: 'tip', pattern: /👅\s*\*\*Try This Mouth Move!\*\*/i },
  { key: 'steps', pattern: /🗓️\s*\*\*My Simple Next Steps\*\*/i },
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

function parseMetrics(scorecardText: string): ScoreMetric[] {
  const metrics: ScoreMetric[] = []
  const maxScore = 3

  for (const line of scorecardText.split('\n')) {
    const bulletMatch = line.match(
      /^\s*[•\-*]\s*\*\*(.+?)\*\*:\s*((?:⭐|☆)+)\s*(.*)$/u,
    )
    if (bulletMatch) {
      const title = bulletMatch[1].trim()
      const score = Math.min(maxScore, Math.max(0, countFilledStars(bulletMatch[2])))
      const status = scoreToStatus(score, maxScore)
      metrics.push({
        title,
        score: score || 1,
        maxScore,
        status,
        statusLabel: parseStatusLabel(bulletMatch[3], status),
      })
      continue
    }

    const plainMatch = line.match(
      /^\s*\*\*(.+?)\*\*:\s*((?:⭐|☆)+)\s*(.*)$/u,
    )
    if (plainMatch) {
      const title = plainMatch[1].trim()
      const score = Math.min(maxScore, Math.max(0, countFilledStars(plainMatch[2])))
      const status = scoreToStatus(score, maxScore)
      metrics.push({
        title,
        score: score || 1,
        maxScore,
        status,
        statusLabel: parseStatusLabel(plainMatch[3], status),
      })
    }
  }

  return metrics
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
  return text
    .split('\n')
    .map((line) => stripMarkdownInline(line))
    .filter((line) => line.length > 0)
    .join('\n\n')
}

export function parseCoachFeedback(feedback: string): ParsedCoachFeedback {
  const sections = splitSections(feedback)
  const metrics = sections.scorecard ? parseMetrics(sections.scorecard) : []
  const heardRaw = sections.heard ?? ''
  const mispronunciations = parseMispronunciations(heardRaw)
  const coachHeardText = cleanProseSection(heardRaw)
  const coachingTip = cleanProseSection(sections.tip ?? '')
  const homework = sections.steps ? parseHomework(sections.steps) : []

  const parseComplete =
    metrics.length > 0 &&
    Boolean(coachingTip || coachHeardText || homework.length > 0)

  return {
    metrics,
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
