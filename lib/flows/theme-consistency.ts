// Flow Theme Consistency Utilities
// Ensures palette and vibe consistency across screens in a flow

import { prisma } from '../db/client'
import type { FlowThemeConfig } from './types'
import type { ScreenDSL, Palette, Vibe } from '../dsl/types'

/**
 * Calculate palette similarity score (0-1)
 * Higher score means more similar palettes
 */
export function calculatePaletteSimilarity(palette1: Palette, palette2: Palette): number {
  // Convert hex colors to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  // Calculate Euclidean distance in RGB space
  const colorDistance = (color1: string, color2: string): number => {
    const [r1, g1, b1] = hexToRgb(color1)
    const [r2, g2, b2] = hexToRgb(color2)
    const distance = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))
    return distance / Math.sqrt(255 * 255 * 3) // Normalize to 0-1
  }

  // Calculate average distance across all palette colors
  const distances = [
    colorDistance(palette1.primary, palette2.primary),
    colorDistance(palette1.secondary, palette2.secondary),
    colorDistance(palette1.accent, palette2.accent),
    colorDistance(palette1.background, palette2.background),
  ]

  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
  return 1 - avgDistance // Convert distance to similarity
}

/**
 * Calculate vibe consistency score (0-1)
 * Returns 1 if vibes match, 0 if completely different
 */
export function calculateVibeConsistency(vibe1: Vibe, vibe2: Vibe): number {
  if (vibe1 === vibe2) {
    return 1
  }

  // Define vibe groups for partial matching
  const vibeGroups: Record<string, Vibe[]> = {
    professional: ['professional', 'corporate', 'modern', 'minimal'],
    creative: ['creative', 'playful', 'energetic', 'bold'],
    calm: ['calm', 'elegant', 'minimal'],
    tech: ['tech', 'modern', 'bold'],
  }

  // Check if vibes are in the same group
  for (const group of Object.values(vibeGroups)) {
    if (group.includes(vibe1) && group.includes(vibe2)) {
      return 0.5 // Partial match
    }
  }

  return 0 // No match
}

/**
 * Calculate overall flow consistency score
 */
export async function calculateFlowConsistency(flowId: string): Promise<{
  paletteConsistency: number
  vibeConsistency: number
  overallConsistency: number
}> {
  const screens = await prisma.screen.findMany({
    where: { flowId },
  })

  if (screens.length < 2) {
    return {
      paletteConsistency: 1,
      vibeConsistency: 1,
      overallConsistency: 1,
    }
  }

  // Extract palettes and vibes
  const palettes: Palette[] = []
  const vibes: Vibe[] = []

  for (const screen of screens) {
    if (screen.palette) {
      try {
        palettes.push(JSON.parse(screen.palette as string))
      } catch {
        // Skip invalid palettes
      }
    }
    if (screen.vibe) {
      vibes.push(screen.vibe as Vibe)
    }
  }

  // Calculate palette consistency
  let paletteConsistency = 1
  if (palettes.length > 1) {
    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < palettes.length; i++) {
      for (let j = i + 1; j < palettes.length; j++) {
        totalSimilarity += calculatePaletteSimilarity(palettes[i], palettes[j])
        comparisons++
      }
    }

    paletteConsistency = comparisons > 0 ? totalSimilarity / comparisons : 1
  }

  // Calculate vibe consistency
  let vibeConsistency = 1
  if (vibes.length > 1) {
    let totalSimilarity = 0
    let comparisons = 0

    for (let i = 0; i < vibes.length; i++) {
      for (let j = i + 1; j < vibes.length; j++) {
        totalSimilarity += calculateVibeConsistency(vibes[i], vibes[j])
        comparisons++
      }
    }

    vibeConsistency = comparisons > 0 ? totalSimilarity / comparisons : 1
  }

  // Overall consistency is average of palette and vibe
  const overallConsistency = (paletteConsistency + vibeConsistency) / 2

  return {
    paletteConsistency,
    vibeConsistency,
    overallConsistency,
  }
}

