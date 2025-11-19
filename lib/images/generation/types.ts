import { z } from 'zod'
import { IntentVisualTheme, IntentColorMood } from '../../ai/intent/intent.schema'

export const IMAGE_STYLES = [
  '3d',
  'clay',
  'vector',
  'neon',
  'editorial',
  'illustrated',
  'photographic',
  'collage',
  'line_art',
] as const

export const ASPECT_RATIOS = [
  '16:9',
  '4:3',
  '1:1',
  '9:16',
  '21:9',
  '16:10',
] as const

export const imageGenerationRequestSchema = z.object({
  prompt: z.string().min(1),
  style: z.enum(IMAGE_STYLES).optional(),
  aspectRatio: z.enum(ASPECT_RATIOS).default('16:9'),
  seed: z.number().int().positive().optional(),
  visualTheme: z.enum(['illustrated', 'photographic', '3d', 'collage', 'line_art'] as const).optional(),
  colorMood: z.enum(['vibrant', 'muted', 'warm', 'cool', 'neon', 'monochrome'] as const).optional(),
})

export const imageGenerationResultSchema = z.object({
  url: z.string().url(),
  seed: z.number().int().positive().optional(),
  prompt: z.string().min(1),
  style: z.enum(IMAGE_STYLES).optional(),
  aspectRatio: z.enum(ASPECT_RATIOS),
  metadata: z
    .object({
      provider: z.string(),
      model: z.string().optional(),
      generationId: z.string().optional(),
      createdAt: z.date().default(() => new Date()),
    })
    .catchall(z.string())
    .default({}),
})

export type ImageStyle = (typeof IMAGE_STYLES)[number]
export type AspectRatio = (typeof ASPECT_RATIOS)[number]
export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>
export type ImageGenerationResult = z.infer<typeof imageGenerationResultSchema>

