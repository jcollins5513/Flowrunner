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
import type {
  ComponentComplexity,
  ComponentTier,
  LibraryComponent,
} from '../component-types'
import { loadComponentImplementation } from '../component-loader'
import type { UpgradeOption } from '../component-upgrades'

export interface LibraryComponentRendererProps {
  component: Component
  vibe: Vibe
  palette: Palette
  pattern: PatternFamily
  slot?: string
  hasAccess: boolean
  screenType?: string
  tierPreference?: ComponentTier
  formFactor?: 'mobile' | 'web' | 'both'
  style?: React.CSSProperties
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onUpgradesAvailable?: (component: Component, upgrades: UpgradeOption[]) => void
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
  onUpgradesAvailable,
  defaultRender,
  screenType,
  tierPreference,
  formFactor,
}: LibraryComponentRendererProps): React.ReactElement {
  const [libraryComponent, setLibraryComponent] = useState<LibraryComponent | null>(null)
  const [implementation, setImplementation] = useState<React.ComponentType<any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([])

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

    let cancelled = false

    const explicitTier = tierPreference || (component.props?.tierPreference as ComponentTier | undefined)
    const explicitScreenType = screenType || (component.props?.screenType as string | undefined) || undefined
    const explicitFormFactor = formFactor ?? 'web'
    const explicitRequestedComponentId = component.props?.libraryComponent as string | undefined
    const explicitComplexity =
      (component.props?.requestedComplexity as ComponentComplexity | undefined) || undefined
    const allowAdvancedSelection =
      (component.props?.allowAdvancedSelection as boolean | undefined) ?? Boolean(explicitRequestedComponentId)

    const loadComponent = async () => {
      try {
        const selection = await selectLibraryComponent({
          componentType: component.type,
          vibe,
          palette,
          pattern,
          slot,
          hasAccess,
          tierPreference: explicitTier,
          screenType: explicitScreenType,
          formFactor: explicitFormFactor,
          requestedComponentId: explicitRequestedComponentId,
          allowUpgrades: hasAccess,
          allowAdvancedSelection,
          requestedComplexity: explicitComplexity,
          requestedCategory: component.props?.requestedCategory as any,
        })

        if (cancelled) return
        if (!selection) {
          setLibraryComponent(null)
          setLoading(false)
          return
        }

        const loaded = await loadComponentImplementation(selection.component)
        if (cancelled) return

        if (!loaded) {
          console.error('[LibraryComponentRenderer] Failed to load implementation for:', selection.component.id)
        }

        setLibraryComponent(selection.component)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'library-component-renderer.tsx:114',message:'Setting implementation',data:{componentId:selection.component.id,loadedType:typeof loaded,isFunction:typeof loaded === 'function',loadedName:loaded?.name || loaded?.displayName || 'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Use direct assignment instead of function form to avoid React evaluating it
        if (typeof loaded === 'function') {
          setImplementation(loaded)
        } else {
          console.error('[LibraryComponentRenderer] Loaded component is not a function:', typeof loaded)
          setImplementation(null)
        }
        setUpgradeOptions(selection.upgrades)
        setLoading(false)
      } catch (error) {
        if (!cancelled) {
          console.error('[LibraryComponentRenderer] Error loading component:', error)
          setLibraryComponent(null)
          setImplementation(null)
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      cancelled = true
    }
  }, [
    tierPreference,
    component.props?.tierPreference,
    component.props?.screenType,
    component.props?.libraryComponent,
    component.props?.requestedComplexity,
    component.props?.requestedCategory,
    component.props?.allowAdvancedSelection,
    component.type,
    formFactor,
    hasAccess,
    palette,
    pattern,
    screenType,
    slot,
    vibe,
  ])

  useEffect(() => {
    if (onUpgradesAvailable) {
      onUpgradesAvailable(component, upgradeOptions)
    }
  }, [component, onUpgradesAvailable, upgradeOptions])

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
        // Don't pass implementation prop - let TextWrapper load it directly to avoid RSC serialization issues
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
        // Don't pass implementation prop - let ButtonWrapper load it directly to avoid RSC serialization issues
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

