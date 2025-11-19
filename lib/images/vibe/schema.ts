import { z } from 'zod'

export const vibeSchema = z
  .enum([
    'playful',
    'professional',
    'bold',
    'minimal',
    'modern',
    'retro',
    'elegant',
    'energetic',
    'calm',
    'tech',
    'creative',
    'corporate',
  ])
  .describe('Visual vibe or stylistic descriptor')

export type Vibe = z.infer<typeof vibeSchema>

export interface VibeAnalysis {
  vibe: Vibe
  confidence: number // 0-1 score indicating confidence in the inference
  characteristics: {
    colorSaturation: number // 0-1, average saturation level
    visualWeight: number // 0-1, brightness/contrast intensity
    compositionComplexity: number // 0-1, complexity of composition
    colorTemperature: number // -1 (cool) to 1 (warm)
    brightness: number // 0-1, overall brightness
  }
  reasoning?: string[] // Optional array of reasoning steps for debugging
}

export interface CompositionAnalysis {
  aspectRatio: number // width / height
  width: number
  height: number
  isPortrait: boolean
  isLandscape: boolean
  isSquare: boolean
}

export interface MoodIndicators {
  colorTemperature: number // -1 (cool) to 1 (warm)
  saturation: number // 0-1
  brightness: number // 0-1
  contrast: number // 0-1
}

