import { NextResponse } from 'next/server'
import { getQueueHealthSnapshots } from '@/lib/images/generation/queue'
import { pipelineTelemetry } from '@/lib/telemetry/pipeline'

export async function GET() {
  const queues = getQueueHealthSnapshots()
  pipelineTelemetry.logStage('health_check', 'success', {
    metadata: { target: 'queues', queueCount: queues.length, names: queues.map((queue) => queue.name) },
  })

  return NextResponse.json({
    status: 'ok',
    queues,
    timestamp: new Date().toISOString(),
  })
}
