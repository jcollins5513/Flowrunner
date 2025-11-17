// Pattern validation utilities
// Validates DSL against pattern contracts

import { type ScreenDSL } from '../dsl/types'
import { type PatternDefinition } from './schema'
import { loadPattern } from './loader'
import { type PatternFamily } from './families'
import { type PatternVariant } from '../dsl/types'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Validate DSL components against pattern required slots
 */
function validateRequiredSlots(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): ValidationError[] {
  const errors: ValidationError[] = []
  const dslComponentTypes = new Set(dsl.components.map((c) => c.type))
  const requiredSlots = new Set(pattern.componentSlots.required)

  // Check if all required slots are present
  for (const requiredSlot of requiredSlots) {
    if (!dslComponentTypes.has(requiredSlot as any)) {
      errors.push({
        field: 'components',
        message: `Missing required component slot: ${requiredSlot}`,
        code: 'MISSING_REQUIRED_SLOT',
      })
    }
  }

  return errors
}

/**
 * Validate component types are compatible with pattern
 */
function validateComponentTypes(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): ValidationError[] {
  const errors: ValidationError[] = []
  const allAllowedSlots = new Set([
    ...pattern.componentSlots.required,
    ...pattern.componentSlots.optional,
  ])
  const dslComponentTypes = new Set(dsl.components.map((c) => c.type))

  // Check if all DSL components are allowed by pattern
  for (const componentType of dslComponentTypes) {
    if (!allAllowedSlots.has(componentType)) {
      errors.push({
        field: 'components',
        message: `Component type '${componentType}' is not allowed in pattern ${pattern.family}`,
        code: 'INVALID_COMPONENT_TYPE',
      })
    }
  }

  return errors
}

/**
 * Validate image placement matches pattern constraints
 */
function validateImagePlacement(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): ValidationError[] {
  const errors: ValidationError[] = []

  // Hero image is always required
  if (!dsl.hero_image) {
    errors.push({
      field: 'hero_image',
      message: 'Hero image is required',
      code: 'MISSING_HERO_IMAGE',
    })
    return errors
  }

  // Validate hero image placement
  const heroPlacement = pattern.imagePlacement.hero
  // Note: Actual placement validation would require rendering context
  // This is a basic structural check

  // Validate supporting images if pattern supports them
  if (dsl.supporting_images && dsl.supporting_images.length > 0) {
    if (!pattern.imagePlacement.supporting || pattern.imagePlacement.supporting.length === 0) {
      errors.push({
        field: 'supporting_images',
        message: `Pattern ${pattern.family} does not support supporting images`,
        code: 'UNSUPPORTED_SUPPORTING_IMAGES',
      })
    } else if (dsl.supporting_images.length > pattern.imagePlacement.supporting.length) {
      errors.push({
        field: 'supporting_images',
        message: `Pattern ${pattern.family} supports maximum ${pattern.imagePlacement.supporting.length} supporting images, got ${dsl.supporting_images.length}`,
        code: 'TOO_MANY_SUPPORTING_IMAGES',
      })
    }
  }

  return errors
}

/**
 * Validate DSL against pattern contract
 * @param dsl Screen DSL to validate
 * @param pattern Pattern definition to validate against
 * @returns Validation result with errors if any
 */
export function validateDSLAgainstPattern(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): ValidationResult {
  const errors: ValidationError[] = []

  // Verify pattern family and variant match
  if (dsl.pattern_family !== pattern.family) {
    errors.push({
      field: 'pattern_family',
      message: `Pattern family mismatch: DSL has ${dsl.pattern_family}, pattern is ${pattern.family}`,
      code: 'PATTERN_FAMILY_MISMATCH',
    })
  }

  if (dsl.pattern_variant !== pattern.variant) {
    errors.push({
      field: 'pattern_variant',
      message: `Pattern variant mismatch: DSL has ${dsl.pattern_variant}, pattern is ${pattern.variant}`,
      code: 'PATTERN_VARIANT_MISMATCH',
    })
  }

  // Validate required slots
  errors.push(...validateRequiredSlots(dsl, pattern))

  // Validate component types
  errors.push(...validateComponentTypes(dsl, pattern))

  // Validate image placement
  errors.push(...validateImagePlacement(dsl, pattern))

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate DSL against pattern by loading pattern first
 * @param dsl Screen DSL to validate
 * @returns Validation result with errors if any
 */
export function validateDSLWithPattern(dsl: ScreenDSL): ValidationResult {
  try {
    const pattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
    return validateDSLAgainstPattern(dsl, pattern)
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          field: 'pattern',
          message: error instanceof Error ? error.message : 'Failed to load pattern',
          code: 'PATTERN_LOAD_ERROR',
        },
      ],
    }
  }
}

/**
 * Format validation errors into human-readable messages
 * @param result Validation result
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  return result.errors.map((error) => `${error.field}: ${error.message}`)
}

