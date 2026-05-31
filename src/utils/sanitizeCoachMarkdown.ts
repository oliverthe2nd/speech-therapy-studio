/** Strips raw markdown divider lines that break our feedback layout. */
export function sanitizeCoachMarkdown(text: string): string {
  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      if (/^[_\-=*]{3,}$/.test(trimmed)) return false
      if (/^#{1,6}\s*[_\-=*]+\s*$/.test(trimmed)) return false
      return true
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
