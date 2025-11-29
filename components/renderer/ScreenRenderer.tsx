// Main screen renderer component
// Renders a complete screen from DSL using pattern definitions
// Blocks rendering if DSL is invalid

'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { type Component, type ScreenDSL } from '@/lib/dsl/types'
import { loadPatternAsync } from '@/lib/patterns/loader'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { renderComponent } from '@/lib/renderer/component-factory'
import { HeroImage } from './HeroImage'
import { SupportingImages } from './SupportingImages'
import { applyPaletteStyles, applyVibeStyles } from '@/lib/renderer/styling'
import { useResponsiveBreakpoint, type Breakpoint } from '@/lib/renderer/hooks'
import { ContainerProvider, useContainerBreakpoint, containerStyles } from '@/lib/renderer/container-queries'
import { ScreenRendererErrorBoundary, ComponentRendererErrorBoundary } from './ErrorBoundary'
import { telemetry } from '@/lib/renderer/telemetry'
import { validateScreenDSL } from '@/lib/dsl/validator'
import { validateDSLAgainstPattern } from '@/lib/patterns/validator'
import { cn } from '@/lib/utils'
import { canUseLibraryComponents } from '@/lib/library/feature-gate'
import { BackgroundWrapper } from '@/lib/library/wrappers/background-wrapper'
import type { LibraryContext } from '@/lib/renderer/component-factory'

export interface ComponentInteractionContext {
  event: React.MouseEvent
  slotName: string
  screenId?: string
}

export interface ScreenRendererProps {
  dsl: ScreenDSL
  className?: string
  onComponentClick?: (
    componentType: Component['type'],
    component: ScreenDSL['components'][0],
    context: ComponentInteractionContext
  ) => void
  skipValidation?: boolean // Only use for development/debugging
  // Editing props (optional)
  editMode?: boolean
  screenId?: string
  onScreenUpdate?: (updatedDSL: ScreenDSL) => void
  editingComponentId?: string | null
  onStartEdit?: (componentIndex: number) => void
  onSaveEdit?: (componentIndex: number, updatedComponent: ScreenDSL['components'][0]) => void
  interactiveComponentTypes?: Component['type'][]
  // Library component props (optional)
  userId?: string | null
  enableLibraryComponents?: boolean
}

const BREAKPOINT_ORDER: Breakpoint[] = ['mobile', 'tablet', 'desktop']

