import type { ScoreMetric } from '@/types/analyzeSpeech'
import { parseWeakFocusAreas } from '@/utils/parseFocusAreas'
import {
  EXECUTIVE_SCENARIOS,
  buildExecutiveDashboardExercises,
  personalizedSentenceToExercise,
  scenarioToExercise,
} from '@/constants/executiveScenarios'
import {
  PRACTICE_LESSONS,
  type PhonemeFocus,
  type PracticeLesson,
} from '@/constants/studio'
import type { DashboardExercise } from '@/components/dashboard/recording-section'
import { CLINICAL_MODULE_TITLES } from '@/utils/focusAreaDisplay'
import { phonemeFromFocusArea, primaryPhonemeFromFocusAreas } from '@/utils/focusAreaMapping'
import { pickWeakestClinicalArea } from '@/utils/metricCategories'

export function lessonToExercise(lesson: PracticeLesson): DashboardExercise {
  return {
    id: lesson.id,
    title: CLINICAL_MODULE_TITLES[lesson.focus],
    difficulty: 'Precision Conditioning',
    sentence: lesson.sentence,
    category: 'clinical',
    prompt:
      'Brief articulation conditioning — precise consonant placement at executive pace.',
  }
}

export function pickRecommendedExercise({
  personalizedSentences,
  focusAreas: _focusAreas,
  checkInFocusAreas: _checkInFocusAreas = [],
  practiceCount,
}: {
  personalizedSentences: string[]
  focusAreas: string[]
  checkInFocusAreas?: string[]
  practiceCount: number
}): DashboardExercise {
  if (personalizedSentences.length > 0) {
    const index = Math.max(0, practiceCount) % personalizedSentences.length
    return personalizedSentenceToExercise(personalizedSentences[index], index)
  }

  const scenarios = EXECUTIVE_SCENARIOS.map(scenarioToExercise)
  const index = Math.max(0, practiceCount) % scenarios.length
  return scenarios[index] ?? scenarios[0]
}

function focusAreasFromMetrics(metrics: ScoreMetric[]): string[] {
  return metrics
    .filter((metric) => metric.score < metric.maxScore)
    .map((metric) => metric.title)
}

function pickDistinctExercise(
  personalizedSentences: string[],
  practiceCount: number,
  avoidSentence: string,
): DashboardExercise {
  for (let offset = 0; offset < 6; offset += 1) {
    const candidate = pickRecommendedExercise({
      personalizedSentences,
      focusAreas: [],
      practiceCount: practiceCount + offset,
    })
    if (candidate.sentence.trim() !== avoidSentence.trim()) {
      return candidate
    }
  }

  return pickRecommendedExercise({
    personalizedSentences,
    focusAreas: [],
    practiceCount: practiceCount + 1,
  })
}

export function pickFollowUpExercise({
  feedback,
  metrics,
  currentSentence,
  personalizedSentences,
  checkInFocusAreas: _checkInFocusAreas = [],
  practiceCount,
}: {
  feedback: string
  metrics: ScoreMetric[]
  currentSentence: string
  personalizedSentences: string[]
  checkInFocusAreas?: string[]
  practiceCount: number
}): DashboardExercise {
  const metricFocus = focusAreasFromMetrics(metrics)
  const parsedFocus = parseWeakFocusAreas(feedback)
  const focusAreas =
    metricFocus.length > 0
      ? metricFocus
      : parsedFocus.length > 0
        ? parsedFocus
        : ['R-Sound Strength']

  const exercise = pickDistinctExercise(
    personalizedSentences,
    practiceCount + 1,
    currentSentence,
  )

  const phoneme = primaryPhonemeFromFocusAreas(focusAreas)

  return {
    ...exercise,
    title: exercise.title.startsWith('Follow-up')
      ? exercise.title
      : `Next scenario · ${exercise.title}`,
    difficulty: phoneme
      ? `${exercise.difficulty} · clarity edge on ${phoneme}-sound`
      : exercise.difficulty,
  }
}

export function phonemeFocusForExercise(
  exercise: DashboardExercise,
): PhonemeFocus | null {
  const lesson = Object.values(PRACTICE_LESSONS)
    .flat()
    .find((item) => item.id === exercise.id)
  return lesson?.focus ?? null
}

/** Executive scenarios first; clinical modules live in the Practice library. */
export function buildDashboardExercises({
  personalizedSentences,
  focusAreas: _focusAreas,
}: {
  personalizedSentences: string[]
  focusAreas: string[]
}): DashboardExercise[] {
  return buildExecutiveDashboardExercises(personalizedSentences)
}

/** All drills including clinical articulation modules (Practice studio). */
export function buildPracticeLibraryExercises({
  personalizedSentences,
  focusAreas,
}: {
  personalizedSentences: string[]
  focusAreas: string[]
}): DashboardExercise[] {
  const list = buildExecutiveDashboardExercises(personalizedSentences)

  const phoneme = primaryPhonemeFromFocusAreas(focusAreas)
  const phonemes: PhonemeFocus[] = phoneme ? [phoneme] : ['R', 'S']

  for (const focus of phonemes) {
    for (const lesson of PRACTICE_LESSONS[focus]) {
      list.push(lessonToExercise(lesson))
    }
  }

  return list
}

/** First articulation lesson aligned to the weakest clinical score area. */
export function articulationModuleForWeakClinical(
  weakAreas: ScoreMetric[],
): DashboardExercise | null {
  const weakest = pickWeakestClinicalArea(weakAreas)
  if (!weakest) return null

  const phoneme = phonemeFromFocusArea(weakest.title) ?? 'R'
  const lessons = PRACTICE_LESSONS[phoneme]
  if (lessons.length === 0) return null

  return lessonToExercise(lessons[0])
}
