import { BASELINE_PRACTICE_SENTENCE } from '../constants/studio'

const STORAGE_KEY = 'speech-studio-drill-history'
const MAX_STORED = 100

function normalize(sentence: string): string {
  return sentence.trim().toLowerCase()
}

export function getStoredDrillHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export function addToDrillHistory(sentences: string[]) {
  const existing = getStoredDrillHistory()
  const merged = [...sentences, ...existing]
  const seen = new Set<string>()
  const unique: string[] = []

  for (const sentence of merged) {
    const key = normalize(sentence)
    if (!key || key === normalize(BASELINE_PRACTICE_SENTENCE)) continue
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(sentence.trim())
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(unique.slice(0, MAX_STORED)),
  )
}

export function mergeExcludeSentences(
  ...groups: Array<string[] | undefined>
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const group of groups) {
    for (const sentence of group ?? []) {
      const trimmed = sentence.trim()
      const key = normalize(trimmed)
      if (!key || seen.has(key)) continue
      seen.add(key)
      result.push(trimmed)
    }
  }

  return result
}
