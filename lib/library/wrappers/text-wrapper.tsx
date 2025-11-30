/**
 * Text Component Wrapper
 * 
 * Wraps library text components (title, subtitle, text) to integrate with DSL.
 */

'use client'

import React, { useEffect, useState, useRef, isValidElement } from 'react'
import type { LibraryComponent } from '../component-types'
import { loadComponentImplementation } from '../component-loader'
import type { Component } from '@/lib/dsl/types'
import type { Palette, Vibe } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface TextWrapperProps {
  libraryComponent: LibraryComponent
  dslComponent: Component
  palette: Palette
  vibe: Vibe
  className?: string
  style?: React.CSSProperties
  onError?: (error: Error) => void
  implementation?: React.ComponentType<any> | null
}

export function TextWrapper({
  libraryComponent,
  dslComponent,
  palette,
  vibe,
  className,
  style,
  onError,
  implementation,
}: TextWrapperProps): React.ReactElement {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  // Use ref to store the actual component function to prevent React from evaluating it
  const componentRef = useRef<React.ComponentType<any> | null>(null)

  // Always load component directly to avoid RSC serialization issues
  // Don't rely on implementation prop as it gets serialized through RSC boundaries
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const LoadedComponent = await loadComponentImplementation(libraryComponent)
        if (!cancelled) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:70',message:'Component loaded in TextWrapper',data:{componentId:libraryComponent.id,loadedType:typeof LoadedComponent,isFunction:typeof LoadedComponent === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          if (typeof LoadedComponent === 'function' && !isValidElement(LoadedComponent)) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:52',message:'Setting component in state',data:{componentId:libraryComponent.id,loadedType:typeof LoadedComponent,isFunction:typeof LoadedComponent === 'function',isJSX:isValidElement(LoadedComponent),componentName:LoadedComponent?.name || LoadedComponent?.displayName || 'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // Store in ref to prevent React from evaluating it
            componentRef.current = LoadedComponent
            setComponent(() => LoadedComponent)
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:58',message:'Loaded component is not a function',data:{componentId:libraryComponent.id,loadedType:typeof LoadedComponent,isJSX:isValidElement(LoadedComponent)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.error('[TextWrapper] Loaded component is not a function:', typeof LoadedComponent)
            setError(new Error('Loaded component is not a function'))
          }
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          onError?.(error)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [libraryComponent, onError])

  // Track when Component changes from function to JSX and restore from ref
  useEffect(() => {
    if (Component && isValidElement(Component)) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:76',message:'Component became JSX - restoring from ref',data:{componentId:libraryComponent.id,refType:typeof componentRef.current,refIsFunction:typeof componentRef.current === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Component became JSX - restore from ref if available
      if (componentRef.current && typeof componentRef.current === 'function') {
        setComponent(() => componentRef.current as React.ComponentType<any>)
      } else {
        setComponent(null)
      }
    } else if (Component && typeof Component === 'function') {
      // Update ref when Component is a valid function
      componentRef.current = Component
    }
  }, [Component, libraryComponent.id])

  if (error) {
    // Fallback to plain text on error
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }

  if (!Component) {
    // Loading state
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }

  // Validate that Component is actually a function/class component
  if (typeof Component !== 'function' && typeof Component !== 'object') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:98',message:'Invalid component type in TextWrapper',data:{componentType:typeof Component,componentId:libraryComponent.id,isJSX:isValidElement(Component),componentValue:JSON.stringify(Component)?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (process.env.NODE_ENV === 'development') {
      console.error('[TextWrapper] Invalid component type:', typeof Component)
    }
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:108',message:'Rendering component in TextWrapper',data:{componentType:typeof Component,componentId:libraryComponent.id,componentName:Component?.name || Component?.displayName || 'unknown',isFunction:typeof Component === 'function',isJSX:isValidElement(Component),componentToString:Component?.toString?.()?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Apply palette colors via CSS variables
  const paletteStyle: React.CSSProperties = {
    ...style,
    ['--flow-primary' as string]: palette.primary,
    ['--flow-secondary' as string]: palette.secondary,
    ['--flow-accent' as string]: palette.accent,
    ['--flow-background' as string]: palette.background,
  }

  // Different components accept content in different ways
  // Try common prop patterns
  const props: Record<string, any> = {
    className: cn(className),
    style: paletteStyle,
  }

  // Guard against JSX being stored instead of component function
  // Use ref if Component is JSX (shouldn't happen, but safety check)
  const ComponentToRender = isValidElement(Component) && componentRef.current 
    ? componentRef.current 
    : Component

  if (isValidElement(ComponentToRender) || (ComponentToRender && typeof ComponentToRender !== 'function')) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'text-wrapper.tsx:157',message:'Component is JSX or invalid - using ref or falling back',data:{componentId:libraryComponent.id,componentType:typeof ComponentToRender,isJSX:isValidElement(ComponentToRender),hasRef:!!componentRef.current,refType:typeof componentRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Try to restore from ref
    if (componentRef.current && typeof componentRef.current === 'function') {
      setComponent(() => componentRef.current as React.ComponentType<any>)
      // Render with ref component
      const RefComponent = componentRef.current
      return (
        <RefComponent {...props}>
          {dslComponent.content}
        </RefComponent>
      )
    }
    // Fallback to plain text
    return (
      <div className={className} style={style}>
        {dslComponent.content}
      </div>
    )
  }

  // Try children first (most common)
  try {
    return (
      <ComponentToRender {...props}>
        {dslComponent.content}
      </ComponentToRender>
    )
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[TextWrapper] Error rendering component with children:', err)
    }
    // Try text prop
    try {
      return <ComponentToRender {...props} text={dslComponent.content} />
    } catch {
      // Try content prop
      try {
        return <ComponentToRender {...props} content={dslComponent.content} />
      } catch {
        // Fallback: render as children with error handling
        return (
          <div className={className} style={style}>
            {dslComponent.content}
          </div>
        )
      }
    }
  }
}



