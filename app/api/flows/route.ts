import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  try {
    const flows = await prisma.flow.findMany({
      include: {
        screens: true,
      },
    })
    return NextResponse.json(flows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const flow = await prisma.flow.create({
      data: {
        name: body.name,
        description: body.description,
        domain: body.domain,
        theme: body.theme,
        style: body.style,
        userId: body.userId,
      },
    })
    return NextResponse.json(flow)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 })
  }
}

