/** Extract the real error message from a Supabase Edge Function invoke failure. */
export async function readEdgeFunctionError(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') {
    return 'Unknown error'
  }

  const fnError = error as { message?: string; context?: Response }

  if (fnError.context) {
    try {
      const text = await fnError.context.clone().text()
      if (text) {
        try {
          const body = JSON.parse(text) as { error?: string; message?: string }
          if (body.error) return body.error
          if (body.message) return body.message
        } catch {
          return text.slice(0, 500)
        }
      }
    } catch {
      /* ignore read failures */
    }
  }

  const generic = fnError.message ?? 'Unknown error'
  if (generic === 'Edge Function returned a non-2xx status code') {
    return `${generic} — check Supabase function logs and that API secrets (OPENAI_API_KEY, ANTHROPIC_API_KEY) are set via: npm run deploy:speech-functions`
  }

  return generic
}
