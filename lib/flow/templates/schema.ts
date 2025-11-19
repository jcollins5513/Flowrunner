import { z } from 'zod'
import { ALL_PATTERN_FAMILIES } from '../../patterns/families'
import { INTENT_CONSTANTS } from '../../ai/intent/intent.schema'

const patternFamilyEnum = z.enum(ALL_PATTERN_FAMILIES as [string, ...string[]])
const patternVariantEnum = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])

const toneEnum = z.enum(INTENT_CONSTANTS.TONES as [string, ...string[]])
const styleCueEnum = z.enum(INTENT_CONSTANTS.STYLE_CUES as [string, ...string[]])
const colorMoodEnum = z.enum(INTENT_CONSTANTS.COLOR_MOODS as [string, ...string[]])
const domainEnum = z.enum(INTENT_CONSTANTS.DOMAINS as [string, ...string[]])
const visualThemeEnum = z.enum(INTENT_CONSTANTS.VISUAL_THEMES as [string, ...string[]])

const templateFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.union([z.literal('string'), z.literal('enum')]),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  defaultValue: z.string().optional(),
})

export const templateIntentHintsSchema = z
  .object({
    tone: toneEnum.optional(),
    styleCues: z.array(styleCueEnum).min(1).max(3).optional(),
    colorMood: colorMoodEnum.optional(),
    visualTheme: visualThemeEnum.optional(),
    contentFocus: z.string().optional(),
    aiPrompt: z.string().optional(),
  })
  .optional()

export const templateHeroDefaultsSchema = z
  .object({
    vibe: z.string().min(1),
    colorMood: colorMoodEnum.optional(),
    imagePrompt: z.string().optional(),
    aspectRatio: z.string().optional(),
  })
  .optional()

export const flowTemplateScreenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  pattern: z.object({
    family: patternFamilyEnum,
    variant: patternVariantEnum,
  }),
  intentHints: templateIntentHintsSchema,
  heroDefaults: templateHeroDefaultsSchema,
})

const screenOverrideSchema = z.object({
  patternVariant: patternVariantEnum.optional(),
  intentHints: templateIntentHintsSchema,
  heroDefaults: templateHeroDefaultsSchema,
})

const templateCustomizationSchema = z
  .object({
    screenOrder: z.array(z.string()).optional(),
    screenOverrides: z.record(z.string(), screenOverrideSchema).optional(),
    fields: z.array(templateFieldSchema).optional(),
  })
  .optional()

export const flowTemplateSchema = z.object({
  id: z.string().min(1),
  domain: domainEnum,
  name: z.string().min(1),
  description: z.string().min(1),
  metadata: z
    .object({
      estimatedScreens: z.number().int().min(1).max(12).default(3),
      version: z.string().default('1.0.0'),
    })
    .default({}),
  screens: z.array(flowTemplateScreenSchema).min(1),
  customization: templateCustomizationSchema,
})

export type FlowTemplate = z.infer<typeof flowTemplateSchema>
export type FlowTemplateScreen = z.infer<typeof flowTemplateScreenSchema>
export type FlowTemplateCustomization = z.infer<typeof templateCustomizationSchema>
export type FlowTemplateFieldDefinition = z.infer<typeof templateFieldSchema>
