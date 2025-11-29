import { NextRequest, NextResponse } from 'next/server'
import { getComponentById } from '@/lib/library/component-registry'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const id = searchParams.get('id') ?? slug

    if (!id) {
      return NextResponse.json(
        { error: 'Component id is required' },
        { status: 400 }
      )
    }

    const component = getComponentById(id)

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
    console.error('Failed to get component by slug:', error)
    return NextResponse.json(
      { error: 'Failed to get component' },
      { status: 500 }
    )
  }
}



