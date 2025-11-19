// Pattern metadata export stability tests
// These tests ensure pattern metadata exports stay stable and catch accidental renames/removals

import { describe, it, expect } from 'vitest'
import {
  PATTERN_FAMILY_METADATA,
  getPatternFamilyMetadata,
  getPatternFamiliesByDomain,
} from '../../../lib/patterns/metadata'
import {
  PATTERN_FAMILIES,
  ALL_PATTERN_FAMILIES,
  PATTERN_DOMAINS,
} from '../../../lib/patterns/families'
import { type PatternFamily, type PatternDomain } from '../../../lib/patterns/families'

describe('Pattern Metadata Exports', () => {
  describe('PATTERN_FAMILY_METADATA completeness', () => {
    it('should have metadata for all pattern families', () => {
      // Check that every family in PATTERN_FAMILIES has metadata
      for (const family of ALL_PATTERN_FAMILIES) {
        expect(PATTERN_FAMILY_METADATA).toHaveProperty(family)
        expect(PATTERN_FAMILY_METADATA[family]).toBeDefined()
      }
    })

    it('should not have extra metadata entries', () => {
      // Check that every metadata entry corresponds to a family
      const metadataFamilies = Object.keys(PATTERN_FAMILY_METADATA) as PatternFamily[]
      const registryFamilies = ALL_PATTERN_FAMILIES

      expect(metadataFamilies.length).toBe(registryFamilies.length)

      for (const family of metadataFamilies) {
        expect(registryFamilies).toContain(family)
      }
    })

    it('should have complete metadata structure for each family', () => {
      for (const family of ALL_PATTERN_FAMILIES) {
        const metadata = PATTERN_FAMILY_METADATA[family]

        expect(metadata).toHaveProperty('displayName')
        expect(metadata).toHaveProperty('description')
        expect(metadata).toHaveProperty('useCases')
        expect(metadata).toHaveProperty('componentSlots')
        expect(metadata).toHaveProperty('domain')

        // Validate displayName
        expect(typeof metadata.displayName).toBe('string')
        expect(metadata.displayName.length).toBeGreaterThan(0)

        // Validate description
        expect(typeof metadata.description).toBe('string')
        expect(metadata.description.length).toBeGreaterThan(0)

        // Validate useCases
        expect(Array.isArray(metadata.useCases)).toBe(true)
        expect(metadata.useCases.length).toBeGreaterThan(0)
        metadata.useCases.forEach((useCase) => {
          expect(typeof useCase).toBe('string')
          expect(useCase.length).toBeGreaterThan(0)
        })

        // Validate componentSlots
        expect(metadata.componentSlots).toHaveProperty('required')
        expect(metadata.componentSlots).toHaveProperty('optional')
        expect(Array.isArray(metadata.componentSlots.required)).toBe(true)
        expect(Array.isArray(metadata.componentSlots.optional)).toBe(true)

        // Validate domain
        expect(Object.values(PATTERN_DOMAINS)).toContain(metadata.domain)
      }
    })
  })

  describe('getPatternFamilyMetadata', () => {
    it('should return metadata for valid family', () => {
      const metadata = getPatternFamilyMetadata(PATTERN_FAMILIES.ONB_HERO_TOP)
      expect(metadata).toBeDefined()
      expect(metadata.displayName).toBeDefined()
    })

    it('should return same metadata as direct access', () => {
      for (const family of ALL_PATTERN_FAMILIES.slice(0, 5)) {
        const metadata1 = getPatternFamilyMetadata(family)
        const metadata2 = PATTERN_FAMILY_METADATA[family]
        expect(metadata1).toEqual(metadata2)
      }
    })
  })

  describe('getPatternFamiliesByDomain', () => {
    it('should return families for each domain', () => {
      for (const domain of Object.values(PATTERN_DOMAINS)) {
        const families = getPatternFamiliesByDomain(domain)
        expect(Array.isArray(families)).toBe(true)
        families.forEach((family) => {
          expect(PATTERN_FAMILY_METADATA[family].domain).toBe(domain)
        })
      }
    })

    it('should return all families when grouped by domain', () => {
      const allFamiliesByDomain = Object.values(PATTERN_DOMAINS).flatMap((domain) =>
        getPatternFamiliesByDomain(domain)
      )

      // Each family should appear exactly once
      expect(allFamiliesByDomain.length).toBe(ALL_PATTERN_FAMILIES.length)

      for (const family of ALL_PATTERN_FAMILIES) {
        expect(allFamiliesByDomain).toContain(family)
      }
    })
  })

  describe('Pattern family snapshot (stability test)', () => {
    it('should maintain expected pattern families', () => {
      // This snapshot test ensures the 12 core families are present
      const coreFamilies = [
        'ONB_HERO_TOP',
        'FEAT_IMAGE_TEXT_RIGHT',
        'FEAT_IMAGE_TEXT_LEFT',
        'CTA_SPLIT_SCREEN',
        'HERO_CENTER_TEXT',
        'NEWSLETTER_SIGNUP',
        'PRICING_TABLE',
        'TESTIMONIAL_CARD_GRID',
        'DEMO_DEVICE_FULLBLEED',
        'ACT_FORM_MINIMAL',
        'DASHBOARD_OVERVIEW',
        'PRODUCT_DETAIL',
      ]

      for (const family of coreFamilies) {
        expect(ALL_PATTERN_FAMILIES).toContain(family as PatternFamily)
        expect(PATTERN_FAMILY_METADATA).toHaveProperty(family)
      }
    })

    it('should maintain pattern family count', () => {
      // We maintain 12 canonical families in the registry
      expect(ALL_PATTERN_FAMILIES.length).toBe(12)
    })
  })

  describe('Component slot stability', () => {
    it('should maintain required slot expectations for core families', () => {
      const expectedRequiredSlots: Record<string, string[]> = {
        ONB_HERO_TOP: ['title', 'subtitle', 'button'],
        FEAT_IMAGE_TEXT_RIGHT: ['title', 'subtitle'],
        FEAT_IMAGE_TEXT_LEFT: ['title', 'subtitle'],
        CTA_SPLIT_SCREEN: ['title', 'button'],
        HERO_CENTER_TEXT: ['title'],
        NEWSLETTER_SIGNUP: ['title', 'form'],
        PRICING_TABLE: ['title'],
        TESTIMONIAL_CARD_GRID: ['title'],
        DEMO_DEVICE_FULLBLEED: ['title'],
        ACT_FORM_MINIMAL: ['title', 'form'],
        DASHBOARD_OVERVIEW: ['title'],
        PRODUCT_DETAIL: ['title'],
      }

      for (const [family, expectedSlots] of Object.entries(expectedRequiredSlots)) {
        if (ALL_PATTERN_FAMILIES.includes(family as PatternFamily)) {
          const metadata = PATTERN_FAMILY_METADATA[family as PatternFamily]
          expect(metadata.componentSlots.required).toEqual(
            expect.arrayContaining(expectedSlots)
          )
        }
      }
    })

    it('should have valid component slot types', () => {
      const validSlotTypes = ['title', 'subtitle', 'text', 'button', 'form', 'image']

      for (const family of ALL_PATTERN_FAMILIES) {
        const metadata = PATTERN_FAMILY_METADATA[family]

        // Check required slots
        metadata.componentSlots.required.forEach((slot) => {
          expect(validSlotTypes).toContain(slot)
        })

        // Check optional slots
        metadata.componentSlots.optional.forEach((slot) => {
          expect(validSlotTypes).toContain(slot)
        })

        // Ensure no overlap between required and optional
        const overlap = metadata.componentSlots.required.filter((slot) =>
          metadata.componentSlots.optional.includes(slot)
        )
        expect(overlap.length).toBe(0)
      }
    })
  })

  describe('Domain categorization', () => {
    it('should categorize families correctly by domain', () => {
      const domainMapping: Record<PatternDomain, string[]> = {
        [PATTERN_DOMAINS.COMMON]: [
          'ONB_HERO_TOP',
          'FEAT_IMAGE_TEXT_RIGHT',
          'FEAT_IMAGE_TEXT_LEFT',
          'CTA_SPLIT_SCREEN',
          'HERO_CENTER_TEXT',
          'NEWSLETTER_SIGNUP',
          'PRICING_TABLE',
          'TESTIMONIAL_CARD_GRID',
          'ACT_FORM_MINIMAL',
        ],
        [PATTERN_DOMAINS.ECOMMERCE]: ['PRODUCT_DETAIL'],
        [PATTERN_DOMAINS.SAAS]: ['DASHBOARD_OVERVIEW'],
        [PATTERN_DOMAINS.MOBILE]: ['DEMO_DEVICE_FULLBLEED'],
      }

      for (const [domain, expectedFamilies] of Object.entries(domainMapping)) {
        const families = getPatternFamiliesByDomain(domain as PatternDomain)
        for (const family of expectedFamilies) {
          if (ALL_PATTERN_FAMILIES.includes(family as PatternFamily)) {
            expect(families).toContain(family as PatternFamily)
          }
        }
      }
    })
  })
})

