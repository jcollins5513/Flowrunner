// Screen management endpoints for a flow
// GET, POST operations for screens within a flow

import { NextResponse } from 'next/server'
import { getScreenSequence, insertScreen, removeScreen, getOrderedScreens } from '@/lib/flows'
import type { InsertScreenOptions } from '@/lib/flows/types'
import type { ScreenDSL } from '@/lib/dsl/types'

// GET /api/flows/[flowId]/screens - Get all screens in a flow
export async function GET(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'ordered' // 'ordered' or 'sequence'

    if (format === 'sequence') {
      const sequence = await getScreenSequence(params.flowId)
      return NextResponse.json(sequence)
    } else {
      const screens = await getOrderedScreens(params.flowId)
      return NextResponse.json(screens)
    }
  } catch (error) {
    console.error('Error fetching screens:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch screens' },
      { status: 500 }
    )
  }
}

// POST /api/flows/[flowId]/screens - Insert a new screen
export async function POST(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const body = await request.json()

    const insertOptions: InsertScreenOptions = {
      screenDSL: body.screenDSL as ScreenDSL,
      position: body.position,
      afterScreenId: body.afterScreenId,
      beforeScreenId: body.beforeScreenId,
      navigationFrom: body.navigationFrom,
      heroImageId: body.heroImageId,
    }

    if (!insertOptions.screenDSL) {
      return NextResponse.json({ error: 'screenDSL is required' }, { status: 400 })
    }

    const result = await insertScreen(params.flowId, insertOptions)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error inserting screen:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to insert screen' },
      { status: 500 }
    )
  }
}

