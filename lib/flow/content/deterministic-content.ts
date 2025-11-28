import { Intent } from '@/lib/ai/intent/intent.schema'
import { Component } from '@/lib/dsl/types'
import { PatternFamily } from '@/lib/patterns/families'
import { PatternDefinition } from '@/lib/patterns/schema'
import { ScreenGenerationPlan } from '@/lib/flow/templates/selector'
import { deterministicId } from '@/lib/utils/deterministic'
import { SUPPORTED_COMPONENT_TYPES } from '@/lib/renderer/component-factory'

const TONE_CTA_PRESETS: Record<Intent['tone'], string[]> = {
  professional: ['Request a demo', 'View pricing', 'Talk to sales'],
  friendly: ['Get started', 'See how it works', 'Join the community'],
  bold: ['Start now', 'Claim my spot', 'Experience it'],
  calm: ['Explore the product', 'Learn more', 'View details'],
  energetic: ['Launch now', 'Fuel my workflow', 'Try it today'],
}

const PATTERN_CTA_FALLBACKS: Partial<Record<PatternFamily, string[]>> = {
  CTA_SPLIT_SCREEN: ['Take action', 'See the offer'],
  ACT_FORM_MINIMAL: ['Submit request', 'Join the waitlist'],
  ONB_HERO_TOP: ['Begin onboarding', 'Start the tour'],
}

const DEFAULT_CTA = 'Get started'

export interface ComponentBuildContext {
  intent: Intent
  plan: ScreenGenerationPlan
  pattern: PatternDefinition
  prompt: string
}

const orderedSlots = (pattern: PatternDefinition): string[] =>
  Object.entries(pattern.layout.positions)
    .filter(([slot]) => slot !== 'hero_image')
    .sort(([, a], [, b]) => (a.y === b.y ? a.x - b.x : a.y - b.y))
    .map(([slot]) => slot)

const selectCTA = (tone: Intent['tone'], pattern: PatternDefinition): string => {
  const toneOptions = TONE_CTA_PRESETS[tone] ?? []
  const patternOptions = PATTERN_CTA_FALLBACKS[pattern.family as PatternFamily] ?? []
  return [...toneOptions, ...patternOptions, DEFAULT_CTA][0] ?? DEFAULT_CTA
}

const ensureRequiredSlots = (pattern: PatternDefinition): void => {
  const layoutSlots = new Set(Object.keys(pattern.layout.positions))
  pattern.componentSlots.required.forEach((slot) => {
    if (!layoutSlots.has(slot)) {
      throw new Error(`Required slot ${slot} is missing from pattern layout positions`)
    }
  })
}

const buildTitle = ({ plan, intent }: ComponentBuildContext): string | undefined => {
  if (plan.textPlan.contentFocus) {
    return `${plan.name}: ${plan.textPlan.contentFocus}`
  }
  const toneLabel = intent.tone.charAt(0).toUpperCase() + intent.tone.slice(1)
  return `${plan.name} • ${toneLabel} ${intent.domain}`
}

const buildSubtitle = ({ plan, intent }: ComponentBuildContext): string | undefined => {
  const styleCue = plan.textPlan.styleCues[0] ?? intent.styleCues[0]
  if (!styleCue) return undefined
  const mood = plan.textPlan.colorMood ?? intent.colorMood
  return `${styleCue} style • ${mood} palette`
}

const buildBody = ({ intent }: ComponentBuildContext): string | undefined => {
  const normalized = intent.normalizedPrompt.trim()
  if (!normalized) return undefined
  return `${normalized} — tailored for ${intent.domain} audiences.`
}

const buildForm = ({ plan, intent }: ComponentBuildContext): { content: string; props: Component['props'] } | undefined => {
  const focus = plan.textPlan.contentFocus ?? plan.name
  const label = `${focus} updates`
  const fields = [
    { name: 'email', label: 'Work email', type: 'email' },
    { name: 'name', label: 'Full name', type: 'text' },
  ]

  return {
    content: `${intent.tone === 'professional' ? 'Request' : 'Get'} ${label.toLowerCase()}`,
    props: { fields },
  }
}

const slotToComponent = (slot: string): Component['type'] => {
  if (!SUPPORTED_COMPONENT_TYPES.includes(slot as Component['type'])) {
    throw new Error(`Unsupported component slot ${slot}`)
  }
  return slot as Component['type']
}

export const buildComponentsFromContext = (context: ComponentBuildContext): Component[] => {
  ensureRequiredSlots(context.pattern)

  const slots = orderedSlots(context.pattern)
  const components: Component[] = []
  const { required } = context.pattern.componentSlots

  slots.forEach((slot) => {
    let component: Component | null = null
    switch (slot) {
      case 'title': {
        const title = buildTitle(context)
        if (title) {
          component = { type: slotToComponent(slot), content: title }
        }
        break
      }
      case 'subtitle': {
        const subtitle = buildSubtitle(context)
        if (subtitle) {
          component = { type: slotToComponent(slot), content: subtitle }
        }
        break
      }
      case 'text': {
        const text = buildBody(context)
        if (text) {
          component = { type: slotToComponent(slot), content: text }
        }
        break
      }
      case 'button': {
        const label = selectCTA(context.intent.tone, context.pattern)
        component = { type: slotToComponent(slot), content: label }
        break
      }
      case 'form': {
        const form = buildForm(context)
        if (form) {
          component = { type: slotToComponent(slot), content: form.content, props: form.props }
        }
        break
      }
      case 'image': {
        component = {
          type: slotToComponent(slot),
          content: context.plan.heroPlan.imagePrompt,
          props: { reference: deterministicId('image', `${context.prompt}-${context.plan.screenId}`) },
        }
        break
      }
      default:
        break
    }

    if (component) {
      components.push(component)
    } else if (required.includes(slot)) {
      throw new Error(`Missing required component content for slot ${slot}`)
    }
  })

  return components
}
