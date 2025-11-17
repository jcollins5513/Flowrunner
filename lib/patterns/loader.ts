// Pattern loader utility
// Loads and validates pattern definition JSON files

import { patternDefinitionSchema, type PatternDefinition } from './schema'
import { type PatternFamily } from './families'
import { type PatternVariant } from '../dsl/types'

// Cache for loaded patterns
const patternCache = new Map<string, PatternDefinition>()

/**
 * Load a pattern definition from JSON file (client-safe)
 * @param family Pattern family identifier
 * @param variant Pattern variant number (1-5)
 * @returns Pattern definition object
 * @throws Error if pattern file not found or invalid
 */
export async function loadPatternAsync(
  family: PatternFamily,
  variant: PatternVariant
): Promise<PatternDefinition> {
  const cacheKey = `${family}-${variant}`
  
  // Check cache first
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey)!
  }

  try {
    // Load pattern file via fetch (works in both server and client)
    const response = await fetch(
      `/api/patterns/${family}/variant-${variant}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch pattern: ${response.statusText}`)
    }

    const patternData = await response.json()

    // Validate against schema
    const validatedPattern = patternDefinitionSchema.parse(patternData)

    // Verify family and variant match
    if (validatedPattern.family !== family) {
      throw new Error(`Pattern family mismatch: expected ${family}, got ${validatedPattern.family}`)
    }
    if (validatedPattern.variant !== variant) {
      throw new Error(`Pattern variant mismatch: expected ${variant}, got ${validatedPattern.variant}`)
    }

    // Cache the pattern
    patternCache.set(cacheKey, validatedPattern)

    return validatedPattern
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load pattern ${family} variant ${variant}: ${error.message}`)
    }
    throw error
  }
}

/**
 * Synchronous pattern loader (server-side only)
 * Falls back to async loader if fs is not available
 */
export function loadPattern(family: PatternFamily, variant: PatternVariant): PatternDefinition {
  const cacheKey = `${family}-${variant}`
  
  // Check cache first
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey)!
  }

  // For client-side, we need to use async loading
  // This is a temporary solution - in production, patterns should be pre-loaded
  throw new Error(
    `Pattern ${family} variant ${variant} not cached. Use loadPatternAsync() in client components.`
  )
}

/**
 * Load multiple patterns at once
 * @param patterns Array of {family, variant} objects
 * @returns Map of pattern keys to pattern definitions
 */
export function loadPatterns(
  patterns: Array<{ family: PatternFamily; variant: PatternVariant }>
): Map<string, PatternDefinition> {
  const result = new Map<string, PatternDefinition>()
  
  for (const { family, variant } of patterns) {
    const pattern = loadPattern(family, variant)
    const key = `${family}-${variant}`
    result.set(key, pattern)
  }
  
  return result
}

/**
 * Clear the pattern cache
 */
export function clearPatternCache(): void {
  patternCache.clear()
}

/**
 * Check if a pattern is cached
 * @param family Pattern family identifier
 * @param variant Pattern variant number
 * @returns True if pattern is cached
 */
export function isPatternCached(family: PatternFamily, variant: PatternVariant): boolean {
  const cacheKey = `${family}-${variant}`
  return patternCache.has(cacheKey)
}

/**
 * Get all cached pattern keys
 * @returns Array of pattern keys (family-variant)
 */
export function getCachedPatternKeys(): string[] {
  return Array.from(patternCache.keys())
}

