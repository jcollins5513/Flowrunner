/**
 * Component Loader
 * 
 * Dynamically loads React components from library component files.
 * Handles different component export patterns and caches loaded components.
 */

import type { LibraryComponent } from './component-types'
import type React from 'react'

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType<any>>()

/**
 * Extract component from demo wrapper
 * 
 * Many library components are wrapped in demo functions.
 * This attempts to extract the actual component.
 */
function extractComponent(module: any): React.ComponentType<any> | null {
  // Try default export first
  if (module.default && typeof module.default === 'function') {
    return module.default
  }

  // Try named exports (common patterns)
  const componentNames = [
    'AnimatedGradientText',
    'RainbowButton',
    'ShimmerButton',
    'RippleButton',
    'MagicCard',
    'HeroHighlight',
    'BackgroundBeams',
    'AuroraBackground',
    'Meteors',
    'TextReveal',
    'MorphingText',
    'WordRotate',
    'TypingAnimation',
    'LineShadowText',
    'AnimatedShinyText',
    'BorderBeam',
    'MovingBorder',
    'CometCard',
    'GlareCard',
    'EvervaultCard',
    'WobbleCard',
    'ThreeDCardEffect',
  ]

  for (const name of componentNames) {
    if (module[name] && typeof module[name] === 'function') {
      return module[name]
    }
  }

  // Try to find any exported function component
  for (const key in module) {
    if (typeof module[key] === 'function' && key[0] === key[0].toUpperCase()) {
      return module[key]
    }
  }

  return null
}

/**
 * Load component code dynamically
 */
export async function loadComponentCode(
  component: LibraryComponent
): Promise<React.ComponentType<any> | null> {
  // Check cache first
  const cacheKey = `${component.source}/${component.slug}`
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!
  }

  try {
    // Dynamic import based on source and slug
    let module: any

    if (component.source === 'magic') {
      module = await import(
        `@/components/library/magic/components/${component.slug}/code`
      )
    } else if (component.source === 'aceternity') {
      module = await import(
        `@/components/library/aceternity/components/${component.slug}/code`
      )
    } else {
      module = await import(
        `@/components/library/components/${component.slug}/code`
      )
    }

    const Component = extractComponent(module)

    if (Component) {
      componentCache.set(cacheKey, Component)
      return Component
    }

    console.warn(
      `Could not extract component from ${component.source}/${component.slug}`
    )
    return null
  } catch (error) {
    console.error(
      `Failed to load component ${component.source}/${component.slug}:`,
      error
    )
    return null
  }
}

/**
 * Preload component (useful for performance)
 */
export async function preloadComponent(
  component: LibraryComponent
): Promise<void> {
  if (component.component) {
    return // Already loaded
  }

  const Component = await loadComponentCode(component)
  if (Component) {
    // Update component reference (mutable for performance)
    ;(component as any).component = Component
  }
}

/**
 * Clear component cache
 */
export function clearComponentCache(): void {
  componentCache.clear()
}

