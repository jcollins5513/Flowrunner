// Styling utilities for applying palette and vibe to components

import { type Palette, type Vibe } from '../dsl/types'
import React from 'react'

/**
 * Apply palette colors to component styles
 */
export function applyPaletteStyles(palette: Palette): React.CSSProperties {
  return {
    color: palette.primary,
    // Add more palette-based styles as needed
  }
}

/**
 * Apply vibe-based styling
 */
export function applyVibeStyles(vibe: Vibe): React.CSSProperties {
  const vibeStyles: Record<Vibe, React.CSSProperties> = {
    playful: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 500,
    },
    professional: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
    bold: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    minimal: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 300,
      letterSpacing: '0.05em',
    },
    modern: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 400,
    },
    retro: {
      fontFamily: 'Georgia, serif',
      fontWeight: 400,
      fontStyle: 'italic',
    },
    elegant: {
      fontFamily: 'Georgia, serif',
      fontWeight: 400,
      letterSpacing: '0.02em',
    },
    energetic: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 600,
    },
    calm: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 300,
    },
    tech: {
      fontFamily: 'monospace',
      fontWeight: 400,
    },
    creative: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 500,
    },
    corporate: {
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 400,
      letterSpacing: '0.01em',
    },
  }

  return vibeStyles[vibe] || {}
}

/**
 * Get button styles based on palette
 */
export function getButtonStyles(palette: Palette, vibe: Vibe): React.CSSProperties {
  return {
    backgroundColor: palette.accent,
    color: palette.background,
    border: `2px solid ${palette.accent}`,
    ...applyVibeStyles(vibe),
  }
}

