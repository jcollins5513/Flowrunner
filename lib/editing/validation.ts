// Edit Validation Layer
// Validates edits against pattern constraints and Zod schemas

import type { ScreenDSL, Component } from '../dsl/types'
import { validateScreenDSL } from '../dsl/validator'
import { validateDSLAgainstPattern } from '../patterns/validator'
import { loadPattern } from '../patterns/loader'
import type { PatternDefinition } from '../patterns/schema'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate a component edit against pattern constraints
 */
export function validateComponentEdit(
  dsl: ScreenDSL,
  componentIndex: number,
  updatedComponent: Partial<Component>
): ValidationResult {
  const errors: ValidationError[] = []

  // Check if component index is valid
  if (componentIndex < 0 || componentIndex >= dsl.components.length) {
    return {
      valid: false,
      errors: [{ field: 'componentIndex', message: 'Invalid component index' }],
    }
  }

  const currentComponent = dsl.components[componentIndex]
  const pattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)

  // Check if component type matches pattern slot requirements
  if (updatedComponent.type && updatedComponent.type !== currentComponent.type) {
    const slotTypes = getSlotTypesForComponent(pattern, componentIndex)
    if (!slotTypes.includes(updatedComponent.type)) {
      errors.push({
        field: 'component.type',
        message: `Component type "${updatedComponent.type}" is not allowed in this pattern slot. Allowed types: ${slotTypes.join(', ')}`,
      })
    }
  }

  // Validate component content (if provided)
  if (updatedComponent.content !== undefined && updatedComponent.content.trim() === '') {
    errors.push({
      field: 'component.content',
      message: 'Component content cannot be empty',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate a complete DSL update
 */
export function validateDSLUpdate(
  currentDSL: ScreenDSL,
  updatedDSL: Partial<ScreenDSL>
): ValidationResult {
  const errors: ValidationError[] = []

  // Merge updates into current DSL for validation
  const mergedDSL: ScreenDSL = {
    ...currentDSL,
    ...updatedDSL,
    // Deep merge components if updating
    components: updatedDSL.components || currentDSL.components,
    palette: updatedDSL.palette || currentDSL.palette,
    hero_image: updatedDSL.hero_image || currentDSL.hero_image,
  }

  // Validate against Zod schema
  const schemaResult = validateScreenDSL(mergedDSL)
  if (!schemaResult.success) {
    const schemaErrors = schemaResult.formattedErrors || [schemaResult.error?.message || 'Validation failed']
    return {
      valid: false,
      errors: schemaErrors.map((msg) => ({ field: 'dsl', message: msg })),
    }
  }

  // Validate against pattern
  try {
    const pattern = loadPattern(mergedDSL.pattern_family, mergedDSL.pattern_variant)
    const patternResult = validateDSLAgainstPattern(mergedDSL, pattern)

    if (!patternResult.valid) {
      return {
        valid: false,
        errors: patternResult.errors.map((err) => ({
          field: err.field,
          message: err.message,
        })),
      }
    }
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          field: 'pattern',
          message: error instanceof Error ? error.message : 'Failed to load pattern for validation',
        },
      ],
    }
  }

  return {
    valid: true,
    errors: [],
  }
}

/**
 * Check if pattern allows component reordering
 */
export function canReorderComponents(pattern: PatternDefinition): boolean {
  // For now, we'll allow reordering if all slots are of the same component type
  // This is a simplified check - can be enhanced based on pattern metadata
  return true // Most patterns allow reordering
}

/**
 * Check if pattern allows component deletion
 */
export function canDeleteComponent(
  pattern: PatternDefinition,
  componentIndex: number,
  currentComponents: Component[]
): boolean {
  // Components can be deleted if there's at least one component remaining
  // and if the pattern doesn't require all slots to be filled
  const requiredSlots = Object.keys(pattern.layout.positions).filter(
    (slot) => slot !== 'hero_image'
  ).length

  if (currentComponents.length <= 1) {
    return false // Must have at least one component
  }

  // Check if this slot is required by the pattern
  const slotNames = Object.keys(pattern.layout.positions).filter((slot) => slot !== 'hero_image')
  if (componentIndex >= slotNames.length) {
    return false // Component index out of pattern slots
  }

  return true // Allow deletion if more than one component exists
}

/**
 * Check if pattern allows adding a component
 */
export function canAddComponent(
  pattern: PatternDefinition,
  currentComponents: Component[]
): boolean {
  const maxSlots = Object.keys(pattern.layout.positions).filter(
    (slot) => slot !== 'hero_image'
  ).length

  return currentComponents.length < maxSlots
}

/**
 * Get allowed component types for a specific slot in a pattern
 */
function getSlotTypesForComponent(
  pattern: PatternDefinition,
  componentIndex: number
): Component['type'][] {
  const slotNames = Object.keys(pattern.layout.positions).filter((slot) => slot !== 'hero_image')

  if (componentIndex >= slotNames.length) {
    return [] // Invalid index
  }

  const slotName = slotNames[componentIndex]

  // Check pattern metadata for slot constraints
  // For now, return all component types - this can be enhanced with pattern metadata
  return ['title', 'subtitle', 'button', 'form', 'text', 'image']
}

/**
 * Validate palette format
 */
export function validatePalette(palette: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!palette || typeof palette !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'palette', message: 'Palette must be an object' }],
    }
  }

  const p = palette as Record<string, unknown>
  const requiredFields = ['primary', 'secondary', 'accent', 'background']

  for (const field of requiredFields) {
    if (!p[field] || typeof p[field] !== 'string') {
      errors.push({
        field: `palette.${field}`,
        message: `Palette ${field} must be a valid color string`,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
