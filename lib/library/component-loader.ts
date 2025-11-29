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
    return cached
  }

  if (component.component) {
    componentCache.set(cacheKey, component.component)
    return component.component
  }

  if (!component.load) {
    return null
  }

  const loaded = await component.load()
  componentCache.set(cacheKey, loaded)
  return loaded
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



