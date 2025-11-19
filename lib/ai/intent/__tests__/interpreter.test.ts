import { describe, expect, it } from 'vitest'
import { IntentInterpreter, IntentProvider, IntentProviderInput } from '../interpreter'
import { MockIntentProvider } from '../providers/mock'

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
})
