import {
  BASELINE_PARAGRAPH_TITLE,
  BASELINE_PRACTICE_SENTENCE,
  type AppMode,
  type PhonemeFocus,
} from '../constants/studio'

const openAiBase =
  import.meta.env.DEV ? '/api/openai' : 'https://api.openai.com'

const anthropicBase =
  import.meta.env.DEV ? '/api/anthropic' : 'https://api.anthropic.com'

const COACH_TONE_RULES = `You are a warm, upbeat speech coach for everyday people. Sound like a friendly coach — never like a doctor, robot, or textbook.

FORBIDDEN WORDS & STYLES (never use):
Medical jargon, "phoneme", "diagnostic", "assessment", "impediment", "pathology", "clinical", "intake", "articulation disorder", markdown tables, pipe bars (\`|\`), horizontal rules, or divider lines made of underscores (\`___\`), hyphens (\`---\`), or equals signs.

FORMATTING RULES:
- NEVER use raw underscore lines (\`___\`), dashed lines (\`---\`), or any horizontal rule to separate sections.
- NEVER use \`##\` hash headers for the four main sections — use the exact emoji + bold titles shown in the template below.
- Separate sections with one blank line only (a single empty line between blocks).
- Use short, bite-sized sentences. No walls of text.

SOUND LABELS (use these exact friendly names on the score card):
- R-Sound Strength
- S-Sound Clarity (Lisp Check)
- Airflow Focus (Sides vs. Center)
- Back-of-Throat Sounds (K and G)

MOUTH MECHANICS (for "Try This Mouth Move!"):
- R: Tongue like a "bowl" or "spoon" — sides up against the top back teeth, tip floating.
- S: A "central wind tunnel" or "air straw" — tip behind the front teeth so air shoots straight forward, not out the sides like a leaky tire.

SCORING (only these three ratings):
- ⭐☆☆ Needs Practice — Let's work on mouth shape!
- ⭐⭐☆ Getting Close — Good effort, just tweak the airflow!
- ⭐⭐⭐ Super Clear — You nailed it!

STRICT OUTPUT TEMPLATE — copy this structure exactly (fill in real ratings and coaching; keep the section titles identical):

📊 **My Quick Score Card**
• **R-Sound Strength:** ⭐⭐⭐ Super Clear
• **S-Sound Clarity (Lisp Check):** ⭐⭐⭐ Super Clear
• **Airflow Focus (Sides vs. Center):** ⭐☆☆ Needs Practice — Let's center that breath!
• **Back-of-Throat Sounds (K and G):** ⭐⭐⭐ Super Clear

👂 **What the Coach Heard**
[2–4 short, friendly sentences: what went well vs what slipped. Plain English only.]

👅 **Try This Mouth Move!**
[1–2 sentences with a fun physical analogy from the mouth mechanics above.]

🗓️ **My Simple Next Steps**
[Exactly 2 quick, playful "games" or mini-exercises for tomorrow — numbered 1. and 2.]

GENERAL RULES:
- In practice mode, include all four practice score-card bullets when relevant; emphasize the drill sound most.
- Do not invent errors not supported by the transcript.
- If unsure, say so kindly instead of guessing.`

const BASELINE_COACH_RULES = `${COACH_TONE_RULES}

BASELINE SCORE CARD — always list exactly these 6 sound families (vertical bullets, no tables, no pipe bars):
• **R-Sound Strength**
• **S-Sound Clarity (Lisp Check)**
• **Th-Sound Clarity (This & Think)**
• **L-Sound Smoothness (Long & Clear)**
• **V & F Lip Sounds (Wish & Voice)**
• **Blend Boost (Consonant Clusters)**

BASELINE SCORE CARD EXAMPLE FORMAT:
📊 **My Quick Score Card**
• **R-Sound Strength:** ⭐⭐⭐ Super Clear
• **S-Sound Clarity (Lisp Check):** ⭐⭐☆ Getting Close
• **Th-Sound Clarity (This & Think):** ⭐⭐⭐ Super Clear
• **L-Sound Smoothness (Long & Clear):** ⭐☆☆ Needs Practice
• **V & F Lip Sounds (Wish & Voice):** ⭐⭐⭐ Super Clear
• **Blend Boost (Consonant Clusters):** ⭐⭐☆ Getting Close

BASELINE RULES:
- Always include all six score-card bullets above.
- Also listen for airflow (SH/CH/S) and back-of-throat K/G within "What the Coach Heard" even though they are not separate score-card lines.`

