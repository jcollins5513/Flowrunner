import { NextRequest, NextResponse } from 'next/server'
import { ImageRepository } from '@/lib/images/repository'
import type { ImageQueryFilters, PaginationOptions } from '@/lib/images/persistence/types'

// Mark route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const repository = new ImageRepository()

    // Extract query parameters
    const userId = searchParams.get('userId') ?? undefined
    const domain = searchParams.get('domain') ?? undefined
    const vibe = searchParams.get('vibe') ?? undefined
    const style = searchParams.get('style') ?? undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0

    // Build filters
    const filters: ImageQueryFilters | undefined =
      userId || domain || vibe || style
        ? {
            userId,
            domain,
            vibe: vibe as any,
            style,
          }
        : undefined

    // Build pagination options
    const pagination: PaginationOptions = {
      limit: Math.min(limit, 100), // Cap at 100
      offset: Math.max(offset, 0),
    }

    // Query images
    const images = await repository.queryImages(filters, pagination)

    // Return response with basic metadata
    const response = images.map((image) => ({
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      vibe: image.vibe,
      style: image.style,
      domain: image.domain,
      createdAt: image.createdAt.toISOString(),
    }))

    return NextResponse.json({
      images: response,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        count: response.length,
      },
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

