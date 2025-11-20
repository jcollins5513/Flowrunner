// Common renderer utilities

'use client'

import React, { type CSSProperties } from 'react'
import { type PatternDefinition } from '../patterns/schema'
import { type Component } from '../dsl/types'

export interface SlotPosition {
  x: number
  y: number
  width: number
  height?: number
}

/**
 * Compute slot position style for grid layout
 */
export function computeSlotPosition(
  position: SlotPosition,
  layoutStructure: 'grid' | 'flex',
  isSingleColumn = false
): CSSProperties {
  if (layoutStructure === 'grid') {
    if (isSingleColumn) {
      // Normalize positions for single column: all components at x:0, stack vertically
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

  // Flex layout
  return {
    order: position.y ?? 0,
    flex: position.width ?? 1,
  }
}

/**
 * Get image placement configuration from pattern
 */
export function getImagePlacement(
  pattern: PatternDefinition,
  imageType: 'hero' | 'supporting',
  index?: number
): { position: string; size: string } | null {
  if (imageType === 'hero') {
    return pattern.imagePlacement.hero
  }

  if (imageType === 'supporting') {
    const supportingPlacements = pattern.imagePlacement.supporting
    if (!supportingPlacements || supportingPlacements.length === 0) {
      return null
    }

    if (index !== undefined && index < supportingPlacements.length) {
      return supportingPlacements[index]!
    }

    // Fallback to first placement
    return supportingPlacements[0]!
  }

  return null
}

/**
 * Validate component props against expected structure
 */
export function validateComponentProps(
  component: Component,
  expectedProps?: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (expectedProps) {
    for (const [key, type] of Object.entries(expectedProps)) {
      const value = component.props?.[key]

      if (type === 'string' && typeof value !== 'string' && value !== undefined) {
        errors.push(`Prop ${key} must be a string, got ${typeof value}`)
      } else if (type === 'number' && typeof value !== 'number' && value !== undefined) {
        errors.push(`Prop ${key} must be a number, got ${typeof value}`)
      } else if (type === 'boolean' && typeof value !== 'boolean' && value !== undefined) {
        errors.push(`Prop ${key} must be a boolean, got ${typeof value}`)
      } else if (type === 'array' && !Array.isArray(value) && value !== undefined) {
        errors.push(`Prop ${key} must be an array, got ${typeof value}`)
      } else if (type === 'object' && (typeof value !== 'object' || Array.isArray(value)) && value !== undefined) {
        errors.push(`Prop ${key} must be an object, got ${typeof value}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Debugging utilities for layout overlay and slot visualization
 */

export interface LayoutDebugInfo {
  patternFamily: string
  patternVariant: number
  slots: Array<{
    name: string
    position: SlotPosition
    hasComponent: boolean
  }>
}

/**
 * Generate layout debug information
 */
export function generateLayoutDebugInfo(
  pattern: PatternDefinition,
  components: Component[]
): LayoutDebugInfo {
  const componentMap = new Map<string, Component>()
  components.forEach((comp) => {
    componentMap.set(comp.type, comp)
  })

  const slots = Object.entries(pattern.layout.positions).map(([slotName, position]) => ({
    name: slotName,
    position,
    hasComponent: componentMap.has(slotName),
  }))

  return {
    patternFamily: pattern.family,
    patternVariant: pattern.variant,
    slots,
  }
}

/**
 * Layout overlay component for debugging
 * Shows slot outlines and names
 */
export interface LayoutDebugOverlayProps {
  pattern: PatternDefinition
  components: Component[]
  className?: string
}

export const LayoutDebugOverlay: React.FC<LayoutDebugOverlayProps> = ({
  pattern,
  components,
  className = '',
}) => {
  const debugInfo = generateLayoutDebugInfo(pattern, components)

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-50 ${className}`}
      style={{
        border: '2px dashed rgba(255, 0, 0, 0.5)',
      }}
    >
      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
        DEBUG: {debugInfo.patternFamily} v{debugInfo.patternVariant}
      </div>
      {debugInfo.slots.map((slot) => (
        <div
          key={slot.name}
          className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
          style={{
            gridColumn: `${slot.position.x + 1} / ${slot.position.x + slot.position.width + 1}`,
            gridRow: `${slot.position.y + 1} / ${slot.position.y + (slot.position.height || 1) + 1}`,
          }}
        >
          <div
            className={`absolute top-0 left-0 text-xs px-1 py-0.5 ${
              slot.hasComponent ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            {slot.name}
            {!slot.hasComponent && ' (empty)'}
          </div>
        </div>
      ))}
    </div>
  )
}

