import { describe, expect, it } from 'vitest'
import { intentSchema } from '../../ai/intent/intent.schema'
import { mapTemplateToScreenSequence, selectTemplateForIntent } from '../selector'

describe('template selector', () => {
  const buildIntent = (overrides: Record<string, unknown> = {}) =>
    intentSchema.parse({
      rawPrompt: 'Design a cinematic UI flow',
      normalizedPrompt: 'design a cinematic ui flow',
      ...overrides,
    })

  it('selects the template that matches the intent domain and cues', () => {
    const intent = buildIntent({
      domain: 'ecommerce',
      styleCues: ['luxury', 'modern'],
      tone: 'bold',
      colorMood: 'vibrant',
    })

    const template = selectTemplateForIntent(intent)
    expect(template.domain).toBe('ecommerce')
    expect(template.screens).toHaveLength(4)
  })

  it('falls back to the closest compatible template when domain is unsupported', () => {
    const intent = buildIntent({
      domain: 'marketing',
      styleCues: ['playful'],
      tone: 'friendly',
      colorMood: 'warm',
    })

    const template = selectTemplateForIntent(intent)
    expect(['ecommerce', 'saas']).toContain(template.domain)
  })

  it('maps a template to deterministic screen generation plans', () => {
    const intent = buildIntent({
      domain: 'mobile_app',
      styleCues: ['modern'],
      tone: 'bold',
      colorMood: 'neon',
    })

    const template = selectTemplateForIntent(intent)
    const plans = mapTemplateToScreenSequence(template, intent)

    expect(plans).toHaveLength(template.screens.length)
    expect(plans[0].pattern.family).toBe(template.screens[0].pattern.family)
    expect(plans[0].textPlan.styleCues.length).toBeGreaterThan(0)
    expect(plans[0].heroPlan.imagePrompt.length).toBeGreaterThan(0)
  })
})
