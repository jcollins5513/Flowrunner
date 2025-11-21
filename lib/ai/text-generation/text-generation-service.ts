import {
  DEFAULT_LENGTH_CONSTRAINTS,
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
  TextLengthConstraints,
} from './types'

interface CacheEntry {
  createdAt: number
  result: TextGenerationResult
}

export interface TextGenerationServiceOptions {
  cacheTtlMs?: number
}

const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const clampText = (value: string, maxLength: number): string => {
  if (!value) return ''
  if (value.length <= maxLength) return value.trim()
  return value.slice(0, maxLength).trim()
}

const applyLengthConstraints = (
  result: TextGenerationResult,
  constraints: TextLengthConstraints
): TextGenerationResult => ({
  ...result,
  title: clampText(result.title, constraints.title),
  subtitle: clampText(result.subtitle, constraints.subtitle),
  body: clampText(result.body, constraints.body),
  buttonLabels: result.buttonLabels.map((label) => clampText(label, constraints.buttonLabel)),
  formLabels: result.formLabels.map((label) => clampText(label, constraints.formLabel)),
})

const stableSerialize = (value: unknown): string => {
  if (value === undefined) return ''
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined)
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableSerialize(val)}`).join(',')}}`
}

export class TextGenerationService {
  private cache = new Map<string, CacheEntry>()
  private cacheTtlMs: number

  constructor(private provider: TextGenerationProvider, options: TextGenerationServiceOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL
  }

  async generate(input: TextGenerationInput): Promise<TextGenerationResult> {
    const constraints: TextLengthConstraints = {
      ...DEFAULT_LENGTH_CONSTRAINTS,
      ...input.lengthConstraints,
    }

    const cacheKey = input.cacheKey ?? stableSerialize({ ...input, lengthConstraints: constraints })
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.createdAt < this.cacheTtlMs) {
      return {
        ...cached.result,
        metadata: {
          ...(cached.result.metadata ?? {}),
          cacheHit: true,
        },
      }
    }

    const result = await this.provider.generate(input, constraints)
    const constrainedResult = applyLengthConstraints(result, constraints)

    this.cache.set(cacheKey, {
      createdAt: Date.now(),
      result: constrainedResult,
    })

    return constrainedResult
  }
}
