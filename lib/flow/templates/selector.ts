import { Intent } from '../../ai/intent/intent.schema'
import { FlowTemplate, FlowTemplateScreen } from './schema'
import { listTemplates } from './loader'

export interface ScreenGenerationPlan {
  order: number
  templateId: string
  screenId: string
  name: string
  pattern: FlowTemplateScreen['pattern']
  textPlan: {
    tone: Intent['tone']
    styleCues: Intent['styleCues']
    colorMood: Intent['colorMood']
    contentFocus?: string
    customFields?: Record<string, string>
  }
  heroPlan: {
    vibe: string
    colorMood: Intent['colorMood']
    imagePrompt: string
    aspectRatio: string
  }
}

type ScreenOverrideConfig = {
  patternVariant?: FlowTemplateScreen['pattern']['variant']
  intentHints?: FlowTemplateScreen['intentHints']
  heroDefaults?: FlowTemplateScreen['heroDefaults']
}

export interface TemplateCustomizationOptions {
  screenOrder?: string[]
  screenOverrides?: Record<string, ScreenOverrideConfig>
  fieldValues?: Record<string, string>
}

const DOMAIN_FALLBACKS: Record<Intent['domain'], FlowTemplate['domain'][]> = {
  ecommerce: ['ecommerce', 'marketing'],
  saas: ['saas', 'finance', 'healthcare'],
  mobile_app: ['mobile_app', 'saas'],
  marketing: ['ecommerce', 'saas'],
  finance: ['saas', 'ecommerce'],
  healthcare: ['saas', 'mobile_app'],
}

const dedupeStyleCues = (cues: Intent['styleCues']): Intent['styleCues'] => {
  const unique = Array.from(new Set(cues))
  return unique.slice(0, 3) as Intent['styleCues']
}

const scoreTemplate = (template: FlowTemplate, intent: Intent): number => {
  let score = 0

  if (template.domain === intent.domain) {
    score += 10
  } else if (DOMAIN_FALLBACKS[intent.domain]?.includes(template.domain)) {
    score += 5
  }

  const templateStyleCues = new Set(
    template.screens.flatMap((screen) => screen.intentHints?.styleCues ?? [])
  )
  const styleMatches = intent.styleCues.filter((cue) => templateStyleCues.has(cue)).length
  score += styleMatches * 2

  const templateTones = new Set(template.screens.map((screen) => screen.intentHints?.tone).filter(Boolean))
  if (templateTones.has(intent.tone)) {
    score += 1
  }

  const templateColorMoods = new Set(
    template.screens.map((screen) => screen.intentHints?.colorMood).filter(Boolean)
  )
  if (templateColorMoods.has(intent.colorMood)) {
    score += 1
  }

  return score
}

