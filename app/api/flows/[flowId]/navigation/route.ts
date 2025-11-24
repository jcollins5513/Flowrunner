// Navigation graph management endpoints
// GET, POST operations for flow navigation

import { NextResponse } from 'next/server'
import {
  buildNavigationGraph,
  addNavigationPath,
  removeNavigationPath,
  validateNavigationGraph,
  getNavigationPath,
} from '@/lib/flows'

// GET /api/flows/[flowId]/navigation - Get navigation graph
export async function GET(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'validate') {
      const validation = await validateNavigationGraph(flowId)
      return NextResponse.json(validation)
    }

    if (action === 'path') {
      const fromScreenId = searchParams.get('from')
      const toScreenId = searchParams.get('to')

      if (!fromScreenId || !toScreenId) {
        return NextResponse.json({ error: 'from and to screen IDs are required' }, { status: 400 })
      }

      const path = await getNavigationPath(flowId, fromScreenId, toScreenId)
      return NextResponse.json({ path })
    }

    // Default: return full navigation graph
    const graph = await buildNavigationGraph(flowId)
    return NextResponse.json({
      ...graph,
      screens: Array.from(graph.screens.entries()).map(([id, entry]) => ({ id, ...entry })),
    })
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch navigation' },
      { status: 500 }
    )
  }
}

// POST /api/flows/[flowId]/navigation - Add navigation path
export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const body = await request.json()

    if (!body.fromScreenId || !body.toScreenId) {
      return NextResponse.json({ error: 'fromScreenId and toScreenId are required' }, { status: 400 })
    }

    await addNavigationPath(flowId, body.fromScreenId, body.toScreenId, {
      trigger: body.trigger,
      condition: body.condition,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding navigation path:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add navigation path' },
      { status: 500 }
    )
  }
}

// DELETE /api/flows/[flowId]/navigation - Remove navigation path
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const { searchParams } = new URL(request.url)
    const fromScreenId = searchParams.get('fromScreenId')

    if (!fromScreenId) {
      return NextResponse.json({ error: 'fromScreenId is required' }, { status: 400 })
    }

    await removeNavigationPath(flowId, fromScreenId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing navigation path:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove navigation path' },
      { status: 500 }
    )
  }
}

