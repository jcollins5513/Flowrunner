import { describe, expect, it, vi } from 'vitest'
import { TextGenerationService } from '../../../lib/ai/text-generation/text-generation-service'
import type { TextGenerationProvider } from '../../../lib/ai/text-generation/types'
import { DEFAULT_LENGTH_CONSTRAINTS, TextGenerationInput } from '../../../lib/ai/text-generation/types'

type ProviderCall = { input: TextGenerationInput; constraints: typeof DEFAULT_LENGTH_CONSTRAINTS }

class FakeProvider implements TextGenerationProvider {
  public calls: ProviderCall[] = []

  constructor(private readonly resultFactory: () => { title?: string; subtitle?: string; body?: string; buttonLabels?: string[]; formLabels?: string[] }) {}

  async generate(input: TextGenerationInput, constraints: typeof DEFAULT_LENGTH_CONSTRAINTS) {
    this.calls.push({ input, constraints })
    const result = this.resultFactory()
    return {
      title: result.title ?? 'Title',
      subtitle: result.subtitle ?? 'Subtitle',
      body: result.body ?? 'Body copy that is long enough to be interesting.',
      buttonLabels: result.buttonLabels ?? ['Continue'],
      formLabels: result.formLabels ?? ['Email'],
    }
  }
}

const baseInput: TextGenerationInput = {
  prompt: 'Create a cozy banking onboarding screen',
  vibe: 'warm',
  tone: 'supportive',
  actions: ['Sign up', 'Explore plans'],
}

describe('TextGenerationService', () => {
  it('reuses cached content for identical inputs', async () => {
    const provider = new FakeProvider(() => ({ title: 'Cached Title' }))
    const service = new TextGenerationService(provider, { cacheTtlMs: 1000 })

    const first = await service.generate(baseInput)
    const second = await service.generate(baseInput)

    expect(first.title).toBe('Cached Title')
    expect(second.metadata?.cacheHit).toBe(true)
    expect(provider.calls).toHaveLength(1)
  })

  it('expires cached entries after the TTL', async () => {
    vi.useFakeTimers()
    const provider = new FakeProvider(() => ({ title: 'Fresh Title' }))
    const service = new TextGenerationService(provider, { cacheTtlMs: 500 })

    await service.generate(baseInput)
    await service.generate(baseInput)
    expect(provider.calls).toHaveLength(1)

    vi.advanceTimersByTime(600)

    await service.generate(baseInput)
    expect(provider.calls).toHaveLength(2)

    vi.useRealTimers()
  })

  it('enforces configured length constraints across all fields', async () => {
    const provider = new FakeProvider(() => ({
      title: 'A very long generated title that should be truncated',
      subtitle: 'Subtitle that is intentionally verbose to test the clamp behavior of the service',
      body: 'Body copy that should also be truncated to respect the maximum body length constraints.',
      buttonLabels: ['One extremely long button label that should be shortened'],
      formLabels: ['Email address field label that is too verbose'],
    }))

    const service = new TextGenerationService(provider)
    const result = await service.generate({
      ...baseInput,
      lengthConstraints: {
        ...DEFAULT_LENGTH_CONSTRAINTS,
        title: 20,
        subtitle: 30,
        body: 40,
        buttonLabel: 10,
        formLabel: 12,
      },
    })

    expect(result.title.length).toBeLessThanOrEqual(20)
    expect(result.subtitle.length).toBeLessThanOrEqual(30)
    expect(result.body.length).toBeLessThanOrEqual(40)
    expect(result.buttonLabels.every((label) => label.length <= 10)).toBe(true)
    expect(result.formLabels.every((label) => label.length <= 12)).toBe(true)
  })
})
