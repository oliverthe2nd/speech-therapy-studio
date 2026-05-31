import { parseWeakFocusAreas } from '../utils/parseFocusAreas'

const anthropicBase =
  import.meta.env.DEV ? '/api/anthropic' : 'https://api.anthropic.com'

const DRILL_GENERATION_SYSTEM = `You create brand-new speech practice sentences for kids and families.
Return ONLY a valid JSON array of exactly 5 strings. No markdown fences, no commentary — just the array.

Every batch must feel fresh, creative, and different from prior batches. Never recycle or lightly tweak old sentences.`

export type GenerateDrillsOptions = {
  excludeSentences?: string[]
  variationSeed?: string
}

function buildDrillUserPrompt(
  aiFeedback: string,
  weakFocusAreas: string[],
  options: GenerateDrillsOptions,
): string {
  const focusHint =
    weakFocusAreas.length > 0
      ? `The user's latest score card shows these sounds need the MOST practice (pack every sentence with these):
${weakFocusAreas.map((area) => `- ${area}`).join('\n')}`
      : `Read the score card below. Target every sound rated ⭐☆☆ or ⭐⭐☆. If all are ⭐⭐⭐, pick the two lowest-confidence areas and still build lively practice sentences.`

  const excludeBlock =
    options.excludeSentences && options.excludeSentences.length > 0
      ? `\nNEVER repeat or closely paraphrase any of these previously used sentences:\n${options.excludeSentences
          .slice(0, 40)
          .map((s) => `- "${s}"`)
          .join('\n')}`
      : ''

  const seed = options.variationSeed ?? `${Date.now()}`

  return `Variation batch ID: ${seed}

Here is the user's latest speech pattern check-in coach feedback:

---
${aiFeedback}
---

${focusHint}
${excludeBlock}

Rules:
- Generate exactly 5 NEW practice sentences (one or two clauses each) — completely different wording from any excluded sentence above.
- Pack each sentence heavily with the user's weak sounds (many repetitions per sentence).
- Sound mapping tips:
  - R-Sound Strength → rich R blends (br, cr, dr, fr, gr, tr, str)
  - S-Sound Clarity → S, Z, soft C
  - Th-Sound → "th" in this/think/three
  - L-Sound → clear L in many positions
  - V & F → wish/voice/five/family/flowing
  - Blend Boost → clusters like bl, cl, fl, gr, str, spr, tw
- Use fun, everyday topics (animals, games, snacks, sports, space, friends).
- Layperson language only — no medical terms.
- Do NOT copy the Grandfather Paragraph or any check-in passage.

Return ONLY a JSON array of 5 strings, like:
["sentence 1", "sentence 2", "sentence 3", "sentence 4", "sentence 5"]`
}

export function parseDrillSentences(raw: string): string[] {
  const trimmed = raw.trim()
  const jsonSlice = trimmed.match(/\[[\s\S]*\]/)?.[0] ?? trimmed
  const parsed: unknown = JSON.parse(jsonSlice)

  if (!Array.isArray(parsed)) {
    throw new Error('Drill generator did not return a JSON array.')
  }

  const sentences = parsed
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)

  if (sentences.length < 5) {
    throw new Error('Expected 5 practice sentences from drill generator.')
  }

  return sentences.slice(0, 5)
}

async function callClaude(userPrompt: string, maxTokens: number): Promise<string> {
  const headers: HeadersInit = {
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  }

  if (!import.meta.env.DEV && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    headers['x-api-key'] = import.meta.env.VITE_ANTHROPIC_API_KEY
    headers['anthropic-version'] = '2023-06-01'
  }

  const response = await fetch(`${anthropicBase}/v1/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: DRILL_GENERATION_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Drill generation failed: ${detail}`)
  }

  const payload = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }

  const textBlock = payload.content.find((block) => block.type === 'text')
  if (!textBlock?.text) {
    throw new Error('Drill generator returned an empty response.')
  }

  return textBlock.text
}

export async function generatePersonalizedDrills(
  aiFeedback: string,
  options: GenerateDrillsOptions = {},
): Promise<string[]> {
  const weakFocusAreas = parseWeakFocusAreas(aiFeedback)
  const raw = await callClaude(
    buildDrillUserPrompt(aiFeedback, weakFocusAreas, {
      ...options,
      variationSeed:
        options.variationSeed ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
    1536,
  )
  return parseDrillSentences(raw)
}
