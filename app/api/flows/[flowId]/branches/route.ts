// Branch management endpoints
// GET, POST, PATCH, DELETE operations for flow branches

import { NextResponse } from 'next/server'
import {
  getBranchesFromScreen,
  getBranchesToScreen,
  createBranch,
  deleteBranch,
  updateBranch,
  hasBranches,
  getBranchCount,
  findBranchPoints,
  mergeBranches,
} from '@/lib/flows'
import type { BranchConfig } from '@/lib/flows/branching'

// GET /api/flows/[flowId]/branches - Get branches
export async function GET(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const screenId = searchParams.get('screenId')

    // Get all branch points in the flow
    if (action === 'branch-points') {
      const branchPoints = await findBranchPoints(params.flowId)
      return NextResponse.json({ branchPoints })
    }

    // Check if a screen has branches
    if (action === 'has-branches') {
      if (!screenId) {
        return NextResponse.json({ error: 'screenId is required' }, { status: 400 })
      }
      const hasBranching = await hasBranches(params.flowId, screenId)
      return NextResponse.json({ hasBranches: hasBranching })
    }

    // Get branch count for a screen
    if (action === 'count') {
      if (!screenId) {
        return NextResponse.json({ error: 'screenId is required' }, { status: 400 })
      }
      const count = await getBranchCount(params.flowId, screenId)
      return NextResponse.json({ count })
    }

    // Get branches from a screen
    if (!screenId) {
      return NextResponse.json({ error: 'screenId is required' }, { status: 400 })
    }

    const direction = searchParams.get('direction') || 'from' // 'from' or 'to'

    if (direction === 'to') {
      const branches = await getBranchesToScreen(params.flowId, screenId)
      return NextResponse.json({ branches })
    } else {
      const branches = await getBranchesFromScreen(params.flowId, screenId)
      return NextResponse.json({ branches })
    }
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

// POST /api/flows/[flowId]/branches - Create a new branch
export async function POST(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const body = await request.json()

    if (!body.fromScreenId || !body.toScreenId) {
      return NextResponse.json({ error: 'fromScreenId and toScreenId are required' }, { status: 400 })
    }

    const config: BranchConfig = {
      toScreenId: body.toScreenId,
      trigger: body.trigger,
      condition: body.condition,
      label: body.label,
    }

    await createBranch(params.flowId, body.fromScreenId, config)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create branch' },
      { status: 500 }
    )
  }
}

// PATCH /api/flows/[flowId]/branches - Update a branch
export async function PATCH(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const body = await request.json()

    if (!body.fromScreenId || !body.toScreenId) {
      return NextResponse.json({ error: 'fromScreenId and toScreenId are required' }, { status: 400 })
    }

    await updateBranch(
      params.flowId,
      body.fromScreenId,
      body.toScreenId,
      {
        label: body.label,
        condition: body.condition,
        trigger: body.trigger,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update branch' },
      { status: 500 }
    )
  }
}

// DELETE /api/flows/[flowId]/branches - Delete a branch
export async function DELETE(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const fromScreenId = searchParams.get('fromScreenId')

    if (!fromScreenId) {
      return NextResponse.json({ error: 'fromScreenId is required' }, { status: 400 })
    }

    const toScreenId = searchParams.get('toScreenId')
    const condition = searchParams.get('condition')
    const label = searchParams.get('label')

    // Require at least one filter (toScreenId, condition, or label)
    if (!toScreenId && !condition && !label) {
      return NextResponse.json(
        { error: 'At least one of toScreenId, condition, or label is required' },
        { status: 400 }
      )
    }

    await deleteBranch(params.flowId, fromScreenId, {
      toScreenId: toScreenId || undefined,
      condition: condition || undefined,
      label: label || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete branch' },
      { status: 500 }
    )
  }
}

