/** Executive-facing labels and subtexts — never expose raw clinical strings on the UI. */

export type BrandedFocusArea = {
  label: string
  subtext: string
}

const EXACT_LABELS: Record<string, BrandedFocusArea> = {
  'R-Sound Strength': {
    label: 'Vocalic R Precision',
    subtext:
      'Drives strong vocal authority and presence in the boardroom.',
  },
  'S-Sound Clarity (Lisp Check)': {
    label: 'S-Sound Crispness',
    subtext:
      'Ensures your key metrics and numbers sound razor-sharp to investors.',
  },
  'Th-Sound Clarity (This & Think)': {
    label: 'TH Consonant Edge',
    subtext:
      'Polishes transition words like "this," "that," and "think" in executive briefings.',
  },
  'L-Sound Smoothness (Long & Clear)': {
    label: 'L Flow Control',
    subtext:
      'Keeps multi-syllable leadership language smooth on global video calls.',
  },
  'V & F Lip Sounds (Wish & Voice)': {
    label: 'V & W Transition Flow',
    subtext:
      'Smoothes out delivery pace during high-stakes presentations.',
  },
  'Blend Boost (Consonant Clusters)': {
    label: 'Consonant Cluster Control',
    subtext:
      'Sharpens complex word transitions in fast-paced stakeholder updates.',
  },
  'Airflow Focus (Sides vs. Center)': {
    label: 'Breath Channeling',
    subtext:
      'Steadies airflow so long sentences stay clear under pressure.',
  },
  'Back-of-Throat Sounds (K and G)': {
    label: 'Velar Precision',
    subtext:
      'Anchors hard consonants in words like "strategy" and "growth."',
  },
  'Pace (Words Per Minute)': {
    label: 'WPM Pacing',
    subtext: 'Calibrates delivery speed for boardroom and keynote settings.',
  },
  'Filler Word Counter': {
    label: 'Filler Word Frequency',
    subtext: 'Reduces verbal friction that dilutes executive presence.',
  },
  'Clarity Score': {
    label: 'Brevity',
    subtext: 'Tightens message density so every word earns its place.',
  },
  'WPM Pacing': {
    label: 'WPM Pacing',
    subtext: 'Calibrates delivery speed for boardroom and keynote settings.',
  },
  'Filler Word Frequency': {
    label: 'Filler Word Frequency',
    subtext: 'Reduces verbal friction that dilutes executive presence.',
  },
  Brevity: {
    label: 'Brevity',
    subtext: 'Tightens message density so every word earns its place.',
  },
}

function matchBrandedFocusArea(raw: string): BrandedFocusArea | null {
  const trimmed = raw.trim()
  if (EXACT_LABELS[trimmed]) return EXACT_LABELS[trimmed]

  if (/R-Sound/i.test(trimmed)) return EXACT_LABELS['R-Sound Strength']
  if (/S-Sound|Lisp/i.test(trimmed)) return EXACT_LABELS['S-Sound Clarity (Lisp Check)']
  if (/Th-Sound/i.test(trimmed)) return EXACT_LABELS['Th-Sound Clarity (This & Think)']
  if (/L-Sound/i.test(trimmed)) return EXACT_LABELS['L-Sound Smoothness (Long & Clear)']
  if (/V\s*&\s*[FW]|V and F|V\/W|Wish & Voice/i.test(trimmed)) {
    return EXACT_LABELS['V & F Lip Sounds (Wish & Voice)']
  }
  if (/Blend Boost|Blends/i.test(trimmed)) return EXACT_LABELS['Blend Boost (Consonant Clusters)']
  if (/Airflow/i.test(trimmed)) return EXACT_LABELS['Airflow Focus (Sides vs. Center)']
  if (/Back-of-Throat|K and G/i.test(trimmed)) {
    return EXACT_LABELS['Back-of-Throat Sounds (K and G)']
  }
  if (/Pace \(Words Per Minute\)/i.test(trimmed)) return EXACT_LABELS['Pace (Words Per Minute)']
  if (/Filler Word/i.test(trimmed)) return EXACT_LABELS['Filler Word Counter']
  if (/Clarity Score|Delivery Tone|Briefness/i.test(trimmed)) {
    return EXACT_LABELS['Clarity Score']
  }

  return null
}

export function brandFocusArea(raw: string): BrandedFocusArea {
  return (
    matchBrandedFocusArea(raw) ?? {
      label: raw.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      subtext: 'Priority clarity target from your latest executive session.',
    }
  )
}

export function displayFocusArea(area: string): string {
  return brandFocusArea(area).label
}

export function focusAreaSubtext(area: string): string {
  return brandFocusArea(area).subtext
}

export function displayClinicalMetricTitle(rawTitle: string): string {
  return brandFocusArea(rawTitle).label
}

export function clinicalMetricSubtext(rawTitle: string): string {
  return brandFocusArea(rawTitle).subtext
}

export const CLINICAL_MODULE_TITLES = {
  R: 'Vocalic R Precision',
  S: 'S-Sound Crispness',
} as const
