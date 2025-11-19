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
  }
  heroPlan: {
    vibe: string
    colorMood: Intent['colorMood']
    imagePrompt: string
    aspectRatio: string
  }
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

export const mapTemplateToScreenSequence = (
  template: FlowTemplate,
  intent: Intent
): ScreenGenerationPlan[] =>
  template.screens.map((screen, index) => {
    const tone = resolveTone(screen, intent)
    const colorMood = resolveColorMood(screen, intent)
    const styleCues = resolveStyleCues(screen, intent)

    return {
      order: index,
      templateId: template.id,
      screenId: screen.id,
      name: screen.name,
      pattern: screen.pattern,
      textPlan: {
        tone,
        styleCues,
        colorMood,
        contentFocus: screen.intentHints?.contentFocus,
      },
      heroPlan: {
        vibe: screen.heroDefaults?.vibe ?? `${screen.name} hero image`,
        colorMood: screen.heroDefaults?.colorMood ?? colorMood,
        imagePrompt: resolveHeroPrompt(screen, intent),
        aspectRatio: resolveHeroAspectRatio(screen),
      },
    }
  })
