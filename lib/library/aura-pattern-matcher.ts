/**
 * Aura Pattern Matcher
 * 
 * Matches aura templates to FlowRunner pattern families and variants,
 * enabling template-guided pattern selection.
 */

import type { PatternFamily } from '../patterns/families'
import type { PatternVariant } from '../dsl/types'
import {
  analyzeAuraTemplate,
  mapAuraToPatternFamily,
  suggestPatternVariant,
  type AuraTemplateMetadata,
  type AuraLayoutAnalysis,
} from './aura-analyzer'

export interface AuraTemplateMatch {
  templateSlug: string
  templateName: string
  patternFamily: PatternFamily
  patternVariant: PatternVariant
  confidence: number
  reasoning: string[]
}

/**
 * Match an aura template to a FlowRunner pattern
 */
export function matchAuraToPattern(
  metadata: AuraTemplateMetadata,
  html?: string
): AuraTemplateMatch | null {
  const reasoning: string[] = []

  // First, try metadata-based matching
  let patternFamily = mapAuraToPatternFamily(metadata)
  let confidence = 0.7

  if (patternFamily) {
    reasoning.push(`Matched pattern family "${patternFamily}" based on metadata tags`)
  }

  // If HTML is provided, analyze layout
  let analysis: AuraLayoutAnalysis | null = null
  if (html) {
    analysis = analyzeAuraTemplate(html, metadata)

    // Use analysis to refine or override metadata-based match
    if (analysis.suggestedPatternFamily) {
      const analysisConfidence = analysis.confidence
      if (analysisConfidence > confidence) {
        patternFamily = analysis.suggestedPatternFamily
        confidence = analysisConfidence
        reasoning.push(
          `Layout analysis suggests "${patternFamily}" with ${Math.round(
            analysisConfidence * 100
          )}% confidence`
        )
      } else {
        reasoning.push(
          `Layout analysis confirms "${patternFamily}" with ${Math.round(
            analysisConfidence * 100
          )}% confidence`
        )
        confidence = Math.max(confidence, analysisConfidence * 0.8)
      }
    }
  }

  if (!patternFamily) {
    return null
  }

  // Determine variant
  const variant = analysis
    ? suggestPatternVariant(analysis, metadata)
    : (1 as PatternVariant)

  if (analysis) {
    reasoning.push(
      `Selected variant ${variant} based on layout complexity (${analysis.sections} sections, ${analysis.hasCards ? 'has cards' : 'no cards'}, ${analysis.hasForm ? 'has form' : 'no form'})`
    )
  } else {
    reasoning.push(`Using default variant ${variant}`)
  }

  return {
    templateSlug: metadata.slug,
    templateName: metadata.name,
    patternFamily,
    patternVariant: variant,
    confidence,
    reasoning,
  }
}

/**
 * Find best matching pattern for a given intent/domain
 */
export function findBestAuraTemplateForPattern(
  patternFamily: PatternFamily,
  patternVariant: PatternVariant,
  templates: Array<{ metadata: AuraTemplateMetadata; html?: string }>
): AuraTemplateMatch | null {
  const matches = templates
    .map((template) => matchAuraToPattern(template.metadata, template.html))
    .filter((match): match is AuraTemplateMatch => match !== null)
    .filter((match) => match.patternFamily === patternFamily)
    .sort((a, b) => {
      // Prefer exact variant match, then higher confidence
      if (a.patternVariant === patternVariant && b.patternVariant !== patternVariant) {
        return -1
      }
      if (b.patternVariant === patternVariant && a.patternVariant !== patternVariant) {
        return 1
      }
      return b.confidence - a.confidence
    })

  return matches[0] || null
}

/**
 * Get all aura templates that match a pattern family
 */
export function getAuraTemplatesForPattern(
  patternFamily: PatternFamily,
  templates: Array<{ metadata: AuraTemplateMetadata; html?: string }>
): AuraTemplateMatch[] {
  return templates
    .map((template) => matchAuraToPattern(template.metadata, template.html))
    .filter((match): match is AuraTemplateMatch => match !== null)
    .filter((match) => match.patternFamily === patternFamily)
    .sort((a, b) => b.confidence - a.confidence)
}

