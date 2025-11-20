// Flow-specific API routes
// GET, PUT, DELETE operations for individual flows

import { NextResponse } from 'next/server'
import { FlowEngine } from '@/lib/flows'
import type { UpdateFlowOptions } from '@/lib/flows/types'

// GET /api/flows/[flowId] - Get flow by ID
export async function GET(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const includeScreens = searchParams.get('includeScreens') !== 'false'

    const flow = await FlowEngine.getFlow(params.flowId, includeScreens)
    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error fetching flow:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch flow' },
      { status: 500 }
    )
  }
}

// PUT /api/flows/[flowId] - Update flow
export async function PUT(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const body = await request.json()

    const updateOptions: UpdateFlowOptions = {
      name: body.name,
      description: body.description,
      domain: body.domain,
      theme: body.theme,
      style: body.style,
      isPublic: body.isPublic,
      themeConfig: body.themeConfig,
    }

    const flow = await FlowEngine.updateFlow(params.flowId, updateOptions)
    return NextResponse.json(flow)
  } catch (error) {
    console.error('Error updating flow:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update flow' },
      { status: 500 }
    )
  }
}

// DELETE /api/flows/[flowId] - Delete flow
export async function DELETE(request: Request, { params }: { params: { flowId: string } }) {
  try {
    await FlowEngine.deleteFlow(params.flowId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting flow:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete flow' },
      { status: 500 }
    )
  }
}

