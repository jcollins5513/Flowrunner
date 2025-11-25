import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { pipelineTelemetry } from '@/lib/telemetry/pipeline'

export async function GET() {
  pipelineTelemetry.logStage('health_check', 'start', { metadata: { target: 'api' } })
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    pipelineTelemetry.logStage('health_check', 'success', {
      metadata: { target: 'api', database: 'connected' },
    })
    return NextResponse.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
  } catch (error) {
    pipelineTelemetry.logStage('health_check', 'error', {
      message: 'database_disconnected',
      metadata: { target: 'api' },
    })
    return NextResponse.json({ status: 'error', database: 'disconnected' }, { status: 500 })
  }
}

