import { NextRequest, NextResponse } from 'next/server'
import { extractPalette } from '@/lib/images/palette'
import type { Palette } from '@/lib/images/palette'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, fallback } = body as { url: string; fallback?: Palette }

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const palette = await extractPalette({ url, fallback })
    return NextResponse.json(palette)
  } catch (error) {
    console.error('Error extracting palette:', error)
    const message = error instanceof Error ? error.message : 'Failed to extract palette'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}





