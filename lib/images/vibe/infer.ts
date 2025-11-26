import 'server-only'

import type { Palette } from '../palette'
import type { Vibe, VibeAnalysis, CompositionAnalysis, MoodIndicators } from './schema'
import {
  analyzeColorSaturation,
  analyzeVisualWeight,
  analyzeComposition,
  analyzeMoodIndicators,
} from './analyzer'

export interface InferVibeOptions {
  url: string
  palette: Palette
  manualOverride?: Vibe
  includeReasoning?: boolean
}

interface VibeScore {
  vibe: Vibe
  score: number
  reasoning: string[]
}

/**
 * Rule-based vibe inference from image characteristics
 */
export const inferVibe = async (options: InferVibeOptions): Promise<VibeAnalysis> => {
  const { url, palette, manualOverride, includeReasoning = false } = options

  // Manual override takes precedence
  if (manualOverride) {
    return {
      vibe: manualOverride,
      confidence: 1.0,
      characteristics: {
        colorSaturation: 0.5,
        visualWeight: 0.5,
        compositionComplexity: 0.5,
        colorTemperature: 0,
        brightness: 0.5,
      },
      reasoning: includeReasoning ? ['Manual override applied'] : undefined,
    }
  }

  // Analyze image characteristics
  const [colorSaturation, visualWeight, composition, moodIndicators] = await Promise.all([
    analyzeColorSaturation(url),
    analyzeVisualWeight(url),
    analyzeComposition(url),
    Promise.resolve().then(async () => {
      const weight = await analyzeVisualWeight(url)
      return analyzeMoodIndicators(url, palette, weight)
    }),
  ])

  const compositionComplexity = calculateCompositionComplexity(composition)

  const characteristics = {
    colorSaturation,
    visualWeight,
    compositionComplexity,
    colorTemperature: moodIndicators.colorTemperature,
    brightness: moodIndicators.brightness,
  }

  // Score each vibe based on characteristics
  const scores: VibeScore[] = [
    scorePlayful(characteristics, moodIndicators, composition, includeReasoning),
    scoreProfessional(characteristics, moodIndicators, composition, includeReasoning),
    scoreBold(characteristics, moodIndicators, composition, includeReasoning),
    scoreMinimal(characteristics, moodIndicators, composition, includeReasoning),
    scoreModern(characteristics, moodIndicators, composition, includeReasoning),
    scoreRetro(characteristics, moodIndicators, composition, includeReasoning),
    scoreElegant(characteristics, moodIndicators, composition, includeReasoning),
    scoreEnergetic(characteristics, moodIndicators, composition, includeReasoning),
    scoreCalm(characteristics, moodIndicators, composition, includeReasoning),
    scoreTech(characteristics, moodIndicators, composition, includeReasoning),
    scoreCreative(characteristics, moodIndicators, composition, includeReasoning),
    scoreCorporate(characteristics, moodIndicators, composition, includeReasoning),
  ]

  // Find highest scoring vibe
  const bestMatch = scores.reduce((best, current) =>
    current.score > best.score ? current : best
  )

  // Calculate confidence (normalize score to 0-1, with bonus if significantly higher than second place)
  const sortedScores = scores.sort((a, b) => b.score - a.score)
  const topScore = sortedScores[0].score
  const secondScore = sortedScores[1]?.score ?? 0
  const scoreDiff = topScore - secondScore
  const confidence = Math.min(0.5 + topScore * 0.3 + scoreDiff * 0.2, 1.0)

  return {
    vibe: bestMatch.vibe,
    confidence,
    characteristics,
    reasoning: includeReasoning ? bestMatch.reasoning : undefined,
  }
}

/**
 * Calculate composition complexity (0-1)
 */
const calculateCompositionComplexity = (composition: CompositionAnalysis): number => {
  // Square images are simpler, extreme aspect ratios are more complex
  if (composition.isSquare) return 0.3
  const aspectRatioDeviation = Math.abs(composition.aspectRatio - 1)
  return Math.min(aspectRatioDeviation * 0.5, 1.0)
}

// Vibe scoring functions

const scorePlayful = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // High saturation
  if (chars.colorSaturation > 0.7) {
    score += 0.3
    if (includeReasoning) reasoning.push('High color saturation')
  }

  // Bright colors
  if (chars.brightness > 0.6) {
    score += 0.2
    if (includeReasoning) reasoning.push('Bright colors')
  }

  // Varied composition (not square)
  if (!composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Varied composition')
  }

  // Moderate to high visual weight
  if (chars.visualWeight > 0.5) {
    score += 0.2
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  // Warm or neutral temperature
  if (mood.colorTemperature > -0.3) {
    score += 0.1
    if (includeReasoning) reasoning.push('Warm or neutral tones')
  }

  return { vibe: 'playful', score, reasoning }
}

