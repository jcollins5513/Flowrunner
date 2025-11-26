import { NextRequest, NextResponse } from 'next/server'
import { inferVibe } from '@/lib/images/vibe/infer'
import type { Palette } from '@/lib/images/palette'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, palette, includeReasoning } = body as {
      url: string
      palette: Palette
      includeReasoning?: boolean
    }

    if (!url || !palette) {
      return NextResponse.json({ error: 'URL and palette are required' }, { status: 400 })
    }

    const vibeAnalysis = await inferVibe({ url, palette, includeReasoning })
    return NextResponse.json(vibeAnalysis)
  } catch (error) {
    console.error('Error inferring vibe:', error)
    const message = error instanceof Error ? error.message : 'Failed to infer vibe'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

