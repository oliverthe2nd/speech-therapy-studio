import {
  whisperFilename,
  whisperMimeType,
} from '../../src/utils/whisperAudioFile.ts'

type TranscribeBody = {
  audio?: string
  mimeType?: string
}

function decodeBase64Audio(base64: string): Uint8Array {
  const normalized = base64.includes(',')
    ? base64.split(',').pop() ?? base64
    : base64

  const binary = Buffer.from(normalized, 'base64')
  return new Uint8Array(binary)
}

async function transcribeWithWhisper(
  audioBytes: Uint8Array,
  mimeType: string,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add it to your .env file.',
    )
  }

  const formData = new FormData()
  const filename = whisperFilename(audioBytes, mimeType)
  const resolvedMimeType = whisperMimeType(audioBytes, mimeType)
  formData.append(
    'file',
    new Blob([audioBytes], { type: resolvedMimeType }),
    filename,
  )
  formData.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Whisper transcription failed: ${detail.slice(0, 500)}`)
  }

  const payload = (await response.json()) as { text?: string }
  const text = payload.text?.trim()
  if (!text) {
    throw new Error('Whisper returned an empty transcript.')
  }

  return text
}

export async function handleTranscribeSpeech(
  body: TranscribeBody,
  apiKey: string,
): Promise<string> {
  if (typeof body.audio !== 'string' || !body.audio.trim()) {
    throw new Error('Missing required field: audio (base64-encoded recording).')
  }

  const bytes = decodeBase64Audio(body.audio.trim())
  if (bytes.length === 0) {
    throw new Error('Audio payload was empty after decoding.')
  }

  const mimeType =
    typeof body.mimeType === 'string' && body.mimeType.trim()
      ? body.mimeType.trim()
      : 'audio/webm'

  return transcribeWithWhisper(bytes, mimeType, apiKey)
}
