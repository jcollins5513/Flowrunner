import { NextResponse } from 'next/server'
import { FlowEngine } from '@/lib/flows'
import type { CreateFlowOptions, UpdateFlowOptions, FlowQueryOptions } from '@/lib/flows/types'

// GET /api/flows - Query flows with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const queryOptions: FlowQueryOptions = {
      userId: searchParams.get('userId') || undefined,
      domain: searchParams.get('domain') || undefined,
      theme: searchParams.get('theme') || undefined,
      isPublic: searchParams.get('isPublic') === 'true' ? true : searchParams.get('isPublic') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'name') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    }

    const flows = await FlowEngine.queryFlows(queryOptions)
    return NextResponse.json(flows)
  } catch (error) {
    console.error('Error querying flows:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query flows' },
      { status: 500 }
    )
  }
}

// POST /api/flows - Create a new flow
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const createOptions: CreateFlowOptions = {
      name: body.name,
      description: body.description,
      domain: body.domain,
      theme: body.theme,
      style: body.style,
      userId: body.userId,
      isPublic: body.isPublic,
      initialScreens: body.initialScreens,
      themeConfig: body.themeConfig,
    }

    if (!createOptions.name) {
      return NextResponse.json({ error: 'Flow name is required' }, { status: 400 })
    }

    const flow = await FlowEngine.createFlow(createOptions)
    return NextResponse.json(flow, { status: 201 })
  } catch (error) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create flow' },
      { status: 500 }
    )
  }
}

