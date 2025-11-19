// DSL Persistence Layer with Validation
// Ensures all DSL documents are validated before persisting to database

import { z } from 'zod'
import { prisma } from './client'
import { validateScreenDSL, validateFlowDSL, assertScreenDSL, assertFlowDSL, ValidationError } from '../dsl/validator'
import { validateDSLAgainstPattern, validateDSLWithPattern } from '../patterns/validator'
import { loadPattern } from '../patterns/loader'
import type { ScreenDSL, FlowDSL } from '../dsl/types'
import type { PatternDefinition } from '../patterns/schema'

export interface PersistenceResult<T> {
  success: boolean
  data?: T
  error?: string
  validationErrors?: string[]
}

/**
 * Validate DSL before persistence
 * Performs both schema validation and pattern validation
 */
export async function validateDSLForPersistence(
  dsl: unknown,
  requirePatternValidation: boolean = true
): Promise<{ success: boolean; dsl?: ScreenDSL; errors?: string[] }> {
  // Step 1: Schema validation
  const schemaResult = validateScreenDSL(dsl)
  if (!schemaResult.success) {
    return {
      success: false,
      errors: schemaResult.formattedErrors || [schemaResult.error?.message || 'Schema validation failed'],
    }
  }

  const validatedDSL = schemaResult.data!

  // Step 2: Pattern validation (if required)
  if (requirePatternValidation) {
    try {
      const pattern = loadPattern(validatedDSL.pattern_family, validatedDSL.pattern_variant)
      const patternResult = validateDSLAgainstPattern(validatedDSL, pattern)

      if (!patternResult.valid) {
        return {
          success: false,
          errors: patternResult.errors.map((err) => `${err.field}: ${err.message}`),
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to load pattern for validation'],
      }
    }
  }

  return {
    success: true,
    dsl: validatedDSL,
  }
}

/**
 * Create a revision with validation
 * Throws ValidationError if DSL is invalid
 */
export async function createRevisionWithValidation(
  flowId: string,
  dsl: unknown,
  options: {
    screenId?: string
    version?: number
    changeType?: string
    skipPatternValidation?: boolean
  } = {}
): Promise<{ revision: any; dsl: ScreenDSL }> {
  // Validate DSL
  const validation = await validateDSLForPersistence(dsl, !options.skipPatternValidation)

  if (!validation.success || !validation.dsl) {
    // Create a ZodError from validation errors for proper error handling
    const zodError = new z.ZodError(
      validation.errors?.map((msg) => ({
        code: 'custom',
        path: [],
        message: msg,
      })) || []
    )
    throw new ValidationError('DSL validation failed', zodError)
  }

  const validatedDSL = validation.dsl

  // Get latest version for this flow
  const latestRevision = await prisma.revision.findFirst({
    where: { flowId },
    orderBy: { version: 'desc' },
  })

  const nextVersion = options.version ?? (latestRevision ? latestRevision.version + 1 : 1)

  // Create revision
  const revision = await prisma.revision.create({
    data: {
      flowId,
      screenId: options.screenId ?? null,
      dslSnapshot: JSON.stringify(validatedDSL),
      version: nextVersion,
      changeType: options.changeType ?? 'generation',
    },
  })

  return { revision, dsl: validatedDSL }
}

/**
 * Create a screen with validation
 * Throws ValidationError if DSL is invalid
 */
export async function createScreenWithValidation(
  flowId: string,
  dsl: unknown,
  options: {
    heroImageId?: string
    skipPatternValidation?: boolean
  } = {}
): Promise<{ screen: any; dsl: ScreenDSL }> {
  // Validate DSL
  const validation = await validateDSLForPersistence(dsl, !options.skipPatternValidation)

  if (!validation.success || !validation.dsl) {
    // Create a ZodError from validation errors for proper error handling
    const zodError = new z.ZodError(
      validation.errors?.map((msg) => ({
        code: 'custom',
        path: [],
        message: msg,
      })) || []
    )
    throw new ValidationError('DSL validation failed', zodError)
  }

  const validatedDSL = validation.dsl

  // Create screen
  const screen = await prisma.screen.create({
    data: {
      flowId,
      heroImageId: options.heroImageId ?? null,
      palette: JSON.stringify(validatedDSL.palette),
      vibe: validatedDSL.vibe,
      patternFamily: validatedDSL.pattern_family,
      patternVariant: validatedDSL.pattern_variant,
      components: JSON.stringify(validatedDSL.components),
      navigation: validatedDSL.navigation ? JSON.stringify(validatedDSL.navigation) : null,
      animations: validatedDSL.animations ? JSON.stringify(validatedDSL.animations) : null,
      metadata: validatedDSL.metadata ? JSON.stringify(validatedDSL.metadata) : null,
    },
  })

  return { screen, dsl: validatedDSL }
}

/**
 * Validate FlowDSL before persistence
 */
export function validateFlowForPersistence(
  flow: unknown
): PersistenceResult<FlowDSL> {
  const result = validateFlowDSL(flow)

  if (!result.success) {
    return {
      success: false,
      error: result.error?.message || 'FlowDSL validation failed',
      validationErrors: result.formattedErrors,
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

