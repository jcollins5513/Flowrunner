// Pattern layout renderer
// Applies pattern definitions to create the layout structure

'use client'

import React from 'react'
import { type PatternDefinition } from '../patterns/schema'
import { type Component } from '../dsl/types'
import { useContainerBreakpoint, containerStyles } from './container-queries'
import { useResponsiveBreakpoint, type Breakpoint } from './hooks'

export interface PatternLayoutProps {
  pattern: PatternDefinition
  components: Component[]
  heroImage?: React.ReactNode
  supportingImages?: React.ReactNode[]
  className?: string
}

export function PatternLayout({
  pattern,
  components,
  heroImage,
  supportingImages,
  className = '',
}: PatternLayoutProps) {
  const { layout, spacing, responsive } = pattern

  // Always call hooks unconditionally (React rules)
  // Use viewport breakpoint as primary source since pattern-layout might not be in container context
  const breakpoint: Breakpoint = useResponsiveBreakpoint()

  const breakpointConfig = responsive.breakpoints[breakpoint as keyof typeof responsive.breakpoints]

  const padding = breakpointConfig?.padding ?? spacing.padding
  const gap = breakpointConfig?.gap ?? spacing.gap
  const gridTemplate = breakpointConfig?.gridTemplate ?? layout.gridTemplate

  // Create component map for easy lookup
  const componentMap = new Map<string, Component>()
  components.forEach((comp) => {
    componentMap.set(comp.type, comp)
  })

  // Get position for a component slot
  const getPosition = (slotName: string) => {
    return pattern.layout.positions[slotName]
  }

  // Render component at position
  const renderComponentAtPosition = (slotName: string, component: Component | undefined) => {
    const position = getPosition(slotName)
    if (!position || !component) return null

    const gridColumn = `${position.x + 1} / ${position.x + position.width + 1}`
    const gridRow = `${position.y + 1} / ${position.y + (position.height || 1) + 1}`

    return (
      <div
        key={slotName}
        style={{
          gridColumn,
          gridRow,
        }}
      >
        {/* Component will be rendered by parent */}
        {slotName}
      </div>
    )
  }

  if (layout.structure === 'grid') {
    return (
      <div
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          padding: `${padding}px`,
          gap: `${gap}px`,
          width: '100%',
          minHeight: '100vh',
          ...containerStyles, // Enable container queries
        }}
      >
        {/* Render hero image */}
        {heroImage && (
          <div
            style={{
              gridColumn: pattern.layout.positions.hero_image
                ? `${pattern.layout.positions.hero_image.x + 1} / ${pattern.layout.positions.hero_image.x + pattern.layout.positions.hero_image.width + 1}`
                : '1 / -1',
              gridRow: pattern.layout.positions.hero_image
                ? `${pattern.layout.positions.hero_image.y + 1} / ${pattern.layout.positions.hero_image.y + (pattern.layout.positions.hero_image.height || 1) + 1}`
                : '1 / 1',
            }}
          >
            {heroImage}
          </div>
        )}

        {/* Render components at their positions */}
        {Object.keys(pattern.layout.positions).map((slotName) => {
          if (slotName === 'hero_image') return null
          const component = componentMap.get(slotName)
          if (!component) return null

          const position = pattern.layout.positions[slotName]
          return (
            <div
              key={slotName}
              style={{
                gridColumn: `${position.x + 1} / ${position.x + position.width + 1}`,
                gridRow: `${position.y + 1} / ${position.y + (position.height || 1) + 1}`,
              }}
            >
              {/* Slot placeholder - will be filled by ScreenRenderer */}
              <div data-slot={slotName} />
            </div>
          )
        })}
      </div>
    )
  }

  // Flex layout (for future implementation)
  return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: layout.flexDirection || 'column',
          padding: `${padding}px`,
          gap: `${gap}px`,
          width: '100%',
          minHeight: '100vh',
          ...containerStyles, // Enable container queries
        }}
      >
      {heroImage && <div>{heroImage}</div>}
      {/* Flex components would go here */}
    </div>
  )
}

