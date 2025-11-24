import { runPromptToTemplatePipeline } from '../ai/intent/pipeline'
import type { InterpretOptions } from '../ai/intent/interpreter'
import type { ScreenGenerationPlan } from './templates/selector'
import type { FlowTemplate } from './templates/schema'
import { loadPattern } from '../patterns/loader'
import { validateDSLAgainstPattern } from '../patterns/validator'
import type { PatternDefinition } from '../patterns/schema'
import type { Component, PatternFamily, PatternVariant, ScreenDSL } from '../dsl/types'
import { dslAssembler } from '../dsl/assembler'
import { ImageGenerationService } from '../images/generation/service'
import { MockImageProvider } from '../images/generation/providers/mock'
import { ImageOrchestrator, type HeroImageWithPalette } from '../images/orchestrator'
import { persistHeroImageMetadata } from '../db/hero-image-persistence'
import { createScreenWithValidation } from '../db/dsl-persistence'
import { validateScreenDSL } from '../dsl/validator'

export interface PromptToRenderOptions {
  screenIndex?: number
  interpreterOptions?: InterpretOptions
  imageOrchestrator?: ImageOrchestrator
  prebuiltHeroImage?: HeroImageWithPalette
  flowId?: string
  userId?: string
  persist?: boolean
  skipPatternValidation?: boolean
}

export interface PromptToRenderResult {
  intent: FlowIntentResult
  template: FlowTemplate
  plan: ScreenGenerationPlan
  pattern: PatternDefinition
  heroImage: HeroImageWithPalette
  screenDSL: ScreenDSL
  screenId?: string
}

export interface FlowIntentResult {
  domain: string
  templateId: string
}

const defaultOrchestrator = new ImageOrchestrator({
  service: new ImageGenerationService({ provider: new MockImageProvider() }),
  autoExtractPalette: true,
  autoInferVibe: true,
  autoPersist: true,
})

const buildComponentsFromPlan = (
  plan: ScreenGenerationPlan,
  pattern: PatternDefinition
): Component[] => {
  const components: Component[] = []
  const { required, optional } = pattern.componentSlots

  if (required.includes('title')) {
    components.push({ type: 'title', content: plan.name })
  }

  if (required.includes('subtitle')) {
    components.push({ type: 'subtitle', content: plan.textPlan.contentFocus ?? plan.heroPlan.vibe })
  } else if (optional.includes('subtitle') && plan.textPlan.contentFocus) {
    components.push({ type: 'subtitle', content: plan.textPlan.contentFocus })
  }

  if (required.includes('text')) {
    components.push({ type: 'text', content: plan.textPlan.colorMood })
  } else if (optional.includes('text')) {
    components.push({ type: 'text', content: `${plan.textPlan.tone} narrative` })
  }

  if (required.includes('button')) {
    components.push({ type: 'button', content: 'Continue' })
  } else if (optional.includes('button')) {
    components.push({ type: 'button', content: 'Learn more' })
  }

  if (required.includes('form')) {
    components.push({
      type: 'form',
      content: JSON.stringify({ fields: [{ name: 'email', label: 'Email', type: 'email' }] }),
      props: { fields: [{ name: 'email', label: 'Email', type: 'email' }] },
    })
  }

  if (optional.includes('image') && !required.includes('image')) {
    components.push({ type: 'image', content: plan.heroPlan.imagePrompt })
  }

  return components
}

const resolvePattern = (plan: ScreenGenerationPlan): PatternDefinition => {
  try {
    return loadPattern(plan.pattern.family as PatternFamily, plan.pattern.variant as PatternVariant)
  } catch (error) {
    // Fallback to variant 1 if the requested variant cannot be validated
    return loadPattern(plan.pattern.family as PatternFamily, 1 as PatternVariant)
  }
}

export const assembleScreenFromPrompt = async (
  prompt: string,
  options: PromptToRenderOptions = {}
): Promise<PromptToRenderResult> => {
  const pipeline = await runPromptToTemplatePipeline(prompt, options.interpreterOptions)
  const plan = pipeline.sequence[options.screenIndex ?? 0]

  if (!plan) {
    throw new Error('No screen generation plan produced from prompt')
  }

  const pattern = resolvePattern(plan)
  const orchestrator = options.imageOrchestrator ?? defaultOrchestrator

  const heroImage =
    options.prebuiltHeroImage ??
    (await orchestrator.generateHeroImageWithPalette({
      prompt: plan.heroPlan.imagePrompt,
      aspectRatio: plan.heroPlan.aspectRatio,
    }))

  let persistedImageId = heroImage.imageId
  try {
    const persistedImage = await persistHeroImageMetadata(heroImage, {
      userId: options.userId,
      domain: pipeline.intent.domain,
    })
    persistedImageId = persistedImage.id
  } catch (error) {
    console.warn('Failed to persist hero image metadata; continuing with in-memory ID', error)
  }

  const heroWithId: HeroImageWithPalette = {
    ...heroImage,
    imageId: persistedImageId ?? heroImage.imageId ?? `hero-${Date.now()}`,
  }

  const components = buildComponentsFromPlan(plan, pattern)

  const assembly = await dslAssembler.assemble(
    {
      heroImage: heroWithId,
      patternFamily: plan.pattern.family as PatternFamily,
      patternVariant: plan.pattern.variant as PatternVariant,
      components,
      metadata: {
        templateId: plan.templateId,
        planScreenId: plan.screenId,
      },
    },
    { validate: true }
  )

  const schemaValidation = validateScreenDSL(assembly.dsl)
  if (!schemaValidation.success) {
    throw schemaValidation.error ?? new Error('Screen DSL failed schema validation')
  }

  if (!options.skipPatternValidation) {
    const patternValidation = validateDSLAgainstPattern(assembly.dsl, pattern)
    if (!patternValidation.valid) {
      const message = patternValidation.errors.map((err) => `${err.code}:${err.field}`).join(', ')
      throw new Error(`Pattern validation failed: ${message}`)
    }
  }

  let screenId: string | undefined
  const shouldPersist = options.persist ?? Boolean(options.flowId)

  if (shouldPersist && options.flowId) {
    const { screen } = await createScreenWithValidation(options.flowId, assembly.dsl, {
      heroImageId: heroWithId.imageId,
      skipPatternValidation: options.skipPatternValidation,
    })
    screenId = screen.id
  }

  return {
    intent: { domain: pipeline.intent.domain, templateId: plan.templateId },
    template: pipeline.template,
    plan,
    pattern,
    heroImage: heroWithId,
    screenDSL: assembly.dsl,
    screenId,
  }
}

