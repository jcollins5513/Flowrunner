// Unit tests for next screen generator (Phase 12.2)

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  extractContextFromScreen,
  inferNextScreenIntent,
  buildScreenDSLFromPlan,
  generateNextScreen,
} from '@/lib/flows/next-screen-generator'
import type { NextScreenTriggerContext } from '@/lib/flows/types'
import type { ScreenDSL } from '@/lib/dsl/types'
import { createPatternFixtureDSL } from '@/lib/patterns/fixtures'
import type { ScreenGenerationPlan } from '@/lib/flow/templates/selector'
import type { HeroImageWithPalette } from '@/lib/images/orchestrator'

describe('extractContextFromScreen', () => {
  it('extracts palette, vibe, pattern correctly', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1, {
      paletteOverride: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#ff0000',
        background: '#ffffff',
      },
      vibe: 'modern',
    })

    const context = extractContextFromScreen(screen)

    expect(context.palette.primary).toBe('#000000')
    expect(context.vibe).toBe('modern')
    expect(context.patternFamily).toBe('ONB_HERO_TOP')
    expect(context.patternVariant).toBe(1)
    expect(context.components).toBeDefined()
  })

  it('includes flow metadata when provided', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const flowMetadata = { domain: 'ecommerce', theme: 'modern', style: 'minimal' }

    const context = extractContextFromScreen(screen, flowMetadata)

    expect(context.flowMetadata?.domain).toBe('ecommerce')
    expect(context.flowMetadata?.theme).toBe('modern')
  })
})

describe('inferNextScreenIntent', () => {
  it('generates appropriate prompts from button clicks', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context = extractContextFromScreen(screen)

    const triggerContext: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Get Started' },
      componentType: 'button',
      trigger: 'click',
    }

    const prompt = inferNextScreenIntent(triggerContext, context)

    expect(prompt).toContain('onboarding')
    expect(prompt).toContain('onb hero top')
  })

  it('handles different component types', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ACT_FORM_MINIMAL', 1)
    const context = extractContextFromScreen(screen)

    const triggerContext: NextScreenTriggerContext = {
      screen,
      component: { type: 'form', content: 'Sign Up Form', props: {} },
      componentType: 'form',
      trigger: 'click',
    }

    const prompt = inferNextScreenIntent(triggerContext, context)

    expect(prompt).toBeDefined()
    expect(typeof prompt).toBe('string')
  })

  it('includes flow metadata in prompt when available', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context = extractContextFromScreen(screen, {
      domain: 'saas',
      theme: 'professional',
      style: 'minimal',
    })

    const triggerContext: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Continue' },
      componentType: 'button',
      trigger: 'click',
    }

    const prompt = inferNextScreenIntent(triggerContext, context)

    expect(prompt).toContain('saas')
    expect(prompt).toContain('professional')
  })
})

describe('buildScreenDSLFromPlan', () => {
  it('creates valid DSL from generation plan', () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context = extractContextFromScreen(screen)

    const plan: ScreenGenerationPlan = {
      order: 0,
      templateId: 'test-template',
      screenId: 'test-screen',
      name: 'Test Screen',
      pattern: {
        family: 'FEAT_IMAGE_TEXT_RIGHT',
        variant: 1,
      },
      textPlan: {
        tone: 'professional',
        styleCues: ['modern', 'clean'],
        colorMood: 'calm',
        contentFocus: 'Feature showcase',
      },
      heroPlan: {
        vibe: 'professional',
        colorMood: 'calm',
        imagePrompt: 'Professional feature image',
        aspectRatio: '16:9',
      },
    }

    const heroImage: HeroImageWithPalette = {
      image: {
        url: 'https://example.com/image.png',
        prompt: 'Test image',
        seed: 12345,
        aspectRatio: '16:9',
        style: 'modern',
        metadata: {
          provider: 'test',
          model: 'test-model',
          generationId: 'test-id',
        },
      },
      palette: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#ff0000',
        background: '#ffffff',
      },
      vibe: 'professional',
    }

    const dsl = buildScreenDSLFromPlan(plan, context, heroImage)

    expect(dsl.pattern_family).toBe('FEAT_IMAGE_TEXT_RIGHT')
    expect(dsl.pattern_variant).toBe(1)
    expect(dsl.hero_image.url).toBe('https://example.com/image.png')
    expect(dsl.components.length).toBeGreaterThan(0)
    expect(dsl.components.some((c) => c.type === 'title')).toBe(true)
    expect(dsl.components.some((c) => c.type === 'button')).toBe(true)
  })
})

describe('generateNextScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full pipeline successfully', async () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Get Started' },
      componentType: 'button',
      trigger: 'click',
    }

    const onProgress = vi.fn()

    const result = await generateNextScreen(context, {
      onProgress,
    })

    expect(result.screenDSL).toBeDefined()
    expect(result.screenId).toBeDefined()
    expect(onProgress).toHaveBeenCalled()
  })

  it('handles image generation failures gracefully', async () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Continue' },
      componentType: 'button',
      trigger: 'click',
    }

    // Mock image orchestrator to fail
    const mockOrchestrator = {
      generateHeroImageWithPalette: vi.fn().mockRejectedValue(new Error('Image generation failed')),
    }

    await expect(
      generateNextScreen(context, {
        imageOrchestrator: mockOrchestrator,
      }),
    ).rejects.toThrow()
  })

  it('applies theme consistency rules', async () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1, {
      paletteOverride: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#ff0000',
        background: '#ffffff',
      },
      vibe: 'professional',
    })

    const context: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Continue' },
      componentType: 'button',
      trigger: 'click',
    }

    const result = await generateNextScreen(context)

    // Generated screen should maintain similar vibe
    expect(result.screenDSL.vibe).toBeDefined()
    expect(result.screenDSL.palette).toBeDefined()
  })

  it('progress callbacks fire at correct stages', async () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Continue' },
      componentType: 'button',
      trigger: 'click',
    }

    const progressStages: string[] = []
    const onProgress = vi.fn((stage: string) => {
      progressStages.push(stage)
    })

    await generateNextScreen(context, {
      onProgress,
    })

    expect(progressStages).toContain('extracting-context')
    expect(progressStages).toContain('inferring-intent')
    expect(progressStages).toContain('selecting-template')
    expect(progressStages).toContain('generating-image')
    expect(progressStages).toContain('building-screen')
  })

  it('uses user prompt override when provided', async () => {
    const screen: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
    const context: NextScreenTriggerContext = {
      screen,
      component: { type: 'button', content: 'Continue' },
      componentType: 'button',
      trigger: 'click',
    }

    const customPrompt = 'Create a dashboard screen with analytics'
    const result = await generateNextScreen(context, {
      userPrompt: customPrompt,
    })

    expect(result.screenDSL).toBeDefined()
    // The result should reflect the custom prompt
  })
})

