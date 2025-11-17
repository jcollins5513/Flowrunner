// Main screen renderer component
// Renders a complete screen from DSL using pattern definitions

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { type ScreenDSL } from '@/lib/dsl/types'
import { loadPatternAsync } from '@/lib/patterns/loader'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { renderComponent } from '@/lib/renderer/component-factory'
import { HeroImage } from './HeroImage'
import { applyPaletteStyles, applyVibeStyles } from '@/lib/renderer/styling'
import { useResponsiveBreakpoint, type Breakpoint } from '@/lib/renderer/hooks'

export interface ScreenRendererProps {
  dsl: ScreenDSL
  className?: string
  onComponentClick?: (componentType: string, component: ScreenDSL['components'][0]) => void
}

const BREAKPOINT_ORDER: Breakpoint[] = ['mobile', 'tablet', 'desktop']

export const ScreenRenderer: React.FC<ScreenRendererProps> = ({
  dsl,
  className = '',
  onComponentClick,
}) => {
  const [pattern, setPattern] = useState<PatternDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const breakpoint = useResponsiveBreakpoint()

  useEffect(() => {
    loadPatternAsync(dsl.pattern_family, dsl.pattern_variant)
      .then(setPattern)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [dsl.pattern_family, dsl.pattern_variant])

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

