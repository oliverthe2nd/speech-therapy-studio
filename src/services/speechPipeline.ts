import type { AppMode, PhonemeFocus } from '../constants/studio'
import { analyzeSpeechViaEdgeFunction } from './analyzeSpeech'
import { transcribeSpeechViaEdgeFunction } from './transcribeSpeech'

export type CoachingContext = {
  mode: AppMode
  targetSentence: string
  phonemeFocus?: PhonemeFocus | null
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  return transcribeSpeechViaEdgeFunction(blob)
}

export async function getCoachFeedback(
  transcript: string,
  context: CoachingContext,
): Promise<string> {
  const result = await analyzeSpeechViaEdgeFunction(transcript, context)
  return result.feedback
}

export async function processRecording(
  blob: Blob,
  context: CoachingContext,
) {
  const transcript = await transcribeAudio(blob)
  const { feedback } = await analyzeSpeechViaEdgeFunction(transcript, context)
  return { transcript, feedback }
}
