import { runPromptToTemplatePipeline } from '../ai/intent/pipeline'
import type { InterpretOptions } from '../ai/intent/interpreter'
import type { ScreenGenerationPlan } from './templates/selector'
import type { FlowTemplate } from './templates/schema'
import { loadPattern } from '../patterns/loader'
import { validateDSLAgainstPattern } from '../patterns/validator'
import type { PatternDefinition } from '../patterns/schema'
import type { PatternFamily, PatternVariant, ScreenDSL } from '../dsl/types'
import { dslAssembler } from '../dsl/assembler'
import { ImageGenerationService } from '../images/generation/service'
import { OpenAIImageProvider } from '../images/generation/providers/openai'
import { ImageOrchestrator, type HeroImageWithPalette } from '../images/orchestrator'
import { persistHeroImageMetadata } from '../db/hero-image-persistence'
import { createScreenWithValidation } from '../db/dsl-persistence'
import { validateScreenDSL } from '../dsl/validator'
import { pipelineTelemetry } from '../telemetry/pipeline'
import { buildComponentsFromContext } from './content/deterministic-content'
import { deterministicId, deterministicSeed } from '../utils/deterministic'
import type { Intent } from '../ai/intent/intent.schema'

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

const createDefaultOrchestrator = () =>
  new ImageOrchestrator({
    service: new ImageGenerationService({ provider: new OpenAIImageProvider() }),
    autoExtractPalette: true,
    autoInferVibe: true,
    autoPersist: true,
  })

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

  const pattern = (await pipelineTelemetry.timeStage(
    'pattern_resolution',
    () => Promise.resolve(resolvePattern(plan)),
    { family: plan.pattern.family, variant: plan.pattern.variant },
  )) as PatternDefinition
  pipelineTelemetry.logStage('pattern_resolution', 'success', {
    metadata: {
      templateId: plan.templateId,
      screenId: plan.screenId,
      family: plan.pattern.family,
      variant: plan.pattern.variant,
    },
  })
  const orchestrator = options.imageOrchestrator ?? createDefaultOrchestrator()

  const heroSeedBase = deterministicSeed(`${prompt}-${plan.pattern.family}-${plan.pattern.variant}`)
  const heroSeed = heroSeedBase === 0 ? 1 : heroSeedBase

  const heroImage =
    options.prebuiltHeroImage ??
    ((await pipelineTelemetry.timeStage(
      'image_generation',
      () =>
        orchestrator.generateHeroImageWithPalette({
          prompt: plan.heroPlan.imagePrompt,
          aspectRatio: plan.heroPlan.aspectRatio,
          seed: heroSeed,
          style: pipeline.intent.visualTheme,
          colorMood: plan.heroPlan.colorMood,
          visualTheme: pipeline.intent.visualTheme,
        }),
      {
        patternFamily: plan.pattern.family,
        patternVariant: plan.pattern.variant,
        seed: heroSeed,
      },
    )) as HeroImageWithPalette)

  pipelineTelemetry.logStage('image_generation_trace', 'success', {
    metadata: {
      seed: heroSeed,
      prompt: plan.heroPlan.imagePrompt,
      aspectRatio: plan.heroPlan.aspectRatio,
    },
  })

  pipelineTelemetry.logStage('palette_and_vibe', 'success', {
    metadata: {
      palette: heroImage.palette,
      vibe: heroImage.vibe ?? 'unknown',
    },
  })

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
    imageId:
      persistedImageId ??
      heroImage.imageId ??
      deterministicId(
        'hero',
        `${prompt}-${plan.pattern.family}-${plan.pattern.variant}-${plan.screenId ?? 'screen'}`,
      ),
  }

  const components = buildComponentsFromContext({
    intent: pipeline.intent as Intent,
    plan,
    pattern,
    prompt,
  })

  const assembly = (await pipelineTelemetry.timeStage(
    'dsl_assembly',
    () =>
      dslAssembler.assemble(
        {
          heroImage: heroWithId,
          patternFamily: plan.pattern.family as PatternFamily,
          patternVariant: plan.pattern.variant as PatternVariant,
          patternDefinition: pattern,
          components,
          metadata: {
            templateId: plan.templateId,
            planScreenId: plan.screenId,
          },
        },
        { validate: true },
      ),
    { patternFamily: plan.pattern.family, patternVariant: plan.pattern.variant },
  )) as Awaited<ReturnType<typeof dslAssembler.assemble>>

  const schemaValidation = (await pipelineTelemetry.timeStage(
    'validation',
    () => Promise.resolve(validateScreenDSL(assembly.dsl)),
    { scope: 'schema' },
  )) as ReturnType<typeof validateScreenDSL>
  if (!schemaValidation.success) {
    pipelineTelemetry.logStage('validation', 'error', {
      message: 'schema_validation_failed',
      metadata: { issues: schemaValidation.error?.errors?.issues ?? [] },
    })
    throw schemaValidation.error ?? new Error('Screen DSL failed schema validation')
  }

  if (!options.skipPatternValidation) {
    const patternValidation = validateDSLAgainstPattern(assembly.dsl, pattern)
    if (!patternValidation.valid) {
      pipelineTelemetry.logStage('validation', 'error', {
        message: 'pattern_validation_failed',
        metadata: { errors: patternValidation.errors },
      })
      const message = patternValidation.errors.map((err) => `${err.code}:${err.field}`).join(', ')
      throw new Error(`Pattern validation failed: ${message}`)
    }
  }

  pipelineTelemetry.logStage('validation', 'success', {
    metadata: { schema: true, pattern: options.skipPatternValidation ? 'skipped' : 'passed' },
  })

  let screenId: string | undefined
  const shouldPersist = options.persist ?? Boolean(options.flowId)

  if (shouldPersist && options.flowId) {
    const { screen } = (await pipelineTelemetry.timeStage(
      'persistence',
      () =>
        createScreenWithValidation(options.flowId as string, assembly.dsl, {
          heroImageId: heroWithId.imageId,
          skipPatternValidation: options.skipPatternValidation,
        }),
      { flowId: options.flowId, persistedHeroImageId: heroWithId.imageId },
    )) as Awaited<ReturnType<typeof createScreenWithValidation>>
    screenId = screen.id
  } else {
    pipelineTelemetry.logStage('persistence', 'success', {
      message: 'skipped',
      metadata: { reason: 'no_flow_id' },
    })
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