// Internal renderer component that uses container queries
const ScreenRendererContent: React.FC<ScreenRendererProps> = ({
  dsl,
  className = '',
  onComponentClick,
  skipValidation = false,
  editMode = false,
  screenId,
  onScreenUpdate,
  editingComponentId = null,
  onStartEdit,
  onSaveEdit,
  interactiveComponentTypes,
  userId,
  enableLibraryComponents = true,
}) => {
  const [pattern, setPattern] = useState<PatternDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasLibraryAccess, setHasLibraryAccess] = useState(false)
  const [backgroundComponent, setBackgroundComponent] = useState<any>(null)
  const viewportBreakpoint = useResponsiveBreakpoint()
  const containerBreakpoint = useContainerBreakpoint()
  
  // Prefer container breakpoint, fallback to viewport
  const breakpoint: Breakpoint = containerBreakpoint || viewportBreakpoint

  // Check library component access
  useEffect(() => {
    console.log('[ScreenRenderer] Checking library access:', { enableLibraryComponents })
    if (!enableLibraryComponents) {
      console.log('[ScreenRenderer] Library components disabled')
      setHasLibraryAccess(false)
      return
    }

    let cancelled = false

    // For now, allow access by default (userId will be added later)
    canUseLibraryComponents(null)
      .then((hasAccess) => {
        console.log('[ScreenRenderer] Library access result:', hasAccess)
        if (!cancelled) {
          setHasLibraryAccess(hasAccess)
        }
      })
      .catch((err) => {
        console.error('[ScreenRenderer] Error checking library access:', err)
        if (!cancelled) {
          setHasLibraryAccess(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [enableLibraryComponents])

  // Select background component if access is available
  useEffect(() => {
    if (!hasLibraryAccess || !pattern) {
      setBackgroundComponent(null)
      return
    }

    let cancelled = false

    // Use API route to avoid importing server-only modules
    fetch('/api/library/components/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vibe: dsl.vibe,
        pattern: dsl.pattern_family,
        slot: 'hero.background',
        hasAccess: hasLibraryAccess,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setBackgroundComponent(data.component || null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackgroundComponent(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [hasLibraryAccess, pattern, dsl.vibe, dsl.pattern_family])

  // Validate DSL before rendering
  useEffect(() => {
    if (skipValidation) return

    // Schema validation
    const schemaResult = validateScreenDSL(dsl)
    if (!schemaResult.success) {
      setValidationError(`DSL Schema Error: ${schemaResult.formattedErrors?.join(', ') || schemaResult.error?.message}`)
      setLoading(false)
      return
    }

    // Pattern validation will happen after pattern loads
  }, [dsl, skipValidation])

  useEffect(() => {
    if (validationError) return // Don't load pattern if schema validation failed

    let cancelled = false

    loadPatternAsync(dsl.pattern_family, dsl.pattern_variant)
      .then((loadedPattern) => {
        if (cancelled) return
        setPattern(loadedPattern)

        if (!skipValidation) {
          const patternResult = validateDSLAgainstPattern(dsl, loadedPattern)
          if (!patternResult.valid) {
            setValidationError(
              `Pattern Validation Error: ${patternResult.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
            )
          }
        }
      })
      .catch(async (err) => {
        if (cancelled) return

        // Retry once after clearing the pattern cache (handles dev auto-reloads)
        try {
          const { clearPatternCache } = await import('@/lib/patterns/loader')
          clearPatternCache()
        } catch {
          // ignore cache clear errors and surface original error
        }

        // Retry load
        try {
          const retryPattern = await loadPatternAsync(dsl.pattern_family, dsl.pattern_variant)
          if (cancelled) return
          setPattern(retryPattern)
          if (!skipValidation) {
            const patternResult = validateDSLAgainstPattern(dsl, retryPattern)
            if (!patternResult.valid) {
              setValidationError(
                `Pattern Validation Error: ${patternResult.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
              )
            }
          }
        } catch (retryError) {
          if (cancelled) return
          setError(retryError instanceof Error ? retryError.message : String(retryError))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dsl, skipValidation, validationError])

  useEffect(() => {
    if (error) {
      console.error('ScreenRenderer pattern error', {
        family: dsl.pattern_family,
        variant: dsl.pattern_variant,
        error,
      })
    }
  }, [error, dsl.pattern_family, dsl.pattern_variant])

  const layoutConfig = useMemo(() => {
    if (!pattern) {
      return {
        padding: 24,
        gap: 24,
        gridTemplate: '1fr',
      }
    }
    const breakpointConfig = pattern.responsive?.breakpoints?.[breakpoint]
    const fallbackBreakpoint = BREAKPOINT_ORDER.find(
      (bp) => pattern.responsive?.breakpoints?.[bp],
    )
    const appliedConfig =
      breakpointConfig ??
      (fallbackBreakpoint ? pattern.responsive?.breakpoints?.[fallbackBreakpoint] : undefined) ??
      {}

    const padding = appliedConfig.padding ?? pattern.spacing.padding
    const gap = appliedConfig.gap ?? pattern.spacing.gap
    const gridTemplate = appliedConfig.gridTemplate ?? pattern.layout.gridTemplate ?? '1fr'

    return {
      padding,
      gap,
      gridTemplate,
    }
  }, [pattern, breakpoint])

  const componentMap = useMemo(() => {
    const map = new Map<string, ScreenDSL['components'][0]>()
    dsl.components.forEach((comp) => {
      map.set(comp.type, comp)
    })
    return map
  }, [dsl.components])

  // Create array for component indexing
  const componentMapArray = useMemo(() => {
    return Array.from(componentMap.values())
  }, [componentMap])

  if (loading) {
    return <div className="p-8">Loading pattern...</div>
  }

  // Block rendering if validation failed
  if (validationError) {
    return (
      <div className="p-8 text-red-600 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-bold mb-2">DSL Validation Failed</h3>
        <p className="text-sm">{validationError}</p>
        <p className="text-xs mt-2 text-gray-600">Rendering blocked to prevent invalid UI output.</p>
      </div>
    )
  }

  if (error || !pattern) {
    return <div className="p-8 text-red-600">Error loading pattern: {error}</div>
  }

  const paletteStyles = applyPaletteStyles(dsl.palette)
  const vibeStyles = applyVibeStyles(dsl.vibe)

  const heroImageNode = (
    <HeroImage
      image={dsl.hero_image}
      position={pattern.imagePlacement.hero.position}
      size={pattern.imagePlacement.hero.size}
      priority={true}
      lazy={false}
      palette={dsl.palette}
    />
  )

  const computeSlotStyle = (position: { x: number; y: number; width: number; height?: number }) => {
    if (pattern.layout.structure === 'grid') {
      return {
        gridColumn: `${position.x + 1} / ${position.x + position.width + 1}`,
        gridRow: `${position.y + 1} / ${position.y + (position.height || 1) + 1}`,
      }
    }
    return {
      order: position.y ?? 0,
      flex: position.width ?? 1,
    }
  }

  const supportingImages =
    dsl.supporting_images && dsl.supporting_images.length > 0 ? (
      <div className="mt-8 w-full">
        <SupportingImages
          images={dsl.supporting_images}
          pattern={pattern}
          lazy={true}
          palette={dsl.palette}
        />
      </div>
    ) : null

  // Create library context for component factory
  const libraryContext: LibraryContext | undefined = enableLibraryComponents
    ? {
        vibe: dsl.vibe,
        palette: dsl.palette,
        pattern: dsl.pattern_family,
        hasAccess: hasLibraryAccess,
        screenType:
          (dsl.metadata as Record<string, unknown> | undefined)?.screenType as string | undefined ??
          (dsl.metadata as Record<string, unknown> | undefined)?.screen_type as string | undefined,
        formFactor: 'web',
      }
    : undefined

  console.log('[ScreenRenderer] Library context:', {
    enabled: enableLibraryComponents,
    hasAccess: hasLibraryAccess,
    context: libraryContext,
  })

  return (
    <div
      className={className}
      style={{
        backgroundColor: dsl.palette.background,
        color: dsl.palette.primary,
        width: '100%',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Background effect layer */}
      {backgroundComponent && hasLibraryAccess && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <BackgroundWrapper
            libraryComponent={backgroundComponent}
            palette={dsl.palette}
            vibe={dsl.vibe}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <div
        style={{
          display: pattern.layout.structure === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns:
            pattern.layout.structure === 'grid' ? layoutConfig.gridTemplate : undefined,
          gridAutoRows: pattern.layout.structure === 'grid' ? 'min-content' : undefined,
          flexDirection: pattern.layout.structure === 'flex' ? pattern.layout.flexDirection : undefined,
          padding: `${layoutConfig.padding}px`,
          gap: `${layoutConfig.gap}px`,
          position: 'relative',
          zIndex: 1,
          ...containerStyles, // Enable container queries
        }}
      >
        {pattern.layout.positions.hero_image && (
          <div style={computeSlotStyle(pattern.layout.positions.hero_image)}>{heroImageNode}</div>
        )}

        {Object.entries(pattern.layout.positions).map(([slotName, position], slotIndex) => {
          if (slotName === 'hero_image') return null
          const component = componentMap.get(slotName)
          if (!component) return null

          // Find component index in DSL components array
          const componentIndex = dsl.components.findIndex((c) => c === component)

          const isInteractiveComponent =
            !!interactiveComponentTypes && !editMode && interactiveComponentTypes.includes(component.type as Component['type'])

          const componentStyle = {
            ...paletteStyles,
            ...vibeStyles,
          }

          const slotClassName = cn(
            isInteractiveComponent &&
              'interactive-slot group relative cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:ring-1 hover:ring-slate-200 focus-within:ring-2 focus-within:ring-slate-300'
          )

          const componentClassName = cn(
            'w-full',
            isInteractiveComponent &&
              'interactive-slot-component pointer-events-auto focus:outline-none group-hover:opacity-95 group-active:scale-[0.99]'
          )

          return (
            <div
              key={slotName}
              style={computeSlotStyle(position)}
              className={slotClassName}
              data-component-type={component.type}
              data-slot-name={slotName}
              data-interactive={isInteractiveComponent ? 'true' : undefined}
            >
              <ComponentRendererErrorBoundary
                componentType={component.type}
                slotName={slotName}
                onError={(error, errorInfo) => {
                  // Normalize componentStack: null -> undefined for telemetry
                  const normalizedErrorInfo = {
                    componentStack: errorInfo.componentStack ?? undefined,
                  }
                  telemetry.reportError(
                    error,
                    normalizedErrorInfo,
                    {
                      component: {
                        type: component.type,
                        slotName,
                      },
                      pattern: {
                        family: dsl.pattern_family,
                        variant: dsl.pattern_variant,
                      },
                    }
                  )
                }}
                fallback={
                  <div className="p-4 text-sm text-muted-foreground border border-dashed rounded">
                    Failed to render {component.type}
                  </div>
                }
              >
                {renderComponent({
                  component,
                  style: componentStyle,
                  className: componentClassName,
                  onClick: onComponentClick
                    ? (event) =>
                        onComponentClick(component.type as Component['type'], component, {
                          event,
                          slotName,
                          screenId,
                        })
                    : undefined,
                  editMode,
                  editingComponentId,
                  componentIndex: componentIndex >= 0 ? componentIndex : slotIndex,
                  screenId,
                  onStartEdit,
                  onSaveEdit,
                  libraryContext: libraryContext
                    ? {
                        ...libraryContext,
                        slot: slotName,
                      }
                    : undefined,
                })}
              </ComponentRendererErrorBoundary>
            </div>
          )
        })}
      </div>

      {supportingImages}
    </div>
  )
}

// Main renderer component with container provider wrapper and error boundary
export const ScreenRenderer: React.FC<ScreenRendererProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo, context?: { patternFamily?: string; patternVariant?: number }) => {
    // Normalize componentStack: null -> undefined for telemetry
    const normalizedErrorInfo = {
      componentStack: errorInfo.componentStack ?? undefined,
    }
    telemetry.reportError(
      error,
      normalizedErrorInfo,
      {
        pattern: context
          ? {
              family: context.patternFamily || props.dsl.pattern_family,
              variant: context.patternVariant || props.dsl.pattern_variant,
            }
          : undefined,
        dsl: {
          patternFamily: props.dsl.pattern_family,
          patternVariant: props.dsl.pattern_variant,
        },
      }
    )
  }
  
  return (
    <ContainerProvider containerRef={containerRef}>
      <div ref={containerRef} style={{ width: '100%' }}>
        <ScreenRendererErrorBoundary
          onError={handleError}
          patternFamily={props.dsl.pattern_family}
          patternVariant={props.dsl.pattern_variant}
        >
          <ScreenRendererContent {...props} />
        </ScreenRendererErrorBoundary>
      </div>
    </ContainerProvider>
  )
}

