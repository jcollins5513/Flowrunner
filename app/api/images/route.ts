import { NextRequest, NextResponse } from 'next/server'
import { ImageSearchService } from '@/lib/images/search-service'
import type { ImageSearchFilters } from '@/lib/images/search-service'
import type { ImageSortOption } from '@/lib/images/search-service'
import { ImageRepository } from '@/lib/images/repository'

// Mark route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchService = new ImageSearchService()
    const repository = new ImageRepository()

    // Extract query parameters
    const userId = searchParams.get('userId') ?? undefined
    const domain = searchParams.get('domain') ?? undefined
    const vibe = searchParams.get('vibe') ?? undefined
    const style = searchParams.get('style') ?? undefined
    const searchQuery = searchParams.get('search') ?? undefined
    const isFavorite = searchParams.get('favorite') === 'true' ? true : undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const patternCompatibility = searchParams.get('patternCompatibility')?.split(',').filter(Boolean)
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    const sortBy = (searchParams.get('sortBy') ?? 'newest') as ImageSortOption
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    // Build filters
    const filters: ImageSearchFilters | undefined =
      userId || domain || vibe || style || searchQuery || isFavorite !== undefined || tags?.length || patternCompatibility?.length || dateFrom || dateTo
        ? {
            userId,
            domain,
            vibe,
            style,
            searchQuery,
            isFavorite,
            tags,
            patternCompatibility,
            dateFrom,
            dateTo,
          }
        : undefined

    // Build pagination options
    const pagination = {
      limit: Math.min(limit, 100), // Cap at 100
      offset: Math.max(offset, 0),
    }

    // Search images with advanced filters
    // Use sortBy from query params or from filters
    const finalSortBy = sortBy || filters?.sortBy
    const result = await searchService.searchImages(filters, pagination, finalSortBy)

    // Return response with deserialized data
    const response = result.images.map((image) => {
      const palette = ImageRepository.deserializePalette(image.extractedPalette)
      const patternTags = ImageRepository.deserializePatternTags(image.patternCompatibilityTags)
      const tags = ImageRepository.deserializeTags(image.tags)

      return {
        id: image.id,
        url: image.url,
        prompt: image.prompt,
        seed: image.seed,
        aspectRatio: image.aspectRatio,
        style: image.style,
        palette,
        vibe: image.vibe,
        patternCompatibilityTags: patternTags,
        tags,
        domain: image.domain,
        userId: image.userId,
        isPublic: image.isPublic,
        isFavorite: image.isFavorite,
        usageCount: image.usageCount,
        parentImageId: image.parentImageId,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      images: response,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        total: result.total,
        hasMore: result.pagination.hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

