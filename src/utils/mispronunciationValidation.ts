export type MispronunciationItem = {
  expected: string
  heard: string
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019'"]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordTokens(text: string): string[] {
  return normalizeForMatch(text).split(' ').filter(Boolean)
}

export function wordsEquivalent(a: string, b: string): boolean {
  if (a === b) return true
  if (a + 's' === b || b + 's' === a) return true
  if (a.endsWith('s') && a.slice(0, -1) === b) return true
  if (b.endsWith('s') && b.slice(0, -1) === a) return true
  return false
}

export function phrasesEquivalent(a: string, b: string): boolean {
  const wordsA = wordTokens(a)
  const wordsB = wordTokens(b)
  if (wordsA.length !== wordsB.length) return false
  return wordsA.every((word, index) => wordsEquivalent(word, wordsB[index]))
}

export function phraseInText(phrase: string, text: string): boolean {
  const phraseWords = wordTokens(phrase)
  const textWords = wordTokens(text)
  if (phraseWords.length === 0 || textWords.length === 0) return false

  for (let i = 0; i <= textWords.length - phraseWords.length; i += 1) {
    let matches = true
    for (let j = 0; j < phraseWords.length; j += 1) {
      if (!wordsEquivalent(textWords[i + j], phraseWords[j])) {
        matches = false
        break
      }
    }
    if (matches) return true
  }

  return false
}

function alignExpectedToTarget(
  expected: string,
  heard: string,
  targetSentence: string,
): string | null {
  const heardWords = wordTokens(heard)
  const targetWords = wordTokens(targetSentence)
  const count = heardWords.length
  if (count === 0) return null

  for (let i = 0; i <= targetWords.length - count; i += 1) {
    const slice = targetWords.slice(i, i + count).join(' ')
    if (phrasesEquivalent(slice, heard)) {
      return slice
    }
  }

  if (phraseInText(heard, targetSentence) && !phraseInText(expected, targetSentence)) {
    return heard
  }

  return null
}

function isFalsePositive(
  item: MispronunciationItem,
  targetSentence: string,
  transcript: string,
): boolean {
  const expected = item.expected.trim()
  const heard = item.heard.trim()
  if (!expected || !heard) return true

  if (phrasesEquivalent(expected, heard)) return true

  const target = targetSentence.trim()
  const spoken = transcript.trim()

  if (target && phraseInText(heard, target)) {
    if (!phraseInText(expected, target)) return true
    const aligned = alignExpectedToTarget(expected, heard, target)
    if (aligned && phrasesEquivalent(aligned, heard)) return true
  }

  if (spoken && phraseInText(heard, spoken) && target && !phraseInText(expected, target)) {
    return true
  }

  return false
}

/** Filter coach mispronunciations against the on-screen target and transcript. */
export function sanitizeMispronunciations(
  items: MispronunciationItem[],
  targetSentence: string,
  transcript: string,
): MispronunciationItem[] {
  const target = targetSentence.trim()

  return items
    .filter((item) => !isFalsePositive(item, target, transcript))
    .map((item) => {
      const aligned = target
        ? alignExpectedToTarget(item.expected, item.heard, target)
        : null
      return aligned
        ? { expected: aligned, heard: item.heard.trim() }
        : { expected: item.expected.trim(), heard: item.heard.trim() }
    })
    .filter((item) => !phrasesEquivalent(item.expected, item.heard))
}
