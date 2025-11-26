// Build ScreenDSL from generation plan
// This is a pure function that doesn't import server-only modules

import type { ScreenDSL, Component, PatternFamily, PatternVariant, Palette, Vibe } from '../dsl/types'
import type { ScreenContext } from './types'
import type { ScreenGenerationPlan } from '../flow/templates/selector'
// Note: HeroImageWithPalette is imported as type to avoid pulling in server-only modules
// This type is also defined in lib/images/orchestrator.ts but we only need the type here
type HeroImageWithPalette = {
  image: {
    url: string
    prompt?: string
    seed?: number
    aspectRatio?: string
    style?: string
  }
  palette: Palette
  vibe?: Vibe
  imageId?: string
}
import { loadPattern } from '../patterns/loader'

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
  playful: ['Jump into the flow', "Let's go"],
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
): string => {
  if (customLabel) return customLabel
  const tonePreset = CTA_TONE_PRESETS[tone.toLowerCase()]
  if (tonePreset && tonePreset.length > 0) {
    return tonePreset[Math.floor(Math.random() * tonePreset.length)]
  }
  const patternFallback = CTA_PATTERN_FALLBACKS[family]
  if (patternFallback) return patternFallback
  return 'Get started'
}

const buildComponentsForPattern = (
  patternDefinition: any,
  plan: ScreenGenerationPlan,
  context: ScreenContext,
  heroImage: HeroImageWithPalette
): { components: Component[]; meta: ComponentBuildMeta; slotOrder: string[] } => {
  const { textPlan, heroPlan } = plan
  const components: Component[] = []
  const slotOrder: string[] = []
  let hasForm = false
  let buttonLabel: string | undefined
  let buttonSource: 'custom' | 'tone' | 'pattern' | 'default' = 'default'

  // Get pattern slots
  const slots = patternDefinition.slots || []

  for (const slot of slots) {
    slotOrder.push(slot.name)

    switch (slot.name) {
      case 'title':
        components.push({
          type: 'title',
          content: textPlan.title || plan.name || 'Welcome',
          style: {
            fontSize: slot.style?.fontSize || 'text-4xl',
            fontWeight: slot.style?.fontWeight || 'font-bold',
            textAlign: slot.style?.textAlign || 'text-center',
          },
        })
        break

      case 'subtitle':
        components.push({
          type: 'subtitle',
          content: textPlan.subtitle || `Built for ${describeAudience(context)}`,
          style: {
            fontSize: slot.style?.fontSize || 'text-xl',
            fontWeight: slot.style?.fontWeight || 'font-normal',
            textAlign: slot.style?.textAlign || 'text-center',
          },
        })
        break

      case 'text':
        components.push({
          type: 'text',
          content: textPlan.description || textPlan.body || 'Discover what makes us different.',
          style: {
            fontSize: slot.style?.fontSize || 'text-base',
            fontWeight: slot.style?.fontWeight || 'font-normal',
            textAlign: slot.style?.textAlign || 'text-left',
          },
        })
        break

      case 'button':
        const ctaLabel = selectCtaLabel(
          context.flowMetadata?.theme || 'modern',
          plan.pattern.family as PatternFamily,
          textPlan.ctaLabel
        )
        buttonLabel = ctaLabel
        buttonSource = textPlan.ctaLabel ? 'custom' : 'tone'
        components.push({
          type: 'button',
          content: ctaLabel,
          style: {
            variant: slot.style?.variant || 'primary',
            size: slot.style?.size || 'lg',
          },
        })
        break

      case 'form':
        hasForm = true
        components.push({
          type: 'form',
          fields: textPlan.formFields || DEFAULT_FORM_FIELDS,
          submitLabel: textPlan.formSubmitLabel || 'Submit',
        })
        break

      case 'image':
        // Hero image is handled separately in DSL
        break
    }
  }

  return {
    components,
    meta: {
      buttonLabel,
      buttonSource,
      hasForm,
    },
    slotOrder,
  }
}

/**
 * Build ScreenDSL from generation plan
 */
export function buildScreenDSLFromPlan(
  plan: ScreenGenerationPlan,
  context: ScreenContext,
  heroImage: HeroImageWithPalette,
): ScreenDSL {
  const { pattern } = plan
  const { palette, vibe } = context

  // Use generated palette if available, otherwise use context palette
  // Ensure all required fields are present (normalize from optional palette)
  const paletteFromImage = heroImage.palette
  const finalPalette: Palette = paletteFromImage
    ? {
        primary: paletteFromImage.primary || palette.primary || '#3B82F6',
        secondary: paletteFromImage.secondary || palette.secondary || '#8B5CF6',
        accent: paletteFromImage.accent || palette.accent || '#F59E0B',
        background: paletteFromImage.background || palette.background || '#FFFFFF',
      }
    : {
        primary: palette.primary || '#3B82F6',
        secondary: palette.secondary || '#8B5CF6',
        accent: palette.accent || '#F59E0B',
        background: palette.background || '#FFFFFF',
      }
  // Ensure vibe is valid, default to 'modern' if not
  const validVibes: Vibe[] = ['playful', 'professional', 'bold', 'minimal', 'modern', 'retro', 'elegant', 'energetic', 'calm', 'tech', 'creative', 'corporate']
  const finalVibe: Vibe = (heroImage.vibe && validVibes.includes(heroImage.vibe as Vibe)) 
    ? (heroImage.vibe as Vibe)
    : (vibe && validVibes.includes(vibe)) 
      ? vibe 
      : 'modern'

  // Build components from textPlan
  const patternDefinition = loadPattern(pattern.family as PatternFamily, (pattern.variant as PatternVariant) || 1)
  const { components } = buildComponentsForPattern(patternDefinition, plan, context, heroImage)

  // Ensure hero_image has required fields
  if (!heroImage.image?.url) {
    throw new Error('Hero image URL is required')
  }

  // Ensure URL is valid (Zod requires valid URL format)
  try {
    new URL(heroImage.image.url)
  } catch {
    throw new Error(`Invalid hero image URL: ${heroImage.image.url}`)
  }

  // Ensure ID is always a string
  const heroImageId = heroImage.imageId || `hero-${Date.now()}`

  return {
    hero_image: {
      id: String(heroImageId),
      url: heroImage.image.url,
      ...(heroImage.image.prompt && { prompt: heroImage.image.prompt }),
      ...(heroImage.image.seed !== undefined && { seed: heroImage.image.seed }),
      ...(heroImage.image.aspectRatio && { aspectRatio: heroImage.image.aspectRatio }),
      ...(heroImage.image.style && { style: heroImage.image.style }),
      ...(finalPalette && { extractedPalette: finalPalette }),
      ...(finalVibe && { vibe: finalVibe }),
    },
    palette: finalPalette,
    vibe: finalVibe,
    pattern_family: pattern.family as PatternFamily,
    pattern_variant: (pattern.variant as PatternVariant) || 1,
    components,
    ...(context.patternFamily || plan.name ? {
      metadata: {
        ...(context.patternFamily && { generatedFrom: context.patternFamily }),
        ...(plan.name && { planName: plan.name }),
      },
    } : {}),
  }
}

