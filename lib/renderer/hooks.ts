import { useEffect, useState } from 'react'

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

