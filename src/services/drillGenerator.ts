const anthropicBase =
  import.meta.env.DEV ? '/api/anthropic' : 'https://api.anthropic.com'

const DRILL_GENERATION_SYSTEM = `You create short, business-focused speech practice lines for working professionals.
Return ONLY a valid JSON array of recordable strings. No markdown fences, no commentary.

Each batch supports executive presence: presentation clarity, articulatory crispness for international intelligibility, and boardroom delivery.
Never suggest accent elimination — only polish for global team clarity.
Every string must be something the user can read aloud into a microphone — never coaching instructions.`

import {
  phaseFocusDrillDirective,
  type PhaseFocus,
} from '@/utils/phaseFocus'

export type GenerateDrillsOptions = {
  excludeSentences?: string[]
  variationSeed?: string
  activePhaseFocus?: PhaseFocus
}

function buildDrillUserPrompt(
  aiFeedback: string,
  options: GenerateDrillsOptions,
): string {
  const excludeBlock =
    options.excludeSentences && options.excludeSentences.length > 0
      ? `\nNEVER repeat or closely paraphrase any of these previously used lines:\n${options.excludeSentences
          .slice(0, 40)
          .map((s) => `- "${s}"`)
          .join('\n')}`
      : ''

  const seed = options.variationSeed ?? `${Date.now()}`
  const phaseBlock = options.activePhaseFocus
    ? `\n${phaseFocusDrillDirective(options.activePhaseFocus)}\n`
    : ''

  return `Variation batch ID: ${seed}
${phaseBlock}
Here is the user's latest executive communication coach feedback:

---
${aiFeedback}
---

${excludeBlock}

Generate exactly 2 recordable business drills tailored to their weakest area (pace, fillers, clarity, or phonetic precision as directed above):

1. ELEVATOR PITCH — max 18 words, professional stakeholder update or value statement. Prefix not needed in the string.
2. KEYNOTE SLIDE or CORPORATE SOUND-TRANSITION — one sentence, max 20 words. Use tough professional words if doing a sound-transition (strategic, revenue, cross-functional, quarterly).

Rules:
- Do NOT include coaching instructions in the array.
- Do NOT output tongue twisters, kid phrases, or medical jargon.
- Boardroom-ready language only.
- Do NOT copy the baseline passage verbatim.

Return ONLY a JSON array of exactly 2 strings, like:
["Our platform reduced onboarding time by forty percent this quarter.", "We delivered measurable cross-functional results ahead of schedule."]`
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

  if (sentences.length < 2) {
    throw new Error('Expected at least 2 practice lines from drill generator.')
  }

  return sentences.slice(0, 4)
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
  const raw = await callClaude(
    buildDrillUserPrompt(aiFeedback, {
      ...options,
      variationSeed:
        options.variationSeed ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
    768,
  )
  return parseDrillSentences(raw)
}
