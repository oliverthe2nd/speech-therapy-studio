export type BaselineStep = 1 | 2 | 3

export const BASELINE_STEP_COUNT = 3

/** Step 3 operational strategic address — executive benchmark passage */
export const BASELINE_STRESS_TEST_PASSAGE =
  'As we look at our operational trajectory for the upcoming fiscal quarters, our global strategy remains focused on scaling high-margin, sustainable infrastructure. Moving forward, maintaining precise alignment across our cross-functional teams is vital to driving predictable revenue victories. Our immediate execution priority requires a structured balance between rapid innovation and absolute market clarity.'

export const BASELINE_FLOW_STEPS: {
  step: BaselineStep
  title: string
  coachPrompt: string
  kind: 'conversation' | 'reading'
}[] = [
  {
    step: 1,
    title: 'The Introduction',
    coachPrompt:
      "Welcome to SpeakFlow. Let's calibrate your audio and profile. To start, tap record and tell me your name and your core professional focus.",
    kind: 'conversation',
  },
  {
    step: 2,
    title: 'The Professional Context',
    coachPrompt:
      'Got it, thank you. What is your current title or seniority level, and what types of audiences or teams do you find yourself presenting to most often?',
    kind: 'conversation',
  },
  {
    step: 3,
    title: 'The High-Stakes Reading Stress-Test',
    coachPrompt:
      "Excellent. Now let's establish your technical benchmark under simulated executive pressure. Tap record and read this operational strategic address out loud with your natural presentation delivery:",
    kind: 'reading',
  },
]

export const BASELINE_WIZARD_INTRO =
  'A three-minute conversational calibration with your executive coach — profile first, then a high-stakes delivery benchmark.'
