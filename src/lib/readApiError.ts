/** Extract a readable error message from a failed API response. */
export async function readApiError(response: Response): Promise<string> {
  const text = await response.text()

  if (!text) {
    return `Request failed with HTTP ${response.status}`
  }

  try {
    const body = JSON.parse(text) as { error?: string; message?: string }
    if (body.error) return body.error
    if (body.message) return body.message
  } catch {
    /* fall through */
  }

  return text.slice(0, 500)
}
