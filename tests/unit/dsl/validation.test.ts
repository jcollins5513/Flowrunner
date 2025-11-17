import { describe, it, expect } from 'vitest'
import {
  validateScreenDSL,
  validateFlowDSL,
  validatePartialScreenDSL,
  validatePartialFlowDSL,
  assertScreenDSL,
  assertFlowDSL,
  ValidationError,
} from '@/lib/dsl/validator'
import type { ScreenDSL, FlowDSL } from '@/lib/dsl/schemas'

describe('DSL Validation', () => {
  describe('ScreenDSL Validation', () => {
    const validScreenDSL: ScreenDSL = {
      hero_image: {
        id: 'img-1',
        url: 'https://example.com/image.jpg',
        prompt: 'A beautiful hero image',
        seed: 12345,
        aspectRatio: '16:9',
        style: '3D',
        extractedPalette: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          background: '#FFFFFF',
        },
        vibe: 'playful',
      },
      palette: {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        background: '#FFFFFF',
      },
      vibe: 'playful',
      pattern_family: 'ONB_HERO_TOP',
      pattern_variant: 1,
      components: [
        {
          type: 'title',
          content: 'Welcome to FlowRunner',
        },
        {
          type: 'button',
          content: 'Get Started',
          props: { variant: 'primary' },
        },
      ],
      navigation: {
        type: 'internal',
        screenId: 'screen-2',
        target: 'next',
      },
      animations: {
        fadeIn: true,
      },
      metadata: {
        tags: ['onboarding', 'hero'],
      },
    }

    it('should validate a valid ScreenDSL', () => {
      const result = validateScreenDSL(validScreenDSL)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validScreenDSL)
      expect(result.error).toBeUndefined()
    })

    it('should reject ScreenDSL with missing required fields', () => {
      const invalid = { ...validScreenDSL }
      delete (invalid as any).hero_image
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.formattedErrors).toBeDefined()
      expect(result.formattedErrors?.length).toBeGreaterThan(0)
    })

    it('should reject ScreenDSL with invalid pattern family', () => {
      const invalid = {
        ...validScreenDSL,
        pattern_family: 'INVALID_PATTERN' as any,
      }
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
      expect(result.formattedErrors).toBeDefined()
    })

    it('should reject ScreenDSL with invalid pattern variant', () => {
      const invalid = {
        ...validScreenDSL,
        pattern_variant: 6 as any,
      }
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject ScreenDSL with empty components array', () => {
      const invalid = {
        ...validScreenDSL,
        components: [],
      }
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject ScreenDSL with invalid navigation (internal without screenId)', () => {
      const invalid = {
        ...validScreenDSL,
        navigation: {
          type: 'internal' as const,
          // Missing screenId
        },
      }
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject ScreenDSL with invalid navigation (external without url)', () => {
      const invalid = {
        ...validScreenDSL,
        navigation: {
          type: 'external' as const,
          // Missing url
        },
      }
      const result = validateScreenDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should validate ScreenDSL with valid external navigation', () => {
      const valid = {
        ...validScreenDSL,
        navigation: {
          type: 'external' as const,
          url: 'https://example.com',
        },
      }
      const result = validateScreenDSL(valid)
      expect(result.success).toBe(true)
    })

    it('should validate ScreenDSL with minimal required fields', () => {
      const minimal: ScreenDSL = {
        hero_image: {
          id: 'img-1',
          url: 'https://example.com/image.jpg',
        },
        palette: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          background: '#FFFFFF',
        },
        vibe: 'playful',
        pattern_family: 'ONB_HERO_TOP',
        pattern_variant: 1,
        components: [
          {
            type: 'title',
            content: 'Minimal Screen',
          },
        ],
      }
      const result = validateScreenDSL(minimal)
      expect(result.success).toBe(true)
    })

    it('should validate ScreenDSL with all pattern variants', () => {
      for (let variant = 1; variant <= 5; variant++) {
        const screen = {
          ...validScreenDSL,
          pattern_variant: variant as 1 | 2 | 3 | 4 | 5,
        }
        const result = validateScreenDSL(screen)
        expect(result.success).toBe(true)
      }
    })

    it('should validate ScreenDSL with all pattern families', () => {
      const families = [
        'ONB_HERO_TOP',
        'FEAT_IMAGE_TEXT_RIGHT',
        'DEMO_DEVICE_FULLBLEED',
        'ACT_FORM_MINIMAL',
      ]
      for (const family of families) {
        const screen = {
          ...validScreenDSL,
          pattern_family: family as any,
        }
        const result = validateScreenDSL(screen)
        expect(result.success).toBe(true)
      }
    })

    it('should validate ScreenDSL with all component types', () => {
      const componentTypes = ['title', 'subtitle', 'button', 'form', 'text', 'image']
      for (const type of componentTypes) {
        const screen = {
          ...validScreenDSL,
          components: [
            {
              type: type as any,
              content: 'Test content',
            },
          ],
        }
        const result = validateScreenDSL(screen)
        expect(result.success).toBe(true)
      }
    })

    it('assertScreenDSL should throw on invalid data', () => {
      const invalid = { ...validScreenDSL }
      delete (invalid as any).hero_image
      expect(() => assertScreenDSL(invalid)).toThrow(ValidationError)
    })

    it('assertScreenDSL should return data on valid input', () => {
      const result = assertScreenDSL(validScreenDSL)
      expect(result).toEqual(validScreenDSL)
    })
  })

  describe('FlowDSL Validation', () => {
    const validScreenDSL: ScreenDSL = {
      hero_image: {
        id: 'img-1',
        url: 'https://example.com/image.jpg',
      },
      palette: {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        background: '#FFFFFF',
      },
      vibe: 'playful',
      pattern_family: 'ONB_HERO_TOP',
      pattern_variant: 1,
      components: [
        {
          type: 'title',
          content: 'Screen 1',
        },
      ],
    }

    const validFlowDSL: FlowDSL = {
      id: 'flow-1',
      name: 'Test Flow',
      description: 'A test flow',
      domain: 'e-commerce',
      theme: 'modern',
      style: 'minimal',
      screens: [validScreenDSL],
    }

    it('should validate a valid FlowDSL', () => {
      const result = validateFlowDSL(validFlowDSL)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validFlowDSL)
    })

    it('should reject FlowDSL with missing required fields', () => {
      const invalid = { ...validFlowDSL }
      delete (invalid as any).id
      const result = validateFlowDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject FlowDSL with empty name', () => {
      const invalid = {
        ...validFlowDSL,
        name: '',
      }
      const result = validateFlowDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject FlowDSL with empty screens array', () => {
      const invalid = {
        ...validFlowDSL,
        screens: [],
      }
      const result = validateFlowDSL(invalid)
      expect(result.success).toBe(false)
    })

    it('should validate FlowDSL with minimal required fields', () => {
      const minimal: FlowDSL = {
        id: 'flow-1',
        name: 'Minimal Flow',
        screens: [validScreenDSL],
      }
      const result = validateFlowDSL(minimal)
      expect(result.success).toBe(true)
    })

    it('should validate FlowDSL with multiple screens', () => {
      const flow = {
        ...validFlowDSL,
        screens: [validScreenDSL, validScreenDSL, validScreenDSL],
      }
      const result = validateFlowDSL(flow)
      expect(result.success).toBe(true)
      expect(result.data?.screens.length).toBe(3)
    })

    it('assertFlowDSL should throw on invalid data', () => {
      const invalid = { ...validFlowDSL }
      delete (invalid as any).id
      expect(() => assertFlowDSL(invalid)).toThrow(ValidationError)
    })

    it('assertFlowDSL should return data on valid input', () => {
      const result = assertFlowDSL(validFlowDSL)
      expect(result).toEqual(validFlowDSL)
    })
  })

  describe('Partial Validation', () => {
    const validScreenDSL: ScreenDSL = {
      hero_image: {
        id: 'img-1',
        url: 'https://example.com/image.jpg',
      },
      palette: {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        background: '#FFFFFF',
      },
      vibe: 'playful',
      pattern_family: 'ONB_HERO_TOP',
      pattern_variant: 1,
      components: [
        {
          type: 'title',
          content: 'Screen 1',
        },
      ],
    }

    it('should validate partial ScreenDSL with only some fields', () => {
      const partial = {
        palette: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          background: '#FFFFFF',
        },
      }
      const result = validatePartialScreenDSL(partial)
      expect(result.success).toBe(true)
    })

    it('should validate empty partial ScreenDSL', () => {
      const result = validatePartialScreenDSL({})
      expect(result.success).toBe(true)
    })

    it('should validate partial ScreenDSL with invalid nested field', () => {
      const partial = {
        palette: {
          primary: 123, // Invalid type
        },
      }
      const result = validatePartialScreenDSL(partial)
      expect(result.success).toBe(false)
    })

    it('should validate partial FlowDSL with only some fields', () => {
      const partial = {
        name: 'Updated Flow Name',
        description: 'Updated description',
      }
      const result = validatePartialFlowDSL(partial)
      expect(result.success).toBe(true)
    })

    it('should validate empty partial FlowDSL', () => {
      const result = validatePartialFlowDSL({})
      expect(result.success).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      const result = validateScreenDSL(null)
      expect(result.success).toBe(false)
      expect(result.formattedErrors).toBeDefined()
    })

    it('should handle undefined input gracefully', () => {
      const result = validateScreenDSL(undefined)
      expect(result.success).toBe(false)
    })

    it('should handle empty object input', () => {
      const result = validateScreenDSL({})
      expect(result.success).toBe(false)
      expect(result.formattedErrors?.length).toBeGreaterThan(0)
    })

    it('should validate ScreenDSL with all optional fields', () => {
      const screen: ScreenDSL = {
        hero_image: {
          id: 'img-1',
          url: 'https://example.com/image.jpg',
          prompt: 'Prompt',
          seed: 123,
          aspectRatio: '16:9',
          style: '3D',
          extractedPalette: {
            primary: '#FF0000',
            secondary: '#00FF00',
            accent: '#0000FF',
            background: '#FFFFFF',
          },
          vibe: 'playful',
        },
        supporting_images: [
          {
            id: 'img-2',
            url: 'https://example.com/image2.jpg',
          },
        ],
        palette: {
          primary: '#FF0000',
          secondary: '#00FF00',
          accent: '#0000FF',
          background: '#FFFFFF',
        },
        vibe: 'playful',
        pattern_family: 'ONB_HERO_TOP',
        pattern_variant: 1,
        components: [
          {
            type: 'title',
            content: 'Full Screen',
            props: { size: 'large' },
          },
        ],
        navigation: {
          type: 'internal',
          screenId: 'screen-2',
          target: 'next',
        },
        animations: {
          fadeIn: true,
          duration: 300,
        },
        metadata: {
          tags: ['test'],
          version: 1,
        },
      }
      const result = validateScreenDSL(screen)
      expect(result.success).toBe(true)
    })

    it('should validate all vibe types', () => {
      const vibes = [
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
        const screen: ScreenDSL = {
          hero_image: {
            id: 'img-1',
            url: 'https://example.com/image.jpg',
          },
          palette: {
            primary: '#FF0000',
            secondary: '#00FF00',
            accent: '#0000FF',
            background: '#FFFFFF',
          },
          vibe: vibe as any,
          pattern_family: 'ONB_HERO_TOP',
          pattern_variant: 1,
          components: [
            {
              type: 'title',
              content: 'Test',
            },
          ],
        }
        const result = validateScreenDSL(screen)
        expect(result.success).toBe(true)
      }
    })
  })
})

