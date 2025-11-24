// Branch merge endpoint
// POST operation for merging multiple branches into one

import { NextResponse } from 'next/server'
import { mergeBranches } from '@/lib/flows'

// POST /api/flows/[flowId]/branches/merge - Merge branches
export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const body = await request.json()

    if (!body.fromScreenId || !body.branchToKeep || !body.branchesToMerge) {
      return NextResponse.json(
        { error: 'fromScreenId, branchToKeep, and branchesToMerge are required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(body.branchesToMerge) || body.branchesToMerge.length === 0) {
      return NextResponse.json(
        { error: 'branchesToMerge must be a non-empty array' },
        { status: 400 }
      )
    }

    await mergeBranches(
      flowId,
      body.fromScreenId,
      {
        toScreenId: body.branchToKeep.toScreenId,
        condition: body.branchToKeep.condition,
        label: body.branchToKeep.label,
      },
      body.branchesToMerge.map((b: any) => ({
        toScreenId: b.toScreenId,
        condition: b.condition,
      }))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error merging branches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge branches' },
      { status: 500 }
    )
  }
}

