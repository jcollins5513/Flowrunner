import { NextRequest, NextResponse } from 'next/server'
import { selectLibraryComponent } from '@/lib/library/component-selector'
import type { ComponentSelectionContext } from '@/lib/library/component-types'

export async function POST(request: NextRequest) {
  try {
    const context: ComponentSelectionContext = await request.json()

    const selection = await selectLibraryComponent(context)

    if (!selection) {
      return NextResponse.json({ component: null })
    }

    // Return only serializable metadata, not the component itself
    return NextResponse.json({
      component: {
        name: selection.component.name,
        id: selection.component.id,
        library: selection.component.library,
        tier: selection.component.tier,
        category: selection.component.category,
        type: selection.component.type,
        role: selection.component.role,
        screenTypes: selection.component.screenTypes,
        formFactor: selection.component.formFactor,
        allowedSlots: selection.component.allowedSlots,
        complexity: selection.component.complexity,
      },
      upgrades: selection.upgrades.map((upgrade) => ({
        id: upgrade.toId,
        name: upgrade.component.name,
        tier: upgrade.component.tier,
        type: upgrade.component.type,
        role: upgrade.component.role,
        category: upgrade.component.category,
      })),
      score: selection.score,
      reasons: selection.reasons,
    })
  } catch (error) {
    console.error('Failed to select library component:', error)
    return NextResponse.json(
      { error: 'Failed to select component' },
      { status: 500 }
    )
  }
}



