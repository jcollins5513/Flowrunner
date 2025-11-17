// Main screen renderer component
// Renders a complete screen from DSL using pattern definitions

'use client'

import React, { useEffect, useState } from 'react'
import { type ScreenDSL } from '@/lib/dsl/types'
import { loadPatternAsync } from '@/lib/patterns/loader'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { PatternLayout } from '@/lib/renderer/pattern-layout'
import { renderComponent } from '@/lib/renderer/component-factory'
import { HeroImage } from './HeroImage'
import { applyPaletteStyles, applyVibeStyles } from '@/lib/renderer/styling'

export interface ScreenRendererProps {
  dsl: ScreenDSL
  className?: string
  onComponentClick?: (componentType: string, component: ScreenDSL['components'][0]) => void
}

export const ScreenRenderer: React.FC<ScreenRendererProps> = ({
  dsl,
  className = '',
  onComponentClick,
}) => {
  const [pattern, setPattern] = useState<PatternDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load pattern definition
  useEffect(() => {
    loadPatternAsync(dsl.pattern_family, dsl.pattern_variant)
      .then(setPattern)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [dsl.pattern_family, dsl.pattern_variant])

  if (loading) {
    return <div className="p-8">Loading pattern...</div>
  }

  if (error || !pattern) {
    return <div className="p-8 text-red-600">Error loading pattern: {error}</div>
  }

  // Apply palette and vibe styles
  const paletteStyles = applyPaletteStyles(dsl.palette)
  const vibeStyles = applyVibeStyles(dsl.vibe)

  // Create component map
  const componentMap = new Map<string, ScreenDSL['components'][0]>()
  dsl.components.forEach((comp) => {
    componentMap.set(comp.type, comp)
  })

  // Render hero image
  const heroImageNode = (
    <HeroImage
      image={dsl.hero_image}
      position={pattern.imagePlacement.hero.position}
      size={pattern.imagePlacement.hero.size}
    />
  )

  // Render components at their pattern positions
  const renderComponents = () => {
    return Object.entries(pattern.layout.positions).map(([slotName, position]) => {
      if (slotName === 'hero_image') return null

      const component = componentMap.get(slotName)
      if (!component) return null

      const componentStyle = {
        ...paletteStyles,
        ...vibeStyles,
      }

      return (
        <div
          key={slotName}
          style={{
            gridColumn: `${position.x + 1} / ${position.x + position.width + 1}`,
            gridRow: `${position.y + 1} / ${position.y + (position.height || 1) + 1}`,
          }}
        >
          {renderComponent({
            component,
            style: componentStyle,
            onClick:
              component.type === 'button' && onComponentClick
                ? () => onComponentClick(component.type, component)
                : undefined,
          })}
        </div>
      )
    })
  }

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
          display: 'grid',
          gridTemplateColumns: pattern.layout.gridTemplate || '1fr',
          padding: `${pattern.spacing.padding}px`,
          gap: `${pattern.spacing.gap}px`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Hero image */}
        {pattern.layout.positions.hero_image && (
          <div
            style={{
              gridColumn: `${pattern.layout.positions.hero_image.x + 1} / ${pattern.layout.positions.hero_image.x + pattern.layout.positions.hero_image.width + 1}`,
              gridRow: `${pattern.layout.positions.hero_image.y + 1} / ${pattern.layout.positions.hero_image.y + (pattern.layout.positions.hero_image.height || 1) + 1}`,
              position: pattern.imagePlacement.hero.position === 'full-bleed' ? 'absolute' : 'relative',
              ...(pattern.imagePlacement.hero.position === 'full-bleed' && {
                inset: 0,
                zIndex: 0,
              }),
            }}
          >
            {heroImageNode}
          </div>
        )}

        {/* Components */}
        {renderComponents()}
      </div>
    </div>
  )
}

