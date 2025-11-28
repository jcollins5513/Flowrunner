/**
 * Library Component Renderer
 * 
 * Wrapper component that handles async loading and rendering of library components.
 */

'use client'

import React, { useEffect, useState } from 'react'
import type { Component } from '@/lib/dsl/types'
import type { Palette, Vibe } from '@/lib/dsl/types'
import type { PatternFamily } from '@/lib/patterns/families'
import { TextWrapper } from './text-wrapper'
import { ButtonWrapper } from './button-wrapper'
import { CardWrapper } from './card-wrapper'

export interface LibraryComponentRendererProps {
  component: Component
  vibe: Vibe
  palette: Palette
  pattern: PatternFamily
  slot?: string
  hasAccess: boolean
  style?: React.CSSProperties
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  defaultRender: () => React.ReactElement
}

export function LibraryComponentRenderer({
  component,
  vibe,
  palette,
  pattern,
  slot,
  hasAccess,
  style,
  className,
  onClick,
  defaultRender,
}: LibraryComponentRendererProps): React.ReactElement {
  const [libraryComponent, setLibraryComponent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

    let cancelled = false

    // Check if component explicitly specifies a library component
    const explicitLibraryComponent = component.props?.libraryComponent as string | undefined

    const loadComponent = async () => {
      try {
        let comp: any = null

        if (explicitLibraryComponent) {
          // Try to find by slug (could be "animated-gradient-text" or "magic/animated-gradient-text")
          const [source, slug] = explicitLibraryComponent.includes('/')
            ? explicitLibraryComponent.split('/')
            : [undefined, explicitLibraryComponent]

          // Use API route instead of direct import (server-only)
          const response = await fetch(
            `/api/library/components/by-slug?slug=${encodeURIComponent(slug)}${source ? `&source=${encodeURIComponent(source)}` : ''}`
          )
          const data = await response.json()
          comp = data.component
        }

        // If no explicit component or not found, use selector
        if (!comp) {
          // Use API route instead of direct import (server-only)
          const response = await fetch('/api/library/components/select', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              componentType: component.type,
              vibe,
              palette,
              pattern,
              slot,
              hasAccess,
            }),
          })
          const data = await response.json()
          comp = data.component
        }

        if (!cancelled) {
          setLibraryComponent(comp)
          setLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load library component:', error)
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      cancelled = true
    }
  }, [component.type, component.props?.libraryComponent, vibe, palette, pattern, slot, hasAccess])

  // If loading or no library component, render default
  if (loading || !libraryComponent) {
    return defaultRender()
  }

  // Render with appropriate wrapper based on component type
  if (component.type === 'title' || component.type === 'subtitle' || component.type === 'text') {
    return (
      <TextWrapper
        key={component.content}
        libraryComponent={libraryComponent}
        dslComponent={component}
        palette={palette}
        vibe={vibe}
        className={className}
        style={style}
      />
    )
  }

  if (component.type === 'button') {
    return (
      <ButtonWrapper
        key={component.content}
        libraryComponent={libraryComponent}
        dslComponent={component}
        palette={palette}
        vibe={vibe}
        className={className}
        style={style}
        onClick={onClick}
      />
    )
  }

  // Fallback to default
  return defaultRender()
}

