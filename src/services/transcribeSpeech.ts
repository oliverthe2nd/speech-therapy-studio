import { supabase } from '../supabaseClient'
import { readEdgeFunctionError } from '../lib/readEdgeFunctionError'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

type TranscribeSpeechResponse = {
  transcript: string
}

/** Calls transcribe-speech via multipart upload (avoids base64 size limits). */
export async function transcribeSpeechViaEdgeFunction(
  blob: Blob,
): Promise<string> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    )
  }

  const formData = new FormData()
  formData.append('file', blob, blob.type.includes('webm') ? 'recording.webm' : 'recording.audio')

  const response = await fetch(
    `${supabaseUrl}/functions/v1/transcribe-speech`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: formData,
    },
  )

  const text = await response.text()
  let payload: (TranscribeSpeechResponse & { error?: string }) | null = null

  try {
    payload = JSON.parse(text) as TranscribeSpeechResponse & { error?: string }
  } catch {
    if (!response.ok) {
      throw new Error(
        text.slice(0, 500) || `Transcription failed with HTTP ${response.status}`,
      )
    }
    throw new Error('Transcription returned invalid JSON.')
  }

  if (!response.ok) {
    throw new Error(
      payload?.error ??
        (text.slice(0, 500) ||
          `Transcription failed with HTTP ${response.status}`),
    )
  }

  const transcript = payload?.transcript?.trim()
  if (!transcript) {
    throw new Error('Transcription returned an empty transcript.')
  }

  return transcript
}

/** Legacy invoke path — kept for tests; prefer transcribeSpeechViaEdgeFunction. */
export async function transcribeSpeechViaInvoke(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const audio = btoa(binary)

  const { data, error } = await supabase.functions.invoke<TranscribeSpeechResponse>(
    'transcribe-speech',
    {
      body: { audio, mimeType: blob.type || 'audio/webm' },
    },
  )

  if (error) {
    throw new Error(await readEdgeFunctionError(error))
  }

  const transcript = data?.transcript?.trim()
  if (!transcript) {
    throw new Error('Transcription returned an empty transcript.')
  }

  return transcript
}
