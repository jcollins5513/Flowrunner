import type { PatternFamily, PatternVariant } from '../dsl/types'

type PatternTelemetryEventType =
  | 'load_success'
  | 'load_failure'
  | 'validation_success'
  | 'validation_failure'

export interface PatternTelemetryEvent {
  type: PatternTelemetryEventType
  family: PatternFamily
  variant: PatternVariant
  durationMs: number
  timestamp: string
  error?: string
}

export interface PatternTelemetryCounters {
  loadSuccess: number
  loadFailure: number
  validationSuccess: number
  validationFailure: number
  lastError?: string
  lastErrorAt?: string
}

export interface PatternTelemetrySummary {
  totals: PatternTelemetryCounters
  perPattern: Record<string, PatternTelemetryCounters & { family: PatternFamily; variant: PatternVariant }>
  recentEvents: PatternTelemetryEvent[]
  generatedAt: string
}

interface PatternTelemetryState {
  totals: PatternTelemetryCounters
  perPattern: Record<string, PatternTelemetryCounters & { family: PatternFamily; variant: PatternVariant }>
  recentEvents: PatternTelemetryEvent[]
}

const GLOBAL_KEY = '__FLOWRUNNER_PATTERN_TELEMETRY__'
const RECENT_EVENT_LIMIT = 50

function createCounterSeed(): PatternTelemetryCounters {
  return {
    loadSuccess: 0,
    loadFailure: 0,
    validationSuccess: 0,
    validationFailure: 0,
  }
}

function getTelemetryState(): PatternTelemetryState {
  const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: PatternTelemetryState }

  if (!globalScope[GLOBAL_KEY]) {
    globalScope[GLOBAL_KEY] = {
      totals: createCounterSeed(),
      perPattern: {},
      recentEvents: [],
    }
  }

  return globalScope[GLOBAL_KEY]!
}

function getPatternKey(family: PatternFamily, variant: PatternVariant): string {
  return `${family}-${variant}`
}

function pushEvent(event: PatternTelemetryEvent) {
  const state = getTelemetryState()
  state.recentEvents.unshift(event)
  if (state.recentEvents.length > RECENT_EVENT_LIMIT) {
    state.recentEvents.pop()
  }
}

function updateCounters(
  family: PatternFamily,
  variant: PatternVariant,
  updater: (counters: PatternTelemetryCounters) => void,
  error?: string
) {
  const state = getTelemetryState()
  updater(state.totals)

  const key = getPatternKey(family, variant)
  if (!state.perPattern[key]) {
    state.perPattern[key] = {
      ...createCounterSeed(),
      family,
      variant,
    }
  }

  updater(state.perPattern[key])

  if (error) {
    state.perPattern[key].lastError = error
    state.perPattern[key].lastErrorAt = new Date().toISOString()
  }
}

function logEvent(
  type: PatternTelemetryEventType,
  family: PatternFamily,
  variant: PatternVariant,
  durationMs: number,
  error?: string
) {
  pushEvent({
    type,
    family,
    variant,
    durationMs: Math.round(durationMs),
    timestamp: new Date().toISOString(),
    error,
  })
}

export function recordPatternLoadSuccess(
  family: PatternFamily,
  variant: PatternVariant,
  durationMs: number
): void {
  updateCounters(
    family,
    variant,
    (counters) => {
      counters.loadSuccess += 1
    }
  )
  logEvent('load_success', family, variant, durationMs)
}

export function recordPatternLoadFailure(
  family: PatternFamily,
  variant: PatternVariant,
  durationMs: number,
  errorMessage: string
): void {
  updateCounters(
    family,
    variant,
    (counters) => {
      counters.loadFailure += 1
    },
    errorMessage
  )
  logEvent('load_failure', family, variant, durationMs, errorMessage)
}

export function recordPatternValidationSuccess(
  family: PatternFamily,
  variant: PatternVariant,
  durationMs: number
): void {
  updateCounters(
    family,
    variant,
    (counters) => {
      counters.validationSuccess += 1
    }
  )
  logEvent('validation_success', family, variant, durationMs)
}

export function recordPatternValidationFailure(
  family: PatternFamily,
  variant: PatternVariant,
  durationMs: number,
  errorMessage: string
): void {
  updateCounters(
    family,
    variant,
    (counters) => {
      counters.validationFailure += 1
    },
    errorMessage
  )
  logEvent('validation_failure', family, variant, durationMs, errorMessage)
}

export function getPatternTelemetrySummary(): PatternTelemetrySummary {
  const state = getTelemetryState()
  return {
    totals: { ...state.totals },
    perPattern: Object.fromEntries(
      Object.entries(state.perPattern).map(([key, counters]) => [key, { ...counters }])
    ),
    recentEvents: [...state.recentEvents],
    generatedAt: new Date().toISOString(),
  }
}

export function resetPatternTelemetry(): void {
  const state = getTelemetryState()
  state.totals = createCounterSeed()
  state.perPattern = {}
  state.recentEvents = []
}

