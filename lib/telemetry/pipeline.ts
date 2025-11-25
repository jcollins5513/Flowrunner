// Cross-platform performance timing
// performance.now() is available globally in both browsers and Node.js (v16+)
// Using a safe wrapper to avoid TypeScript/webpack issues with node:perf_hooks
function getPerformanceNow(): number {
  // Use the global performance object available in both browser and Node.js environments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perf = (globalThis as any).performance || (typeof window !== 'undefined' ? (window as any).performance : null)
  if (perf && typeof perf.now === 'function') {
    return perf.now()
  }
  // Fallback to Date.now() if performance is not available
  return Date.now()
}

export type PipelineStage =
  | 'prompt_intake'
  | 'intent_interpretation'
  | 'template_selection'
  | 'screen_sequence'
  | 'pattern_resolution'
  | 'image_generation'
  | 'palette_and_vibe'
  | 'dsl_assembly'
  | 'validation'
  | 'persistence'
  | 'health_check'

export type PipelineStageStatus = 'start' | 'success' | 'error'

export interface PipelineTelemetryEvent {
  stage: PipelineStage
  status: PipelineStageStatus
  message?: string
  durationMs?: number
  metadata?: Record<string, unknown>
  timestamp: number
}

export class PipelineTelemetry {
  private events: PipelineTelemetryEvent[] = []
  private maxEvents = 200

  logStage(
    stage: PipelineStage,
    status: PipelineStageStatus,
    options: { message?: string; durationMs?: number; metadata?: Record<string, unknown> } = {},
  ): void {
    const event: PipelineTelemetryEvent = {
      stage,
      status,
      timestamp: Date.now(),
      ...options,
    }

    this.events.push(event)
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    if (process.env.NODE_ENV === 'development') {
      const { message, durationMs, metadata } = options
      console.log('[PipelineTelemetry]', stage, status, { message, durationMs, metadata })
    }
  }

  timeStage(
    stage: PipelineStage,
    action: () => Promise<unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<unknown> {
    const start = getPerformanceNow()
    this.logStage(stage, 'start', { metadata })

    return action()
      .then((result) => {
        this.logStage(stage, 'success', {
          durationMs: Math.round(getPerformanceNow() - start),
          metadata,
        })
        return result
      })
      .catch((error) => {
        this.logStage(stage, 'error', {
          durationMs: Math.round(getPerformanceNow() - start),
          message: error instanceof Error ? error.message : String(error),
          metadata,
        })
        throw error
      })
  }

  getEvents(): PipelineTelemetryEvent[] {
    return [...this.events]
  }

  getRecentByStage(stage: PipelineStage, limit: number = 10): PipelineTelemetryEvent[] {
    return this.events
      .filter((event) => event.stage === stage)
      .slice(-limit)
      .reverse()
  }

  clear(): void {
    this.events = []
  }
}

export const pipelineTelemetry = new PipelineTelemetry()
