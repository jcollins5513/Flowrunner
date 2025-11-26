// Next Screen Generator Service
// Generates next screen from click context using the deterministic pipeline

import type {
  NextScreenTriggerContext,
  ScreenContext,
  GenerateNextScreenOptions,
  GenerateNextScreenResult,
} from './types'
import type { ScreenDSL, Component, PatternFamily, PatternVariant, Palette, Vibe, HeroImage } from '../dsl/types'
import { runPromptToTemplatePipeline } from '../ai/intent/pipeline'
import type { ScreenGenerationPlan } from '../flow/templates/selector'
import type { HeroImageWithPalette } from '../images/orchestrator'
import type { PatternDefinition } from '../patterns/schema'
import { FlowEngine } from './engine'
import { insertScreen } from './screen-sequence'
import { ImageOrchestrator } from '../images/orchestrator'
import { ImageGenerationService } from '../images/generation/service'
import { MockImageProvider } from '../images/generation/providers/mock'
import { persistHeroImageMetadata } from '../db/hero-image-persistence'
import { ImageRepository } from '../images/repository'
import type { AspectRatio, ImageStyle } from '../images/generation/types'
import { buildScreenDSLFromPlan } from './build-screen-dsl'

/**
 * Pattern suggestion heuristics
 * Suggests next pattern based on current pattern
 */
const PATTERN_SUGGESTIONS: Partial<Record<PatternFamily, PatternFamily[]>> = {
  ONB_HERO_TOP: ['FEAT_IMAGE_TEXT_RIGHT', 'ACT_FORM_MINIMAL', 'HERO_CENTER_TEXT'],
  FEAT_IMAGE_TEXT_RIGHT: ['ACT_FORM_MINIMAL', 'PRODUCT_DETAIL', 'DASHBOARD_OVERVIEW'],
  FEAT_IMAGE_TEXT_LEFT: ['ACT_FORM_MINIMAL', 'PRODUCT_DETAIL'],
  ACT_FORM_MINIMAL: ['DASHBOARD_OVERVIEW', 'PRODUCT_DETAIL', 'FEAT_IMAGE_TEXT_RIGHT'],
  PRODUCT_DETAIL: ['ACT_FORM_MINIMAL', 'DASHBOARD_OVERVIEW'],
  DASHBOARD_OVERVIEW: ['PRODUCT_DETAIL', 'FEAT_IMAGE_TEXT_RIGHT'],
  DEMO_DEVICE_FULLBLEED: ['ACT_FORM_MINIMAL', 'PRODUCT_DETAIL'],
  HERO_CENTER_TEXT: ['FEAT_IMAGE_TEXT_RIGHT', 'ACT_FORM_MINIMAL'],
  NEWSLETTER_SIGNUP: ['DASHBOARD_OVERVIEW', 'FEAT_IMAGE_TEXT_RIGHT'],
  PRICING_TABLE: ['ACT_FORM_MINIMAL', 'PRODUCT_DETAIL'],
  TESTIMONIAL_CARD_GRID: ['ACT_FORM_MINIMAL', 'PRODUCT_DETAIL'],
  CTA_SPLIT_SCREEN: ['ACT_FORM_MINIMAL', 'DASHBOARD_OVERVIEW'],
}

const SUPPORTED_COMPONENT_SLOTS: Component['type'][] = ['title', 'subtitle', 'text', 'button', 'form', 'image']

const CTA_TONE_PRESETS: Record<string, string[]> = {
  friendly: ['Get started free', 'Invite your team'],
  professional: ['Schedule a demo', 'Book a walkthrough'],
  bold: ['Launch now', 'Unlock access'],
  modern: ['Start exploring', 'Pair with product tour'],
  playful: ['Jump into the flow', 'Let’s go'],
  minimal: ['Begin', 'Continue'],
}

const CTA_PATTERN_FALLBACKS: Partial<Record<PatternFamily, string>> = {
  ONB_HERO_TOP: 'Start your journey',
  ACT_FORM_MINIMAL: 'Request access',
  PRICING_TABLE: 'Choose a plan',
  CTA_SPLIT_SCREEN: 'Talk to sales',
}

