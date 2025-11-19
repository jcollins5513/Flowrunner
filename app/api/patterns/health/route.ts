import { NextResponse } from 'next/server'
import { getPatternTelemetrySummary } from '@/lib/telemetry/patterns'

export async function GET() {
  const summary = getPatternTelemetrySummary()
  return NextResponse.json(summary, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