const scoreProfessional = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Moderate saturation
  if (chars.colorSaturation >= 0.3 && chars.colorSaturation <= 0.7) {
    score += 0.3
    if (includeReasoning) reasoning.push('Moderate saturation')
  }

  // Balanced colors
  if (chars.brightness >= 0.4 && chars.brightness <= 0.7) {
    score += 0.2
    if (includeReasoning) reasoning.push('Balanced brightness')
  }

  // Structured composition (landscape or portrait, not extreme)
  if (composition.isLandscape || composition.isPortrait) {
    score += 0.2
    if (includeReasoning) reasoning.push('Structured composition')
  }

  // Moderate visual weight
  if (chars.visualWeight >= 0.4 && chars.visualWeight <= 0.7) {
    score += 0.2
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  // Neutral to cool temperature
  if (mood.colorTemperature >= -0.5 && mood.colorTemperature <= 0.3) {
    score += 0.1
    if (includeReasoning) reasoning.push('Neutral to cool tones')
  }

  return { vibe: 'professional', score, reasoning }
}

const scoreBold = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // High contrast
  if (mood.contrast > 0.7) {
    score += 0.3
    if (includeReasoning) reasoning.push('High contrast')
  }

  // High saturation
  if (chars.colorSaturation > 0.7) {
    score += 0.25
    if (includeReasoning) reasoning.push('High saturation')
  }

  // Strong visual weight
  if (chars.visualWeight > 0.7) {
    score += 0.25
    if (includeReasoning) reasoning.push('Strong visual weight')
  }

  // Any composition
  score += 0.1
  if (includeReasoning) reasoning.push('Works with any composition')

  // Saturated colors
  if (mood.saturation > 0.6) {
    score += 0.1
    if (includeReasoning) reasoning.push('Saturated colors')
  }

  return { vibe: 'bold', score, reasoning }
}

const scoreMinimal = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Low saturation
  if (chars.colorSaturation < 0.4) {
    score += 0.3
    if (includeReasoning) reasoning.push('Low saturation')
  }

  // High brightness
  if (chars.brightness > 0.7) {
    score += 0.25
    if (includeReasoning) reasoning.push('High brightness')
  }

  // Simple composition (square or near-square)
  if (composition.isSquare || chars.compositionComplexity < 0.3) {
    score += 0.25
    if (includeReasoning) reasoning.push('Simple composition')
  }

  // Low visual weight
  if (chars.visualWeight < 0.5) {
    score += 0.15
    if (includeReasoning) reasoning.push('Low visual weight')
  }

  // Low contrast
  if (mood.contrast < 0.4) {
    score += 0.05
    if (includeReasoning) reasoning.push('Low contrast')
  }

  return { vibe: 'minimal', score, reasoning }
}

const scoreModern = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Balanced saturation
  if (chars.colorSaturation >= 0.4 && chars.colorSaturation <= 0.7) {
    score += 0.25
    if (includeReasoning) reasoning.push('Balanced saturation')
  }

  // Cool tones
  if (mood.colorTemperature < 0) {
    score += 0.25
    if (includeReasoning) reasoning.push('Cool tones')
  }

  // Clean composition
  if (composition.isLandscape || composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Clean composition')
  }

  // Moderate brightness
  if (chars.brightness >= 0.5 && chars.brightness <= 0.8) {
    score += 0.2
    if (includeReasoning) reasoning.push('Moderate brightness')
  }

  // Moderate visual weight
  if (chars.visualWeight >= 0.4 && chars.visualWeight <= 0.7) {
    score += 0.1
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  return { vibe: 'modern', score, reasoning }
}

const scoreRetro = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Warm tones
  if (mood.colorTemperature > 0.3) {
    score += 0.3
    if (includeReasoning) reasoning.push('Warm tones')
  }

  // Moderate saturation
  if (chars.colorSaturation >= 0.4 && chars.colorSaturation <= 0.7) {
    score += 0.25
    if (includeReasoning) reasoning.push('Moderate saturation')
  }

  // Specific color palettes (warm oranges, browns, yellows)
  if (mood.colorTemperature > 0.2 && mood.saturation > 0.4) {
    score += 0.2
    if (includeReasoning) reasoning.push('Retro color palette')
  }

  // Any composition
  score += 0.15
  if (includeReasoning) reasoning.push('Works with various compositions')

  // Moderate visual weight
  if (chars.visualWeight >= 0.3 && chars.visualWeight <= 0.7) {
    score += 0.1
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  return { vibe: 'retro', score, reasoning }
}

const scoreElegant = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Low-moderate saturation
  if (chars.colorSaturation >= 0.2 && chars.colorSaturation <= 0.6) {
    score += 0.3
    if (includeReasoning) reasoning.push('Refined saturation')
  }

  // Balanced composition
  if (composition.isLandscape || composition.isSquare) {
    score += 0.25
    if (includeReasoning) reasoning.push('Balanced composition')
  }

  // Moderate brightness
  if (chars.brightness >= 0.4 && chars.brightness <= 0.7) {
    score += 0.2
    if (includeReasoning) reasoning.push('Moderate brightness')
  }

  // Balanced visual weight
  if (chars.visualWeight >= 0.4 && chars.visualWeight <= 0.6) {
    score += 0.15
    if (includeReasoning) reasoning.push('Balanced visual weight')
  }

  // Neutral to warm temperature
  if (mood.colorTemperature >= -0.2 && mood.colorTemperature <= 0.4) {
    score += 0.1
    if (includeReasoning) reasoning.push('Refined color temperature')
  }

  return { vibe: 'elegant', score, reasoning }
}

