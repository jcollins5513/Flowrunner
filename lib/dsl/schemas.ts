// Zod schemas for DSL validation
import { z } from 'zod'

// Base schemas

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  .describe('Hex color (supports 3 or 6 characters)')

export const paletteSchema = z
  .object({
    primary: hexColor.describe('Primary color in hex format'),
    secondary: hexColor.describe('Secondary color in hex format'),
    accent: hexColor.describe('Accent color in hex format'),
    background: hexColor.describe('Background color in hex format'),
  })
  .describe('Color palette with primary, secondary, accent, and background colors')

export const patternFamilySchema = z
  .enum([
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
  ])
  .describe('Layout pattern family identifier')

export const patternVariantSchema = z
  .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
  .describe('Pattern variant number (1-5)')

export const vibeSchema = z
  .enum([
    'playful',
    'professional',
    'bold',
    'minimal',
    'modern',
    'retro',
    'elegant', // Additional vibes
    'energetic',
    'calm',
    'tech',
    'creative',
    'corporate',
  ])
  .describe('Visual vibe or stylistic descriptor')

export const heroImageSchema = z
  .object({
    id: z.string().describe('Unique identifier for the image'),
    url: z.string().url().describe('URL or path to the image'),
    prompt: z.string().optional().describe('Prompt used to generate the image'),
    seed: z.number().int().optional().describe('Seed value for reproducible generation'),
    aspectRatio: z.string().optional().describe('Aspect ratio of the image (e.g., "16:9")'),
    style: z.string().optional().describe('Image style (3D, clay, vector, neon, editorial, etc.)'),
    extractedPalette: paletteSchema.optional().describe('Color palette extracted from the image'),
    vibe: vibeSchema.optional().describe('Vibe inferred from the image'),
  })
  .describe('Hero image with metadata')

export const componentSchema = z
  .object({
    type: z
      .enum(['title', 'subtitle', 'button', 'form', 'text', 'image'])
      .describe('Type of component'),
    content: z.string().min(1).describe('Text content or label for the component'),
    props: z.record(z.unknown()).optional().describe('Additional component properties'),
  })
  .describe('UI component definition')

export const navigationSchema = z
  .object({
    type: z.enum(['internal', 'external']).describe('Navigation type'),
    target: z.string().optional().describe('Target identifier or label'),
    screenId: z
      .string()
      .optional()
      .describe('Target screen ID (required for internal navigation)'),
    url: z.string().url().optional().describe('External URL (required for external navigation)'),
  })
  .refine(
    (data) => {
      if (data.type === 'internal') {
        return !!data.screenId
      }
      if (data.type === 'external') {
        return !!data.url
      }
      return true
    },
    {
      message:
        'Internal navigation requires screenId, external navigation requires url',
    }
  )
  .describe('Navigation configuration')

// Composite schemas

export const screenDSLSchema = z
  .object({
    hero_image: heroImageSchema.describe('Primary hero image for the screen'),
    supporting_images: z
      .array(heroImageSchema)
      .optional()
      .describe('Additional supporting images'),
    palette: paletteSchema.describe('Color palette for the screen'),
    vibe: vibeSchema.describe('Visual vibe of the screen'),
    pattern_family: patternFamilySchema.describe('Layout pattern family'),
    pattern_variant: patternVariantSchema.describe('Specific pattern variant (1-5)'),
    components: z
      .array(componentSchema)
      .min(1)
      .describe('Array of UI components (must have at least one)'),
    navigation: navigationSchema.optional().describe('Navigation configuration'),
    animations: z
      .record(z.unknown())
      .optional()
      .describe('Animation configuration object'),
    metadata: z
      .record(z.unknown())
      .optional()
      .describe('Additional metadata for the screen'),
  })
  .describe('Complete screen DSL definition')

export const flowDSLSchema = z
  .object({
    id: z.string().describe('Unique identifier for the flow'),
    name: z.string().min(1).describe('Name of the flow'),
    description: z.string().optional().describe('Description of the flow'),
    domain: z.string().optional().describe('Domain category (e.g., e-commerce, SaaS)'),
    theme: z.string().optional().describe('Theme identifier'),
    style: z.string().optional().describe('Style identifier'),
    screens: z
      .array(screenDSLSchema)
      .min(1)
      .describe('Array of screens in the flow (must have at least one)'),
  })
  .describe('Complete flow DSL definition')

// Partial schemas for incremental updates

export const partialScreenDSLSchema = screenDSLSchema.partial().describe('Partial screen DSL for incremental updates')

export const partialFlowDSLSchema = flowDSLSchema.partial().describe('Partial flow DSL for incremental updates')

// Type exports (inferred from schemas)
export type Palette = z.infer<typeof paletteSchema>
export type PatternFamily = z.infer<typeof patternFamilySchema>
export type PatternVariant = z.infer<typeof patternVariantSchema>
export type Vibe = z.infer<typeof vibeSchema>
export type HeroImage = z.infer<typeof heroImageSchema>
export type Component = z.infer<typeof componentSchema>
export type Navigation = z.infer<typeof navigationSchema>
export type ScreenDSL = z.infer<typeof screenDSLSchema>
export type FlowDSL = z.infer<typeof flowDSLSchema>
export type PartialScreenDSL = z.infer<typeof partialScreenDSLSchema>
export type PartialFlowDSL = z.infer<typeof partialFlowDSLSchema>
