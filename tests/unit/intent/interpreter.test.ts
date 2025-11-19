import { describe, expect, it } from 'vitest'
import {
  IntentInterpreter,
  IntentInterpreterEvent,
  IntentProvider,
  IntentProviderInput,
} from '@/lib/ai/intent/interpreter'
import { MockIntentProvider } from '@/lib/ai/intent/providers/mock'

class CountingProvider implements IntentProvider {
  public name = 'counting-provider'
  public calls = 0

  async generateIntent(input: IntentProviderInput) {
    this.calls += 1
    return {
      domain: input.normalizedPrompt.includes('shop') ? 'ecommerce' : 'saas',
      styleCues: ['modern'],
      visualTheme: 'illustrated',
      tone: 'professional',
      colorMood: 'vibrant',
      metadata: { locale: input.locale ?? 'default' },
    }
  }
}

class FailingProvider implements IntentProvider {
  public name = 'failing-provider'
  async generateIntent() {
    throw new Error('LLM offline')
  }
}

describe('IntentInterpreter', () => {
  it('returns validated intent from mock provider', async () => {
    const interpreter = new IntentInterpreter(new MockIntentProvider())

    const intent = await interpreter.interpret('Create a luxury ecommerce hero with neon energy')

    expect(intent.domain).toBe('ecommerce')
    expect(intent.styleCues).toContain('luxury')
    expect(intent.colorMood).toBe('neon')
    expect(intent.metadata.provider).toBe('mock-intent-provider')
  })

  it('caches repeated prompts by normalized value and locale', async () => {
    const provider = new CountingProvider()
    const interpreter = new IntentInterpreter(provider)

    const first = await interpreter.interpret('Design a SaaS dashboard hero')
    const second = await interpreter.interpret('   design a saas dashboard    hero   ')

    expect(first).toBe(second)
    expect(provider.calls).toBe(1)

    const refreshed = await interpreter.interpret('Design a SaaS dashboard hero', { forceRefresh: true })
    expect(refreshed).not.toBe(first)
    expect(provider.calls).toBe(2)
  })

  it('produces fallback intent when provider fails and caches it', async () => {
    const interpreter = new IntentInterpreter(new FailingProvider())

    const fallback = await interpreter.interpret('Generate a fintech splash hero with neon vibes')
    expect(fallback.fallback.applied).toBe(true)
    expect(fallback.domain).toBe('saas')

    const cached = await interpreter.interpret('Generate a fintech splash hero with neon vibes')
    expect(cached).toBe(fallback)
  })

  it('emits telemetry events for success, caching, and failure', async () => {
    const successEvents: IntentInterpreterEvent[] = []
    const interpreter = new IntentInterpreter(new MockIntentProvider(), {
      onEvent: (event) => successEvents.push(event),
    })

    await interpreter.interpret('Create an energetic marketing hero with neon gradients')
    await interpreter.interpret('Create an energetic marketing hero with neon gradients')

    expect(successEvents.some((event) => event.type === 'provider_success')).toBe(true)
    expect(successEvents.some((event) => event.type === 'cache_hit')).toBe(true)

    const failureEvents: IntentInterpreterEvent[] = []
    const failingInterpreter = new IntentInterpreter(new FailingProvider(), {
      onEvent: (event) => failureEvents.push(event),
    })

    await failingInterpreter.interpret('Trigger fallback scenario for telemetry validation')

    expect(failureEvents.some((event) => event.type === 'provider_failure')).toBe(true)
    expect(failureEvents.some((event) => event.type === 'fallback_applied')).toBe(true)
  })
})
