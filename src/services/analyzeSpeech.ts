import type { AppMode, PhonemeFocus } from '../constants/studio'
import type { BaselineStep } from '../constants/baselineFlow'
import type { ExecutiveDossier } from '../types/analyzeSpeech'
import { readApiError } from '../lib/readApiError'
import type { AnalyzeSpeechResponse } from '../types/analyzeSpeech'

export type AnalyzeSpeechContext = {
  mode: AppMode
  targetSentence: string
  phonemeFocus?: PhonemeFocus | null
  recordingDurationMs?: number
  baselineStep?: BaselineStep
  priorDossier?: ExecutiveDossier
  activePhaseFocus?: 1 | 2 | 3
}

export type AnalyzeSpeechResult = {
  transcript: string
  feedback: string
  analysis: AnalyzeSpeechResponse['analysis']
}

/** Calls the local analyze-speech API (Anthropic key stays server-side). */
export async function analyzeSpeechViaEdgeFunction(
  transcript: string,
  context: AnalyzeSpeechContext,
): Promise<AnalyzeSpeechResult> {
  const response = await fetch('/api/analyze-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      mode: context.mode,
      targetSentence: context.targetSentence || undefined,
      phonemeFocus: context.phonemeFocus ?? null,
      recordingDurationMs: context.recordingDurationMs,
      baselineStep: context.baselineStep,
      priorDossier: context.priorDossier,
      activePhaseFocus: context.activePhaseFocus,
    }),
  })

  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(`Speech analysis failed: ${message}`)
  }

  const data = (await response.json()) as AnalyzeSpeechResponse

  const feedback = data?.analysis?.feedbackMarkdown?.trim()
  if (!feedback) {
    throw new Error('Speech analysis returned an empty coach report.')
  }

  return {
    transcript: data?.transcript ?? transcript,
    feedback,
    analysis: data!.analysis,
  }
}
