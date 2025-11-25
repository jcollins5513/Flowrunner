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
  onEvent?: (event: IntentInterpreterEvent) => void
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
  payload?: IntentProviderResult,
  providerMetadata?: Record<string, string>
): Intent => {
  const base = {
    rawPrompt: prompt,
    normalizedPrompt,
    metadata: { provider: providerName, ...(providerMetadata ?? {}), ...(payload?.metadata ?? {}) },
  }

  return intentSchema.parse({
    ...payload,
    ...base,
  })
}

export type IntentInterpreterEvent =
  | { type: 'cache_hit'; prompt: string; locale?: string }
  | { type: 'cache_miss'; prompt: string; locale?: string }
  | { type: 'cache_store'; prompt: string; locale?: string }
  | { type: 'provider_success'; prompt: string; locale?: string; provider: string; durationMs: number }
  | { type: 'provider_failure'; prompt: string; locale?: string; provider: string; durationMs: number; error: string }
  | { type: 'fallback_applied'; prompt: string; locale?: string; reason: string }

export class IntentInterpreter {
  private cache: Map<string, Intent>

  constructor(private provider: IntentProvider, private options: IntentInterpreterOptions = {}) {
    this.cache = options.cache ?? new Map<string, Intent>()
  }

  get providerName(): string {
    return this.provider.name
  }

  private emit(event: IntentInterpreterEvent) {
    this.options.onEvent?.(event)
  }

  async interpret(prompt: string, options: InterpretOptions = {}): Promise<Intent> {
    if (!prompt?.trim()) {
      throw new Error('Prompt is required for intent interpretation')
    }

    const normalizedPrompt = normalizePrompt(prompt)
    const cacheKey = buildCacheKey(normalizedPrompt, options.locale)

    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      this.emit({ type: 'cache_hit', prompt: normalizedPrompt, locale: options.locale })
      return this.cache.get(cacheKey) as Intent
    }

    this.emit({ type: 'cache_miss', prompt: normalizedPrompt, locale: options.locale })
    const start = Date.now()

    try {
      const providerResult = await this.provider.generateIntent({
        prompt,
        normalizedPrompt,
        locale: options.locale,
      })

      const intent = mergeIntentPayload(
        prompt,
        normalizedPrompt,
        this.provider.name,
        providerResult,
        this.options.providerMetadata
      )
      this.cache.set(cacheKey, intent)
      this.emit({
        type: 'provider_success',
        prompt: normalizedPrompt,
        locale: options.locale,
        provider: this.provider.name,
        durationMs: Date.now() - start,
      })
      this.emit({ type: 'cache_store', prompt: normalizedPrompt, locale: options.locale })
      return intent
    } catch (error) {
      const fallbackIntent = createFallbackIntent({
        prompt,
        normalizedPrompt,
        reason: error instanceof Error ? error.message : 'Unknown provider failure',
      })
      this.cache.set(cacheKey, fallbackIntent)
      this.emit({
        type: 'provider_failure',
        prompt: normalizedPrompt,
        locale: options.locale,
        provider: this.provider.name,
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown provider failure',
      })
      this.emit({
        type: 'fallback_applied',
        prompt: normalizedPrompt,
        locale: options.locale,
        reason: error instanceof Error ? error.message : 'Unknown provider failure',
      })
      this.emit({ type: 'cache_store', prompt: normalizedPrompt, locale: options.locale })
      return fallbackIntent
    }
  }
}

export const intentUtils = {
  normalizePrompt,
  buildCacheKey,
}
