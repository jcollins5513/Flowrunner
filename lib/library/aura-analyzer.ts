/**
 * Aura Template Analyzer
 * 
 * Analyzes aura library templates to extract layout patterns and inform
 * pattern family/variant selection for FlowRunner screens.
 */

import type { PatternFamily } from '../patterns/families'
import type { PatternDefinition } from '../patterns/schema'

export interface AuraTemplateMetadata {
  name: string
  slug: string
  description: string
  tags: string[]
  category: string
  layout_role: string
  recommended_slots: string[]
  domain_tags: string[]
  source: string
}

export interface AuraLayoutAnalysis {
  structure: 'grid' | 'flex' | 'mixed'
  hasHero: boolean
  heroPosition: 'top' | 'center' | 'left' | 'right' | 'full-bleed' | null
  hasNavigation: boolean
  hasForm: boolean
  hasCards: boolean
  hasGrid: boolean
  sections: number
  suggestedPatternFamily: PatternFamily | null
  confidence: number // 0-1
}

/**
 * Analyze an aura template's HTML to extract layout patterns
 */
export function analyzeAuraTemplate(
  html: string,
  metadata: AuraTemplateMetadata
): AuraLayoutAnalysis {
  const analysis: AuraLayoutAnalysis = {
    structure: 'flex',
    hasHero: false,
    heroPosition: null,
    hasNavigation: false,
    hasForm: false,
    hasCards: false,
    hasGrid: false,
    sections: 0,
    suggestedPatternFamily: null,
    confidence: 0,
  }

  // Detect hero section
  const heroIndicators = [
    /hero/i,
    /class="[^"]*hero[^"]*"/i,
    /id="[^"]*hero[^"]*"/i,
  ]
  analysis.hasHero = heroIndicators.some((pattern) => pattern.test(html))

  // Detect hero position
  if (analysis.hasHero) {
    if (/hero.*top|top.*hero/i.test(html)) {
      analysis.heroPosition = 'top'
    } else if (/hero.*center|center.*hero/i.test(html)) {
      analysis.heroPosition = 'center'
    } else if (/hero.*left|left.*hero/i.test(html)) {
      analysis.heroPosition = 'left'
    } else if (/hero.*right|right.*hero/i.test(html)) {
      analysis.heroPosition = 'right'
    } else if (/full.*bleed|fullbleed/i.test(html)) {
      analysis.heroPosition = 'full-bleed'
    }
  }

  // Detect layout structure
  if (/grid|grid-cols|grid-template/i.test(html)) {
    analysis.structure = 'grid'
    analysis.hasGrid = true
  } else if (/flex|flex-row|flex-col/i.test(html)) {
    analysis.structure = 'flex'
  } else {
    analysis.structure = 'mixed'
  }

  // Detect components
  analysis.hasNavigation = /nav|navbar|menu/i.test(html)
  analysis.hasForm = /form|input|button.*submit/i.test(html)
  analysis.hasCards = /card|card-|shadow.*rounded/i.test(html)

  // Count sections
  const sectionMatches = html.match(/<section|class="[^"]*section[^"]*"/gi)
  analysis.sections = sectionMatches ? sectionMatches.length : 0

  // Suggest pattern family based on analysis
  const suggestion = suggestPatternFamily(analysis, metadata)
  analysis.suggestedPatternFamily = suggestion.family
  analysis.confidence = suggestion.confidence

  return analysis
}

/**
 * Suggest a pattern family based on layout analysis
 */
