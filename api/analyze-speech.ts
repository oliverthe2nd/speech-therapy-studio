import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleAnalyzeSpeech } from '../server/handlers/analyzeSpeech.js'

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
        ? (JSON.parse(req.body) as Record<string, unknown>)
        : ((req.body ?? {}) as Record<string, unknown>)

    const result = await handleAnalyzeSpeech(
      body,
      process.env.ANTHROPIC_API_KEY ?? '',
    )
    res.status(200).json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    console.error('[analyze-speech]', message)
    res.status(400).json({ error: message })
  }
}
