import { NextRequest, NextResponse } from 'next/server'
import { selectLibraryComponent } from '@/lib/library/component-selector'
import type { ComponentSelectionContext } from '@/lib/library/component-types'

export async function POST(request: NextRequest) {
  try {
    const context: ComponentSelectionContext = await request.json()
    
    const component = await selectLibraryComponent(context)
    
    if (!component) {
      return NextResponse.json({ component: null })
    }

    // Return only serializable metadata, not the component itself
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
    console.error('Failed to select library component:', error)
    return NextResponse.json(
      { error: 'Failed to select component' },
      { status: 500 }
    )
  }
}