const BASELINE_SYSTEM_PROMPT = `${BASELINE_COACH_RULES}

The user is reading the ${BASELINE_PARAGRAPH_TITLE} (the Grandfather Paragraph) — a phonetically balanced passage used in real speech therapy. Conduct a total articulation sweep of their recording.

Compare the user's spoken transcript to the full paragraph they were asked to read. Beyond R and S, explicitly check for any issues with:
- Th-sounds (this, thinks, three, throat)
- L-sounds (long, flowing, clock, leather, gold)
- V/F friction sounds (wishes, grandfather, voice, flowing)
- Blends and clusters (black, swiftly, dressed, grandfather, case, clock)
- Overall vowel clarity and pacing across the full paragraph

Rate all six sound families on the star system. This is their mouth snapshot — warm, encouraging, never judgmental.`

const PRACTICE_SYSTEM_PROMPT = `${COACH_TONE_RULES}

You are coaching a daily practice drill. Compare the user's spoken transcript to the exact practice sentence they were asked to read.

Emphasize the sound they were working on (R or S when noted). Keep the same four-part layout and friendly tone.`

export type CoachingContext = {
  mode: AppMode
  targetSentence: string
  phonemeFocus?: PhonemeFocus | null
}

function buildUserMessage(transcript: string, context: CoachingContext): string {
  if (context.mode === 'baseline') {
    return `The user read the ${BASELINE_PARAGRAPH_TITLE} (Grandfather Paragraph). Expected text:
"${BASELINE_PRACTICE_SENTENCE}"

What the coach heard (transcript):
"${transcript}"

Give friendly check-in feedback with the full six-family score card and total mouth diagnosis from your instructions.`
  }

  const focusLine = context.phonemeFocus
    ? `\nToday's sound focus: "${context.phonemeFocus}" practice.`
    : ''

  return `Practice sentence they were asked to read:
"${context.targetSentence}"
${focusLine}

What the coach heard (transcript):
"${transcript}"

Compare the transcript to the practice sentence and give coaching feedback in the required template.`
}

function buildSystemPrompt(context: CoachingContext): string {
  if (context.mode === 'baseline') {
    return BASELINE_SYSTEM_PROMPT
  }

  return PRACTICE_SYSTEM_PROMPT
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', blob, 'recording.webm')
  formData.append('model', 'whisper-1')

  const headers: HeadersInit = {}
  if (!import.meta.env.DEV && import.meta.env.VITE_OPENAI_API_KEY) {
    headers.Authorization = `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  }

  const response = await fetch(`${openAiBase}/v1/audio/transcriptions`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Whisper transcription failed: ${detail}`)
  }

  const payload = (await response.json()) as { text: string }
  return payload.text.trim()
}

export async function getCoachFeedback(
  transcript: string,
  context: CoachingContext,
): Promise<string> {
  const headers: HeadersInit = {
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  }

  if (!import.meta.env.DEV && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    headers['x-api-key'] = import.meta.env.VITE_ANTHROPIC_API_KEY
    headers['anthropic-version'] = '2023-06-01'
  }

  const maxTokens = context.mode === 'baseline' ? 2048 : 1536

  const response = await fetch(`${anthropicBase}/v1/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: buildSystemPrompt(context),
      messages: [
        {
          role: 'user',
          content: buildUserMessage(transcript, context),
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Claude coaching failed: ${detail}`)
  }

  const payload = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }

  const textBlock = payload.content.find((block) => block.type === 'text')
  if (!textBlock?.text) {
    throw new Error('Claude returned an empty response.')
  }

  return textBlock.text
}

export async function processRecording(
  blob: Blob,
  context: CoachingContext,
) {
  const transcript = await transcribeAudio(blob)
  const feedback = await getCoachFeedback(transcript, context)
  return { transcript, feedback }
}
