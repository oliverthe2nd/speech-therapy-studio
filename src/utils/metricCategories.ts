import type { ScoreMetric } from '@/types/analyzeSpeech'
import {
  CLINICAL_MODULE_TITLES,
  clinicalMetricSubtext as brandedClinicalSubtext,
  displayClinicalMetricTitle,
} from '@/utils/focusAreaDisplay'
import { phonemeFromFocusArea } from '@/utils/focusAreaMapping'

/** Core phonetic trackers shown on the clinical results tab. */
export const CORE_CLINICAL_TRACKERS = [
  'R-Sound Strength',
  'S-Sound Clarity (Lisp Check)',
  'Back-of-Throat Sounds (K and G)',
] as const

const EXECUTIVE_TITLE_PATTERNS = [
  /^Pace \(Words Per Minute\)/i,
  /^Filler Word Counter/i,
  /^Clarity Score/i,
  /^Delivery Tone/i,
]

const CLINICAL_TITLE_PATTERNS = [
  /R-Sound/i,
  /S-Sound|Lisp/i,
  /Back-of-Throat|K and G/i,
  /Th-Sound/i,
  /L-Sound/i,
  /V\s*&\s*F|V and F/i,
  /Blend Boost|Blends/i,
  /Airflow/i,
]

export function metricPercent(metric: ScoreMetric): number {
  const max = metric.maxScore > 0 ? metric.maxScore : 3
  return Math.round((metric.score / max) * 100)
}

export function isExecutiveMetric(title: string): boolean {
  return EXECUTIVE_TITLE_PATTERNS.some((pattern) => pattern.test(title.trim()))
}

export function isClinicalMetric(title: string): boolean {
  return CLINICAL_TITLE_PATTERNS.some((pattern) => pattern.test(title.trim()))
}

export function splitAssessmentMetrics(metrics: ScoreMetric[]): {
  executive: ScoreMetric[]
  clinical: ScoreMetric[]
} {
  const executive: ScoreMetric[] = []
  const clinical: ScoreMetric[] = []
  const seenExecutive = new Set<string>()
  const seenClinical = new Set<string>()

  for (const metric of metrics) {
    const key = metric.title.trim().toLowerCase()
    if (isExecutiveMetric(metric.title)) {
      if (!seenExecutive.has(key)) {
        seenExecutive.add(key)
        executive.push(metric)
      }
      continue
    }
    if (isClinicalMetric(metric.title)) {
      if (!seenClinical.has(key)) {
        seenClinical.add(key)
        clinical.push(metric)
      }
    }
  }

  return { executive, clinical }
}

/** Present executive metrics with boardroom-friendly labels. */
export function displayExecutiveMetric(metric: ScoreMetric): ScoreMetric {
  if (/^Pace \(Words Per Minute\)/i.test(metric.title)) {
    return { ...metric, title: 'WPM Pacing' }
  }
  if (/^Filler Word Counter/i.test(metric.title)) {
    return { ...metric, title: 'Filler Word Frequency' }
  }
  if (/^Clarity Score|^Delivery Tone/i.test(metric.title)) {
    return { ...metric, title: 'Brevity' }
  }
  return metric
}

export function mergeClinicalMetrics(
  primary: ScoreMetric[],
  fallbackFromAll: ScoreMetric[],
): ScoreMetric[] {
  if (primary.length > 0) return primary
  return splitAssessmentMetrics(fallbackFromAll).clinical
}

export function mergeExecutiveMetrics(
  primary: ScoreMetric[],
  fallbackFromAll: ScoreMetric[],
  professionalFallback?: ScoreMetric[],
): ScoreMetric[] {
  if (primary.length > 0) {
    return primary.map(displayExecutiveMetric)
  }
  const fromAll = splitAssessmentMetrics(fallbackFromAll).executive
  if (fromAll.length > 0) {
    return fromAll.map(displayExecutiveMetric)
  }
  if (professionalFallback?.length) {
    return professionalFallback.map(displayExecutiveMetric)
  }
  return []
}

export function clinicalAreasBelowThreshold(
  clinical: ScoreMetric[],
  thresholdPercent = 75,
): ScoreMetric[] {
  return clinical.filter((metric) => metricPercent(metric) < thresholdPercent)
}

export function formatClinicalAreaForBanner(title: string): string {
  return displayClinicalMetricTitle(title)
}

/** Premium subtext for acoustic metric cards. */
export function clinicalMetricSubtext(title: string): string | undefined {
  return brandedClinicalSubtext(title)
}

export function buildStructuralPracticeRecommendation(
  weakAreas: ScoreMetric[],
): string | null {
  if (weakAreas.length === 0) return null

  const weakest = pickWeakestClinicalArea(weakAreas)
  if (!weakest) return null

  const phoneme = phonemeFromFocusArea(weakest.title)
  if (phoneme) {
    const moduleLabel = CLINICAL_MODULE_TITLES[phoneme]
    return `💡 Structural Edge: To sharpen this corporate drill, open our ${moduleLabel} conditioning module.`
  }

  const areaLabel = formatClinicalAreaForBanner(weakest.title)
  return `💡 Structural Edge: To sharpen this corporate drill, prioritize ${areaLabel}.`
}

export function pickWeakestClinicalArea(
  weakAreas: ScoreMetric[],
): ScoreMetric | null {
  if (weakAreas.length === 0) return null

  return weakAreas.reduce((lowest, metric) =>
    metricPercent(metric) < metricPercent(lowest) ? metric : lowest,
  )
}
