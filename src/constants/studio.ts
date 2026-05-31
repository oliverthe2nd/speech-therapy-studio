export type AppMode = 'baseline' | 'practice'

export type PhonemeFocus = 'R' | 'S'

export type PracticeLesson = {
  id: string
  sentence: string
  focus: PhonemeFocus
}

/** Grandfather Paragraph — phonetically balanced full baseline (speech pathology standard) */
export const BASELINE_PRACTICE_SENTENCE =
  'You wish to know all about my grandfather. Well, he is nearly ninety-three years old; he dresses himself in an ancient black frock coat, usually minorly stained with ink. He still thinks swiftly, but a long flowing beard clings to his chin, and his voice has a slight quiver when he speaks. Twice each day he plays with a zinc zipper on a soft leather case, which holds a small gold clock.'

export const BASELINE_PARAGRAPH_TITLE = 'The Grandfather Paragraph'

/** @deprecated Use BASELINE_PRACTICE_SENTENCE */
export const BASELINE_DIAGNOSTIC_SENTENCE = BASELINE_PRACTICE_SENTENCE

export const BASELINE_FOCUS_DESCRIPTION =
  'This classic paragraph gently tests R, S, Th, L, V & F, blends, and more — a full friendly sweep of how your mouth is moving today.'

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
