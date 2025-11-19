// Main screen renderer component
// Renders a complete screen from DSL using pattern definitions
// Blocks rendering if DSL is invalid

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { type ScreenDSL } from '@/lib/dsl/types'
import { loadPatternAsync } from '@/lib/patterns/loader'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { renderComponent } from '@/lib/renderer/component-factory'
import { HeroImage } from './HeroImage'
import { applyPaletteStyles, applyVibeStyles } from '@/lib/renderer/styling'
import { useResponsiveBreakpoint, type Breakpoint } from '@/lib/renderer/hooks'
import { validateScreenDSL } from '@/lib/dsl/validator'
import { validateDSLAgainstPattern } from '@/lib/patterns/validator'

export interface ScreenRendererProps {
  dsl: ScreenDSL
  className?: string
  onComponentClick?: (componentType: string, component: ScreenDSL['components'][0]) => void
  skipValidation?: boolean // Only use for development/debugging
}

const BREAKPOINT_ORDER: Breakpoint[] = ['mobile', 'tablet', 'desktop']

export const ScreenRenderer: React.FC<ScreenRendererProps> = ({
  dsl,
  className = '',
  onComponentClick,
  skipValidation = false,
}) => {
  const [pattern, setPattern] = useState<PatternDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const breakpoint = useResponsiveBreakpoint()

  // Validate DSL before rendering
  useEffect(() => {
    if (skipValidation) return

    // Schema validation
    const schemaResult = validateScreenDSL(dsl)
    if (!schemaResult.success) {
      setValidationError(`DSL Schema Error: ${schemaResult.formattedErrors?.join(', ') || schemaResult.error?.message}`)
      return
    }

    // Pattern validation will happen after pattern loads
  }, [dsl, skipValidation])

  useEffect(() => {
    if (validationError) return // Don't load pattern if schema validation failed

    loadPatternAsync(dsl.pattern_family, dsl.pattern_variant)
      .then((loadedPattern) => {
        setPattern(loadedPattern)

        // Validate DSL against pattern
        if (!skipValidation) {
          const patternResult = validateDSLAgainstPattern(dsl, loadedPattern)
          if (!patternResult.valid) {
            setValidationError(
              `Pattern Validation Error: ${patternResult.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
            )
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
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
    />
  )

  const computeSlotStyle = (position: { x: number; y: number; width: number; height?: number }) => {
    if (pattern.layout.structure === 'grid') {
      // Check if we're on mobile with single column layout
      const isSingleColumn = layoutConfig.gridTemplate === '1fr' || layoutConfig.gridTemplate?.match(/^1fr\s*$/)
      
      if (isSingleColumn) {
        // Normalize positions for single column: all components at x:0, stack vertically
        // Components originally on the right (x > 0) should stack after left column components
        // Use a large multiplier to ensure right column items come after left column
        const normalizedY = position.x === 0 ? position.y : position.y + (position.x * 1000)
        return {
          gridColumn: '1 / 2',
          gridRow: `${normalizedY + 1} / ${normalizedY + (position.height || 1) + 1}`,
        }
      }
      
      // Multi-column layout: use original positions
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
      <div className="mt-8 grid w-full grid-cols-2 gap-4">
        {dsl.supporting_images.map((image) => (
          <div key={image.id} className="relative h-40 w-full overflow-hidden rounded-xl">
            <HeroImage image={image} />
          </div>
        ))}
      </div>
    ) : null

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
        }}
      >
        {pattern.layout.positions.hero_image && (
          <div style={computeSlotStyle(pattern.layout.positions.hero_image)}>{heroImageNode}</div>
        )}

        {Object.entries(pattern.layout.positions).map(([slotName, position]) => {
          if (slotName === 'hero_image') return null
          const component = componentMap.get(slotName)
          if (!component) return null

          const componentStyle = {
            ...paletteStyles,
            ...vibeStyles,
          }

          return (
            <div key={slotName} style={computeSlotStyle(position)}>
              {renderComponent({
                component,
                style: componentStyle,
                onClick: onComponentClick ? () => onComponentClick(component.type, component) : undefined,
              })}
            </div>
          )
        })}
      </div>

      {supportingImages}
    </div>
  )
}