const DEFAULT_FORM_FIELDS = [
  { id: 'full_name', label: 'Full name', placeholder: 'Alex Product', type: 'text', required: true },
  { id: 'work_email', label: 'Work email', placeholder: 'alex@company.com', type: 'email', required: true },
  { id: 'company', label: 'Company', placeholder: 'Product Labs', type: 'text', required: false },
  { id: 'goal', label: 'Primary goal', placeholder: 'e.g. onboard trial users', type: 'text', required: false },
]

type ComponentBuildMeta = {
  buttonLabel?: string
  buttonSource?: 'custom' | 'tone' | 'pattern' | 'default'
  hasForm: boolean
}

const humanize = (value?: string) => {
  if (!value) return ''
  return value
    .split(/[_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

const describeAudience = (context: ScreenContext) => {
  if (context.flowMetadata?.domain) {
    return `${humanize(context.flowMetadata.domain)} teams`
  }
  return 'growing teams'
}

const formatStyleCues = (styleCues?: readonly string[]) => {
  if (!styleCues?.length) {
    return 'Modern & confident'
  }
  return styleCues.map((cue) => humanize(cue)).join(' • ')
}

const selectCtaLabel = (
  tone: string,
  family: PatternFamily,
  customLabel?: string
): { label: string; source: ComponentBuildMeta['buttonSource'] } => {
  if (customLabel?.trim()) {
    return { label: customLabel.trim(), source: 'custom' }
  }
  const tonePreset = CTA_TONE_PRESETS[tone]
  if (tonePreset?.length) {
    return { label: tonePreset[0], source: 'tone' }
  }
  const patternFallback = CTA_PATTERN_FALLBACKS[family]
  if (patternFallback) {
    return { label: patternFallback, source: 'pattern' }
  }
  return { label: 'Continue', source: 'default' }
}

const buildComponentsForPattern = (
  patternDefinition: PatternDefinition,
  plan: ScreenGenerationPlan,
  context: ScreenContext,
  heroImage: HeroImageWithPalette
): { components: Component[]; meta: ComponentBuildMeta; slotOrder: Component['type'][] } => {
  const slotOrder = Object.keys(patternDefinition.layout.positions)
    .filter((slot): slot is Component['type'] => slot !== 'hero_image' && SUPPORTED_COMPONENT_SLOTS.includes(slot as Component['type']))
  const seen = new Set<Component['type']>()
  const components: Component[] = []
  const meta: ComponentBuildMeta = { hasForm: false }
  const focus = plan.textPlan.contentFocus ?? plan.name
  const cuesText = formatStyleCues(plan.textPlan.styleCues)
  const audience = describeAudience(context)
  const toneLabel = humanize(plan.textPlan.tone)

  slotOrder.forEach((slot) => {
    if (seen.has(slot)) {
      return
    }
    switch (slot) {
      case 'title':
        components.push({
          type: 'title',
          content: focus,
        })
        seen.add(slot)
        break
      case 'subtitle':
        components.push({
          type: 'subtitle',
          content: `${toneLabel} • ${cuesText}`,
        })
        seen.add(slot)
        break
      case 'text': {
        const narrative = `${focus}. Designed for ${audience} who want a ${toneLabel.toLowerCase()} experience with ${cuesText.toLowerCase()} energy.`
        components.push({
          type: 'text',
          content: narrative,
        })
        seen.add(slot)
        break
      }
      case 'button': {
        const { label, source } = selectCtaLabel(
          plan.textPlan.tone,
          patternDefinition.family as PatternFamily,
          plan.textPlan.customFields?.hero_cta_label
        )
        meta.buttonLabel = label
        meta.buttonSource = source
        components.push({
          type: 'button',
          content: label,
          props: { variant: 'default', size: 'lg' },
        })
        seen.add(slot)
        break
      }
      case 'form': {
        meta.hasForm = true
        const formTitle = plan.textPlan.customFields?.form_title ?? 'Tell us about yourself'
        const formDescription =
          plan.textPlan.customFields?.form_description ??
          `Share a few details so we can tailor the next step for ${audience}.`
        const submitPreset = selectCtaLabel(
          plan.textPlan.tone,
          patternDefinition.family as PatternFamily,
          plan.textPlan.customFields?.form_submit_label
        )
        components.push({
          type: 'form',
          content: formTitle,
          props: {
            description: formDescription,
            fields: DEFAULT_FORM_FIELDS.map((field) => ({ ...field })),
            submitLabel: submitPreset.label,
          },
        })
        seen.add(slot)
        break
      }
      case 'image': {
        if (heroImage.image?.url) {
          components.push({
            type: 'image',
            content: heroImage.image.prompt ?? 'Supporting visual',
            props: {
              url: heroImage.image.url,
              id: heroImage.imageId ?? heroImage.image.url,
            },
          })
          seen.add(slot)
        }
        break
      }
      default:
        break
    }
  })

  const requiredSlots = patternDefinition.componentSlots.required.filter((slot): slot is Component['type'] =>
    SUPPORTED_COMPONENT_SLOTS.includes(slot as Component['type'])
  )
  const missingSlots = requiredSlots.filter((slot) => !components.some((component) => component.type === slot))
  if (missingSlots.length) {
    throw new Error(`Missing components for required slots: ${missingSlots.join(', ')}`)
  }

  return { components, meta, slotOrder }
}

const buildHeroFromLibrary = (
  libraryImage: HeroImage,
  plan: ScreenGenerationPlan,
  context: ScreenContext,
): HeroImageWithPalette => {
  const palette = libraryImage.extractedPalette ?? context.palette
  const aspectRatio = (libraryImage.aspectRatio as AspectRatio | undefined) ?? plan.heroPlan.aspectRatio

  return {
    image: {
      url: libraryImage.url,
      prompt: libraryImage.prompt ?? plan.heroPlan.imagePrompt,
      seed: libraryImage.seed,
      style: libraryImage.style as ImageStyle | undefined,
      aspectRatio,
      metadata: { provider: 'library', createdAt: new Date() },
    },
    palette: {
      primary: palette.primary || context.palette.primary,
      secondary: palette.secondary || context.palette.secondary,
      accent: palette.accent || context.palette.accent,
      background: palette.background || context.palette.background,
    },
    vibe: libraryImage.vibe ?? context.vibe,
    imageId: libraryImage.id,
  }
}

/**
 * Extract context from current screen
 */
export function extractContextFromScreen(screen: ScreenDSL, flowMetadata?: {
  domain?: string
  theme?: string
  style?: string
}): ScreenContext {
  return {
    palette: screen.palette,
    vibe: screen.vibe,
    patternFamily: screen.pattern_family,
    patternVariant: screen.pattern_variant,
    components: screen.components,
    flowMetadata,
  }
}

/**
 * Infer next screen intent from click context
 */
export function inferNextScreenIntent(
  context: NextScreenTriggerContext,
  screenContext: ScreenContext,
): string {
  const { component, screen } = context
  const { patternFamily, vibe, flowMetadata } = screenContext

  // Analyze component content
  const componentText = component.content.toLowerCase()
  const buttonActions: Record<string, string> = {
    'sign up': 'user registration',
    'sign in': 'user authentication',
    'get started': 'onboarding',
    'continue': 'progression',
    'next': 'progression',
    'learn more': 'information',
    'view': 'details',
    'buy': 'purchase',
    'add to cart': 'purchase',
    'submit': 'form submission',
    'create': 'creation',
    'join': 'membership',
  }

  let action = 'progression'
  for (const [keyword, mappedAction] of Object.entries(buttonActions)) {
    if (componentText.includes(keyword)) {
      action = mappedAction
      break
    }
  }

  // Build prompt
  const patternName = patternFamily.replace(/_/g, ' ').toLowerCase()
  const themePart = flowMetadata?.theme ? ` with ${flowMetadata.theme} theme` : ''
  const vibePart = vibe !== 'modern' ? ` in a ${vibe} style` : ''
  const domainPart = flowMetadata?.domain ? ` for ${flowMetadata.domain}` : ''

  return `Create next screen after ${patternName} where user ${action}${themePart}${vibePart}${domainPart}. Continue the flow naturally.`
}


/**
 * Generate next screen from click context
 */
export async function generateNextScreen(
  context: NextScreenTriggerContext,
  options: GenerateNextScreenOptions = {},
): Promise<GenerateNextScreenResult> {
  const { onProgress, userPrompt, flowId, imageOrchestrator, flowEngine } = options

  try {
    // Stage 1: Extract context (10%)
    onProgress?.('extracting-context', 10)
    const screenContext = extractContextFromScreen(context.screen, undefined)
    
    // Stage 2: Infer intent (20%)
    onProgress?.('inferring-intent', 20)
    const prompt = userPrompt || inferNextScreenIntent(context, screenContext)

    // Stage 3: Run pipeline to get template/sequence (30%)
    onProgress?.('selecting-template', 30)
    const pipelineResult = await runPromptToTemplatePipeline(prompt)
    
    // Select first screen from sequence (or allow override)
    const plan = pipelineResult.sequence[0]
    if (!plan) {
      throw new Error('No screen plan generated from template')
    }

    // Stage 4: Generate or reuse hero image (50%)
    onProgress?.('generating-image', 50)

    // Create image orchestrator if not provided
    const orchestrator =
      imageOrchestrator ||
      new ImageOrchestrator({
        service: new ImageGenerationService({ provider: new MockImageProvider() }),
        autoExtractPalette: true,
        autoInferVibe: true,
        autoPersist: true,
      })

    const heroImage = context.libraryImage
      ? buildHeroFromLibrary(context.libraryImage, plan, screenContext)
      : await orchestrator.generateHeroImageWithPalette({
          prompt: plan.heroPlan.imagePrompt,
          aspectRatio: plan.heroPlan.aspectRatio,
          // style is optional - let the orchestrator use defaults or infer from visualTheme
          visualTheme: screenContext.flowMetadata?.theme,
        })

    if (context.libraryImage) {
      try {
        await new ImageRepository().incrementUsageCount(context.libraryImage.id)
      } catch (error) {
        console.warn('Unable to increment library image usage', error)
      }
    } else {
      try {
        await persistHeroImageMetadata(heroImage, {
          userId: options.userId,
          domain: screenContext.flowMetadata?.domain ?? pipelineResult.intent.domain,
        })
      } catch (error) {
        console.warn('Unable to persist hero image metadata for next screen generation', error)
      }
    }

    // Stage 5: Build DSL (70%)
    onProgress?.('building-screen', 70)
    const screenDSL = buildScreenDSLFromPlan(plan, screenContext, heroImage)

    // Stage 6: Save to flow (90%)
    onProgress?.('saving', 90)
    
    let screenId: string
    let navigationPath: { fromScreenId: string; toScreenId: string } | undefined

    if (flowId && context.sourceScreenId) {
      // Use FlowEngine to insert screen
      const engine = flowEngine || FlowEngine
      const { screen } = await insertScreen(flowId, {
        screenDSL,
        position: 'end',
        navigationFrom: context.sourceScreenId,
        heroImageId: heroImage.imageId,
      })
      screenId = screen.id
      navigationPath = {
        fromScreenId: context.sourceScreenId,
        toScreenId: screen.id,
      }
    } else {
      // Return DSL without saving (for playground mode)
      screenId = `generated-${Date.now()}`
    }

    // Complete (100%)
    onProgress?.('complete', 100)

    return {
      screenId,
      screenDSL,
      navigationPath,
    }
  } catch (error) {
    onProgress?.('error', 0)
    throw error
  }
}