export const selectTemplateForIntent = (intent: Intent, templates = listTemplates()): FlowTemplate => {
  if (!templates.length) {
    throw new Error('No flow templates are registered')
  }

  const ranked = templates
    .map((template) => ({ template, score: scoreTemplate(template, intent) }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.template ?? templates[0]
}

const resolveTone = (screen: FlowTemplateScreen, intent: Intent): Intent['tone'] =>
  screen.intentHints?.tone ?? intent.tone

const resolveColorMood = (screen: FlowTemplateScreen, intent: Intent): Intent['colorMood'] =>
  screen.intentHints?.colorMood ?? intent.colorMood

const resolveStyleCues = (screen: FlowTemplateScreen, intent: Intent): Intent['styleCues'] => {
  const combined = [...intent.styleCues, ...(screen.intentHints?.styleCues ?? [])]
  return dedupeStyleCues(combined)
}

const resolveHeroPrompt = (screen: FlowTemplateScreen, intent: Intent): string =>
  screen.heroDefaults?.imagePrompt ?? intent.normalizedPrompt

const resolveHeroAspectRatio = (screen: FlowTemplateScreen): string => screen.heroDefaults?.aspectRatio ?? '16:9'

const orderScreens = (screens: FlowTemplateScreen[], preferredOrder?: string[]): FlowTemplateScreen[] => {
  if (!preferredOrder?.length) {
    return screens
  }

  const orderMap = new Map(preferredOrder.map((id, index) => [id, index]))
  const defaultWeightStart = preferredOrder.length

  return [...screens]
    .map((screen, index) => ({
      screen,
      weight: orderMap.has(screen.id) ? (orderMap.get(screen.id) as number) : defaultWeightStart + index,
    }))
    .sort((a, b) => a.weight - b.weight)
    .map((entry) => entry.screen)
}

const mergeIntentHints = (
  base: FlowTemplateScreen['intentHints'],
  override?: FlowTemplateScreen['intentHints']
): FlowTemplateScreen['intentHints'] => (override ? { ...(base ?? {}), ...override } : base)

const mergeHeroDefaults = (
  base: FlowTemplateScreen['heroDefaults'],
  override?: FlowTemplateScreen['heroDefaults']
): FlowTemplateScreen['heroDefaults'] => (override ? { ...(base ?? {}), ...override } : base)

const applyScreenOverrides = (
  screen: FlowTemplateScreen,
  override?: ScreenOverrideConfig
): FlowTemplateScreen => {
  if (!override) return screen
  return {
    ...screen,
    pattern: {
      ...screen.pattern,
      variant: override.patternVariant ?? screen.pattern.variant,
    },
    intentHints: mergeIntentHints(screen.intentHints, override.intentHints ?? undefined),
    heroDefaults: mergeHeroDefaults(screen.heroDefaults, override.heroDefaults ?? undefined),
  }
}

const getScreenOverride = (
  template: FlowTemplate,
  options: TemplateCustomizationOptions,
  screenId: string
): ScreenOverrideConfig | undefined =>
  options.screenOverrides?.[screenId] ?? template.customization?.screenOverrides?.[screenId]

const resolveTemplateFieldValues = (
  template: FlowTemplate,
  overrides?: Record<string, string>
): Record<string, string> | undefined => {
  const definitions = template.customization?.fields ?? []
  if (!definitions.length && !overrides) {
    return undefined
  }

  const resolved: Record<string, string> = {}
  definitions.forEach((field) => {
    const value = overrides?.[field.id] ?? field.defaultValue
    if (value) {
      resolved[field.id] = value
    }
  })

  if (overrides) {
    Object.entries(overrides).forEach(([key, value]) => {
      if (value) {
        resolved[key] = value
      }
    })
  }

  return Object.keys(resolved).length ? resolved : undefined
}

export const mapTemplateToScreenSequence = (
  template: FlowTemplate,
  intent: Intent,
  customizationOptions: TemplateCustomizationOptions = {}
): ScreenGenerationPlan[] => {
  const orderedScreens = orderScreens(
    template.screens,
    customizationOptions.screenOrder ?? template.customization?.screenOrder
  )
  const resolvedFieldValues = resolveTemplateFieldValues(template, customizationOptions.fieldValues)

  return orderedScreens.map((screen, index) => {
    const override = getScreenOverride(template, customizationOptions, screen.id)
    const resolvedScreen = applyScreenOverrides(screen, override)
    const tone = resolveTone(resolvedScreen, intent)
    const colorMood = resolveColorMood(resolvedScreen, intent)
    const styleCues = resolveStyleCues(resolvedScreen, intent)

    return {
      order: index,
      templateId: template.id,
      screenId: resolvedScreen.id,
      name: resolvedScreen.name,
      pattern: resolvedScreen.pattern,
      textPlan: {
        tone,
        styleCues,
        colorMood,
        contentFocus: resolvedScreen.intentHints?.contentFocus,
        customFields: resolvedFieldValues,
      },
      heroPlan: {
        vibe: resolvedScreen.heroDefaults?.vibe ?? `${resolvedScreen.name} hero image`,
        colorMood: resolvedScreen.heroDefaults?.colorMood ?? colorMood,
        imagePrompt: resolveHeroPrompt(resolvedScreen, intent),
        aspectRatio: resolveHeroAspectRatio(resolvedScreen),
      },
    }
  })
}
