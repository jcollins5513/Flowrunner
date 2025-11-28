/**
 * Button Component Wrapper
 * 
 * Wraps library button components to integrate with DSL.
 */

'use client'

import React, { useEffect, useState } from 'react'
import type { LibraryComponent } from '../component-types'
import { loadComponentCode } from '../component-loader'
import type { Component } from '@/lib/dsl/types'
import type { Palette, Vibe } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface ButtonWrapperProps {
  libraryComponent: LibraryComponent
  dslComponent: Component
  palette: Palette
  vibe: Vibe
  className?: string
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onError?: (error: Error) => void
}

export function ButtonWrapper({
  libraryComponent,
  dslComponent,
  palette,
  vibe,
  className,
  style,
  onClick,
  onError,
}: ButtonWrapperProps): React.ReactElement {
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

  if (error) {
    // Fallback to plain button on error
    return (
      <button
        className={cn('px-4 py-2 rounded', className)}
        style={style}
        onClick={onClick}
      >
        {dslComponent.content}
      </button>
    )
  }

  if (!Component) {
    // Loading state
    return (
      <button
        className={cn('px-4 py-2 rounded', className)}
        style={style}
        onClick={onClick}
      >
        {dslComponent.content}
      </button>
    )
  }

  // Apply palette colors
  const paletteStyle: React.CSSProperties = {
    ...style,
    ['--flow-primary' as string]: palette.primary,
    ['--flow-secondary' as string]: palette.secondary,
    ['--flow-accent' as string]: palette.accent,
  }

  const props: Record<string, any> = {
    className: cn(className),
    style: paletteStyle,
    onClick,
  }

  // Try children first
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
      // Try label prop
      try {
        return <Component {...props} label={dslComponent.content} />
      } catch {
        // Fallback
        return (
          <button
            className={cn('px-4 py-2 rounded', className)}
            style={style}
            onClick={onClick}
          >
            {dslComponent.content}
          </button>
        )
      }
    }
  }
}



