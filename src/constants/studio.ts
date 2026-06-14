export type AppMode = 'baseline' | 'practice'

export type PhonemeFocus = 'R' | 'S'

export type PracticeLesson = {
  id: string
  sentence: string
  focus: PhonemeFocus
}

import { BASELINE_STRESS_TEST_PASSAGE } from './baselineFlow'

/** Executive benchmark passage — Step 3 high-stakes reading stress-test */
export const BASELINE_PRACTICE_SENTENCE = BASELINE_STRESS_TEST_PASSAGE

export const BASELINE_PARAGRAPH_TITLE = 'Executive Communication Baseline'

/** @deprecated Use BASELINE_PRACTICE_SENTENCE */
export const BASELINE_DIAGNOSTIC_SENTENCE = BASELINE_PRACTICE_SENTENCE

export const BASELINE_FOCUS_DESCRIPTION =
  'A three-step conversational calibration with your executive coach — profile, context, then a strategic delivery benchmark under simulated boardroom pressure.'

/** @deprecated Use BASELINE_FOCUS_DESCRIPTION */
export const BASELINE_SCAN_DESCRIPTION = BASELINE_FOCUS_DESCRIPTION

export const PRACTICE_LESSONS: Record<PhonemeFocus, PracticeLesson[]> = {
  R: [
    {
      id: 'r-1',
      focus: 'R',
      sentence: 'The red rocket raced down the runway.',
    },
    {
      id: 'r-2',
      focus: 'R',
      sentence: 'Sarah poured cold water into the rushing river.',
    },
    {
      id: 'r-3',
      focus: 'R',
      sentence: 'The brave ranger protected the rare birds.',
    },
    {
      id: 'r-4',
      focus: 'R',
      sentence: 'Rabbits ran rapidly through the green roaring brush.',
    },
    {
      id: 'r-5',
      focus: 'R',
      sentence: 'Arthur ordered a warm cherry tart at the bakery.',
    },
  ],
  S: [
    {
      id: 's-1',
      focus: 'S',
      sentence: 'Seven silly seals swam silently in the sea.',
    },
    {
      id: 's-2',
      focus: 'S',
      sentence: 'The sneaky snake hissed softly in the green grass.',
    },
    {
      id: 's-3',
      focus: 'S',
      sentence: 'Sam wore silver shoes to the starry summer festival.',
    },
    {
      id: 's-4',
      focus: 'S',
      sentence: 'The glass vase smashed into pieces on the steps.',
    },
    {
      id: 's-5',
      focus: 'S',
      sentence: 'Listen closely to the sweet sounds of the forest.',
    },
  ],
}
