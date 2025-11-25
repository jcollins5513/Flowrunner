import { prisma } from '../db/client'
import type { Image, ImageVersion } from '@prisma/client'
import type {
  SaveImageData,
  PaginationOptions,
  ImageQueryFilters,
  StorageMetadata,
} from './persistence/types'
import { saveImageDataSchema } from './persistence/types'

type ImageWithVersion = Image & { latestVersion?: ImageVersion | null }

/**
 * Repository for image persistence operations
 */
export class ImageRepository {
  /**
   * Save an image to the database
   * Validates data and serializes palette/metadata as JSON
   */
  async saveImage(imageData: SaveImageData): Promise<Image & { version?: ImageVersion }> {
    // Validate input data
    const validated = saveImageDataSchema.parse(imageData)

    // Serialize palette to JSON string
    const extractedPalette = validated.palette ? JSON.stringify(validated.palette) : null

    // Serialize pattern compatibility tags to JSON array string
    const patternCompatibilityTags = validated.patternCompatibilityTags
      ? JSON.stringify(validated.patternCompatibilityTags)
      : null

    // Serialize tags to JSON array string
    const tags = validated.tags ? JSON.stringify(validated.tags) : null

    const storage = validated.storage

    // Save to database
    const client = prisma as unknown as { $transaction?: Function; [key: string]: unknown }
    const runTransaction = client.$transaction
      ? <T>(fn: (tx: any) => Promise<T>) => client.$transaction!(fn)
      : async <T>(fn: (tx: any) => Promise<T>) => fn(client)

    const result = await runTransaction(async (tx) => {
      const createdImage = await tx.image.create({
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
          tags,
          isPublic: false,
          isFavorite: false,
          usageCount: 0,
          storageDriver: storage?.driver ?? undefined,
        },
      })

      if (!storage) {
        return { image: createdImage }
      }

      const version = await tx.imageVersion.create({
        data: this.mapStorageToVersion(storage, createdImage.id),
      })

      const updatedImage = await tx.image.update({
        where: { id: createdImage.id },
        data: { latestVersionId: version.id },
      })

      return { image: updatedImage, version }
    })

    const { image, version } = result
    return version ? { ...image, version } : image
  }

  /**
   * Get an image by ID
   */
  async getImageById(id: string): Promise<Image | null> {
    return prisma.image.findUnique({
      where: { id },
    })
  }

  async getImageWithVersion(id: string): Promise<ImageWithVersion | null> {
    return prisma.image.findUnique({
      where: { id },
      include: { latestVersion: true },
    })
  }

  async getRenderableImage(id: string): Promise<{ image: Image; version?: ImageVersion | null; urls: ReturnType<ImageRepository['getRenderableUrls']> } | null> {
    const image = await this.getImageWithVersion(id)
    if (!image) return null

    const urls = this.getRenderableUrls(image, image.latestVersion ?? null)

    return { image, version: image.latestVersion ?? null, urls }
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

  async queryImagesWithVersions(
    filters?: ImageQueryFilters,
    options?: PaginationOptions
  ): Promise<ImageWithVersion[]> {
    const images = await this.queryImages(filters, options)
    const ids = images.map((image) => image.id)

    if (!ids.length) return []

    const withVersions = await prisma.image.findMany({
      where: { id: { in: ids } },
      include: { latestVersion: true },
      orderBy: { createdAt: 'desc' },
    })

    return withVersions
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

  /**
   * Deserialize user tags from JSON array string
   */
  static deserializeTags(tagsJson: string | null): string[] | null {
    if (!tagsJson) return null
    try {
      return JSON.parse(tagsJson)
    } catch (error) {
      console.warn('Failed to deserialize tags:', error)
      return null
    }
  }

  /**
   * Update image favorite status
   */
  async updateFavorite(id: string, isFavorite: boolean): Promise<Image> {
    return prisma.image.update({
      where: { id },
      data: { isFavorite },
    })
  }

  /**
   * Update image tags
   */
  async updateTags(id: string, tags: string[]): Promise<Image> {
    const tagsJson = tags.length > 0 ? JSON.stringify(tags) : null
    return prisma.image.update({
      where: { id },
      data: { tags: tagsJson },
    })
  }

  /**
   * Increment usage count
   */
  async incrementUsageCount(id: string): Promise<Image> {
    return prisma.image.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    })
  }

  getRenderableUrls(image: Image, version?: ImageVersion | null): {
    url: string
    optimizedUrl?: string | null
    thumbnailUrl?: string | null
  } {
    const resolvedVersion = (version ?? (image as any).version ?? (image as any).latestVersion) as
      | ImageVersion
      | null
      | undefined

    if (!resolvedVersion) {
      return {
        url: image.url,
        optimizedUrl: image.url,
        thumbnailUrl: null,
      }
    }

    const metadata = (resolvedVersion.metadata as Record<string, any> | null) ?? null
    const webpUrl = metadata?.webpUrl as string | undefined

    return {
      url: webpUrl ?? resolvedVersion.optimizedUrl ?? resolvedVersion.url,
      optimizedUrl: resolvedVersion.optimizedUrl ?? resolvedVersion.url,
      thumbnailUrl: resolvedVersion.thumbnailUrl ?? null,
    }
  }

  private mapStorageToVersion(storage: StorageMetadata, imageId: string) {
    return {
      imageId,
      url: storage.url,
      storageKey: storage.key,
      bucket: storage.bucket ?? null,
      storageDriver: storage.driver,
      optimizedUrl: storage.optimizedUrl ?? storage.url,
      optimizedStorageKey: storage.optimizedKey ?? storage.key,
      thumbnailUrl: storage.thumbnailUrl ?? null,
      thumbnailStorageKey: storage.thumbnailKey ?? null,
      format: storage.format ?? null,
      bytes: storage.bytes ?? null,
      width: storage.width ?? null,
      height: storage.height ?? null,
      metadata: storage.metadata ?? null,
      parentVersionId: storage.parentVersionId ?? null,
    }
  }
}

