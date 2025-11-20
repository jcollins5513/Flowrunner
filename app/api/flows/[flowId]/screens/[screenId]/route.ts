// Individual screen operations
// PUT and DELETE operations for screens

import { NextResponse } from 'next/server'
import { removeScreen } from '@/lib/flows'
import { updateScreenWithValidation } from '@/lib/db/dsl-persistence'
import { ValidationError } from '@/lib/dsl/validator'
import type { ScreenDSL } from '@/lib/dsl/types'

// PUT /api/flows/[flowId]/screens/[screenId] - Update a screen
export async function PUT(
  request: Request,
  { params }: { params: { flowId: string; screenId: string } }
) {
  try {
    const body = await request.json()
    const dslUpdate = body.dsl as Partial<ScreenDSL>

    if (!dslUpdate) {
      return NextResponse.json({ error: 'DSL update is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const skipPatternValidation = searchParams.get('skipPatternValidation') === 'true'
    const changeType = searchParams.get('changeType') || 'edit'

    // Verify screen belongs to flow
    const { prisma } = await import('@/lib/db/client')
    const screen = await prisma.screen.findUnique({
      where: { id: params.screenId },
    })

    if (!screen || screen.flowId !== params.flowId) {
      return NextResponse.json({ error: 'Screen not found in flow' }, { status: 404 })
    }

    const result = await updateScreenWithValidation(params.screenId, dslUpdate, {
      skipPatternValidation,
      changeType: changeType as string,
    })

    // Return updated screen with DSL
    return NextResponse.json({
      success: true,
      screen: result.screen,
      dsl: result.dsl,
    })
  } catch (error) {
    console.error('Error updating screen:', error)

    if (error instanceof ValidationError) {
      // ValidationError may have zodError or formattedErrors
      const validationErrors = error.message
        ? [error.message]
        : ['Validation failed']
      
      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update screen' },
      { status: 500 }
    )
  }
}

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

