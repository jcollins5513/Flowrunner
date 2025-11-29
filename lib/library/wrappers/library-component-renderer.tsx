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
import { selectLibraryComponent } from '../component-selector'
import type { ComponentCategory, LibraryComponent } from '../component-types'
import { loadComponentImplementation } from '../component-loader'

export interface LibraryComponentRendererProps {
  component: Component
  vibe: Vibe
  palette: Palette
  pattern: PatternFamily
  slot?: string
  hasAccess: boolean
  screenType?: string
  categoryPreference?: ComponentCategory
  formFactor?: 'mobile' | 'web' | 'both'
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
  screenType,
  categoryPreference,
  formFactor,
}: LibraryComponentRendererProps): React.ReactElement {
  const [libraryComponent, setLibraryComponent] = useState<LibraryComponent | null>(null)
  const [implementation, setImplementation] = useState<React.ComponentType<any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

    let cancelled = false

    const explicitCategory =
      categoryPreference || (component.props?.categoryPreference as ComponentCategory | undefined)
    const explicitScreenType = screenType || (component.props?.screenType as string | undefined) || undefined
    const explicitFormFactor = formFactor ?? 'web'

    const loadComponent = async () => {
      const selection = await selectLibraryComponent({
        componentType: component.type,
        vibe,
        palette,
        pattern,
        slot,
        hasAccess,
        categoryPreference: explicitCategory,
        screenType: explicitScreenType,
        formFactor: explicitFormFactor,
      })

      if (cancelled) return
      if (!selection) {
        setLibraryComponent(null)
        setLoading(false)
        return
      }

      const loaded = await loadComponentImplementation(selection)
      if (cancelled) return

      setLibraryComponent(selection)
      setImplementation(() => loaded)
      setLoading(false)
    }

    loadComponent()

    return () => {
      cancelled = true
    }
  }, [
    categoryPreference,
    component.props?.categoryPreference,
    component.props?.screenType,
    component.type,
    formFactor,
    hasAccess,
    palette,
    pattern,
    screenType,
    slot,
    vibe,
  ])

  // If loading or no library component, render default
  if (loading || !libraryComponent || !implementation) {
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
        implementation={implementation}
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
        implementation={implementation}
      />
    )
  }

  if (component.type === 'form') {
    return (
      <CardWrapper
        key={component.content}
        libraryComponent={libraryComponent}
        dslComponent={component}
        palette={palette}
        vibe={vibe}
        className={className}
        style={style}
        implementation={implementation}
      />
    )
  }

  // Fallback to default
  return defaultRender()
}

