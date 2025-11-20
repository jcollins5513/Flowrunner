// Theme provider for renderer palette and vibe
'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import { type Palette, type Vibe } from '../dsl/types'
import { applyPaletteStyles, applyVibeStyles, getComponentStyles } from './styling'

export interface RendererTheme {
  palette: Palette
  vibe: Vibe
}

export interface RendererThemeContextValue {
  theme: RendererTheme
  palette: Palette
  vibe: Vibe
  paletteStyles: React.CSSProperties
  vibeStyles: React.CSSProperties
  componentStyles: React.CSSProperties
}

const RendererThemeContext = createContext<RendererThemeContextValue | null>(null)

export interface RendererThemeProviderProps {
  children: ReactNode
  palette: Palette
  vibe: Vibe
}

/**
 * Theme provider that supplies palette and vibe through context
 */
export function RendererThemeProvider({
  children,
  palette,
  vibe,
}: RendererThemeProviderProps) {
  const paletteStyles = applyPaletteStyles(palette)
  const vibeStyles = applyVibeStyles(vibe)
  const componentStyles = getComponentStyles(palette, vibe)

  const value: RendererThemeContextValue = {
    theme: { palette, vibe },
    palette,
    vibe,
    paletteStyles,
    vibeStyles,
    componentStyles,
  }

  // Inject CSS variables for palette
  React.useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--flow-primary', palette.primary)
    root.style.setProperty('--flow-secondary', palette.secondary)
    root.style.setProperty('--flow-accent', palette.accent)
    root.style.setProperty('--flow-background', palette.background)

    return () => {
      // Cleanup on unmount (optional)
      root.style.removeProperty('--flow-primary')
      root.style.removeProperty('--flow-secondary')
      root.style.removeProperty('--flow-accent')
      root.style.removeProperty('--flow-background')
    }
  }, [palette])

  // Inject CSS variables for vibe typography and spacing
  React.useEffect(() => {
    const root = document.documentElement
    const { fontSize, lineHeight, fontWeight, letterSpacing } = vibeStyles
    const { padding, margin, gap, borderRadius } = vibeStyles as {
      padding?: string
      margin?: string
      gap?: string
      borderRadius?: string
    }

    if (fontSize) root.style.setProperty('--flow-font-size', fontSize as string)
    if (lineHeight) root.style.setProperty('--flow-line-height', lineHeight as string)
    if (fontWeight) root.style.setProperty('--flow-font-weight', String(fontWeight))
    if (letterSpacing) root.style.setProperty('--flow-letter-spacing', letterSpacing as string)
    if (padding) root.style.setProperty('--flow-padding', padding)
    if (margin) root.style.setProperty('--flow-margin', margin)
    if (gap) root.style.setProperty('--flow-gap', gap)
    if (borderRadius) root.style.setProperty('--flow-border-radius', borderRadius)

    return () => {
      // Cleanup on unmount (optional)
      root.style.removeProperty('--flow-font-size')
      root.style.removeProperty('--flow-line-height')
      root.style.removeProperty('--flow-font-weight')
      root.style.removeProperty('--flow-letter-spacing')
      root.style.removeProperty('--flow-padding')
      root.style.removeProperty('--flow-margin')
      root.style.removeProperty('--flow-gap')
      root.style.removeProperty('--flow-border-radius')
    }
  }, [vibe, vibeStyles])

  return (
    <RendererThemeContext.Provider value={value}>
      {children}
    </RendererThemeContext.Provider>
  )
}

/**
 * Hook to access renderer theme
 */
export function useRendererTheme(): RendererThemeContextValue {
  const context = useContext(RendererThemeContext)
  if (!context) {
    throw new Error('useRendererTheme must be used within RendererThemeProvider')
  }
  return context
}

/**
 * Hook to get just the palette
 */
export function usePalette(): Palette {
  const { palette } = useRendererTheme()
  return palette
}

/**
 * Hook to get just the vibe
 */
export function useVibe(): Vibe {
  const { vibe } = useRendererTheme()
  return vibe
}

/**
 * Hook to get combined component styles
 */
export function useComponentStyles(): React.CSSProperties {
  const { componentStyles } = useRendererTheme()
  return componentStyles
}

