import { NextRequest, NextResponse } from 'next/server'
import { selectBackgroundComponent } from '@/lib/library/component-selector'

export async function POST(request: NextRequest) {
  try {
    const context = await request.json()
    
    const component = await selectBackgroundComponent(context)
    
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
    console.error('Failed to select background component:', error)
    return NextResponse.json(
      { error: 'Failed to select background component' },
      { status: 500 }
    )
  }
}



