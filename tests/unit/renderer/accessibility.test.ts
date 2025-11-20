import { describe, it, expect } from 'vitest'
import {
  getLuminance,
  getContrastRatio,
  meetsWCAGContrast,
  validatePaletteAccessibility,
  getAccessibleTextColor,
  getAccessibleColorSuggestions,
} from '@/lib/renderer/accessibility'

describe('Accessibility utilities', () => {
  describe('getLuminance', () => {
    it('calculates luminance for white', () => {
      const luminance = getLuminance('#ffffff')
      expect(luminance).toBeCloseTo(1, 2)
    })

    it('calculates luminance for black', () => {
      const luminance = getLuminance('#000000')
      expect(luminance).toBeCloseTo(0, 2)
    })

    it('handles hex without hash', () => {
      const luminance = getLuminance('ffffff')
      expect(luminance).toBeCloseTo(1, 2)
    })
  })

  describe('getContrastRatio', () => {
    it('calculates maximum contrast for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000')
      expect(ratio).toBeCloseTo(21, 1)
    })

    it('calculates minimum contrast for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff')
      expect(ratio).toBe(1)
    })

    it('calculates contrast for medium colors', () => {
      const ratio = getContrastRatio('#333333', '#ffffff')
      expect(ratio).toBeGreaterThan(10)
    })
  })

  describe('meetsWCAGContrast', () => {
    it('passes WCAG AA for white on black', () => {
      expect(meetsWCAGContrast('#ffffff', '#000000', 'AA', 'normal')).toBe(true)
    })

    it('passes WCAG AAA for white on black', () => {
      expect(meetsWCAGContrast('#ffffff', '#000000', 'AAA', 'normal')).toBe(true)
    })

    it('fails WCAG AA for low contrast colors', () => {
      expect(meetsWCAGContrast('#cccccc', '#dddddd', 'AA', 'normal')).toBe(false)
    })

    it('passes WCAG AA for large text with lower threshold', () => {
      const ratio = getContrastRatio('#666666', '#ffffff')
      expect(ratio).toBeGreaterThan(3)
      expect(meetsWCAGContrast('#666666', '#ffffff', 'AA', 'large')).toBe(true)
    })
  })

  describe('validatePaletteAccessibility', () => {
    it('validates accessible palette', () => {
      const palette = {
        primary: '#000000',
        secondary: '#333333',
        accent: '#0066cc',
        background: '#ffffff',
      }

      const result = validatePaletteAccessibility(palette)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('reports errors for inaccessible palette', () => {
      const palette = {
        primary: '#cccccc',
        secondary: '#dddddd',
        accent: '#eeeeee',
        background: '#ffffff',
      }

      const result = validatePaletteAccessibility(palette)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('includes warnings for potentially problematic colors', () => {
      const palette = {
        primary: '#000000',
        secondary: '#cccccc', // Low contrast
        accent: '#0066cc',
        background: '#ffffff',
      }

      const result = validatePaletteAccessibility(palette)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('getAccessibleTextColor', () => {
    it('returns dark text for light backgrounds', () => {
      expect(getAccessibleTextColor('#ffffff')).toBe('dark')
      expect(getAccessibleTextColor('#f0f0f0')).toBe('dark')
    })

    it('returns light text for dark backgrounds', () => {
      expect(getAccessibleTextColor('#000000')).toBe('light')
      expect(getAccessibleTextColor('#333333')).toBe('light')
    })
  })

  describe('getAccessibleColorSuggestions', () => {
    it('generates lighter and darker color suggestions', () => {
      const suggestions = getAccessibleColorSuggestions('#666666', 4.5)

      expect(suggestions.lighter).toBeTruthy()
      expect(suggestions.darker).toBeTruthy()
      expect(suggestions.lighter).toMatch(/^#[0-9a-f]{6}$/i)
      expect(suggestions.darker).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('handles invalid hex colors', () => {
      const suggestions = getAccessibleColorSuggestions('invalid', 4.5)
      expect(suggestions.lighter).toBe('#ffffff')
      expect(suggestions.darker).toBe('#000000')
    })
  })
})

