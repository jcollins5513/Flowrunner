/**
 * Component Loader
 * 
 * Dynamically loads React components from library component files.
 * Handles different component export patterns and caches loaded components.
 */

import type { LibraryComponent } from './component-types'
import type React from 'react'

const componentCache = new Map<string, React.ComponentType<any>>()

function getCacheKey(component: LibraryComponent): string {
  return component.id
}

export async function loadComponentImplementation(
  component: LibraryComponent
): Promise<React.ComponentType<any> | null> {
  const cacheKey = getCacheKey(component)
  const cached = componentCache.get(cacheKey)
  if (cached) {
    // Validate cached component is a valid React component
    if (typeof cached === 'function' || (typeof cached === 'object' && cached !== null && 'render' in cached)) {
      return cached
    }
    // Invalid cached component, remove it
    componentCache.delete(cacheKey)
  }

  if (component.component) {
    // Validate component is a valid React component
    const comp = component.component
    if (typeof comp === 'function' || (typeof comp === 'object' && comp !== null && 'render' in comp)) {
      componentCache.set(cacheKey, comp)
      return comp
    }
    console.warn(`[ComponentLoader] Invalid component type for ${component.id}:`, typeof comp)
    return null
  }

  if (!component.load) {
    console.warn(`[ComponentLoader] No load function for component ${component.id}`)
    return null
  }

  try {
    const loaded = await component.load()
    
    // Validate loaded component is a valid React component
    if (!loaded) {
      console.warn(`[ComponentLoader] Load function returned null/undefined for ${component.id}`)
      return null
    }
    
    if (typeof loaded !== 'function' && (typeof loaded !== 'object' || loaded === null || !('render' in loaded))) {
      console.error(`[ComponentLoader] Load function returned invalid component type for ${component.id}:`, typeof loaded, loaded)
      return null
    }
    
    componentCache.set(cacheKey, loaded)
    return loaded
  } catch (error) {
    console.error(`[ComponentLoader] Error loading component ${component.id}:`, error)
    return null
  }
}

export async function preloadComponent(
  component: LibraryComponent
): Promise<void> {
  if (component.component) {
    componentCache.set(getCacheKey(component), component.component)
    return
  }

  const loaded = await loadComponentImplementation(component)
  if (loaded) {
    ;(component as any).component = loaded
  }
}

export function clearComponentCache(): void {
  componentCache.clear()
}



