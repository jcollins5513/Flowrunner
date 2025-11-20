import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { telemetry } from '@/lib/renderer/telemetry'

describe('Telemetry service', () => {
  beforeEach(() => {
    telemetry.clear()
  })

  afterEach(() => {
    telemetry.clear()
  })

  it('reports errors with context', () => {
    const error = new Error('Test error')
    const context = {
      pattern: { family: 'ONB_HERO_TOP', variant: 1 },
      component: { type: 'button', slotName: 'cta' },
    }

    telemetry.reportError(error, undefined, context)

    const stats = telemetry.getErrorStats()
    expect(stats.total).toBe(1)
    expect(stats.byError.length).toBeGreaterThan(0)
  })

  it('aggregates error counts by error type', () => {
    const error1 = new Error('Test error')
    const error2 = new Error('Test error')

    telemetry.reportError(error1)
    telemetry.reportError(error2)

    const stats = telemetry.getErrorStats()
    const errorEntry = stats.byError.find((e) => e.error.includes('Test error'))
    expect(errorEntry?.count).toBe(2)
  })

  it('reports performance metrics', () => {
    telemetry.reportPerformance({
      name: 'render_time',
      value: 100,
      unit: 'ms',
      context: { patternFamily: 'ONB_HERO_TOP' },
    })

    const stats = telemetry.getPerformanceStats()
    expect(stats.byMetric.length).toBeGreaterThan(0)

    const metric = stats.byMetric.find((m) => m.name === 'render_time')
    expect(metric).toBeDefined()
    expect(metric?.avg).toBe(100)
  })

  it('calculates performance statistics correctly', () => {
    telemetry.reportPerformance({ name: 'test_metric', value: 10, unit: 'ms' })
    telemetry.reportPerformance({ name: 'test_metric', value: 20, unit: 'ms' })
    telemetry.reportPerformance({ name: 'test_metric', value: 30, unit: 'ms' })

    const stats = telemetry.getPerformanceStats()
    const metric = stats.byMetric.find((m) => m.name === 'test_metric')

    expect(metric?.count).toBe(3)
    expect(metric?.avg).toBe(20)
    expect(metric?.min).toBe(10)
    expect(metric?.max).toBe(30)
  })

  it('reports render events', () => {
    telemetry.reportRender({
      patternFamily: 'ONB_HERO_TOP',
      patternVariant: 1,
      renderTime: 150,
      componentCount: 5,
      success: true,
    })

    const events = telemetry.getEvents()
    const renderEvent = events.find((e) => e.type === 'render')

    expect(renderEvent).toBeDefined()
    expect(renderEvent?.data).toMatchObject({
      patternFamily: 'ONB_HERO_TOP',
      patternVariant: 1,
      renderTime: 150,
      componentCount: 5,
      success: true,
    })
  })
})

