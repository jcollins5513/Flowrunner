/**
 * Aura Pattern Guide
 * 
 * Uses aura templates to guide pattern selection and enhance screen generation.
 * This integrates aura template analysis into the FlowRunner pattern selection process.
 */

import type { PatternFamily } from '../patterns/families'
import type { PatternVariant } from '../patterns/schema'
import { matchAuraToPattern, findBestAuraTemplateForPattern } from './aura-pattern-matcher'
import { loadAllAuraTemplates, type AuraTemplate } from './aura-loader'

let auraTemplatesCache: AuraTemplate[] | null = null

/**
 * Get cached or load aura templates
 */
async function getAuraTemplates(includeHTML = false): Promise<AuraTemplate[]> {
  if (!auraTemplatesCache || includeHTML) {
    auraTemplatesCache = await loadAllAuraTemplates(includeHTML)
  }
  return auraTemplatesCache
}

/**
 * Suggest pattern based on aura template analysis
 * 
 * This can be used to enhance pattern selection when generating screens.
 */
export async function suggestPatternFromAura(
  intent: {
    domain?: string
    description?: string
    tags?: string[]
  }
): Promise<{
  patternFamily: PatternFamily | null
  patternVariant: PatternVariant
  confidence: number
  suggestedTemplate?: string
}> {
  const templates = await getAuraTemplates(false)

  // Find templates that match the intent
  const matchingTemplates = templates.filter((template) => {
    const metadata = template.metadata

    // Match by domain tags
    if (intent.domain && metadata.domain_tags.includes(intent.domain)) {
      return true
    }

    // Match by description keywords
    if (intent.description) {
      const descLower = intent.description.toLowerCase()
      const templateDescLower = metadata.description.toLowerCase()
      if (templateDescLower.includes(descLower) || descLower.includes(templateDescLower)) {
        return true
      }
    }

    // Match by tags
    if (intent.tags && intent.tags.length > 0) {
      const templateTags = metadata.tags.map((t) => t.toLowerCase())
      const intentTags = intent.tags.map((t) => t.toLowerCase())
      if (intentTags.some((tag) => templateTags.includes(tag))) {
        return true
      }
    }

    return false
  })

  // If we found matches, analyze them
  if (matchingTemplates.length > 0) {
    // Try to match the first template to a pattern
    const match = matchAuraToPattern(matchingTemplates[0].metadata)
    if (match) {
      return {
        patternFamily: match.patternFamily,
        patternVariant: match.patternVariant,
        confidence: match.confidence,
        suggestedTemplate: match.templateSlug,
      }
    }
  }

  // Fallback: return null (let default pattern selection handle it)
  return {
    patternFamily: null,
    patternVariant: 1,
    confidence: 0,
  }
}

/**
 * Enhance pattern selection with aura template guidance
 * 
 * Takes an existing pattern selection and finds similar aura templates
 * that can inform variant selection or provide layout inspiration.
 */
export async function enhancePatternWithAura(
  patternFamily: PatternFamily,
  patternVariant: PatternVariant,
  context?: {
    domain?: string
    vibe?: string
    tags?: string[]
  }
): Promise<{
  enhancedVariant: PatternVariant
  confidence: number
  referenceTemplates: Array<{
    slug: string
    name: string
    confidence: number
  }>
}> {
  const templates = await getAuraTemplates(false)

  // Find best matching aura templates for this pattern
  const match = findBestAuraTemplateForPattern(
    patternFamily,
    patternVariant,
    templates.map((t) => ({
      metadata: t.metadata,
      html: t.html || undefined,
    }))
  )

  const referenceTemplates = match
    ? [
        {
          slug: match.templateSlug,
          name: match.templateName,
          confidence: match.confidence,
        },
      ]
    : []

  // If we found a good match, consider using its suggested variant
  let enhancedVariant = patternVariant
  let confidence = 0.5

  if (match && match.confidence > 0.7) {
    // High confidence match - consider using its variant
    if (match.patternVariant === patternVariant) {
      confidence = 0.9
    } else {
      // Variant differs - use match variant if confidence is high
      if (match.confidence > 0.8) {
        enhancedVariant = match.patternVariant
        confidence = 0.75
      }
    }
  }

  return {
    enhancedVariant,
    confidence,
    referenceTemplates,
  }
}

/**
 * Get aura templates that match a pattern for reference/inspiration
 */
export async function getAuraReferencesForPattern(
  patternFamily: PatternFamily,
  limit = 3
): Promise<Array<{
  slug: string
  name: string
  description: string
  screenshotPath: string | null
  confidence: number
}>> {
  const templates = await getAuraTemplates(false)

  const { getAuraTemplatesForPattern } = await import('./aura-pattern-matcher')
  const matches = getAuraTemplatesForPattern(
    patternFamily,
    templates.map((t) => ({
      metadata: t.metadata,
      html: t.html || undefined,
    }))
  )

  return matches.slice(0, limit).map((match) => {
    const template = templates.find((t) => t.slug === match.templateSlug)
    return {
      slug: match.templateSlug,
      name: match.templateName,
      description: template?.metadata.description || '',
      screenshotPath: template?.screenshotPath || null,
      confidence: match.confidence,
    }
  })
}

/**
 * Clear the aura templates cache (useful for development)
 */
export function clearAuraCache(): void {
  auraTemplatesCache = null
}

