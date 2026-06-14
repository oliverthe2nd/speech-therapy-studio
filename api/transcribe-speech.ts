import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleTranscribeSpeech } from '../server/handlers/transcribeSpeech.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  try {
    const body =
      typeof req.body === 'string'
        ? (JSON.parse(req.body) as { audio?: string; mimeType?: string })
        : ((req.body ?? {}) as { audio?: string; mimeType?: string })

    const transcript = await handleTranscribeSpeech(
      body,
      process.env.OPENAI_API_KEY ?? '',
    )
    res.status(200).json({ transcript })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    console.error('[transcribe-speech]', message)
    res.status(400).json({ error: message })
  }
}
