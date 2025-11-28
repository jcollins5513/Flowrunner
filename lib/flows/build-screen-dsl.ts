// Build ScreenDSL from generation plan
// This is a pure function that doesn't import server-only modules

import type { ScreenDSL, Component, PatternFamily, PatternVariant, Palette, Vibe } from '../dsl/types'
import type { ScreenContext } from './types'
import type { ScreenGenerationPlan } from '../flow/templates/selector'
import type { HeroImageWithPalette } from '../dsl/types'
import type { PatternDefinition } from '../patterns/schema'
import { loadPattern } from '../patterns/loader'
import { deterministicId } from '../utils/deterministic'

// Supported component types - defined locally to avoid importing server-only modules
const SUPPORTED_COMPONENT_TYPES: Component['type'][] = ['title', 'subtitle', 'button', 'form', 'text', 'image']

const CTA_TONE_PRESETS: Record<string, string[]> = {
  friendly: ['Get started free', 'Invite your team'],
  professional: ['Schedule a demo', 'Book a walkthrough'],
  bold: ['Launch now', 'Unlock access'],
  modern: ['Start exploring', 'Pair with product tour'],
  playful: ['Jump into the flow', "Let's go"],
  minimal: ['Begin', 'Continue'],
}

const CTA_PATTERN_FALLBACKS: Partial<Record<PatternFamily, string[]>> = {
  ONB_HERO_TOP: ['Start your journey', 'Begin onboarding'],
  ACT_FORM_MINIMAL: ['Request access', 'Submit'],
  PRICING_TABLE: ['Choose a plan'],
  CTA_SPLIT_SCREEN: ['Talk to sales'],
}

const DEFAULT_FORM_FIELDS = [
  { id: 'full_name', label: 'Full name', placeholder: 'Alex Product', type: 'text', required: true },
  { id: 'work_email', label: 'Work email', placeholder: 'alex@company.com', type: 'email', required: true },
  { id: 'company', label: 'Company', placeholder: 'Product Labs', type: 'text', required: false },
  { id: 'goal', label: 'Primary goal', placeholder: 'e.g. onboard trial users', type: 'text', required: false },
]

