import { beforeEach, describe, expect, it } from 'vitest'
import { pipelineTelemetry } from '@/lib/telemetry/pipeline'

describe('pipelineTelemetry', () => {
  beforeEach(() => {
    pipelineTelemetry.clear()
  })

  it('records stage events with metadata', () => {
    pipelineTelemetry.logStage('prompt_intake', 'success', {
      metadata: { promptLength: 42, locale: 'en' },
    })

    const [event] = pipelineTelemetry.getEvents()
    expect(event.stage).toBe('prompt_intake')
    expect(event.status).toBe('success')
    expect(event.metadata).toMatchObject({ promptLength: 42, locale: 'en' })
  })

  it('captures success and error outcomes when timing stages', async () => {
    await pipelineTelemetry.timeStage('intent_interpretation', () => Promise.resolve('ok'), {
      provider: 'mock',
    })

    const [success] = pipelineTelemetry.getRecentByStage('intent_interpretation')
    expect(success.status).toBe('success')
    expect(success.metadata).toMatchObject({ provider: 'mock' })
    expect(success.durationMs).toBeGreaterThanOrEqual(0)

    await expect(
      pipelineTelemetry.timeStage('template_selection', () => Promise.reject(new Error('fail'))),
    ).rejects.toThrow('fail')

    const [failure] = pipelineTelemetry.getRecentByStage('template_selection')
    expect(failure.status).toBe('error')
    expect(failure.message).toBe('fail')
    expect(failure.durationMs).toBeGreaterThanOrEqual(0)
  })
})
