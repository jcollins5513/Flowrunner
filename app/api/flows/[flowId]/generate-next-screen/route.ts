import { NextRequest, NextResponse } from 'next/server'
import { generateNextScreen } from '@/lib/flows/next-screen-generator'
import type { NextScreenTriggerContext } from '@/lib/flows/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const body = await request.json()
    const { context, userPrompt, userId } = body as {
      context: NextScreenTriggerContext
      userPrompt?: string
      userId?: string
    }

    if (!context) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 })
    }

    const result = await generateNextScreen(context, {
      flowId,
      userPrompt,
      userId,
      onProgress: (stage, progress) => {
        // Progress tracking could be implemented with Server-Sent Events if needed
        console.log(`Generation: ${stage} (${progress}%)`)
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating next screen:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate next screen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}





