import { Intent } from '../../ai/intent/intent.schema'
import { FlowTemplate, FlowTemplateScreen } from './schema'
import { ASPECT_RATIOS, AspectRatio } from '../../images/generation/types'
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
    aspectRatio: AspectRatio
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

const dedupeStyleCues = (cues: readonly string[]): Intent['styleCues'] => {
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
  const timestamp = Date.now()
  console.log(`[DEBUG:TemplateSelection:${timestamp}] Starting template selection:`, {
    intentDomain: intent.domain,
    intentTone: intent.tone,
    intentStyleCues: intent.styleCues,
    intentColorMood: intent.colorMood,
    availableTemplatesCount: templates.length,
  })

  if (!templates.length) {
    console.error(`[DEBUG:TemplateSelection:${timestamp}] No templates available!`)
    throw new Error('No flow templates are registered')
  }

  console.log(`[DEBUG:TemplateSelection:${timestamp}] Available templates:`, templates.map(t => ({
    id: t.id,
    domain: t.domain,
    name: t.name,
    screenCount: t.screens.length,
  })))

  const ranked = templates
    .map((template) => {
      const score = scoreTemplate(template, intent)
      console.log(`[DEBUG:TemplateSelection:${timestamp}] Template scored:`, {
        templateId: template.id,
        templateDomain: template.domain,
        score,
        intentDomain: intent.domain,
        domainMatch: template.domain === intent.domain,
      })
      return { template, score }
    })
    .sort((a, b) => b.score - a.score)

  console.log(`[DEBUG:TemplateSelection:${timestamp}] Template rankings:`, ranked.map((r, i) => ({
    rank: i + 1,
    templateId: r.template.id,
    templateDomain: r.template.domain,
    score: r.score,
  })))

  const selected = ranked[0]?.template ?? templates[0]
  console.log(`[DEBUG:TemplateSelection:${timestamp}] Selected template:`, {
    templateId: selected.id,
    templateDomain: selected.domain,
    templateName: selected.name,
    selectedScore: ranked[0]?.score,
    wasFallback: !ranked[0],
  })

  return selected
}

const resolveTone = (screen: FlowTemplateScreen, intent: Intent): Intent['tone'] =>
  (screen.intentHints?.tone ?? intent.tone) as Intent['tone']

const resolveColorMood = (screen: FlowTemplateScreen, intent: Intent): Intent['colorMood'] =>
  (screen.intentHints?.colorMood ?? intent.colorMood) as Intent['colorMood']

const resolveStyleCues = (screen: FlowTemplateScreen, intent: Intent): Intent['styleCues'] => {
  const combined = [...intent.styleCues, ...(screen.intentHints?.styleCues ?? [])]
  return dedupeStyleCues(combined) as Intent['styleCues']
}

const resolveHeroPrompt = (screen: FlowTemplateScreen, intent: Intent): string =>
  screen.heroDefaults?.imagePrompt ?? intent.normalizedPrompt

const resolveHeroAspectRatio = (screen: FlowTemplateScreen): AspectRatio => {
  const candidate = screen.heroDefaults?.aspectRatio
  if (candidate && (ASPECT_RATIOS as readonly string[]).includes(candidate)) {
    return candidate as AspectRatio
  }
  return '16:9'
}

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
  const timestamp = Date.now()
  console.log(`[DEBUG:TemplateSelection:${timestamp}] Mapping template to screen sequence:`, {
    templateId: template.id,
    templateScreenCount: template.screens.length,
    customizationOptions: Object.keys(customizationOptions),
  })

  const orderedScreens = orderScreens(
    template.screens,
    customizationOptions.screenOrder ?? template.customization?.screenOrder
  )
  const resolvedFieldValues = resolveTemplateFieldValues(template, customizationOptions.fieldValues)

  const plans = orderedScreens.map((screen, index) => {
    const override = getScreenOverride(template, customizationOptions, screen.id)
    const resolvedScreen = applyScreenOverrides(screen, override)
    const tone = resolveTone(resolvedScreen, intent)
    const colorMood = resolveColorMood(resolvedScreen, intent)
    const styleCues = resolveStyleCues(resolvedScreen, intent)

    const plan = {
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
        colorMood: (resolvedScreen.heroDefaults?.colorMood ?? colorMood) as Intent['colorMood'],
        imagePrompt: resolveHeroPrompt(resolvedScreen, intent),
        aspectRatio: resolveHeroAspectRatio(resolvedScreen),
      },
    }

    console.log(`[DEBUG:TemplateSelection:${timestamp}] Generated plan for screen ${index}:`, {
      screenId: plan.screenId,
      name: plan.name,
      patternFamily: plan.pattern.family,
      patternVariant: plan.pattern.variant,
      tone: plan.textPlan.tone,
      colorMood: plan.textPlan.colorMood,
      imagePrompt: plan.heroPlan.imagePrompt?.substring(0, 50),
      hasOverride: !!override,
    })

    return plan
  })

  console.log(`[DEBUG:TemplateSelection:${timestamp}] Screen sequence complete:`, {
    totalPlans: plans.length,
    patternFamilies: plans.map(p => p.pattern.family),
    patternVariants: plans.map(p => p.pattern.variant),
  })

  return plans
}
