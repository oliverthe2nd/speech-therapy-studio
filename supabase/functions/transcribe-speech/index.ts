/**
 * Supabase Edge Function: transcribe-speech
 *
 * Securely calls OpenAI Whisper. Set secret:
 *   supabase secrets set OPENAI_API_KEY=sk-...
 */

import { whisperFilename, whisperMimeType } from './whisperAudioFile.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type TranscribeRequest = {
  audio: string
  mimeType?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function decodeBase64Audio(base64: string): Uint8Array {
  const normalized = base64.includes(',')
    ? base64.split(',').pop() ?? base64
    : base64

  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function transcribeWithWhisper(
  audioBytes: Uint8Array,
  mimeType: string,
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Run: npm run deploy:speech-functions (or supabase secrets set OPENAI_API_KEY=sk-...)',
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
    let message = detail
    try {
      const parsed = JSON.parse(detail) as {
        error?: { message?: string }
      }
      if (parsed.error?.message) {
        message = parsed.error.message
      }
    } catch {
      /* keep raw detail */
    }
    throw new Error(`Whisper transcription failed: ${message}`)
  }

  const payload = (await response.json()) as { text?: string }
  const text = payload.text?.trim()
  if (!text) {
    throw new Error('Whisper returned an empty transcript.')
  }

  return text
}

async function readAudioFromRequest(req: Request): Promise<{
  bytes: Uint8Array
  mimeType: string
}> {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new Error('Missing audio file. Send multipart field "file".')
    }
    const buffer = new Uint8Array(await file.arrayBuffer())
    if (buffer.length === 0) {
      throw new Error('Uploaded audio file was empty.')
    }
    return {
      bytes: buffer,
      mimeType: file.type || 'audio/webm',
    }
  }

  const raw = await req.json()
  if (!raw || typeof raw !== 'object') {
    throw new Error('Request body must be JSON or multipart form data.')
  }

  const body = raw as TranscribeRequest
  if (typeof body.audio !== 'string' || !body.audio.trim()) {
    throw new Error('Missing required field: audio (base64-encoded recording).')
  }

  const bytes = decodeBase64Audio(body.audio.trim())
  if (bytes.length === 0) {
    throw new Error('Audio payload was empty after decoding.')
  }

  return {
    bytes,
    mimeType:
      typeof body.mimeType === 'string' && body.mimeType.trim()
        ? body.mimeType.trim()
        : 'audio/webm',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405)
  }

  try {
    const { bytes, mimeType } = await readAudioFromRequest(req)
    const transcript = await transcribeWithWhisper(bytes, mimeType)
    return jsonResponse({ transcript })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    console.error('[transcribe-speech]', message)
    return jsonResponse({ error: message }, 400)
  }
})
