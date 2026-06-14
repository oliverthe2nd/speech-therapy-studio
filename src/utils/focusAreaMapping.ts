import type { PhonemeFocus } from '@/constants/studio'

/** Map coach score-card sound areas to the closest built-in drill phoneme. */
export function phonemeFromFocusArea(area: string): PhonemeFocus | null {
  if (/R-Sound/i.test(area)) return 'R'
  if (/S-Sound/i.test(area)) return 'S'
  if (/Th-Sound/i.test(area)) return 'S'
  if (/L-Sound/i.test(area)) return 'R'
  if (/V\s*&\s*F|V and F/i.test(area)) return 'S'
  if (/Blend Boost|Blends/i.test(area)) return 'R'
  if (/Airflow/i.test(area)) return 'S'
  if (/Back-of-Throat|K and G/i.test(area)) return 'R'
  return null
}

export function primaryPhonemeFromFocusAreas(
  areas: string[],
): PhonemeFocus | null {
  for (const area of areas) {
    const phoneme = phonemeFromFocusArea(area)
    if (phoneme) return phoneme
  }
  return null
}
