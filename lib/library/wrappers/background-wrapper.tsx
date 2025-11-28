/**
 * Background Component Wrapper
 * 
 * Wraps library background components to integrate with DSL.
 */

'use client'

import React, { useEffect, useState } from 'react'
import type { LibraryComponent } from '../component-types'
import { loadComponentCode } from '../component-loader'
import type { Palette, Vibe } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface BackgroundWrapperProps {
  libraryComponent: LibraryComponent
  palette: Palette
  vibe: Vibe
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  onError?: (error: Error) => void
}

export function BackgroundWrapper({
  libraryComponent,
  palette,
  vibe,
  className,
  style,
  children,
  onError,
}: BackgroundWrapperProps): React.ReactElement {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(
    null
  )
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const LoadedComponent = await loadComponentCode(libraryComponent)
        if (!cancelled) {
          setComponent(() => LoadedComponent)
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          onError?.(error)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [libraryComponent, onError])

  if (error || !Component) {
    // Fallback: render children without background effect
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    )
  }

  // Apply palette colors
  const paletteStyle: React.CSSProperties = {
    ...style,
    ['--flow-primary' as string]: palette.primary,
    ['--flow-secondary' as string]: palette.secondary,
    ['--flow-accent' as string]: palette.accent,
    ['--flow-background' as string]: palette.background,
  }

  const props: Record<string, any> = {
    className: cn(className),
    style: paletteStyle,
  }

  // Background components typically wrap children
  try {
    return (
      <Component {...props}>
        {children}
      </Component>
    )
  } catch {
    // Fallback
    return (
      <div className={cn(className)} style={style}>
        {children}
      </div>
    )
  }
}