const scoreEnergetic = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // High saturation
  if (chars.colorSaturation > 0.7) {
    score += 0.3
    if (includeReasoning) reasoning.push('High saturation')
  }

  // Warm tones
  if (mood.colorTemperature > 0.2) {
    score += 0.25
    if (includeReasoning) reasoning.push('Warm tones')
  }

  // Dynamic composition (not square)
  if (!composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Dynamic composition')
  }

  // High visual weight
  if (chars.visualWeight > 0.6) {
    score += 0.15
    if (includeReasoning) reasoning.push('High visual weight')
  }

  // High brightness
  if (chars.brightness > 0.6) {
    score += 0.1
    if (includeReasoning) reasoning.push('High brightness')
  }

  return { vibe: 'energetic', score, reasoning }
}

const scoreCalm = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Low saturation
  if (chars.colorSaturation < 0.5) {
    score += 0.3
    if (includeReasoning) reasoning.push('Low saturation')
  }

  // Cool tones
  if (mood.colorTemperature < 0) {
    score += 0.25
    if (includeReasoning) reasoning.push('Cool tones')
  }

  // Balanced composition
  if (composition.isLandscape || composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Balanced composition')
  }

  // Moderate to low visual weight
  if (chars.visualWeight < 0.6) {
    score += 0.15
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  // Moderate brightness
  if (chars.brightness >= 0.4 && chars.brightness <= 0.7) {
    score += 0.1
    if (includeReasoning) reasoning.push('Moderate brightness')
  }

  return { vibe: 'calm', score, reasoning }
}

const scoreTech = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Cool tones
  if (mood.colorTemperature < 0) {
    score += 0.3
    if (includeReasoning) reasoning.push('Cool tones')
  }

  // Moderate-high saturation
  if (chars.colorSaturation >= 0.5 && chars.colorSaturation <= 0.8) {
    score += 0.25
    if (includeReasoning) reasoning.push('Moderate-high saturation')
  }

  // Structured composition
  if (composition.isLandscape || composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Structured composition')
  }

  // Moderate to high visual weight
  if (chars.visualWeight >= 0.5) {
    score += 0.15
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  // Moderate brightness
  if (chars.brightness >= 0.4 && chars.brightness <= 0.7) {
    score += 0.1
    if (includeReasoning) reasoning.push('Moderate brightness')
  }

  return { vibe: 'tech', score, reasoning }
}

const scoreCreative = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // High saturation
  if (chars.colorSaturation > 0.6) {
    score += 0.3
    if (includeReasoning) reasoning.push('High saturation')
  }

  // Varied colors (high saturation variance)
  if (mood.saturation > 0.5) {
    score += 0.2
    if (includeReasoning) reasoning.push('Varied colors')
  }

  // Dynamic composition
  if (!composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Dynamic composition')
  }

  // High visual weight
  if (chars.visualWeight > 0.5) {
    score += 0.15
    if (includeReasoning) reasoning.push('High visual weight')
  }

  // Any temperature
  score += 0.15
  if (includeReasoning) reasoning.push('Works with any color temperature')

  return { vibe: 'creative', score, reasoning }
}

const scoreCorporate = (
  chars: VibeAnalysis['characteristics'],
  mood: MoodIndicators,
  composition: CompositionAnalysis,
  includeReasoning: boolean
): VibeScore => {
  const reasoning: string[] = []
  let score = 0

  // Low-moderate saturation
  if (chars.colorSaturation >= 0.2 && chars.colorSaturation <= 0.6) {
    score += 0.3
    if (includeReasoning) reasoning.push('Neutral saturation')
  }

  // Neutral tones
  if (mood.colorTemperature >= -0.3 && mood.colorTemperature <= 0.3) {
    score += 0.25
    if (includeReasoning) reasoning.push('Neutral tones')
  }

  // Structured composition
  if (composition.isLandscape || composition.isSquare) {
    score += 0.2
    if (includeReasoning) reasoning.push('Structured composition')
  }

  // Moderate visual weight
  if (chars.visualWeight >= 0.4 && chars.visualWeight <= 0.6) {
    score += 0.15
    if (includeReasoning) reasoning.push('Moderate visual weight')
  }

  // Moderate brightness
  if (chars.brightness >= 0.4 && chars.brightness <= 0.7) {
    score += 0.1
    if (includeReasoning) reasoning.push('Moderate brightness')
  }

  return { vibe: 'corporate', score, reasoning }
}

