import { z } from 'zod'
import type { Palette } from '../palette'
import type { Vibe } from '../vibe'

/**
 * Data required to save an image to the database
 */
export interface SaveImageData {
  url: string
  prompt?: string | null
  seed?: number | null
  aspectRatio?: string | null
  style?: string | null
  palette?: Palette | null
  vibe?: Vibe | null
  domain?: string | null
  userId?: string | null
  patternCompatibilityTags?: string[] | null
}

/**
 * Zod schema for validating image data before persistence
 */
export const saveImageDataSchema = z.object({
  url: z.string().url().min(1),
  prompt: z.string().min(1).nullable().optional(),
  seed: z.number().int().positive().nullable().optional(),
  aspectRatio: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  palette: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
    .nullable()
    .optional(),
  vibe: z
    .enum([
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
    ])
    .nullable()
    .optional(),
  domain: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  patternCompatibilityTags: z.array(z.string()).nullable().optional(),
})

/**
 * Pagination options for image queries
 */
export interface PaginationOptions {
  limit?: number
  offset?: number
}

/**
 * Image query filters
 */
export interface ImageQueryFilters {
  userId?: string
  domain?: string
  vibe?: Vibe
  style?: string
}

