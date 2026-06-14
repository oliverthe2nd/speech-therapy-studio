import type { DashboardExercise } from '@/components/dashboard/recording-section'
import {
  EXECUTIVE_SCENARIOS,
  personalizedSentenceToExercise,
  scenarioToExercise,
} from '@/constants/executiveScenarios'
import { PRACTICE_LESSONS, type PhonemeFocus } from '@/constants/studio'
import { primaryPhonemeFromFocusAreas } from '@/utils/focusAreaMapping'
import {
  lessonToExercise,
  pickRecommendedExercise,
} from '@/utils/recommendedExercise'

/** Roadmap phase index — maps to Foundation, Precision, Executive Presence. */
export type PhaseFocus = 1 | 2 | 3

export const DEFAULT_PHASE_FOCUS: PhaseFocus = 1

export function parsePhaseFocus(value: unknown): PhaseFocus {
  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (parsed === 2 || parsed === 3) return parsed
  return 1
}

export function phaseFocusLabel(phase: PhaseFocus): string {
  switch (phase) {
    case 1:
      return 'Foundation'
    case 2:
      return 'Precision'
    case 3:
      return 'Executive Presence'
  }
}

/** Coach metric titles prioritized for each active roadmap phase. */
export function focusAreasForPhase(phase: PhaseFocus): string[] {
  switch (phase) {
    case 1:
      return ['Pace (Words Per Minute)', 'Filler Word Counter']
    case 2:
      return ['S-Sound Clarity (Lisp Check)', 'R-Sound Strength']
    case 3:
      return ['Clarity Score', 'Delivery Tone']
  }
}

export function phaseFocusDrillDirective(phase: PhaseFocus): string {
  switch (phase) {
    case 1:
      return `ACTIVE ROADMAP PHASE — Foundation (Phase 1):
Prioritize pacing stabilization and filler word reduction.
Coach metrics to optimize: Pace (Words Per Minute) and Filler Word Counter.
Write lines that reward steady executive tempo, deliberate pauses instead of fillers, and crisp final consonants.`
    case 2:
      return `ACTIVE ROADMAP PHASE — Precision (Phase 2):
Prioritize S-Sound Crispness and Vocalic R Precision.
Coach metrics to optimize: S-Sound Clarity (Lisp Check) and R-Sound Strength.
Load strategic vocabulary with crisp /s/ and vocalic /r/ placement (strategic, revenue, cross-functional, quarterly, results).`
    case 3:
      return `ACTIVE ROADMAP PHASE — Executive Presence (Phase 3):
Prioritize boardroom delivery, clarity score, and stakeholder-ready tone.
Coach metrics to optimize: Clarity Score and Delivery Tone.
Write high-stakes update lines with authority, measured pace, and zero hesitation.`
  }
}

function phonemesForPhase(phase: PhaseFocus): PhonemeFocus[] {
  if (phase === 2) return ['S', 'R']
  return ['R', 'S']
}

/** Merge phase targets with session-derived focus — phase wins when set. */
export function mergeFocusAreasForPhase(
  phase: PhaseFocus,
  supplemental: string[],
): string[] {
  const phaseAreas = focusAreasForPhase(phase)
  const normalized = new Set(phaseAreas.map((area) => area.trim().toLowerCase()))
  const rest = supplemental.filter(
    (area) => !normalized.has(area.trim().toLowerCase()),
  )
  return [...phaseAreas, ...rest]
}

/** Recommended first drill when launching active phase focus from the dashboard. */
export function pickExerciseForPhaseFocus(
  phase: PhaseFocus,
  {
    personalizedSentences,
    practiceCount,
  }: {
    personalizedSentences: string[]
    practiceCount: number
  },
): DashboardExercise {
  if (phase === 2) {
    const phoneme =
      primaryPhonemeFromFocusAreas(focusAreasForPhase(2)) ?? 'S'
    const lesson = PRACTICE_LESSONS[phoneme][0]
    if (lesson) {
      return {
        ...lessonToExercise(lesson),
        title: `Phase 2 · ${lessonToExercise(lesson).title}`,
      }
    }
  }

  if (phase === 1 && personalizedSentences.length > 0) {
    const index = Math.max(0, practiceCount) % personalizedSentences.length
    return {
      ...personalizedSentenceToExercise(personalizedSentences[index], index),
      title: `Phase 1 · Tailored Scenario ${index + 1}`,
    }
  }

  if (phase === 3) {
    const scenarios = EXECUTIVE_SCENARIOS.map(scenarioToExercise)
    const index = Math.max(0, practiceCount) % scenarios.length
    const chosen = scenarios[index] ?? scenarios[0]
    return {
      ...chosen,
      title: `Phase 3 · ${chosen.title}`,
    }
  }

  return pickRecommendedExercise({
    personalizedSentences,
    focusAreas: focusAreasForPhase(phase),
    practiceCount,
  })
}

/** Sort exercises so phase-relevant drills surface first in Schedule / library lists. */
export function sortExercisesForPhaseFocus(
  exercises: DashboardExercise[],
  phase: PhaseFocus,
): DashboardExercise[] {
  const phasePhonemes = new Set(phonemesForPhase(phase))

  const score = (exercise: DashboardExercise): number => {
    if (phase === 1) {
      if (exercise.category === 'personalized') return 0
      if (exercise.category === 'executive' || exercise.category === 'warmup') {
        return 1
      }
      return 3
    }

    if (phase === 2) {
      if (exercise.category === 'clinical') {
        const phoneme = exercise.id.startsWith('s-')
          ? 'S'
          : exercise.id.startsWith('r-')
            ? 'R'
            : null
        if (phoneme && phasePhonemes.has(phoneme)) return 0
        return 1
      }
      if (exercise.category === 'personalized') return 2
      return 3
    }

    if (exercise.category === 'executive' || exercise.category === 'warmup') {
      return 0
    }
    if (exercise.category === 'personalized') return 1
    return 2
  }

  return [...exercises].sort((a, b) => score(a) - score(b))
}
