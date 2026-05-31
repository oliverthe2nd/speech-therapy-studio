/** Pull sound areas that need work from the coach score card (⭐☆☆ or ⭐⭐☆). */
export function parseWeakFocusAreas(feedback: string): string[] {
  const weak = new Set<string>()

  for (const line of feedback.split('\n')) {
    const needsWork =
      line.includes('⭐☆☆') ||
      line.includes('⭐⭐☆') ||
      /needs practice/i.test(line) ||
      /getting close/i.test(line)

    if (!needsWork) continue

    if (/R-Sound Strength/i.test(line)) {
      weak.add('R-Sound Strength')
    }
    if (/S-Sound Clarity/i.test(line)) {
      weak.add('S-Sound Clarity (Lisp Check)')
    }
    if (/Th-Sound/i.test(line)) {
      weak.add('Th-Sound Clarity (This & Think)')
    }
    if (/L-Sound/i.test(line)) {
      weak.add('L-Sound Smoothness (Long & Clear)')
    }
    if (/V\s*&\s*F|V and F/i.test(line)) {
      weak.add('V & F Lip Sounds (Wish & Voice)')
    }
    if (/Blend Boost|Blends/i.test(line)) {
      weak.add('Blend Boost (Consonant Clusters)')
    }
    if (/Airflow Focus/i.test(line)) {
      weak.add('Airflow Focus (Sides vs. Center)')
    }
    if (/Back-of-Throat/i.test(line)) {
      weak.add('Back-of-Throat Sounds (K and G)')
    }
  }

  return Array.from(weak)
}