const humanize = (value?: string) => {
  if (!value) return ''
  return value
    .split(/[\s_]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

const describeAudience = (context: ScreenContext) => {
  if (context.flowMetadata?.domain) {
    return `${humanize(context.flowMetadata.domain)} teams`
  }
  return 'your audience'
}

const orderedSlots = (patternDefinition: PatternDefinition): Component['type'][] => {
  return Object.entries(patternDefinition.layout.positions)
    .filter(([slot]) => slot !== 'hero_image')
    .sort(([, a], [, b]) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .map(([slot]) => {
      if (!SUPPORTED_COMPONENT_TYPES.includes(slot as Component['type'])) {
        throw new Error(`Unsupported component slot ${slot}`)
      }
      return slot as Component['type']
    })
}

const ensureRequiredSlots = (patternDefinition: PatternDefinition) => {
  const layoutSlots = new Set(Object.keys(patternDefinition.layout.positions))
  patternDefinition.componentSlots.required.forEach((slot) => {
    if (!layoutSlots.has(slot)) {
      throw new Error(`Required slot ${slot} missing from pattern layout`)
    }
    if (!SUPPORTED_COMPONENT_TYPES.includes(slot as Component['type'])) {
      throw new Error(`Required slot ${slot} is not supported by renderer components`)
    }
  })
}

const selectCtaLabel = (
  tone: string,
  pattern: PatternDefinition,
  customLabel?: string
): string => {
  if (customLabel?.trim()) {
    return customLabel.trim()
  }
  const toneOptions = CTA_TONE_PRESETS[tone.toLowerCase()]
  if (toneOptions?.length) {
    return toneOptions[0]
  }
  const patternOptions = CTA_PATTERN_FALLBACKS[pattern.family as PatternFamily]
  if (patternOptions?.length) {
    return patternOptions[0]
  }
  return 'Continue'
}

const buildComponentsForPattern = (
  patternDefinition: PatternDefinition,
  plan: ScreenGenerationPlan,
  context: ScreenContext,
  heroImage: HeroImageWithPalette
): Component[] => {
  ensureRequiredSlots(patternDefinition)

  const components: Component[] = []
  const slots = orderedSlots(patternDefinition)
  const focus = plan.textPlan.contentFocus ?? plan.name
  const cuesText = plan.textPlan.styleCues.map(humanize).filter(Boolean).join(' • ')
  const audience = describeAudience(context)

  slots.forEach((slot) => {
    switch (slot) {
      case 'title': {
        if (!focus) {
          if (patternDefinition.componentSlots.required.includes(slot)) {
            throw new Error('Missing content for required title slot')
          }
          return
        }
        components.push({
          type: 'title',
          content: focus,
        })
        break
      }
      case 'subtitle': {
        if (!cuesText) {
          if (patternDefinition.componentSlots.required.includes(slot)) {
            throw new Error('Missing content for required subtitle slot')
          }
          return
        }
        const subtitle = `${humanize(plan.textPlan.tone)} • ${cuesText}`
        components.push({
          type: 'subtitle',
          content: subtitle,
        })
        break
      }
      case 'text': {
        const description = focus
          ? `${focus}. Designed for ${audience} seeking a ${humanize(plan.textPlan.tone).toLowerCase()} experience.`
          : undefined
        if (!description) {
          if (patternDefinition.componentSlots.required.includes(slot)) {
            throw new Error('Missing content for required text slot')
          }
          return
        }
        components.push({
          type: 'text',
          content: description,
        })
        break
      }
      case 'button': {
        const label = selectCtaLabel(plan.textPlan.tone, patternDefinition, plan.textPlan.customFields?.hero_cta_label)
        components.push({
          type: 'button',
          content: label,
          props: { variant: 'primary', size: 'lg' },
        })
        break
      }
      case 'form': {
        const formTitle = plan.textPlan.customFields?.form_title ?? focus
        if (!formTitle) {
          if (patternDefinition.componentSlots.required.includes(slot)) {
            throw new Error('Missing content for required form slot')
          }
          return
        }
        const submitLabel = selectCtaLabel(
          plan.textPlan.tone,
          patternDefinition,
          plan.textPlan.customFields?.form_submit_label
        )
        components.push({
          type: 'form',
          content: formTitle,
          props: {
            description:
              plan.textPlan.customFields?.form_description ??
              `Share a few details so we can tailor the experience for ${audience}.`,
            fields: DEFAULT_FORM_FIELDS,
            submitLabel,
          },
        })
        break
      }
      case 'image': {
        if (!heroImage.image?.url && patternDefinition.componentSlots.required.includes(slot)) {
          throw new Error('Hero image URL required for image slot')
        }
        components.push({
          type: 'image',
          content: plan.heroPlan.imagePrompt,
          props: {
            url: heroImage.image.url,
            id: heroImage.imageId ?? deterministicId('image', `${plan.screenId}-${plan.heroPlan.imagePrompt}`),
          },
        })
        break
      }
      default:
        break
    }
  })

  const requiredSlots = patternDefinition.componentSlots.required.filter((slot) =>
    SUPPORTED_COMPONENT_TYPES.includes(slot as Component['type'])
  )
  requiredSlots.forEach((slot) => {
    if (!components.some((component) => component.type === slot)) {
      throw new Error(`Missing components for required slots: ${slot}`)
    }
  })

  return components
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

  const patternDefinition = loadPattern(pattern.family as PatternFamily, (pattern.variant as PatternVariant) || 1)

  // Use generated palette if available, otherwise use context palette
  const paletteFromImage = heroImage.palette
  const finalPalette: Palette = {
    primary: (paletteFromImage?.primary ?? palette.primary) || '#3B82F6',
    secondary: (paletteFromImage?.secondary ?? palette.secondary) || '#8B5CF6',
    accent: (paletteFromImage?.accent ?? palette.accent) || '#F59E0B',
    background: (paletteFromImage?.background ?? palette.background) || '#FFFFFF',
  }

  const validVibes: Vibe[] = ['playful', 'professional', 'bold', 'minimal', 'modern', 'retro', 'elegant', 'energetic', 'calm', 'tech', 'creative', 'corporate']
  const finalVibe: Vibe = (heroImage.vibe && validVibes.includes(heroImage.vibe as Vibe))
    ? (heroImage.vibe as Vibe)
    : (vibe && validVibes.includes(vibe))
      ? vibe
      : 'modern'

  const components = buildComponentsForPattern(patternDefinition, plan, context, heroImage)

  if (!heroImage.image?.url) {
    throw new Error('Hero image URL is required')
  }

  try {
    new URL(heroImage.image.url)
  } catch {
    throw new Error(`Invalid hero image URL: ${heroImage.image.url}`)
  }

  const heroImageId = heroImage.imageId || deterministicId('hero', `${plan.screenId}-${heroImage.image.url}-${pattern.family}-${pattern.variant}`)

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
  }
}

