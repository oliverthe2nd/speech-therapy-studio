/** POST body from the Speech Therapy Studio frontend */
export type AnalyzeSpeechRequest = {
  /** Whisper transcript or other speech text to analyze */
  transcript?: string
  /** Alias for transcript */
  text?: string
  mode: 'baseline' | 'practice'
  targetSentence?: string
  phonemeFocus?: 'R' | 'S' | null
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

/** Structured analysis returned to the client */
export type SpeechAnalysis = {
  targetSentence: string
  metrics: ScoreMetric[]
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
