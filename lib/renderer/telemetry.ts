// Telemetry utility for error reporting and performance metrics

export interface ErrorContext {
  pattern?: {
    family: string
    variant: number
  }
  component?: {
    type: string
    slotName?: string
  }
  dsl?: {
    patternFamily: string
    patternVariant: number
  }
  timestamp: number
  userAgent?: string
  url?: string
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  context?: Record<string, unknown>
  timestamp: number
}

export interface TelemetryEvent {
  type: 'error' | 'performance' | 'render'
  data: ErrorContext | PerformanceMetric | Record<string, unknown>
  timestamp: number
}

const isDevelopment = process.env.NODE_ENV === 'development'

class TelemetryService {
  private events: TelemetryEvent[] = []
  private errorCounts: Map<string, number> = new Map()
  private performanceMetrics: Map<string, number[]> = new Map()
  private maxEvents = 100 // Keep last 100 events in memory

  /**
   * Report an error with context
   */
  reportError(
    error: Error,
    errorInfo?: {
      componentStack?: string
    },
    context?: Partial<ErrorContext>
  ): void {
    const errorContext: ErrorContext = {
      timestamp: Date.now(),
      ...context,
      ...(typeof window !== 'undefined' && {
        userAgent: window.navigator.userAgent,
        url: window.location.href,
      }),
    }

    const errorKey = `${error.name}:${error.message}`
    const count = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, count + 1)

    const event: TelemetryEvent = {
      type: 'error',
      timestamp: Date.now(),
      data: {
        ...errorContext,
        error: {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined,
          componentStack: isDevelopment ? errorInfo?.componentStack : undefined,
        },
        count: count + 1,
      },
    }

    this.addEvent(event)

    // Log to console in development
    if (isDevelopment) {
      console.error('[Telemetry] Error reported:', {
        error: error.message,
        context: errorContext,
        stack: error.stack,
      })
    }
  }

  /**
   * Report a performance metric
   */
  reportPerformance(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    }

    // Track metrics for aggregation
    const metrics = this.performanceMetrics.get(metric.name) || []
    metrics.push(metric.value)
    // Keep last 50 metrics
    if (metrics.length > 50) {
      metrics.shift()
    }
    this.performanceMetrics.set(metric.name, metrics)

    const event: TelemetryEvent = {
      type: 'performance',
      timestamp: Date.now(),
      data: performanceMetric,
    }

    this.addEvent(event)

    // Log to console in development
    if (isDevelopment) {
      console.log('[Telemetry] Performance metric:', performanceMetric)
    }
  }

  /**
   * Report a render event
   */
  reportRender(context: {
    patternFamily: string
    patternVariant: number
    renderTime: number
    componentCount: number
    success: boolean
  }): void {
    const event: TelemetryEvent = {
      type: 'render',
      timestamp: Date.now(),
      data: context,
    }

    this.addEvent(event)

    // Also report as performance metric
    this.reportPerformance({
      name: 'render_time',
      value: context.renderTime,
      unit: 'ms',
      context: {
        patternFamily: context.patternFamily,
        patternVariant: context.patternVariant,
        componentCount: context.componentCount,
      },
    })
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    byError: Array<{ error: string; count: number }>
    recent: TelemetryEvent[]
  } {
    const errorEvents = this.events.filter((e) => e.type === 'error')
    const byError = Array.from(this.errorCounts.entries()).map(([error, count]) => ({
      error,
      count,
    }))

    return {
      total: errorEvents.length,
      byError,
      recent: errorEvents.slice(-10), // Last 10 errors
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    byMetric: Array<{
      name: string
      count: number
      avg: number
      min: number
      max: number
    }>
  } {
    const byMetric = Array.from(this.performanceMetrics.entries()).map(([name, values]) => {
      const sum = values.reduce((acc, val) => acc + val, 0)
      const avg = sum / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)

      return {
        name,
        count: values.length,
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
      }
    })

    return {
      byMetric,
    }
  }

  /**
   * Get all events (for debugging)
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events]
  }

  /**
   * Clear all events (for testing/debugging)
   */
  clear(): void {
    this.events = []
    this.errorCounts.clear()
    this.performanceMetrics.clear()
  }

  private addEvent(event: TelemetryEvent): void {
    this.events.push(event)
    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }
}

// Singleton instance
export const telemetry = new TelemetryService()

/**
 * Helper to measure render performance
 */
export function measureRender<T>(
  name: string,
  fn: () => T,
  context?: Record<string, unknown>
): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    telemetry.reportPerformance({
      name,
      value: duration,
      unit: 'ms',
      context,
    })
    return result
  } catch (error) {
    const duration = performance.now() - start
    telemetry.reportPerformance({
      name: `${name}_error`,
      value: duration,
      unit: 'ms',
      context: { ...context, error: true },
    })
    throw error
  }
}

/**
 * Helper to measure async render performance
 */
export async function measureRenderAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    telemetry.reportPerformance({
      name,
      value: duration,
      unit: 'ms',
      context,
    })
    return result
  } catch (error) {
    const duration = performance.now() - start
    telemetry.reportPerformance({
      name: `${name}_error`,
      value: duration,
      unit: 'ms',
      context: { ...context, error: true },
    })
    throw error
  }
}

