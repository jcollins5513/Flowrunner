// Accessibility utilities for renderer components

import { type Palette } from '../dsl/types'

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param hex - Hex color string (e.g., '#ffffff')
 * @returns Relative luminance (0-1)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color hex
 * @param color2 - Second color hex
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * @param color1 - Foreground color
 * @param color2 - Background color
 * @param level - WCAG level ('AA' or 'AAA')
 * @param size - Text size ('normal' or 'large')
 * @returns Whether contrast meets standard
 */
export function meetsWCAGContrast(
  color1: string,
  color2: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(color1, color2)

  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  }

  // AA level
  return size === 'large' ? ratio >= 3 : ratio >= 4.5
}

/**
 * Validate palette for accessibility
 * @param palette - Color palette
 * @returns Validation results
 */
export function validatePaletteAccessibility(palette: Palette): {
  valid: boolean
  errors: Array<{ field: string; message: string }>
  warnings: Array<{ field: string; message: string }>
} {
  const errors: Array<{ field: string; message: string }> = []
  const warnings: Array<{ field: string; message: string }> = []

  // Check primary text on background
  if (!meetsWCAGContrast(palette.primary, palette.background, 'AA', 'normal')) {
    errors.push({
      field: 'primary',
      message: `Primary color contrast ratio is below WCAG AA standard (normal text)`,
    })
  }

  // Check secondary text on background
  if (!meetsWCAGContrast(palette.secondary, palette.background, 'AA', 'large')) {
    warnings.push({
      field: 'secondary',
      message: `Secondary color contrast ratio may be low for large text`,
    })
  }

  // Check accent on background
  if (!meetsWCAGContrast(palette.accent, palette.background, 'AA', 'normal')) {
    errors.push({
      field: 'accent',
      message: `Accent color contrast ratio is below WCAG AA standard`,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get accessible text color for a background
 * @param backgroundColor - Background color hex
 * @returns Recommended text color ('light' or 'dark')
 */
export function getAccessibleTextColor(backgroundColor: string): 'light' | 'dark' {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? 'dark' : 'light'
}

/**
 * Generate accessible color suggestions
 * @param baseColor - Base color hex
 * @param targetRatio - Target contrast ratio (default 4.5 for AA normal text)
 * @returns Suggested colors for better contrast
 */
export function getAccessibleColorSuggestions(
  baseColor: string,
  targetRatio = 4.5
): { lighter: string; darker: string } {
  const rgb = hexToRgb(baseColor)
  if (!rgb) {
    return { lighter: '#ffffff', darker: '#000000' }
  }

  // Simple algorithm to adjust brightness
  const adjustBrightness = (color: { r: number; g: number; b: number }, factor: number) => {
    return {
      r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
      g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
      b: Math.min(255, Math.max(0, Math.round(color.b * factor))),
    }
  }

  const lighter = adjustBrightness(rgb, 1.5)
  const darker = adjustBrightness(rgb, 0.7)

  return {
    lighter: rgbToHex(lighter.r, lighter.g, lighter.b),
    darker: rgbToHex(darker.r, darker.g, darker.b),
  }
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

