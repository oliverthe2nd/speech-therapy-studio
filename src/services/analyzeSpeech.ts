import type { AppMode, PhonemeFocus } from '../constants/studio'
import { readEdgeFunctionError } from '../lib/readEdgeFunctionError'
import { supabase } from '../supabaseClient'
import type { AnalyzeSpeechResponse } from '../types/analyzeSpeech'

export type AnalyzeSpeechContext = {
  mode: AppMode
  targetSentence: string
  phonemeFocus?: PhonemeFocus | null
}

export type AnalyzeSpeechResult = {
  transcript: string
  feedback: string
  analysis: AnalyzeSpeechResponse['analysis']
}

/** Calls the deployed analyze-speech Edge Function (Anthropic key stays server-side). */
export async function analyzeSpeechViaEdgeFunction(
  transcript: string,
  context: AnalyzeSpeechContext,
): Promise<AnalyzeSpeechResult> {
  const { data, error } = await supabase.functions.invoke<AnalyzeSpeechResponse>(
    'analyze-speech',
    {
      body: {
        transcript,
        mode: context.mode,
        targetSentence: context.targetSentence || undefined,
        phonemeFocus: context.phonemeFocus ?? null,
      },
    },
  )

  if (error) {
    const message = await readEdgeFunctionError(error)
    throw new Error(`Speech analysis failed: ${message}`)
  }

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
