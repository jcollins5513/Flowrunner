import { z } from 'zod'

const INTENT_DOMAINS = [
  'ecommerce',
  'saas',
  'mobile_app',
  'marketing',
  'finance',
  'healthcare',
] as const

const INTENT_STYLE_CUES = [
  'minimal',
  'modern',
  'playful',
  'luxury',
  'retro',
  'futuristic',
] as const

const INTENT_VISUAL_THEMES = [
  'illustrated',
  'photographic',
  '3d',
  'collage',
  'line_art',
] as const

const INTENT_TONES = [
  'professional',
  'friendly',
  'bold',
  'calm',
  'energetic',
] as const

const INTENT_COLOR_MOODS = [
  'vibrant',
  'muted',
  'warm',
  'cool',
  'neon',
  'monochrome',
] as const

export const intentConfidenceSchema = z.object({
  domain: z.number().min(0).max(1).default(0.6),
  style: z.number().min(0).max(1).default(0.6),
  theme: z.number().min(0).max(1).default(0.6),
  tone: z.number().min(0).max(1).default(0.6),
  color: z.number().min(0).max(1).default(0.6),
})

const fallbackSchema = z.object({
  applied: z.boolean().default(false),
  reason: z.string().optional(),
})

const metadataSchema = z
  .object({
    provider: z.string().optional(),
    model: z.string().optional(),
    responseId: z.string().optional(),
  })
  .catchall(z.string())

export const intentSchema = z.object({
  rawPrompt: z.string().min(1),
  normalizedPrompt: z.string().min(1),
  domain: z.enum(INTENT_DOMAINS).default('saas'),
  styleCues: z.array(z.enum(INTENT_STYLE_CUES)).min(1).max(3).default(['modern']),
  visualTheme: z.enum(INTENT_VISUAL_THEMES).default('illustrated'),
  tone: z.enum(INTENT_TONES).default('professional'),
  colorMood: z.enum(INTENT_COLOR_MOODS).default('vibrant'),
  confidence: intentConfidenceSchema.default({}),
  metadata: metadataSchema.default({}),
  fallback: fallbackSchema.default({}),
  createdAt: z.date().default(() => new Date()),
})

export type IntentDomain = (typeof INTENT_DOMAINS)[number]
export type IntentStyleCue = (typeof INTENT_STYLE_CUES)[number]
export type IntentVisualTheme = (typeof INTENT_VISUAL_THEMES)[number]
export type IntentTone = (typeof INTENT_TONES)[number]
export type IntentColorMood = (typeof INTENT_COLOR_MOODS)[number]
export type IntentConfidence = z.infer<typeof intentConfidenceSchema>
export type Intent = z.infer<typeof intentSchema>

export const INTENT_CONSTANTS = {
  DOMAINS: INTENT_DOMAINS,
  STYLE_CUES: INTENT_STYLE_CUES,
  VISUAL_THEMES: INTENT_VISUAL_THEMES,
  TONES: INTENT_TONES,
  COLOR_MOODS: INTENT_COLOR_MOODS,
}
