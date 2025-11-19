import { Intent, intentSchema } from './intent.schema'

export interface IntentProviderResult {
  domain?: Intent['domain']
  styleCues?: Intent['styleCues']
  visualTheme?: Intent['visualTheme']
  tone?: Intent['tone']
  colorMood?: Intent['colorMood']
  confidence?: Partial<Intent['confidence']>
  metadata?: Record<string, string>
}

export interface IntentProviderInput {
  prompt: string
  normalizedPrompt: string
  locale?: string
}

export interface IntentProvider {
  name: string
  generateIntent(input: IntentProviderInput): Promise<IntentProviderResult>
}

export interface InterpretOptions {
  locale?: string
  forceRefresh?: boolean
}

export interface IntentInterpreterOptions {
  cache?: Map<string, Intent>
  providerMetadata?: Record<string, string>
}

const normalizePrompt = (prompt: string): string => prompt.trim().replace(/\s+/g, ' ').toLowerCase()

const buildCacheKey = (prompt: string, locale?: string) => `${prompt}|${locale ?? 'default'}`

const createFallbackIntent = (params: {
  prompt: string
  normalizedPrompt: string
  reason: string
}): Intent =>
  intentSchema.parse({
    rawPrompt: params.prompt,
    normalizedPrompt: params.normalizedPrompt,
    fallback: { applied: true, reason: params.reason },
  })

const mergeIntentPayload = (
  prompt: string,
  normalizedPrompt: string,
  providerName: string,
  payload?: IntentProviderResult
): Intent => {
  const base = {
    rawPrompt: prompt,
    normalizedPrompt,
    metadata: { provider: providerName, ...(payload?.metadata ?? {}) },
  }

  return intentSchema.parse({
    ...payload,
    ...base,
  })
}

export class IntentInterpreter {
  private cache: Map<string, Intent>

  constructor(private provider: IntentProvider, private options: IntentInterpreterOptions = {}) {
    this.cache = options.cache ?? new Map<string, Intent>()
  }

  async interpret(prompt: string, options: InterpretOptions = {}): Promise<Intent> {
    if (!prompt?.trim()) {
      throw new Error('Prompt is required for intent interpretation')
    }

    const normalizedPrompt = normalizePrompt(prompt)
    const cacheKey = buildCacheKey(normalizedPrompt, options.locale)

    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as Intent
    }

    try {
      const providerResult = await this.provider.generateIntent({
        prompt,
        normalizedPrompt,
        locale: options.locale,
      })

      const intent = mergeIntentPayload(prompt, normalizedPrompt, this.provider.name, providerResult)
      this.cache.set(cacheKey, intent)
      return intent
    } catch (error) {
      const fallbackIntent = createFallbackIntent({
        prompt,
        normalizedPrompt,
        reason: error instanceof Error ? error.message : 'Unknown provider failure',
      })
      this.cache.set(cacheKey, fallbackIntent)
      return fallbackIntent
    }
  }
}

export const intentUtils = {
  normalizePrompt,
  buildCacheKey,
}
