import { readApiError } from '../lib/readApiError'

type TranscribeSpeechResponse = {
  transcript: string
}

function blobToBase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  })
}

/** Calls the local transcribe-speech API (OpenAI key stays server-side). */
export async function transcribeSpeechViaEdgeFunction(
  blob: Blob,
): Promise<string> {
  const audio = await blobToBase64(blob)

  const response = await fetch('/api/transcribe-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio,
      mimeType: blob.type || 'audio/webm',
    }),
  })

  if (!response.ok) {
    const message = await readApiError(response)
    throw new Error(message)
  }

  const payload = (await response.json()) as TranscribeSpeechResponse
  const transcript = payload?.transcript?.trim()
  if (!transcript) {
    throw new Error('Transcription returned an empty transcript.')
  }

  return transcript
}
