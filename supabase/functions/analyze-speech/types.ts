/** POST body from the Speech Therapy Studio frontend */
export type AnalyzeSpeechRequest = {
  /** Whisper transcript or other speech text to analyze */
  transcript?: string
  /** Alias for transcript */
  text?: string
  mode: 'baseline' | 'practice'
  targetSentence?: string
  phonemeFocus?: 'R' | 'S' | null
  /** Recording length in ms — used to compute WPM server-side */
  recordingDurationMs?: number
  /** Conversational baseline wizard step (1=intro, 2=context, 3=stress-test) */
  baselineStep?: 1 | 2 | 3
  /** Profile fields collected in earlier baseline steps */
  priorDossier?: ExecutiveDossier
  /** Active roadmap phase (1=Foundation, 2=Precision, 3=Executive Presence) */
  activePhaseFocus?: 1 | 2 | 3
}

export type ExecutiveDossier = {
  name?: string | null
  title?: string | null
  industry?: string | null
  professionalFocus?: string | null
  audienceContext?: string | null
}

export type GrowthRoadmapPhase = {
  phase: string
  title: string
  focus: string
  duration: string
}

export type GrowthRoadmap = {
  strengths: string[]
  blindspots: string[]
  phases: GrowthRoadmapPhase[]
}

export type ScoreStatus = 'excellent' | 'good' | 'needs-practice'

export type ScoreMetric = {
  title: string
  score: number
  maxScore: number
  status: ScoreStatus
  statusLabel: string
}

export type MispronunciationItem = {
  expected: string
  heard: string
}

export type HomeworkStep = {
  label: string
}

export type ProfessionalMetrics = {
  pace: {
    wpm: number
    idealRange: string
    score: number
    maxScore: number
    status: ScoreStatus
    statusLabel: string
  }
  fillerWords: {
    count: number
    detected: string[]
    score: number
    maxScore: number
    status: ScoreStatus
    statusLabel: string
  }
  clarity: {
    score: number
    maxScore: number
    status: ScoreStatus
    statusLabel: string
    summary: string
  }
}

/** Structured analysis returned to the client */
export type SpeechAnalysis = {
  targetSentence: string
  /** Executive presentation layer — pace, fillers, delivery tone */
  metrics: ScoreMetric[]
  /** Clinical phonetic layer — always computed under the hood */
  clinicalMetrics: ScoreMetric[]
  professionalMetrics: ProfessionalMetrics
  executiveDossier?: ExecutiveDossier
  growthRoadmap?: GrowthRoadmap
  coachHeardText: string
  mispronunciations: MispronunciationItem[]
  coachingTip: string
  homework: HomeworkStep[]
  /** Full markdown coach report (same sections as the live app template) */
  feedbackMarkdown: string
}

export type AnalyzeSpeechResponse = {
  transcript: string
  analysis: SpeechAnalysis
}

export type ErrorResponse = {
  error: string
}
