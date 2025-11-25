import { performance } from 'node:perf_hooks'

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
    const start = performance.now()
    this.logStage(stage, 'start', { metadata })

    return action()
      .then((result) => {
        this.logStage(stage, 'success', {
          durationMs: Math.round(performance.now() - start),
          metadata,
        })
        return result
      })
      .catch((error) => {
        this.logStage(stage, 'error', {
          durationMs: Math.round(performance.now() - start),
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
