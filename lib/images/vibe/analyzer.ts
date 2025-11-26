import 'server-only'

import sharp from 'sharp'
import type { Palette } from '../palette'
import type { CompositionAnalysis, MoodIndicators } from './schema'
import { getImageSource, loadImageBuffer } from '../source'

type VibrantModule = {
  from: (source: string) => { getPalette: () => Promise<Record<string, { hsl?: [number, number, number] }>> }
  Vibrant?: VibrantModule
  default?: VibrantModule
}

// node-vibrant exposes different shapes depending on bundling; normalize to a single interface
let vibrantInstance: VibrantModule | null = null

const getVibrant = async (): Promise<VibrantModule> => {
  if (vibrantInstance) return vibrantInstance

  const vibrantImport = (await import('node-vibrant/node')) as unknown as VibrantModule
  vibrantInstance = vibrantImport.Vibrant ?? vibrantImport.default ?? vibrantImport
  return vibrantInstance
}

/**
 * Calculate average color saturation from palette
 * Uses HSV saturation values from vibrant palette
 */
export const analyzeColorSaturation = async (url: string): Promise<number> => {
  try {
    const vibrant = await getVibrant()
    const source = await getImageSource(url)
    const palette = await vibrant.from(source as any).getPalette()
    
    // Extract saturation values from vibrant swatches
    const saturations: number[] = []
    
    if (palette.Vibrant?.hsl) saturations.push(palette.Vibrant.hsl[1])
    if (palette.Muted?.hsl) saturations.push(palette.Muted.hsl[1])
    if (palette.LightVibrant?.hsl) saturations.push(palette.LightVibrant.hsl[1])
    if (palette.LightMuted?.hsl) saturations.push(palette.LightMuted.hsl[1])
    if (palette.DarkVibrant?.hsl) saturations.push(palette.DarkVibrant.hsl[1])
    if (palette.DarkMuted?.hsl) saturations.push(palette.DarkMuted.hsl[1])
    
    if (saturations.length === 0) return 0.5 // Default moderate saturation
    
    // Average saturation (already 0-1 from HSL)
    return saturations.reduce((sum, s) => sum + s, 0) / saturations.length
  } catch (error) {
    console.warn('Failed to analyze color saturation:', error)
    return 0.5 // Default moderate saturation
  }
}

/**
 * Calculate visual weight (brightness and contrast) from image
 * Returns a 0-1 score where higher = more visual weight
 */
export const analyzeVisualWeight = async (url: string): Promise<number> => {
  try {
    const buffer = await loadImageBuffer(url)
    
    // Get image statistics
    const stats = await sharp(buffer)
      .greyscale()
      .normalize()
      .stats()
    
    // Calculate average brightness (0-1)
    const brightness = (stats.channels[0]?.mean ?? 128) / 255
    
    // Calculate contrast (standard deviation of brightness)
    const stdev = stats.channels[0]?.stdev ?? 0
    const contrast = Math.min(stdev / 128, 1) // Normalize to 0-1
    
    // Visual weight combines brightness and contrast
    // Higher brightness + higher contrast = more visual weight
    return (brightness * 0.6 + contrast * 0.4)
  } catch (error) {
    console.warn('Failed to analyze visual weight:', error)
    return 0.5 // Default moderate visual weight
  }
}

/**
 * Analyze image composition (dimensions, aspect ratio)
 */
export const analyzeComposition = async (url: string): Promise<CompositionAnalysis> => {
  try {
    const buffer = await loadImageBuffer(url)
    
    const metadata = await sharp(buffer).metadata()
    const width = metadata.width ?? 1
    const height = metadata.height ?? 1
    const aspectRatio = width / height
    
    return {
      aspectRatio,
      width,
      height,
      isPortrait: aspectRatio < 1,
      isLandscape: aspectRatio > 1,
      isSquare: Math.abs(aspectRatio - 1) < 0.1,
    }
  } catch (error) {
    console.warn('Failed to analyze composition:', error)
    // Return default square composition
    return {
      aspectRatio: 1,
      width: 1,
      height: 1,
      isPortrait: false,
      isLandscape: false,
      isSquare: true,
    }
  }
}

/**
 * Calculate color temperature from palette
 * Returns -1 (cool/blue) to 1 (warm/red-orange)
 */
const calculateColorTemperature = (palette: Palette): number => {
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }
  
  // Analyze primary and accent colors for temperature
  const colors = [palette.primary, palette.accent, palette.secondary].filter(Boolean) as string[]
  
  if (colors.length === 0) return 0 // Neutral
  
  let totalTemp = 0
  for (const hex of colors) {
    const rgb = hexToRgb(hex)
    if (!rgb) continue
    
    // Warm colors have more red/orange, cool colors have more blue
    // Simple heuristic: (r - b) / 255 gives -1 to 1 range
    const temp = (rgb.r - rgb.b) / 255
    totalTemp += temp
  }
  
  return totalTemp / colors.length
}

/**
 * Analyze mood indicators from palette and visual weight
 */
export const analyzeMoodIndicators = async (
  url: string,
  palette: Palette,
  visualWeight: number
): Promise<MoodIndicators> => {
  const colorTemperature = calculateColorTemperature(palette)
  const saturation = await analyzeColorSaturation(url)
  
  // Brightness from visual weight (already calculated)
  const brightness = visualWeight
  
  // Contrast: calculate from palette color differences
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null
  }
  
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const val = c / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  // Calculate contrast between primary and background
  const primaryRgb = hexToRgb(palette.primary)
  const bgRgb = hexToRgb(palette.background ?? '#FFFFFF')
  
  let contrast = 0.5 // Default moderate contrast
  if (primaryRgb && bgRgb) {
    const lum1 = getLuminance(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    const lum2 = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    const ratio = (lighter + 0.05) / (darker + 0.05)
    // Normalize contrast to 0-1 (assuming max contrast ratio ~21)
    contrast = Math.min(ratio / 21, 1)
  }
  
  return {
    colorTemperature,
    saturation,
    brightness,
    contrast,
  }
}

