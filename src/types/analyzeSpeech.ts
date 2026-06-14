import type { BaselineStep } from '@/constants/baselineFlow'

/** Mirrors supabase/functions/analyze-speech/types.ts */
export type AnalyzeSpeechRequest = {
  transcript: string
  mode: 'baseline' | 'practice'
  targetSentence?: string
  phonemeFocus?: 'R' | 'S' | null
  recordingDurationMs?: number
  baselineStep?: BaselineStep
  priorDossier?: ExecutiveDossier
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
  feedbackMarkdown: string
}

export type AnalyzeSpeechResponse = {
  transcript: string
  analysis: SpeechAnalysis
}
