import OpenAI from 'openai'
import { Intent, INTENT_CONSTANTS } from '../intent.schema'
import { IntentProvider, IntentProviderInput, IntentProviderResult } from '../interpreter'

const allowedDomains = new Set(INTENT_CONSTANTS.DOMAINS)
const allowedStyleCues = new Set(INTENT_CONSTANTS.STYLE_CUES)
const allowedVisualThemes = new Set(INTENT_CONSTANTS.VISUAL_THEMES)
const allowedTones = new Set(INTENT_CONSTANTS.TONES)
const allowedColorMoods = new Set(INTENT_CONSTANTS.COLOR_MOODS)

interface OpenAIIntentResponse {
  domain: string
  styleCues: string[]
  visualTheme: string
  tone: string
  colorMood: string
  confidence?: Partial<Record<'domain' | 'style' | 'theme' | 'tone' | 'color', number>>
}

export interface OpenAIIntentProviderOptions {
  apiKey?: string
  model?: string
  temperature?: number
  topP?: number
  systemPrompt?: string
}

const defaultSystemPrompt = `You are FlowRunner's intent interpreter. Analyze the user's product prompt and return JSON with keys: domain, styleCues, visualTheme, tone, colorMood, confidence. Domain must be one of ${
  INTENT_CONSTANTS.DOMAINS.join(', ')
}. Style cues must be a subset of ${INTENT_CONSTANTS.STYLE_CUES.join(', ')}. Visual theme must be one of ${INTENT_CONSTANTS.VISUAL_THEMES.join(
  ', '
)}. Tone must be one of ${INTENT_CONSTANTS.TONES.join(', ')}. Color mood must be one of ${INTENT_CONSTANTS.COLOR_MOODS.join(
  ', '
)}. Style cues can have up to 3 entries. Confidence values are optional numbers between 0 and 1.`

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value))

const sanitizeDomain = (value: string | undefined): Intent['domain'] | undefined =>
  value && allowedDomains.has(value as Intent['domain']) ? (value as Intent['domain']) : undefined

const sanitizeStyleCues = (values: string[] | undefined): Intent['styleCues'] | undefined => {
  if (!values?.length) return undefined
  const filtered = values.filter((value): value is Intent['styleCues'][number] => allowedStyleCues.has(value as Intent['styleCues'][number]))
  if (!filtered.length) return undefined
  return filtered.slice(0, 3) as Intent['styleCues']
}

const sanitizeVisualTheme = (value: string | undefined): Intent['visualTheme'] | undefined =>
  value && allowedVisualThemes.has(value as Intent['visualTheme']) ? (value as Intent['visualTheme']) : undefined

const sanitizeTone = (value: string | undefined): Intent['tone'] | undefined =>
  value && allowedTones.has(value as Intent['tone']) ? (value as Intent['tone']) : undefined

const sanitizeColorMood = (value: string | undefined): Intent['colorMood'] | undefined =>
  value && allowedColorMoods.has(value as Intent['colorMood']) ? (value as Intent['colorMood']) : undefined

type ConfidenceKey = keyof Intent['confidence']

const sanitizeConfidence = (
  confidence?: Partial<Record<ConfidenceKey, number>>
): IntentProviderResult['confidence'] | undefined => {
  if (!confidence) return undefined
  const entries = Object.entries(confidence).filter(
    (entry): entry is [ConfidenceKey, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1])
  )
  if (!entries.length) return undefined

  return entries.reduce<Record<string, number>>((acc, [key, value]) => {
    acc[key] = clamp01(value)
    return acc
  }, {})
}

const buildUserPrompt = (input: IntentProviderInput): string => {
  const locale = input.locale ?? 'en-US'
  return `PROMPT:\n${input.prompt}\n\nNormalized prompt: ${input.normalizedPrompt}\nLocale: ${locale}`
}

export class OpenAIIntentProvider implements IntentProvider {
  public readonly name = 'openai-intent-provider'
  private client: OpenAI
  private model: string
  private temperature: number
  private topP: number
  private systemPrompt: string

  constructor(private options: OpenAIIntentProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use OpenAIIntentProvider')
    }

    this.client = new OpenAI({ apiKey })
    this.model = options.model ?? process.env.OPENAI_INTENT_MODEL ?? 'gpt-5-mini'
    this.temperature = options.temperature ?? 0
    this.topP = options.topP ?? 1
    this.systemPrompt = options.systemPrompt ?? defaultSystemPrompt
  }

  async generateIntent(input: IntentProviderInput): Promise<IntentProviderResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      top_p: this.topP,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI did not return content for intent interpretation')
    }

    let parsed: OpenAIIntentResponse
    try {
      parsed = JSON.parse(content) as OpenAIIntentResponse
    } catch (error) {
      throw new Error('Failed to parse OpenAI intent response')
    }

    return {
      domain: sanitizeDomain(parsed.domain),
      styleCues: sanitizeStyleCues(parsed.styleCues),
      visualTheme: sanitizeVisualTheme(parsed.visualTheme),
      tone: sanitizeTone(parsed.tone),
      colorMood: sanitizeColorMood(parsed.colorMood),
      confidence: sanitizeConfidence(parsed.confidence),
      metadata: {
        model: this.model,
        completionId: completion.id,
      },
    }
  }
}
