import { describe, it, expect, beforeEach } from 'vitest'
import { DSLAssembler } from '@/lib/dsl/assembler'
import type {
  ScreenDSL,
  PatternFamily,
  PatternVariant,
  Vibe,
  Palette,
} from '@/lib/dsl/types'
import type { HeroImageWithPalette } from '@/lib/images/orchestrator'
import type { TextGenerationResult } from '@/lib/ai/text-generation/types'

describe('DSLAssembler', () => {
  let assembler: DSLAssembler
  let mockHeroImage: HeroImageWithPalette

  beforeEach(() => {
    assembler = new DSLAssembler()

    mockHeroImage = {
      image: {
        url: 'https://example.com/image.jpg',
        prompt: 'A beautiful landscape',
        seed: 12345,
        aspectRatio: '16:9',
        style: '3d',
        metadata: {
          provider: 'test',
          createdAt: new Date(),
        },
      },
      palette: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      vibe: 'modern' as Vibe,
      imageId: 'img-123',
    }
  })

  describe('assemble', () => {
    it('should assemble a complete ScreenDSL from minimal input', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl).toBeDefined()
      expect(result.dsl.hero_image).toBeDefined()
      expect(result.dsl.hero_image.url).toBe('https://example.com/image.jpg')
      expect(result.dsl.palette).toBeDefined()
      expect(result.dsl.vibe).toBe('modern')
      expect(result.dsl.pattern_family).toBe('ONB_HERO_TOP')
      expect(result.dsl.pattern_variant).toBe(1)
      expect(result.dsl.components).toBeDefined()
      expect(result.dsl.components.length).toBeGreaterThan(0)
      expect(result.validationErrors).toBeUndefined()
    })

    it('should assemble hero_image from image metadata', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.hero_image.id).toBe('img-123')
      expect(result.dsl.hero_image.url).toBe('https://example.com/image.jpg')
      expect(result.dsl.hero_image.prompt).toBe('A beautiful landscape')
      expect(result.dsl.hero_image.seed).toBe(12345)
      expect(result.dsl.hero_image.aspectRatio).toBe('16:9')
      expect(result.dsl.hero_image.style).toBe('3d')
      expect(result.dsl.hero_image.extractedPalette).toBeDefined()
      expect(result.dsl.hero_image.vibe).toBe('modern')
    })

    it('should assemble supporting_images array', async () => {
      const supportingImage: HeroImageWithPalette = {
        image: {
          url: 'https://example.com/supporting.jpg',
          prompt: 'Supporting image',
          aspectRatio: '4:3',
          metadata: {
            provider: 'test',
            createdAt: new Date(),
          },
        },
        palette: {
          primary: '#FF0000',
          background: '#FFFFFF',
        },
      }

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'FEAT_IMAGE_TEXT_RIGHT' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        supportingImages: [supportingImage],
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.supporting_images).toBeDefined()
      expect(result.dsl.supporting_images?.length).toBe(1)
      expect(result.dsl.supporting_images?.[0].url).toBe('https://example.com/supporting.jpg')
    })

    it('should assemble palette from extracted colors', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.palette.primary).toBe('#3B82F6')
      expect(result.dsl.palette.secondary).toBe('#8B5CF6')
      expect(result.dsl.palette.accent).toBe('#F59E0B')
      expect(result.dsl.palette.background).toBe('#FFFFFF')
    })

    it('should use palette override when provided', async () => {
      const overridePalette: Palette = {
        primary: '#FF0000',
        secondary: '#00FF00',
        accent: '#0000FF',
        background: '#000000',
      }

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        paletteOverride: overridePalette,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.palette.primary).toBe('#FF0000')
      expect(result.dsl.palette.secondary).toBe('#00FF00')
      expect(result.dsl.palette.accent).toBe('#0000FF')
      expect(result.dsl.palette.background).toBe('#000000')
    })

    it('should use vibe override when provided', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        vibeOverride: 'playful' as Vibe,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.vibe).toBe('playful')
    })

    it('should assemble components from text generation result', async () => {
      const textGen: TextGenerationResult = {
        title: 'Welcome to FlowRunner',
        subtitle: 'Create beautiful UI flows',
        body: 'Start building your next project today.',
        buttonLabels: ['Get Started', 'Learn More'],
        formLabels: ['Email', 'Name'],
      }

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        textGeneration: textGen,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.components.length).toBeGreaterThan(0)
      const titleComponent = result.dsl.components.find((c) => c.type === 'title')
      expect(titleComponent?.content).toBe('Welcome to FlowRunner')
      const subtitleComponent = result.dsl.components.find((c) => c.type === 'subtitle')
      expect(subtitleComponent?.content).toBe('Create beautiful UI flows')
    })

    it('should use provided components when available', async () => {
      const components = [
        {
          type: 'title' as const,
          content: 'Custom Title',
        },
        {
          type: 'button' as const,
          content: 'Custom Button',
        },
      ]

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        components,
      }

      const result = await assembler.assemble(input, { autoGenerateComponents: false })

      expect(result.dsl.components.length).toBe(2)
      expect(result.dsl.components[0].content).toBe('Custom Title')
      expect(result.dsl.components[1].content).toBe('Custom Button')
    })

    it('should build navigation object', async () => {
      const navigation = {
        type: 'internal' as const,
        screenId: 'screen-123',
        target: 'next-screen',
      }

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        navigation,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.navigation).toBeDefined()
      expect(result.dsl.navigation?.type).toBe('internal')
      expect(result.dsl.navigation?.screenId).toBe('screen-123')
    })

    it('should assemble metadata object', async () => {
      const metadata = {
        customField: 'customValue',
        version: '1.0.0',
      }

      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        metadata,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.metadata).toBeDefined()
      expect(result.dsl.metadata?.customField).toBe('customValue')
      expect(result.dsl.metadata?.version).toBe('1.0.0')
      expect(result.dsl.metadata?.assembledAt).toBeDefined()
      expect(result.dsl.metadata?.heroImageId).toBe('img-123')
    })

    it('should validate DSL and throw on validation error', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        components: [], // Empty components should fail validation
      }

      await expect(
        assembler.assemble(input, { autoGenerateComponents: false })
      ).rejects.toThrow()
    })

    it('should return validation errors when throwOnValidationError is false', async () => {
      const input = {
        heroImage: mockHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
        components: [], // Empty components should fail validation
      }

      const result = await assembler.assemble(input, {
        autoGenerateComponents: false,
        throwOnValidationError: false,
      })

      expect(result.validationErrors).toBeDefined()
      expect(result.validationErrors?.length).toBeGreaterThan(0)
    })

    it('should handle missing optional palette fields', async () => {
      const minimalHeroImage: HeroImageWithPalette = {
        image: {
          url: 'https://example.com/image.jpg',
          prompt: 'Test',
          aspectRatio: '16:9',
          metadata: {
            provider: 'test',
            createdAt: new Date(),
          },
        },
        palette: {
          primary: '#3B82F6',
          // Missing secondary, accent, background
        },
      }

      const input = {
        heroImage: minimalHeroImage,
        patternFamily: 'ONB_HERO_TOP' as PatternFamily,
        patternVariant: 1 as PatternVariant,
      }

      const result = await assembler.assemble(input)

      expect(result.dsl.palette.primary).toBe('#3B82F6')
      expect(result.dsl.palette.secondary).toBe('#3B82F6') // Should default to primary
      expect(result.dsl.palette.accent).toBe('#3B82F6') // Should default to primary
      expect(result.dsl.palette.background).toBe('#FFFFFF') // Should default to white
    })
  })

  describe('updateDSL', () => {
    it('should update an existing DSL with partial data', async () => {
      const existingDSL: ScreenDSL = {
        hero_image: {
          id: 'existing-hero',
          url: 'https://example.com/existing.jpg',
        },
        palette: {
          primary: '#000000',
          secondary: '#111111',
          accent: '#222222',
          background: '#FFFFFF',
        },
        vibe: 'modern',
        pattern_family: 'ONB_HERO_TOP',
        pattern_variant: 1,
        components: [
          {
            type: 'title',
            content: 'Old Title',
          },
        ],
      }

      const updates = {
        components: [
          {
            type: 'title' as const,
            content: 'New Title',
          },
        ],
        metadata: {
          updated: true,
        },
      }

      const result = await assembler.updateDSL(existingDSL, updates)

      expect(result.dsl.components[0].content).toBe('New Title')
      expect(result.dsl.metadata?.updated).toBe(true)
      expect(result.dsl.metadata?.updatedAt).toBeDefined()
      expect(result.dsl.hero_image.id).toBe('existing-hero') // Should preserve existing
    })

    it('should validate updated DSL', async () => {
      const existingDSL: ScreenDSL = {
        hero_image: {
          id: 'existing-hero',
          url: 'https://example.com/existing.jpg',
        },
        palette: {
          primary: '#000000',
          secondary: '#111111',
          accent: '#222222',
          background: '#FFFFFF',
        },
        vibe: 'modern',
        pattern_family: 'ONB_HERO_TOP',
        pattern_variant: 1,
        components: [
          {
            type: 'title',
            content: 'Title',
          },
        ],
      }

      const updates = {
        components: [], // Empty components should fail validation
      }

      await expect(assembler.updateDSL(existingDSL, updates)).rejects.toThrow()
    })
  })
})

