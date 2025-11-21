import { prisma } from '../db/client'
import type { Image } from '@prisma/client'
import type { PaginationOptions } from './persistence/types'
import { ImageRepository } from './repository'

/**
 * Sort options for image queries
 */
export type ImageSortOption = 'newest' | 'oldest' | 'mostUsed' | 'leastUsed' | 'favorites'

/**
 * Extended image query filters with search capabilities
 */
export interface ImageSearchFilters {
  userId?: string
  domain?: string
  vibe?: string
  style?: string
  isFavorite?: boolean
  patternCompatibility?: string[]
  dateFrom?: Date
  dateTo?: Date
  // Text search
  searchQuery?: string // Searches in prompt and tags
  tags?: string[] // Exact tag matches
  // Palette search (simplified - checks if palette contains color)
  paletteColor?: string // Hex color to search for in palette
  // Sort option
  sortBy?: ImageSortOption
}

/**
 * Search result with metadata
 */
export interface ImageSearchResult {
  images: Image[]
  total: number
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * Service for advanced image search and filtering
 */
export class ImageSearchService {
  private repository: ImageRepository

  constructor() {
    this.repository = new ImageRepository()
  }

  /**
   * Search images with advanced filters and sorting
   */
  async searchImages(
    filters?: ImageSearchFilters,
    pagination?: PaginationOptions,
    sortBy?: ImageSortOption
  ): Promise<ImageSearchResult> {
    const sortOption = sortBy || filters?.sortBy || 'newest'
    const { limit = 50, offset = 0 } = pagination ?? {}
    const where: any = {}

    // Basic filters
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

    if (filters?.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite
    }

    // Date range filter
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    // Text search in prompt and tags (SQLite LIKE search)
    // Note: SQLite LIKE is case-insensitive by default for ASCII
    if (filters?.searchQuery) {
      const searchTerm = `%${filters.searchQuery}%`
      where.OR = [
        { prompt: { contains: filters.searchQuery } },
        { tags: { contains: filters.searchQuery } },
      ]
    }

    // Tag filter (exact matches in tags array)
    if (filters?.tags && filters.tags.length > 0) {
      // For SQLite, we need to search in the JSON array string
      // This is a simplified approach - for production, consider full-text search
      where.tags = {
        not: null,
      }
      // Note: SQLite doesn't have great JSON array search, so we'll filter in memory
      // For better performance, consider using a full-text search solution
    }

    // Pattern compatibility filter
    if (filters?.patternCompatibility && filters.patternCompatibility.length > 0) {
      where.patternCompatibilityTags = {
        not: null,
      }
    }

    // Build orderBy based on sort option
    const orderBy: any = {}
    switch (sortOption) {
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      case 'oldest':
        orderBy.createdAt = 'asc'
        break
      case 'mostUsed':
        orderBy.usageCount = 'desc'
        break
      case 'leastUsed':
        orderBy.usageCount = 'asc'
        break
      case 'favorites':
        // Favorites first, then by creation date
        orderBy.isFavorite = 'desc'
        orderBy.createdAt = 'desc'
        break
      default:
        orderBy.createdAt = 'desc'
    }

    // Get total count for pagination
    const total = await prisma.image.count({ where })

    // Fetch images
    let images = await prisma.image.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
    })

    // Filter by tags in memory (SQLite limitation)
    if (filters?.tags && filters.tags.length > 0) {
      images = images.filter((image) => {
        if (!image.tags) return false
        try {
          const imageTags: string[] = JSON.parse(image.tags)
          return filters.tags!.some((tag) =>
            imageTags.some((it) => it.toLowerCase().includes(tag.toLowerCase()))
          )
        } catch {
          return false
        }
      })
    }

    // Filter by pattern compatibility
    if (filters?.patternCompatibility && filters.patternCompatibility.length > 0) {
      images = images.filter((image) => {
        if (!image.patternCompatibilityTags) return false
        try {
          const compatTags: string[] = JSON.parse(image.patternCompatibilityTags)
          return filters.patternCompatibility!.some((pattern) =>
            compatTags.includes(pattern)
          )
        } catch {
          return false
        }
      })
    }

    // Filter by palette color (simplified - checks if any palette color matches)
    if (filters?.paletteColor) {
      images = images.filter((image) => {
        if (!image.extractedPalette) return false
        try {
          const palette = JSON.parse(image.extractedPalette)
          const searchColor = filters.paletteColor!.toLowerCase()
          return Object.values(palette).some(
            (color: any) => color && color.toLowerCase() === searchColor
          )
        } catch {
          return false
        }
      })
    }

    return {
      images,
      total: images.length, // Adjusted total after in-memory filtering
      pagination: {
        limit,
        offset,
        hasMore: offset + images.length < total,
      },
    }
  }

  /**
   * Get distinct values for filter dropdowns
   */
  async getFilterOptions(userId?: string): Promise<{
    vibes: string[]
    styles: string[]
    domains: string[]
    tags: string[]
  }> {
    const where = userId ? { userId } : {}

    const [vibes, styles, domains, allImages] = await Promise.all([
      prisma.image.findMany({
        where,
        select: { vibe: true },
        distinct: ['vibe'],
      }),
      prisma.image.findMany({
        where,
        select: { style: true },
        distinct: ['style'],
      }),
      prisma.image.findMany({
        where,
        select: { domain: true },
        distinct: ['domain'],
      }),
      prisma.image.findMany({
        where,
        select: { tags: true },
      }),
    ])

    // Extract unique tags from all images
    const tagSet = new Set<string>()
    allImages.forEach((img) => {
      if (img.tags) {
        try {
          const tags: string[] = JSON.parse(img.tags)
          tags.forEach((tag) => tagSet.add(tag))
        } catch {
          // Ignore invalid JSON
        }
      }
    })

    return {
      vibes: vibes.map((v) => v.vibe).filter((v): v is string => v !== null),
      styles: styles.map((s) => s.style).filter((s): s is string => s !== null),
      domains: domains.map((d) => d.domain).filter((d): d is string => d !== null),
      tags: Array.from(tagSet),
    }
  }
}

