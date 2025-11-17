// Pattern validation tests
import { describe, it, expect, beforeEach } from 'vitest'
import { validateDSLAgainstPattern, validateDSLWithPattern, formatValidationErrors } from '../../../lib/patterns/validator'
import { calculateCompatibility, getCompatibilityRecommendations } from '../../../lib/patterns/compatibility'
import { type ScreenDSL } from '../../../lib/dsl/types'
import { type PatternDefinition } from '../../../lib/patterns/schema'

describe('Pattern Validation', () => {
  const mockPattern: PatternDefinition = {
    family: 'ONB_HERO_TOP',
    variant: 1,
    name: 'Test Pattern',
    description: 'Test pattern for validation',
    layout: {
      structure: 'grid',
      gridTemplate: '1fr',
      positions: {
        hero_image: { x: 0, y: 0, width: 1, height: 1 },
        title: { x: 0, y: 1, width: 1, height: 1 },
        subtitle: { x: 0, y: 2, width: 1, height: 1 },
        button: { x: 0, y: 3, width: 1, height: 1 },
      },
    },
    componentSlots: {
      required: ['title', 'subtitle', 'button'],
      optional: ['text'],
    },
    spacing: {
      padding: 24,
      gap: 16,
    },
    responsive: {
      breakpoints: {},
    },
    imagePlacement: {
      hero: {
        position: 'top',
        size: 'full',
      },
    },
  }

  const validDSL: ScreenDSL = {
    hero_image: {
      id: 'img1',
      url: 'https://example.com/image.jpg',
    },
    palette: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff0000',
      background: '#f0f0f0',
    },
    vibe: 'modern',
    pattern_family: 'ONB_HERO_TOP',
    pattern_variant: 1,
    components: [
      { type: 'title', content: 'Test Title' },
      { type: 'subtitle', content: 'Test Subtitle' },
      { type: 'button', content: 'Click Me' },
    ],
  }

  describe('validateDSLAgainstPattern', () => {
    it('should validate a correct DSL against pattern', () => {
      const result = validateDSLAgainstPattern(validDSL, mockPattern)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required components', () => {
      const invalidDSL: ScreenDSL = {
        ...validDSL,
        components: [
          { type: 'title', content: 'Test Title' },
          // Missing subtitle and button
        ],
      }

      const result = validateDSLAgainstPattern(invalidDSL, mockPattern)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.code === 'MISSING_REQUIRED_SLOT')).toBe(true)
    })

    it('should detect invalid component types', () => {
      const invalidDSL: ScreenDSL = {
        ...validDSL,
        components: [
          { type: 'title', content: 'Test Title' },
          { type: 'subtitle', content: 'Test Subtitle' },
          { type: 'button', content: 'Click Me' },
          { type: 'form', content: 'Invalid' }, // Form not in required or optional
        ],
      }

      const result = validateDSLAgainstPattern(invalidDSL, mockPattern)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'INVALID_COMPONENT_TYPE')).toBe(true)
    })

    it('should detect pattern family mismatch', () => {
      const invalidDSL: ScreenDSL = {
        ...validDSL,
        pattern_family: 'FEAT_IMAGE_TEXT_RIGHT',
      }

      const result = validateDSLAgainstPattern(invalidDSL, mockPattern)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'PATTERN_FAMILY_MISMATCH')).toBe(true)
    })

    it('should detect pattern variant mismatch', () => {
      const invalidDSL: ScreenDSL = {
        ...validDSL,
        pattern_variant: 2,
      }

      const result = validateDSLAgainstPattern(invalidDSL, mockPattern)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'PATTERN_VARIANT_MISMATCH')).toBe(true)
    })

    it('should detect missing hero image', () => {
      const invalidDSL: ScreenDSL = {
        ...validDSL,
        hero_image: null as any,
      }

      const result = validateDSLAgainstPattern(invalidDSL, mockPattern)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'MISSING_HERO_IMAGE')).toBe(true)
    })
  })

  describe('formatValidationErrors', () => {
    it('should format errors into readable messages', () => {
      const result = validateDSLAgainstPattern(
        {
          ...validDSL,
          components: [{ type: 'title', content: 'Test' }],
        },
        mockPattern
      )

      const formatted = formatValidationErrors(result)
      expect(formatted.length).toBeGreaterThan(0)
      expect(formatted[0]).toContain(':')
    })
  })
})

describe('Pattern Compatibility', () => {
  const mockPattern: PatternDefinition = {
    family: 'ONB_HERO_TOP',
    variant: 1,
    name: 'Test Pattern',
    description: 'Test pattern',
    layout: {
      structure: 'grid',
      gridTemplate: '1fr',
      positions: {},
    },
    componentSlots: {
      required: ['title'],
      optional: [],
    },
    spacing: {
      padding: 24,
      gap: 16,
    },
    responsive: {
      breakpoints: {},
    },
    imagePlacement: {
      hero: {
        position: 'top',
        size: 'full',
      },
    },
  }

  it('should calculate compatibility score', () => {
    const image = {
      id: 'img1',
      url: 'https://example.com/image.jpg',
      vibe: 'professional' as const,
      style: 'editorial',
    }

    const palette = {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff0000',
      background: '#f0f0f0',
    }

    const score = calculateCompatibility(image, palette, mockPattern)
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
    expect(score.factors.length).toBeGreaterThan(0)
  })

  it('should provide compatibility recommendations', () => {
    const image = {
      id: 'img1',
      url: 'https://example.com/image.jpg',
      vibe: 'professional' as const,
    }

    const palette = {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff0000',
      background: '#f0f0f0',
    }

    const score = calculateCompatibility(image, palette, mockPattern)
    const recommendations = getCompatibilityRecommendations(score)
    expect(recommendations.length).toBeGreaterThan(0)
  })
})

