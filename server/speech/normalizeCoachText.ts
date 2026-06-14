/** Unescape JSON-style artifacts Claude sometimes emits as literal characters. */
export function normalizeCoachText(text: string): string {
  if (!text) return ''

  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim()
}
