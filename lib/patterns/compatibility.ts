// Pattern compatibility checker
// Checks if images, vibes, and palettes are compatible with patterns

import { type PatternDefinition } from './schema'
import { type HeroImage, type Palette } from '../dsl/types'
import { type Vibe } from '../dsl/schemas'
import { getPatternFamilyMetadata } from './metadata'
import { type PatternFamily } from './families'

export interface CompatibilityScore {
  score: number // 0-100
  factors: CompatibilityFactor[]
}

export interface CompatibilityFactor {
  name: string
  score: number // 0-100
  reason: string
}

/**
 * Check if image vibe/style is compatible with pattern
 */
function checkVibeCompatibility(
  image: HeroImage,
  pattern: PatternDefinition
): CompatibilityFactor {
  const metadata = getPatternFamilyMetadata(pattern.family as PatternFamily)
  const imageVibe = image.vibe

  // Some patterns work better with certain vibes
  // This is a simplified heuristic - can be expanded
  let score = 50 // Base score

  if (!imageVibe) {
    return {
      name: 'vibe',
      score: 50,
      reason: 'No vibe specified in image',
    }
  }

  // Professional patterns work well with professional vibes
  if (metadata.domain === 'saas' || metadata.domain === 'ecommerce') {
    const professionalVibes: Vibe[] = ['professional', 'modern', 'elegant', 'corporate']
    const casualVibes: Vibe[] = ['playful', 'bold']
    
    if (professionalVibes.includes(imageVibe)) {
      score = 90
    } else if (casualVibes.includes(imageVibe)) {
      score = 60
    }
  }

  // Mobile/app patterns work well with modern/playful vibes
  if (metadata.domain === 'mobile') {
    const mobileVibes: Vibe[] = ['modern', 'playful', 'creative']
    const formalVibes: Vibe[] = ['professional', 'retro']
    
    if (mobileVibes.includes(imageVibe)) {
      score = 90
    } else if (formalVibes.includes(imageVibe)) {
      score = 50
    }
  }

  // Common patterns are more flexible
  if (metadata.domain === 'common') {
    score = 70 // More permissive
  }

  return {
    name: 'vibe',
    score,
    reason: `Vibe '${imageVibe}' compatibility with ${metadata.domain} domain pattern`,
  }
}

/**
 * Check if palette works with pattern
 */
function checkPaletteCompatibility(
  palette: Palette,
  pattern: PatternDefinition
): CompatibilityFactor {
  // Basic palette validation - check for contrast and accessibility
  // This is a simplified check - can be expanded with actual color contrast calculations

  let score = 70 // Base score

  // Check if palette has valid hex colors
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  const isValidHex = (color: string) => hexColorRegex.test(color)

  if (!isValidHex(palette.primary) || !isValidHex(palette.secondary) || 
      !isValidHex(palette.accent) || !isValidHex(palette.background)) {
    return {
      name: 'palette',
      score: 0,
      reason: 'Invalid hex color format in palette',
    }
  }

  // Check if background and primary have sufficient contrast (simplified)
  // In a real implementation, would use WCAG contrast ratio calculations
  if (palette.background === palette.primary) {
    score = 30
    return {
      name: 'palette',
      score,
      reason: 'Background and primary colors are too similar',
    }
  }

  return {
    name: 'palette',
    score,
    reason: 'Palette colors are valid and have basic contrast',
  }
}

/**
 * Check if image style is compatible with pattern
 */
function checkStyleCompatibility(
  image: HeroImage,
  pattern: PatternDefinition
): CompatibilityFactor {
  const metadata = getPatternFamilyMetadata(pattern.family as PatternFamily)
  const imageStyle = image.style

  if (!imageStyle) {
    return {
      name: 'style',
      score: 50,
      reason: 'No style specified in image',
    }
  }

  let score = 60 // Base score

  // Professional patterns work well with editorial, vector styles
  if (metadata.domain === 'saas' || metadata.domain === 'ecommerce') {
    if (imageStyle === 'editorial' || imageStyle === 'vector' || imageStyle === '3D') {
      score = 85
    } else if (imageStyle === 'neon' || imageStyle === 'clay') {
      score = 50
    }
  }

  // Mobile/app patterns work well with modern styles
  if (metadata.domain === 'mobile') {
    if (imageStyle === '3D' || imageStyle === 'vector' || imageStyle === 'clay') {
      score = 80
    }
  }

  // Common patterns are flexible
  if (metadata.domain === 'common') {
    score = 70
  }

  return {
    name: 'style',
    score,
    reason: `Style '${imageStyle}' compatibility with pattern domain`,
  }
}

/**
 * Calculate overall compatibility score for image and pattern
 * @param image Hero image to check
 * @param palette Color palette to check
 * @param pattern Pattern definition to check against
 * @returns Compatibility score with factors
 */
export function calculateCompatibility(
  image: HeroImage,
  palette: Palette,
  pattern: PatternDefinition
): CompatibilityScore {
  const factors: CompatibilityFactor[] = []

  // Check vibe compatibility
  factors.push(checkVibeCompatibility(image, pattern))

  // Check palette compatibility
  factors.push(checkPaletteCompatibility(palette, pattern))

  // Check style compatibility
  factors.push(checkStyleCompatibility(image, pattern))

  // Calculate weighted average
  const weights = {
    vibe: 0.3,
    palette: 0.4,
    style: 0.3,
  }

  const totalScore = factors.reduce((sum, factor) => {
    const weight = weights[factor.name as keyof typeof weights] || 0.33
    return sum + factor.score * weight
  }, 0)

  return {
    score: Math.round(totalScore),
    factors,
  }
}

/**
 * Get compatibility recommendations
 * @param score Compatibility score
 * @returns Array of recommendation strings
 */
export function getCompatibilityRecommendations(score: CompatibilityScore): string[] {
  const recommendations: string[] = []

  if (score.score < 50) {
    recommendations.push('Consider using a different image or pattern for better compatibility')
  } else if (score.score < 70) {
    recommendations.push('Compatibility is acceptable but could be improved')
  } else {
    recommendations.push('Good compatibility between image and pattern')
  }

  // Add specific recommendations based on factors
  for (const factor of score.factors) {
    if (factor.score < 50) {
      recommendations.push(`Low ${factor.name} compatibility: ${factor.reason}`)
    }
  }

  return recommendations
}

