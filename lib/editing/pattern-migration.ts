// Pattern Migration Utilities
// Handles component migration when switching patterns/variants

import type { ScreenDSL, Component, PatternFamily, PatternVariant } from '../dsl/types'
import type { PatternDefinition } from '../patterns/schema'
import { loadPattern } from '../patterns/loader'
import { validateDSLAgainstPattern } from '../patterns/validator'
import { updateComponentProps } from './component-ops'

export interface PatternMigrationResult {
  dsl: ScreenDSL
  migrated: boolean
  warnings: string[]
  lostComponents: string[]
}

export interface ComponentCompatibility {
  component: Component
  compatible: boolean
  targetSlot?: string
  warning?: string
}

/**
 * Check component compatibility when switching patterns
 */
export function checkComponentCompatibility(
  components: Component[],
  currentPattern: PatternDefinition,
  targetPattern: PatternDefinition
): ComponentCompatibility[] {
  const compatibility: ComponentCompatibility[] = []

  // Map component types to slot names (common mapping)
  const componentTypeToSlot: Record<string, string[]> = {
    title: ['title', 'heading', 'headline'],
    subtitle: ['subtitle', 'subheading', 'description'],
    button: ['button', 'cta', 'action'],
    text: ['text', 'body', 'content'],
    form: ['form', 'input'],
    image: ['image', 'illustration'],
  }

  // Get available slots in target pattern
  const targetSlots = [
    ...targetPattern.componentSlots.required,
    ...targetPattern.componentSlots.optional,
  ]

  for (const component of components) {
    const possibleSlots = componentTypeToSlot[component.type] || []
    const compatibleSlot = targetSlots.find((slot) =>
      possibleSlots.some((possibleSlot) =>
        slot.toLowerCase().includes(possibleSlot.toLowerCase())
      )
    )

    if (compatibleSlot) {
      compatibility.push({
        component,
        compatible: true,
        targetSlot: compatibleSlot,
      })
    } else {
      compatibility.push({
        component,
        compatible: false,
        warning: `Component type "${component.type}" is not available in target pattern "${targetPattern.family}" variant ${targetPattern.variant}`,
      })
    }
  }

  return compatibility
}

/**
 * Migrate components from current pattern to target pattern
 */
export function migrateComponents(
  dsl: ScreenDSL,
  targetPattern: PatternDefinition
): PatternMigrationResult {
  const currentPattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
  const compatibility = checkComponentCompatibility(
    dsl.components,
    currentPattern,
    targetPattern
  )

  const warnings: string[] = []
  const lostComponents: string[] = []
  const migratedComponents: Component[] = []

  // Migrate compatible components
  for (const comp of compatibility) {
    if (comp.compatible && comp.targetSlot) {
      // Component can be migrated
      migratedComponents.push(comp.component)
    } else {
      // Component cannot be migrated
      lostComponents.push(comp.component.type)
      warnings.push(
        comp.warning || `Component "${comp.component.type}" cannot be migrated to new pattern`
      )
    }
  }

  // Build new DSL with migrated components
  const migratedDSL: ScreenDSL = {
    ...dsl,
    pattern_family: targetPattern.family as PatternFamily,
    pattern_variant: targetPattern.variant as PatternVariant,
    components: migratedComponents,
  }

  // Validate migrated DSL
  const validation = validateDSLAgainstPattern(migratedDSL, targetPattern)
  if (!validation.valid) {
    warnings.push(
      `Validation warnings: ${validation.errors.map((e) => e.message).join('; ')}`
    )
  }

  return {
    dsl: migratedDSL,
    migrated: migratedComponents.length > 0,
    warnings,
    lostComponents,
  }
}

/**
 * Switch pattern variant (same family, different variant)
 */
export function switchPatternVariant(
  dsl: ScreenDSL,
  newVariant: PatternVariant
): PatternMigrationResult {
  const targetPattern = loadPattern(dsl.pattern_family, newVariant)
  return migrateComponents(dsl, targetPattern)
}

/**
 * Switch pattern family (different family)
 */
export function switchPatternFamily(
  dsl: ScreenDSL,
  newFamily: PatternFamily,
  variant: PatternVariant = 1
): PatternMigrationResult {
  const targetPattern = loadPattern(newFamily, variant)
  return migrateComponents(dsl, targetPattern)
}

/**
 * Get migration preview (dry run)
 */
export function previewPatternMigration(
  dsl: ScreenDSL,
  targetFamily: PatternFamily,
  targetVariant: PatternVariant
): PatternMigrationResult {
  const targetPattern = loadPattern(targetFamily, targetVariant)
  const currentPattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
  const compatibility = checkComponentCompatibility(
    dsl.components,
    currentPattern,
    targetPattern
  )

  const warnings: string[] = []
  const lostComponents: string[] = []

  for (const comp of compatibility) {
    if (!comp.compatible) {
      lostComponents.push(comp.component.type)
      warnings.push(
        comp.warning || `Component "${comp.component.type}" cannot be migrated`
      )
    }
  }

  return {
    dsl, // Return original DSL for preview
    migrated: compatibility.some((c) => c.compatible),
    warnings,
    lostComponents,
  }
}
