/**
 * Component Loader
 * 
 * Dynamically loads React components from library component files.
 * Handles different component export patterns and caches loaded components.
 */

import type { LibraryComponent } from './component-types'
import React, { isValidElement } from 'react'
import { TextGenerateAdapter, HeroHighlightAdapter } from './component-adapters'

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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:48',message:'Component loaded',data:{componentId:component.id,loadedType:typeof loaded,isFunction:typeof loaded === 'function',isObject:typeof loaded === 'object',hasRender:loaded && typeof loaded === 'object' && 'render' in loaded,loadedValue:loaded?.toString?.()?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Validate loaded component is a valid React component
    if (!loaded) {
      console.warn(`[ComponentLoader] Load function returned null/undefined for ${component.id}`)
      return null
    }
    
    if (typeof loaded !== 'function' && (typeof loaded !== 'object' || loaded === null || !('render' in loaded))) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:57',message:'Invalid component type detected',data:{componentId:component.id,loadedType:typeof loaded,isJSX:isValidElement(loaded)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error(`[ComponentLoader] Load function returned invalid component type for ${component.id}:`, typeof loaded, loaded)
      return null
    }
    
    // Wrap demo components with adapters to accept dynamic props
    // Demo components have hardcoded content and don't accept dynamic props
    // Adapters wrap the base components to accept DSL content
    let wrappedComponent = loaded
    if (component.id === 'safe.text.generate') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:71',message:'Wrapping TextGenerateEffectDemo with adapter',data:{componentId:component.id,loadedType:typeof loaded,isFunction:typeof loaded === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      wrappedComponent = TextGenerateAdapter as React.ComponentType<any>
    } else if (component.id === 'safe.hero.highlight') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:74',message:'Wrapping HeroHighlightDemo with adapter',data:{componentId:component.id,loadedType:typeof loaded,isFunction:typeof loaded === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      wrappedComponent = HeroHighlightAdapter as React.ComponentType<any>
    }
    
    // Final validation - ensure wrappedComponent is a function, not JSX
    if (typeof wrappedComponent !== 'function' || isValidElement(wrappedComponent)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:85',message:'Wrapped component is not a function',data:{componentId:component.id,wrappedType:typeof wrappedComponent,isJSX:isValidElement(wrappedComponent)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error(`[ComponentLoader] Wrapped component is not a function for ${component.id}:`, typeof wrappedComponent, isValidElement(wrappedComponent))
      return null
    }
    
    componentCache.set(cacheKey, wrappedComponent)
    return wrappedComponent
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'component-loader.ts:64',message:'Component load error',data:{componentId:component.id,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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



