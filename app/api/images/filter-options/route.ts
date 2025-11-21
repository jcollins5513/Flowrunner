import { NextRequest, NextResponse } from 'next/server'
import { ImageSearchService } from '@/lib/images/search-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') ?? undefined

    const searchService = new ImageSearchService()
    const options = await searchService.getFilterOptions(userId)

    return NextResponse.json(options)
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}

