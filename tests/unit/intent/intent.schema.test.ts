import { describe, expect, it } from 'vitest'
import { intentSchema, INTENT_CONSTANTS } from '@/lib/ai/intent/intent.schema'

describe('intentSchema', () => {
  const basePayload = {
    rawPrompt: 'Design a warm onboarding hero for a climate app',
    normalizedPrompt: 'design a warm onboarding hero for a climate app',
  }

  it('applies defaults for optional fields', () => {
    const parsed = intentSchema.parse(basePayload)

    expect(parsed.domain).toBe('saas')
    expect(parsed.styleCues).toEqual(['modern'])
    expect(parsed.visualTheme).toBe('illustrated')
    expect(parsed.tone).toBe('professional')
    expect(parsed.colorMood).toBe('vibrant')
    expect(parsed.fallback.applied).toBe(false)
    expect(parsed.createdAt).toBeInstanceOf(Date)
  })

  it('accepts explicit intent values inside allowed enums', () => {
    const parsed = intentSchema.parse({
      ...basePayload,
      domain: 'ecommerce',
      styleCues: ['luxury', 'minimal'],
      visualTheme: 'photographic',
      tone: 'calm',
      colorMood: 'muted',
      confidence: {
        domain: 0.9,
        style: 0.8,
        theme: 0.7,
        tone: 0.6,
        color: 0.5,
      },
      fallback: { applied: true, reason: 'provider_timeout' },
      metadata: { provider: 'mock', model: 'gpt-test' },
    })

    expect(parsed.domain).toBe('ecommerce')
    expect(parsed.styleCues).toHaveLength(2)
    expect(parsed.confidence.domain).toBeCloseTo(0.9)
    expect(parsed.fallback.reason).toBe('provider_timeout')
    expect(parsed.metadata.provider).toBe('mock')
  })

  it('fails when style cues exceed limit or include unknown values', () => {
    expect(() =>
      intentSchema.parse({
        ...basePayload,
        styleCues: ['modern', 'playful', 'retro', 'minimal'],
      })
    ).toThrow()

    expect(() =>
      intentSchema.parse({
        ...basePayload,
        styleCues: ['unknown'],
      })
    ).toThrow()
  })

  it('exposes enum constants for downstream systems', () => {
    expect(INTENT_CONSTANTS.DOMAINS).toContain('saas')
    expect(INTENT_CONSTANTS.STYLE_CUES).toContain('modern')
    expect(INTENT_CONSTANTS.VISUAL_THEMES).toContain('illustrated')
    expect(INTENT_CONSTANTS.TONES).toContain('professional')
    expect(INTENT_CONSTANTS.COLOR_MOODS).toContain('vibrant')
  })
})
