import { prisma } from '../db/client'
import type { Image } from '@prisma/client'
import type { SaveImageData, PaginationOptions, ImageQueryFilters } from './persistence/types'
import { saveImageDataSchema } from './persistence/types'

/**
 * Repository for image persistence operations
 */
export class ImageRepository {
  /**
   * Save an image to the database
   * Validates data and serializes palette/metadata as JSON
   */
  async saveImage(imageData: SaveImageData): Promise<Image> {
    // Validate input data
    const validated = saveImageDataSchema.parse(imageData)

    // Serialize palette to JSON string
    const extractedPalette = validated.palette ? JSON.stringify(validated.palette) : null

    // Serialize pattern compatibility tags to JSON array string
    const patternCompatibilityTags = validated.patternCompatibilityTags
      ? JSON.stringify(validated.patternCompatibilityTags)
      : null

    // Save to database
    const image = await prisma.image.create({
      data: {
        url: validated.url,
        prompt: validated.prompt ?? null,
        seed: validated.seed ?? null,
        aspectRatio: validated.aspectRatio ?? null,
        style: validated.style ?? null,
        extractedPalette,
        vibe: validated.vibe ?? null,
        domain: validated.domain ?? null,
        userId: validated.userId ?? null,
        patternCompatibilityTags,
        isPublic: false,
        isFavorite: false,
        usageCount: 0,
      },
    })

    return image
  }

  /**
   * Get an image by ID
   */
  async getImageById(id: string): Promise<Image | null> {
    return prisma.image.findUnique({
      where: { id },
    })
  }

  /**
   * Get images by user ID with pagination
   */
  async getImagesByUser(
    userId: string,
    options?: PaginationOptions
  ): Promise<Image[]> {
    const { limit = 50, offset = 0 } = options ?? {}

    return prisma.image.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Query images with filters and pagination
   */
  async queryImages(
    filters?: ImageQueryFilters,
    options?: PaginationOptions
  ): Promise<Image[]> {
    const { limit = 50, offset = 0 } = options ?? {}
    const where: any = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.domain) {
      where.domain = filters.domain
    }

    if (filters?.vibe) {
      where.vibe = filters.vibe
    }

    if (filters?.style) {
      where.style = filters.style
    }

    return prisma.image.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Deserialize palette from JSON string
   */
  static deserializePalette(paletteJson: string | null): any | null {
    if (!paletteJson) return null
    try {
      return JSON.parse(paletteJson)
    } catch (error) {
      console.warn('Failed to deserialize palette:', error)
      return null
    }
  }

  /**
   * Deserialize pattern compatibility tags from JSON array string
   */
  static deserializePatternTags(tagsJson: string | null): string[] | null {
    if (!tagsJson) return null
    try {
      return JSON.parse(tagsJson)
    } catch (error) {
      console.warn('Failed to deserialize pattern tags:', error)
      return null
    }
  }
}

