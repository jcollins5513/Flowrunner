/**
 * Card Component Wrapper
 * 
 * Wraps library card components (for forms) to integrate with DSL.
 */

'use client'

import React, { useEffect, useState } from 'react'
import type { LibraryComponent } from '../component-types'
import { loadComponentCode } from '../component-loader'
import type { Component } from '@/lib/dsl/types'
import type { Palette, Vibe } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface CardWrapperProps {
  libraryComponent: LibraryComponent
  dslComponent: Component
  palette: Palette
  vibe: Vibe
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
}

export function CardWrapper({
  libraryComponent,
  dslComponent,
  palette,
  vibe,
  className,
  style,
  onError,
}: CardWrapperProps): React.ReactElement {
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
    // Fallback: render children without wrapper
    return (
      <div className={cn(className)} style={style}>
        {/* Content will be rendered by Form component */}
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

  // Card components typically wrap children
  // The actual form content will be rendered by the Form component
  // This wrapper just provides the card styling
  try {
    return (
      <Component {...props}>
        {/* Content slot - will be filled by Form component */}
      </Component>
    )
  } catch {
    return (
      <div className={cn(className)} style={style}>
        {/* Fallback */}
      </div>
    )
  }
}

