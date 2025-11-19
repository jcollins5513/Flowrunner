import { describe, expect, it } from 'vitest'
import { intentSchema } from '@/lib/ai/intent/intent.schema'
import { mapTemplateToScreenSequence, selectTemplateForIntent } from '@/lib/flow/templates/selector'

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

  it('selects the finance template when the intent domain is finance', () => {
    const intent = buildIntent({
      domain: 'finance',
      styleCues: ['minimal'],
      tone: 'professional',
      colorMood: 'cool',
    })

    const template = selectTemplateForIntent(intent)
    expect(template.domain).toBe('finance')
    expect(template.id).toBe('finance-fintech-growth-v1')
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

  it('applies template customization metadata and runtime overrides', () => {
    const intent = buildIntent({
      domain: 'saas',
      styleCues: ['modern'],
      tone: 'professional',
      colorMood: 'cool',
    })

    const template = selectTemplateForIntent(intent)
    const plans = mapTemplateToScreenSequence(template, intent, {
      screenOrder: ['pricing-close', 'welcome-hero', 'product-tour'],
      fieldValues: { hero_cta_label: 'Join beta waitlist' },
      screenOverrides: {
        'welcome-hero': { patternVariant: 4 },
      },
    })

    expect(plans[0].screenId).toBe('pricing-close')
    expect(plans[0].pattern.variant).toBe(5)
    const welcomeHeroPlan = plans.find((plan) => plan.screenId === 'welcome-hero')
    expect(welcomeHeroPlan?.pattern.variant).toBe(4)
    expect(welcomeHeroPlan?.textPlan.customFields?.hero_cta_label).toBe('Join beta waitlist')
  })
})
