// Next Screen Generator Service
// Generates next screen from click context using the deterministic pipeline

import type {
  NextScreenTriggerContext,
  ScreenContext,
  GenerateNextScreenOptions,
  GenerateNextScreenResult,
} from './types'
import type { ScreenDSL, Component, PatternFamily, PatternVariant, Palette } from '../dsl/types'
import { runPromptToTemplatePipeline } from '../ai/intent/pipeline'
import type { ScreenGenerationPlan } from '../flow/templates/selector'
import type { HeroImageWithPalette } from '../images/orchestrator'
import { FlowEngine } from './engine'
import { insertScreen } from './screen-sequence'
import { ImageOrchestrator } from '../images/orchestrator'
import { ImageGenerationService } from '../images/generation/service'
import { MockImageProvider } from '../images/generation/providers/mock'
import { ALL_PATTERN_FAMILIES } from '../patterns/families'

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
 * Build ScreenDSL from generation plan
 */
export function buildScreenDSLFromPlan(
  plan: ScreenGenerationPlan,
  context: ScreenContext,
  heroImage: HeroImageWithPalette,
): ScreenDSL {
  const { pattern, textPlan, heroPlan } = plan
  const { palette, vibe } = context

  // Use generated palette if available, otherwise use context palette
  // Ensure all required fields are present (normalize from optional palette)
  const paletteFromImage = heroImage.palette
  const finalPalette: Palette = paletteFromImage
    ? {
        primary: paletteFromImage.primary,
        secondary: paletteFromImage.secondary || palette.secondary || '#8B5CF6',
        accent: paletteFromImage.accent || palette.accent || '#F59E0B',
        background: paletteFromImage.background || palette.background || '#FFFFFF',
      }
    : palette
  const finalVibe = heroImage.vibe || vibe

  // Build components from textPlan
  // This is a simplified version - in production, you'd use AI or templates
  const components: Component[] = []
  
  // Add title
  if (textPlan.contentFocus) {
    components.push({
      type: 'title',
      content: textPlan.contentFocus,
    })
  } else {
    components.push({
      type: 'title',
      content: plan.name,
    })
  }

  // Add subtitle
  components.push({
    type: 'subtitle',
    content: `Continue your journey`,
  })

  // Add text
  components.push({
    type: 'text',
    content: `This screen follows naturally from the previous step.`,
  })

  // Add button
  components.push({
    type: 'button',
    content: 'Continue',
  })

  return {
    hero_image: {
      id: heroImage.imageId || `hero-${Date.now()}`,
      url: heroImage.image.url,
      prompt: heroImage.image.prompt,
      seed: heroImage.image.seed,
      aspectRatio: heroImage.image.aspectRatio,
      style: heroImage.image.style,
      extractedPalette: finalPalette,
      vibe: finalVibe,
    },
    palette: finalPalette,
    vibe: finalVibe,
    pattern_family: pattern.family as PatternFamily,
    pattern_variant: (pattern.variant as PatternVariant) || 1,
    components,
    navigation: {
      type: 'internal',
    },
    metadata: {
      generatedFrom: context.patternFamily,
      planName: plan.name,
    },
  }
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

    // Stage 4: Generate hero image (50%)
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

    const heroImage = await orchestrator.generateHeroImageWithPalette({
      prompt: plan.heroPlan.imagePrompt,
      aspectRatio: plan.heroPlan.aspectRatio,
      // style is optional - let the orchestrator use defaults or infer from visualTheme
      visualTheme: screenContext.flowMetadata?.theme,
    })

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

