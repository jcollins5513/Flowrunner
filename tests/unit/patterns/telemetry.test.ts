import { describe, it, expect, beforeEach } from 'vitest'
import {
  getPatternTelemetrySummary,
  recordPatternLoadFailure,
  recordPatternLoadSuccess,
  recordPatternValidationFailure,
  recordPatternValidationSuccess,
  resetPatternTelemetry,
} from '../../../lib/telemetry/patterns'

describe('Pattern telemetry utility', () => {
  beforeEach(() => {
    resetPatternTelemetry()
  })

  it('tracks load successes and failures', () => {
    recordPatternLoadSuccess('ONB_HERO_TOP', 1, 12)
    recordPatternLoadFailure('ONB_HERO_TOP', 1, 24, 'network error')

    const summary = getPatternTelemetrySummary()

    expect(summary.totals.loadSuccess).toBe(1)
    expect(summary.totals.loadFailure).toBe(1)
    const key = 'ONB_HERO_TOP-1'
    expect(summary.perPattern[key]?.lastError).toContain('network error')
  })

  it('records validation metrics and recent events', () => {
    recordPatternValidationSuccess('CTA_SPLIT_SCREEN', 3, 8)
    recordPatternValidationFailure('CTA_SPLIT_SCREEN', 3, 9, 'Missing slot')

    const summary = getPatternTelemetrySummary()
    expect(summary.totals.validationSuccess).toBe(1)
    expect(summary.totals.validationFailure).toBe(1)
    expect(summary.recentEvents.length).toBeGreaterThan(0)
    expect(summary.recentEvents[0].type).toBe('validation_failure')
  })
})

