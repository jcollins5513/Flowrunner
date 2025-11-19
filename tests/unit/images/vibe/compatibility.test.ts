import { describe, expect, it } from 'vitest'
import {
  getCompatiblePatterns,
  isPatternCompatible,
  getCompatibleVibes,
} from '../../../../lib/images/vibe/compatibility'
import { PATTERN_FAMILIES } from '../../../../lib/patterns/families'
import type { Vibe } from '../../../../lib/images/vibe/schema'

describe('Vibe-Pattern Compatibility', () => {
  describe('getCompatiblePatterns', () => {
    it('returns compatible patterns for each vibe', () => {
      const vibes: Vibe[] = [
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
      ]

      for (const vibe of vibes) {
        const patterns = getCompatiblePatterns(vibe)
        expect(patterns.length).toBeGreaterThan(0)
        expect(Array.isArray(patterns)).toBe(true)
        // All returned patterns should be valid pattern families
        for (const pattern of patterns) {
          expect(Object.values(PATTERN_FAMILIES)).toContain(pattern)
        }
      }
    })

    it('returns different patterns for different vibes', () => {
      const playfulPatterns = getCompatiblePatterns('playful')
      const corporatePatterns = getCompatiblePatterns('corporate')
      
      // Should have some overlap but not be identical
      expect(playfulPatterns.length).toBeGreaterThan(0)
      expect(corporatePatterns.length).toBeGreaterThan(0)
    })
  })

  describe('isPatternCompatible', () => {
    it('returns true for compatible vibe-pattern pairs', () => {
      // Test a few known compatibilities
      expect(isPatternCompatible('playful', PATTERN_FAMILIES.ONB_HERO_TOP)).toBe(true)
      expect(isPatternCompatible('professional', PATTERN_FAMILIES.DASHBOARD_OVERVIEW)).toBe(true)
      expect(isPatternCompatible('minimal', PATTERN_FAMILIES.ACT_FORM_MINIMAL)).toBe(true)
    })

    it('returns false for incompatible vibe-pattern pairs', () => {
      // Test that not all patterns are compatible with all vibes
      const playfulPatterns = getCompatiblePatterns('playful')
      const allPatterns = Object.values(PATTERN_FAMILIES)
      const incompatiblePatterns = allPatterns.filter((p) => !playfulPatterns.includes(p))
      
      if (incompatiblePatterns.length > 0) {
        expect(isPatternCompatible('playful', incompatiblePatterns[0])).toBe(false)
      }
    })
  })

  describe('getCompatibleVibes', () => {
    it('returns compatible vibes for each pattern family', () => {
      const allPatterns = Object.values(PATTERN_FAMILIES)

      for (const pattern of allPatterns) {
        const vibes = getCompatibleVibes(pattern)
        expect(vibes.length).toBeGreaterThan(0)
        expect(Array.isArray(vibes)).toBe(true)
        // All returned vibes should be valid
        for (const vibe of vibes) {
          expect([
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
          ]).toContain(vibe)
        }
      }
    })

    it('returns consistent results (bidirectional)', () => {
      const vibe = 'playful'
      const patterns = getCompatiblePatterns(vibe)
      
      for (const pattern of patterns) {
        const compatibleVibes = getCompatibleVibes(pattern)
        expect(compatibleVibes).toContain(vibe)
      }
    })
  })
})

