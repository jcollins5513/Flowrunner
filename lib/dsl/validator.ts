// DSL Validation Service
import { z } from 'zod'
import {
  screenDSLSchema,
  flowDSLSchema,
  partialScreenDSLSchema,
  partialFlowDSLSchema,
  type ScreenDSL,
  type FlowDSL,
  type PartialScreenDSL,
  type PartialFlowDSL,
} from './schemas'

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: ValidationError
  formattedErrors?: string[]
}

/**
 * Format Zod errors into human-readable messages
 */
function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.')
    const message = err.message
    return path ? `${path}: ${message}` : message
  })
}

/**
 * Validate a complete ScreenDSL
 */
export function validateScreenDSL(data: unknown): ValidationResult<ScreenDSL> {
  try {
    const validated = screenDSLSchema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error)
      return {
        success: false,
        error: new ValidationError('ScreenDSL validation failed', error),
        formattedErrors,
      }
    }
    throw error
  }
}

/**
 * Validate a complete FlowDSL
 */
export function validateFlowDSL(data: unknown): ValidationResult<FlowDSL> {
  try {
    const validated = flowDSLSchema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error)
      return {
        success: false,
        error: new ValidationError('FlowDSL validation failed', error),
        formattedErrors,
      }
    }
    throw error
  }
}

/**
 * Validate a partial ScreenDSL (for incremental updates)
 */
export function validatePartialScreenDSL(
  data: unknown
): ValidationResult<PartialScreenDSL> {
  try {
    const validated = partialScreenDSLSchema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error)
      return {
        success: false,
        error: new ValidationError('Partial ScreenDSL validation failed', error),
        formattedErrors,
      }
    }
    throw error
  }
}

/**
 * Validate a partial FlowDSL (for incremental updates)
 */
export function validatePartialFlowDSL(
  data: unknown
): ValidationResult<PartialFlowDSL> {
  try {
    const validated = partialFlowDSLSchema.parse(data)
    return {
      success: true,
      data: validated,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = formatZodErrors(error)
      return {
        success: false,
        error: new ValidationError('Partial FlowDSL validation failed', error),
        formattedErrors,
      }
    }
    throw error
  }
}

/**
 * Safe validation that returns data or throws ValidationError
 */
export function assertScreenDSL(data: unknown): ScreenDSL {
  const result = validateScreenDSL(data)
  if (!result.success) {
    throw result.error
  }
  return result.data!
}

/**
 * Safe validation that returns data or throws ValidationError
 */
export function assertFlowDSL(data: unknown): FlowDSL {
  const result = validateFlowDSL(data)
  if (!result.success) {
    throw result.error
  }
  return result.data!
}

/**
 * Safe partial validation that returns data or throws ValidationError
 */
export function assertPartialScreenDSL(data: unknown): PartialScreenDSL {
  const result = validatePartialScreenDSL(data)
  if (!result.success) {
    throw result.error
  }
  return result.data!
}

/**
 * Safe partial validation that returns data or throws ValidationError
 */
export function assertPartialFlowDSL(data: unknown): PartialFlowDSL {
  const result = validatePartialFlowDSL(data)
  if (!result.success) {
    throw result.error
  }
  return result.data!
}

