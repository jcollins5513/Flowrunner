// Container query utilities for responsive layouts based on container size
// Uses CSS Container Queries for component-level responsiveness

'use client'

import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'

export type ContainerBreakpoint = 'mobile' | 'tablet' | 'desktop'

export const CONTAINER_BREAKPOINTS: Record<ContainerBreakpoint, number> = {
  mobile: 640, // px
  tablet: 1024, // px
  desktop: Number.POSITIVE_INFINITY,
}

export interface ContainerContextValue {
  containerRef: React.RefObject<HTMLElement>
  breakpoint: ContainerBreakpoint
  width: number | null
}

const ContainerContext = createContext<ContainerContextValue | null>(null)

export interface ContainerProviderProps {
  children: ReactNode
  containerRef?: React.RefObject<HTMLElement>
}

/**
 * ContainerProvider sets up container query context
 * Wraps components that need container-based responsive behavior
 */
export function ContainerProvider({ children, containerRef: externalRef }: ContainerProviderProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const containerRef = externalRef ?? internalRef
  const [breakpoint, setBreakpoint] = useState<ContainerBreakpoint>('desktop')
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateBreakpoint = () => {
      const containerWidth = element.offsetWidth
      setWidth(containerWidth)

      if (containerWidth < CONTAINER_BREAKPOINTS.mobile) {
        setBreakpoint('mobile')
      } else if (containerWidth < CONTAINER_BREAKPOINTS.tablet) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    // Initial measurement
    updateBreakpoint()

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(updateBreakpoint)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [containerRef])

  const value: ContainerContextValue = {
    containerRef,
    breakpoint,
    width,
  }

  // If using external ref, don't render wrapper div
  if (externalRef) {
    return <ContainerContext.Provider value={value}>{children}</ContainerContext.Provider>
  }

  // Otherwise, render wrapper div with container-type
  return (
    <div ref={internalRef} style={{ containerType: 'inline-size' }}>
      <ContainerContext.Provider value={value}>{children}</ContainerContext.Provider>
    </div>
  )
}

/**
 * Hook to access container query context
 */
export function useContainerQuery(): ContainerContextValue {
  const context = useContext(ContainerContext)
  if (!context) {
    throw new Error('useContainerQuery must be used within ContainerProvider')
  }
  return context
}

/**
 * Hook to get current container breakpoint
 */
export function useContainerBreakpoint(): ContainerBreakpoint {
  const { breakpoint } = useContainerQuery()
  return breakpoint
}

/**
 * Hook to get current container width
 */
export function useContainerSize(): number | null {
  const { width } = useContainerQuery()
  return width
}

/**
 * Generate CSS container query classes based on breakpoints
 * Returns an object with CSS classes for container queries
 */
export function generateContainerQueryClasses(
  mobile?: string,
  tablet?: string,
  desktop?: string
): string {
  const classes: string[] = []

  if (mobile) {
    classes.push(`@container (max-width: ${CONTAINER_BREAKPOINTS.mobile - 1}px) { ${mobile} }`)
  }

  if (tablet) {
    classes.push(
      `@container (min-width: ${CONTAINER_BREAKPOINTS.mobile}px) and (max-width: ${CONTAINER_BREAKPOINTS.tablet - 1}px) { ${tablet} }`
    )
  }

  if (desktop) {
    classes.push(
      `@container (min-width: ${CONTAINER_BREAKPOINTS.tablet}px) { ${desktop} }`
    )
  }

  return classes.join(' ')
}

/**
 * Utility to get container query style for a breakpoint
 */
export function getContainerQueryStyle(
  breakpoint: ContainerBreakpoint,
  styles: Partial<Record<ContainerBreakpoint, React.CSSProperties>>
): React.CSSProperties {
  // Try to find exact match
  if (styles[breakpoint]) {
    return styles[breakpoint]!
  }

  // Fallback: find the largest breakpoint that's smaller or equal
  const ordered: ContainerBreakpoint[] = ['mobile', 'tablet', 'desktop']
  const currentIndex = ordered.indexOf(breakpoint)

  for (let i = currentIndex; i >= 0; i--) {
    if (styles[ordered[i]!]) {
      return styles[ordered[i]!]!
    }
  }

  return {}
}

/**
 * CSS utility to mark an element as a container
 */
export const containerStyles: React.CSSProperties = {
  containerType: 'inline-size',
}

/**
 * CSS utility for container query media queries
 */
export const containerQueryMedia = {
  mobile: `@container (max-width: ${CONTAINER_BREAKPOINTS.mobile - 1}px)`,
  tablet: `@container (min-width: ${CONTAINER_BREAKPOINTS.mobile}px) and (max-width: ${CONTAINER_BREAKPOINTS.tablet - 1}px)`,
  desktop: `@container (min-width: ${CONTAINER_BREAKPOINTS.tablet}px)`,
}

