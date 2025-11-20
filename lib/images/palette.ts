// @ts-ignore - node-vibrant has inconsistent exports
const Vibrant = require('node-vibrant')
import { z } from 'zod'

export const paletteSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export type Palette = z.infer<typeof paletteSchema>

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

const getContrast = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  if (!rgb1 || !rgb2) return 0

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

export const validateContrast = (foreground: string, background: string, minRatio: number = 4.5): boolean => {
  return getContrast(foreground, background) >= minRatio
}

const generateFallbackPalette = (): Palette => ({
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#1F2937',
})

export interface ExtractPaletteOptions {
  url: string
  fallback?: Palette
  minContrast?: number
}

export const extractPalette = async (options: ExtractPaletteOptions): Promise<Palette> => {
  const { url, fallback = generateFallbackPalette(), minContrast = 4.5 } = options

  try {
    const palette = await Vibrant.from(url).getPalette()

    const primary = palette.Vibrant?.hex ?? palette.Muted?.hex ?? fallback.primary
    const secondary = palette.LightVibrant?.hex ?? palette.LightMuted?.hex ?? fallback.secondary
    const accent = palette.DarkVibrant?.hex ?? palette.DarkMuted?.hex ?? fallback.accent
    const background = palette.LightMuted?.hex ?? '#FFFFFF'
    const text = palette.DarkVibrant?.hex ?? palette.DarkMuted?.hex ?? '#1F2937'

    const extracted: Palette = {
      primary,
      secondary,
      accent,
      background,
      text: validateContrast(text, background, minContrast) ? text : '#1F2937',
    }

    return paletteSchema.parse(extracted)
  } catch (error) {
    console.warn('Palette extraction failed, using fallback:', error)
    return fallback
  }
}

