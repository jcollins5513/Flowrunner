// Individual screen operations
// DELETE operations for screens

import { NextResponse } from 'next/server'
import { removeScreen } from '@/lib/flows'

// DELETE /api/flows/[flowId]/screens/[screenId] - Remove a screen
export async function DELETE(
  request: Request,
  { params }: { params: { flowId: string; screenId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const updateNavigation = searchParams.get('updateNavigation') !== 'false'

    await removeScreen(params.flowId, params.screenId, updateNavigation)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing screen:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove screen' },
      { status: 500 }
    )
  }
}

