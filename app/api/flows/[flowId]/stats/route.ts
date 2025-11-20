// Flow statistics endpoint
// GET /api/flows/[flowId]/stats

import { NextResponse } from 'next/server'
import { FlowEngine } from '@/lib/flows'

export async function GET(request: Request, { params }: { params: { flowId: string } }) {
  try {
    const stats = await FlowEngine.getFlowStats(params.flowId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching flow stats:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch flow stats' },
      { status: 500 }
    )
  }
}

