import { NextRequest, NextResponse } from 'next/server'
import { getComponentBySlug } from '@/lib/library/component-registry'
import type { ComponentSource } from '@/lib/library/component-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const source = searchParams.get('source') as ComponentSource | null
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }
    
    const component = await getComponentBySlug(slug, source || undefined)
    
    if (!component) {
      return NextResponse.json({ component: null })
    }
    
    // Return only serializable metadata
    return NextResponse.json({
      component: {
        slug: component.slug,
        name: component.name,
        source: component.source,
        type: component.type,
        recommendedSlots: component.recommendedSlots,
        metadata: component.metadata,
        filePath: component.filePath,
        vibeCompatibility: component.vibeCompatibility,
        patternCompatibility: component.patternCompatibility,
      }
    })
  } catch (error) {
    console.error('Failed to get component by slug:', error)
    return NextResponse.json(
      { error: 'Failed to get component' },
      { status: 500 }
    )
  }
}



