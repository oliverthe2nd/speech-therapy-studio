import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** Dev/preview API routes replacing Supabase Edge Functions. */
export function speechApiPlugin(): Plugin {
  return {
    name: 'speech-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]

        if (req.method === 'OPTIONS' && (url === '/api/analyze-speech' || url === '/api/transcribe-speech')) {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization')
          res.end()
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          if (url === '/api/analyze-speech') {
            const raw = await readRequestBody(req)
            const body = JSON.parse(raw) as Record<string, unknown>
            const { handleAnalyzeSpeech } = await server.ssrLoadModule(
              '/server/handlers/analyzeSpeech.ts',
            )
            const result = await handleAnalyzeSpeech(body, env.ANTHROPIC_API_KEY)
            sendJson(res, 200, result)
            return
          }

          if (url === '/api/transcribe-speech') {
            const raw = await readRequestBody(req)
            const body = JSON.parse(raw) as { audio?: string; mimeType?: string }
            const { handleTranscribeSpeech } = await server.ssrLoadModule(
              '/server/handlers/transcribeSpeech.ts',
            )
            const transcript = await handleTranscribeSpeech(body, env.OPENAI_API_KEY)
            sendJson(res, 200, { transcript })
            return
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unexpected server error.'
          console.error('[speech-api]', message)
          sendJson(res, 400, { error: message })
          return
        }

        next()
      })
    },
  }
}