/**
 * Apply theme config to a screen DSL
 * Adjusts palette and vibe to match flow theme
 */
export function applyThemeToScreen(screenDSL: ScreenDSL, themeConfig: FlowThemeConfig): ScreenDSL {
  const tolerance = themeConfig.variationTolerance || 'moderate'

  // Apply primary palette if configured
  if (themeConfig.primaryPalette && themeConfig.allowVariation) {
    // Blend with existing palette based on tolerance
    const blendFactor = tolerance === 'strict' ? 0.9 : tolerance === 'moderate' ? 0.7 : 0.5

    screenDSL.palette = {
      primary: blendColors(screenDSL.palette.primary, themeConfig.primaryPalette.primary, blendFactor),
      secondary: blendColors(screenDSL.palette.secondary, themeConfig.primaryPalette.secondary, blendFactor),
      accent: blendColors(screenDSL.palette.accent, themeConfig.primaryPalette.accent, blendFactor),
      background: blendColors(screenDSL.palette.background, themeConfig.primaryPalette.background, blendFactor),
    }
  } else if (themeConfig.primaryPalette) {
    // Strict mode: use primary palette directly
    screenDSL.palette = { ...themeConfig.primaryPalette }
  }

  // Apply primary vibe if configured
  if (themeConfig.primaryVibe) {
    if (tolerance === 'strict' || !themeConfig.allowVariation) {
      screenDSL.vibe = themeConfig.primaryVibe
    }
    // In moderate/loose mode, keep existing vibe but ensure compatibility
  }

  return screenDSL
}

/**
 * Blend two hex colors
 */
function blendColors(color1: string, color2: string, factor: number): string {
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0]
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
  }

  const [r1, g1, b1] = hexToRgb(color1)
  const [r2, g2, b2] = hexToRgb(color2)

  const r = Math.round(r1 * (1 - factor) + r2 * factor)
  const g = Math.round(g1 * (1 - factor) + g2 * factor)
  const b = Math.round(b1 * (1 - factor) + b2 * factor)

  return rgbToHex(r, g, b)
}

/**
 * Validate screen against flow theme
 */
export function validateScreenTheme(screenDSL: ScreenDSL, themeConfig: FlowThemeConfig): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (themeConfig.primaryPalette) {
    const similarity = calculatePaletteSimilarity(screenDSL.palette, themeConfig.primaryPalette)
    const threshold = themeConfig.variationTolerance === 'strict' ? 0.9 : themeConfig.variationTolerance === 'moderate' ? 0.7 : 0.5

    if (similarity < threshold) {
      issues.push(`Palette similarity (${(similarity * 100).toFixed(1)}%) below threshold (${(threshold * 100).toFixed(1)}%)`)
    }
  }

  if (themeConfig.primaryVibe && screenDSL.vibe !== themeConfig.primaryVibe) {
    const consistency = calculateVibeConsistency(screenDSL.vibe, themeConfig.primaryVibe)
    if (consistency < 0.5 && themeConfig.variationTolerance === 'strict') {
      issues.push(`Vibe mismatch: expected ${themeConfig.primaryVibe}, got ${screenDSL.vibe}`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Get flow theme config from database
 * Note: Currently stored in first screen's metadata as workaround
 * In production, add metadata field to Flow model
 */
export async function getFlowThemeConfig(flowId: string): Promise<FlowThemeConfig | null> {
  const screens = await prisma.screen.findMany({
    where: { flowId },
    orderBy: { createdAt: 'asc' },
    take: 1,
  })

  if (screens.length === 0 || !screens[0].metadata) {
    return null
  }

  try {
    const metadata = JSON.parse(screens[0].metadata as string)
    return metadata.flowThemeConfig || null
  } catch {
    return null
  }
}

