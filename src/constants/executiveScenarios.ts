import type { DashboardExercise } from '@/components/dashboard/recording-section'

export type ExecutiveScenarioCategory =
  | 'boardroom'
  | 'pitch'
  | 'standup'
  | 'warmup'
  | 'personalized'

export type ExecutiveScenario = {
  id: string
  title: string
  difficulty: string
  category: ExecutiveScenarioCategory
  /** Real-world challenge shown above the script */
  prompt: string
  /** Script or speaking target the user delivers aloud */
  sentence: string
  durationLabel?: string
}

export const EXECUTIVE_SCENARIOS: ExecutiveScenario[] = [
  {
    id: 'exec-boardroom-intro',
    title: 'Executive Boardroom Intro',
    difficulty: 'Boardroom',
    category: 'boardroom',
    prompt:
      'You just walked into the boardroom. In 20 seconds, introduce yourself — name, role, and one strategic priority for this quarter.',
    sentence:
      'Good morning — I am Alex Chen, VP of Product. This quarter my priority is accelerating enterprise adoption while protecting margin.',
  },
  {
    id: 'exec-investor-pitch',
    title: '30-Second Investor Pitch',
    difficulty: 'Investor',
    category: 'pitch',
    prompt:
      'Deliver a crisp 30-second investor pitch: name the problem, your solution, and one traction metric.',
    sentence:
      'Teams lose hours to unclear communication. SpeakFlow gives executives real-time delivery coaching — we cut onboarding time by forty percent this quarter.',
  },
  {
    id: 'exec-standup-warmup',
    title: 'Team Stand-up Warm-Up',
    difficulty: 'Leadership',
    category: 'standup',
    prompt:
      'Open your team stand-up with energy: yesterday’s win, today’s focus, and one blocker you need help removing.',
    sentence:
      'Quick stand-up from my side — yesterday we shipped the Q3 roadmap review, today I am aligning stakeholders on launch messaging, and I need design bandwidth for the executive deck.',
  },
]

export const PRE_MEETING_WARMUP: ExecutiveScenario = {
  id: 'exec-pre-meeting-warmup',
  title: 'Pre-Meeting 60-Second Vocal Warm-Up',
  difficulty: 'Executive Warm-Up',
  category: 'warmup',
  durationLabel: '60 seconds',
  prompt:
    'Your next client call starts in two minutes. Open the meeting with authority: greet the room, state the agenda in one breath, and invite the first speaker.',
  sentence:
    'Thanks everyone for joining — today we will cover pipeline updates, blockers, and next steps. Let us start with Sarah on regional performance.',
}

const PERSONALIZED_SCENARIO_TITLES = [
  'Tailored Elevator Pitch',
  'Keynote Sound Transition',
  'Stakeholder Update',
  'Board-Ready One-Liner',
]

export function scenarioToExercise(scenario: ExecutiveScenario): DashboardExercise {
  return {
    id: scenario.id,
    title: scenario.title,
    difficulty: scenario.difficulty,
    sentence: scenario.sentence,
    category: scenario.category === 'warmup' ? 'warmup' : 'executive',
    prompt: scenario.prompt,
    durationLabel: scenario.durationLabel,
  }
}

export function buildExecutiveDashboardExercises(
  personalizedSentences: string[] = [],
): DashboardExercise[] {
  const scenarios = EXECUTIVE_SCENARIOS.map(scenarioToExercise)

  personalizedSentences.forEach((sentence, index) => {
    scenarios.push({
      id: `personalized-${index}`,
      title:
        PERSONALIZED_SCENARIO_TITLES[index % PERSONALIZED_SCENARIO_TITLES.length] ??
        `Custom Scenario ${index + 1}`,
      difficulty: 'Tailored',
      sentence,
      category: 'personalized',
      prompt:
        'Deliver this line with boardroom clarity — steady pace, zero fillers, and crisp final consonants.',
    })
  })

  return scenarios
}

export function personalizedSentenceToExercise(
  sentence: string,
  index: number,
): DashboardExercise {
  return {
    id: `personalized-${index}`,
    title:
      PERSONALIZED_SCENARIO_TITLES[index % PERSONALIZED_SCENARIO_TITLES.length] ??
      `Custom Scenario ${index + 1}`,
    difficulty: 'Tailored',
    sentence,
    category: 'personalized',
    prompt:
      'Deliver this line with boardroom clarity — steady pace, zero fillers, and crisp final consonants.',
  }
}
