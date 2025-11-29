/**
 * Feature Gating
 * 
 * Checks if user has access to library components (paid feature).
 * This is a placeholder that can be connected to subscription system later.
 */

/**
 * Check if user has access to library components
 * 
 * TODO: Connect to subscription system
 * For now, returns true for development - can be overridden for testing
 */
export async function hasLibraryComponentAccess(
  userId?: string | null
): Promise<boolean> {
  // Placeholder implementation
  // In production, this should check:
  // 1. User subscription tier (Pro or Enterprise)
  // 2. Token balance (if applicable)
  // 3. Feature flags
  
  // For development/testing, return true to enable components:
  return true
  
  // For production, default to false until subscription system is connected:
  // return false
}

/**
 * Check if library components feature is enabled globally
 * (Can be used for feature flags or beta testing)
 */
export function isLibraryComponentFeatureEnabled(): boolean {
  // Can be controlled via environment variable
  return process.env.ENABLE_LIBRARY_COMPONENTS === 'true'
}

/**
 * Combined check: both feature enabled and user has access
 */
export async function canUseLibraryComponents(
  userId?: string | null
): Promise<boolean> {
  // For development, enable if either flag is true or feature is enabled
  const featureEnabled = isLibraryComponentFeatureEnabled()
  const hasAccess = await hasLibraryComponentAccess(userId)
  
  console.log('[FeatureGate] canUseLibraryComponents:', {
    featureEnabled,
    hasAccess,
    envVar: process.env.ENABLE_LIBRARY_COMPONENTS,
  })
  
  // Allow if feature is explicitly enabled OR if has access (for dev)
  return featureEnabled || hasAccess
}



