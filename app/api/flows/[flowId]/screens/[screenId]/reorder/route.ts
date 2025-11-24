import { NextResponse } from 'next/server'
import { reorderScreen } from '@/lib/flows'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string; screenId: string }> }
) {
  try {
    const { flowId, screenId } = await params
    const body = await request.json()
    const newOrder = typeof body.newOrder === 'number' ? body.newOrder : 0
    const orAfterScreenId = typeof body.orAfterScreenId === 'string' ? body.orAfterScreenId : undefined
    const orBeforeScreenId = typeof body.orBeforeScreenId === 'string' ? body.orBeforeScreenId : undefined

    if (
      typeof newOrder !== 'number' &&
      !orAfterScreenId &&
      !orBeforeScreenId
    ) {
      return NextResponse.json({ error: 'newOrder or relative screen is required' }, { status: 400 })
    }

    await reorderScreen(flowId, {
      screenId,
      newOrder,
      orAfterScreenId,
      orBeforeScreenId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering screen:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reorder screen' },
      { status: 500 }
    )
  }
}

