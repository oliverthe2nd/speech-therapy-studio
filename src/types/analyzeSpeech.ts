/** Mirrors supabase/functions/analyze-speech/types.ts */
export type AnalyzeSpeechRequest = {
  transcript: string
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

export type SpeechAnalysis = {
  targetSentence: string
  metrics: ScoreMetric[]
  coachHeardText: string
  mispronunciations: MispronunciationItem[]
  coachingTip: string
  homework: HomeworkStep[]
  feedbackMarkdown: string
}

export type AnalyzeSpeechResponse = {
  transcript: string
  analysis: SpeechAnalysis
}
