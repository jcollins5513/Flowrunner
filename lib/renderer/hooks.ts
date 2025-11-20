import { useEffect, useState, useMemo } from 'react'
import { type PatternDefinition } from '../patterns/schema'
import { useContainerSize, useContainerBreakpoint, type ContainerBreakpoint } from './container-queries'
import { useComponentStyles } from './theme-provider'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS: Record<Breakpoint, number> = {
  mobile: 640,
  tablet: 1024,
  desktop: Number.POSITIVE_INFINITY,
}

/**
 * Responsive breakpoint hook used by the renderer to pick pattern configs.
 * Falls back to 'desktop' during SSR.
 */
export function useResponsiveBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const getBreakpoint = () => {
      if (typeof window === 'undefined') {
        return 'desktop'
      }
      const width = window.innerWidth
      if (width < BREAKPOINTS.mobile) return 'mobile'
      if (width < BREAKPOINTS.tablet) return 'tablet'
      if (width < BREAKPOINTS.desktop) return 'desktop'
      return 'desktop'
    }

    const handleResize = () => {
      setBreakpoint(getBreakpoint())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return breakpoint
}

/**
 * Hook to access current pattern configuration
 * Returns pattern config for current breakpoint
 */
export function usePatternConfig(pattern: PatternDefinition | null, breakpoint: Breakpoint = 'desktop') {
  return useMemo(() => {
    if (!pattern) {
      return {
        padding: 24,
        gap: 24,
        gridTemplate: '1fr',
      }
    }

    const breakpointConfig = pattern.responsive?.breakpoints?.[breakpoint]
    const fallbackBreakpoint: Breakpoint[] = ['mobile', 'tablet', 'desktop']
    const appliedBreakpoint = breakpointConfig
      ? breakpoint
      : fallbackBreakpoint.find((bp) => pattern.responsive?.breakpoints?.[bp]) || 'desktop'

    const appliedConfig =
      breakpointConfig ??
      (appliedBreakpoint ? pattern.responsive?.breakpoints?.[appliedBreakpoint] : undefined) ??
      {}

    const padding = appliedConfig.padding ?? pattern.spacing.padding
    const gap = appliedConfig.gap ?? pattern.spacing.gap
    const gridTemplate = appliedConfig.gridTemplate ?? pattern.layout.gridTemplate ?? '1fr'

    return {
      padding,
      gap,
      gridTemplate,
      breakpoint: appliedBreakpoint,
    }
  }, [pattern, breakpoint])
}

/**
 * Hook to get container size (wrapper for useContainerSize with fallback)
 */
export function useContainerSizeWithFallback(): number | null {
  try {
    return useContainerSize()
  } catch {
    // Not in container context, return null
    return null
  }
}

/**
 * Re-export useComponentStyles from theme provider
 */
export { useComponentStyles }

