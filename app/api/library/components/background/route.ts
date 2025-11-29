import { NextRequest, NextResponse } from 'next/server'
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
        name: component.name,
        id: component.id,
        library: component.library,
        category: component.category,
        type: component.type,
        role: component.role,
        screenTypes: component.screenTypes,
        formFactor: component.formFactor,
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



