// Clone flow endpoint
// POST /api/flows/[flowId]/clone

import { NextResponse } from 'next/server'
import { FlowEngine } from '@/lib/flows'
import type { CloneFlowOptions } from '@/lib/flows/types'

export async function POST(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const body = await request.json()

    const cloneOptions: CloneFlowOptions = {
      newName: body.newName,
      newDescription: body.newDescription,
      userId: body.userId,
      includeScreens: body.includeScreens !== false,
      includeRevisions: body.includeRevisions === true,
      resetNavigation: body.resetNavigation === true,
    }

    if (!cloneOptions.newName) {
      return NextResponse.json({ error: 'New flow name is required' }, { status: 400 })
    }

    const clonedFlow = await FlowEngine.cloneFlow(params.flowId, cloneOptions)
    return NextResponse.json(clonedFlow, { status: 201 })
  } catch (error) {
    console.error('Error cloning flow:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clone flow' },
      { status: 500 }
    )
  }
}