function suggestPatternFamily(
  analysis: AuraLayoutAnalysis,
  metadata: AuraTemplateMetadata
): { family: PatternFamily | null; confidence: number } {
  // High confidence matches
  if (analysis.hasHero && analysis.heroPosition === 'top') {
    return { family: 'ONB_HERO_TOP', confidence: 0.9 }
  }

  if (analysis.hasHero && analysis.heroPosition === 'center') {
    return { family: 'HERO_CENTER_TEXT', confidence: 0.85 }
  }

  if (analysis.hasForm && !analysis.hasHero) {
    return { family: 'ACT_FORM_MINIMAL', confidence: 0.8 }
  }

  if (analysis.hasCards && analysis.hasGrid) {
    if (metadata.tags.includes('Pricing') || metadata.tags.includes('pricing')) {
      return { family: 'PRICING_TABLE', confidence: 0.85 }
    }
    if (
      metadata.tags.includes('Testimonial') ||
      metadata.tags.includes('testimonial')
    ) {
      return { family: 'TESTIMONIAL_CARD_GRID', confidence: 0.85 }
    }
  }

  // Medium confidence matches based on metadata
  if (metadata.tags.includes('Landing Page')) {
    if (analysis.hasHero && analysis.heroPosition === 'left') {
      return { family: 'FEAT_IMAGE_TEXT_LEFT', confidence: 0.7 }
    }
    if (analysis.hasHero && analysis.heroPosition === 'right') {
      return { family: 'FEAT_IMAGE_TEXT_RIGHT', confidence: 0.7 }
    }
  }

  if (metadata.tags.includes('Dashboard')) {
    return { family: 'DASHBOARD_OVERVIEW', confidence: 0.75 }
  }

  if (metadata.tags.includes('Product') || metadata.tags.includes('Detail')) {
    return { family: 'PRODUCT_DETAIL', confidence: 0.7 }
  }

  // Default fallback
  if (analysis.hasHero) {
    return { family: 'HERO_CENTER_TEXT', confidence: 0.5 }
  }

  return { family: null, confidence: 0 }
}

/**
 * Map aura template to pattern family based on metadata and tags
 */
export function mapAuraToPatternFamily(
  metadata: AuraTemplateMetadata
): PatternFamily | null {
  const tags = metadata.tags.map((t) => t.toLowerCase())
  const description = metadata.description.toLowerCase()

  // Direct tag matches
  if (tags.includes('onboarding') || tags.includes('hero')) {
    return 'ONB_HERO_TOP'
  }

  if (tags.includes('pricing')) {
    return 'PRICING_TABLE'
  }

  if (tags.includes('testimonial')) {
    return 'TESTIMONIAL_CARD_GRID'
  }

  if (tags.includes('dashboard')) {
    return 'DASHBOARD_OVERVIEW'
  }

  if (tags.includes('product') || tags.includes('detail')) {
    return 'PRODUCT_DETAIL'
  }

  if (tags.includes('form') || tags.includes('signup') || tags.includes('sign-up')) {
    return 'ACT_FORM_MINIMAL'
  }

  if (tags.includes('newsletter')) {
    return 'NEWSLETTER_SIGNUP'
  }

  if (tags.includes('cta') || tags.includes('call-to-action')) {
    return 'CTA_SPLIT_SCREEN'
  }

  // Description-based matching
  if (description.includes('hero') && description.includes('center')) {
    return 'HERO_CENTER_TEXT'
  }

  if (description.includes('feature') && description.includes('left')) {
    return 'FEAT_IMAGE_TEXT_LEFT'
  }

  if (description.includes('feature') && description.includes('right')) {
    return 'FEAT_IMAGE_TEXT_RIGHT'
  }

  return null
}

/**
 * Get suggested pattern variant based on aura template characteristics
 */
export function suggestPatternVariant(
  analysis: AuraLayoutAnalysis,
  metadata: AuraTemplateMetadata
): 1 | 2 | 3 | 4 | 5 {
  // Use complexity and section count to suggest variant
  const complexity =
    (analysis.sections > 0 ? 1 : 0) +
    (analysis.hasCards ? 1 : 0) +
    (analysis.hasForm ? 1 : 0) +
    (analysis.hasGrid ? 1 : 0)

  // Map complexity to variant (1 = simple, 5 = complex)
  if (complexity <= 1) return 1
  if (complexity === 2) return 2
  if (complexity === 3) return 3
  if (complexity === 4) return 4
  return 5
}

/**
 * Load and analyze an aura template
 */
export async function loadAndAnalyzeAuraTemplate(
  templatePath: string
): Promise<{
  metadata: AuraTemplateMetadata
  analysis: AuraLayoutAnalysis
  suggestedPattern: {
    family: PatternFamily | null
    variant: 1 | 2 | 3 | 4 | 5
    confidence: number
  }
}> {
  // This would load the actual files - for now, return structure
  // In practice, you'd use fs.readFile or similar
  throw new Error('Not implemented - use with actual file loading')
}

