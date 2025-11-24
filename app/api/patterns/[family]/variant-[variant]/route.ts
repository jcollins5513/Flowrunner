// API route to serve pattern JSON files
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ family: string; variant: string }> }
) {
  try {
    const { family, variant } = await params
    const variantFile = variant.startsWith('variant-') ? variant : `variant-${variant}`

    const patternPath = join(
      process.cwd(),
      'lib',
      'patterns',
      'definitions',
      family,
      `${variantFile}.json`
    )

    const fileContent = readFileSync(patternPath, 'utf-8')
    const patternData = JSON.parse(fileContent)

    return NextResponse.json(patternData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Pattern not found' },
      { status: 404 }
    )
  }
}

