/**
 * Text Component Wrapper
 * 
 * Wraps library text components (title, subtitle, text) to integrate with DSL.
 */

'use client'

import React, { useEffect, useState } from 'react'
import type { LibraryComponent } from '../component-types'
import { loadComponentImplementation } from '../component-loader'
import type { Component } from '@/lib/dsl/types'
import type { Palette, Vibe } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface TextWrapperProps {
  libraryComponent: LibraryComponent
  dslComponent: Component
  palette: Palette
  vibe: Vibe
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  implementation?: React.ComponentType<any> | null
}

export function TextWrapper({
  libraryComponent,
  dslComponent,
  palette,
  vibe,
  className,
  style,
  onError,
  implementation,
}: TextWrapperProps): React.ReactElement {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(
    implementation ?? null
  )
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const LoadedComponent = implementation ?? (await loadComponentImplementation(libraryComponent))
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

    if (!Component) {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [Component, libraryComponent, onError, implementation])

  if (error) {
    // Fallback to plain text on error
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }

  if (!Component) {
    // Loading state
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }

  // Apply palette colors via CSS variables
  const paletteStyle: React.CSSProperties = {
    ...style,
    ['--flow-primary' as string]: palette.primary,
    ['--flow-secondary' as string]: palette.secondary,
    ['--flow-accent' as string]: palette.accent,
    ['--flow-background' as string]: palette.background,
  }

  // Different components accept content in different ways
  // Try common prop patterns
  const props: Record<string, any> = {
    className: cn(className),
    style: paletteStyle,
  }

  // Try children first (most common)
  try {
    return (
      <Component {...props}>
        {dslComponent.content}
      </Component>
    )
  } catch {
    // Try text prop
    try {
      return <Component {...props} text={dslComponent.content} />
    } catch {
      // Try content prop
      try {
        return <Component {...props} content={dslComponent.content} />
      } catch {
        // Fallback: render as children with error handling
        return (
          <div className={className} style={style}>
            {dslComponent.content}
          </div>
        )
      }
    }
  }
}



