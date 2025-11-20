// Styling utilities for applying palette and vibe to components

import { type Palette, type Vibe } from '../dsl/types'
import React from 'react'

/**
 * Apply palette colors to component styles
 */
export function applyPaletteStyles(palette: Palette): React.CSSProperties {
  return {
    color: palette.primary,
    backgroundColor: palette.background,
    // CSS variables for palette
    ['--flow-primary' as string]: palette.primary,
    ['--flow-secondary' as string]: palette.secondary,
    ['--flow-accent' as string]: palette.accent,
    ['--flow-background' as string]: palette.background,
  }
}

/**
 * Get palette color CSS properties
 */
export function getPaletteColors(palette: Palette): {
  primary: string
  secondary: string
  accent: string
  background: string
} {
  return {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    background: palette.background,
  }
}

/**
 * Typography scales based on vibe
 */
export const typographyScales: Record<Vibe, {
  fontSize: string
  lineHeight: string
  fontWeight: number
  letterSpacing: string
  fontFamily: string
}> = {
  playful: {
    fontSize: '1.125rem',
    lineHeight: '1.75',
    fontWeight: 500,
    letterSpacing: '0em',
    fontFamily: 'system-ui, sans-serif',
  },
  professional: {
    fontSize: '1rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0.01em',
    fontFamily: 'system-ui, sans-serif',
  },
  bold: {
    fontSize: '1.25rem',
    lineHeight: '1.5',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    fontFamily: 'system-ui, sans-serif',
  },
  minimal: {
    fontSize: '0.875rem',
    lineHeight: '1.75',
    fontWeight: 300,
    letterSpacing: '0.05em',
    fontFamily: 'system-ui, sans-serif',
  },
  modern: {
    fontSize: '1rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0em',
    fontFamily: 'system-ui, sans-serif',
  },
  retro: {
    fontSize: '1rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0.02em',
    fontFamily: 'Georgia, serif',
  },
  elegant: {
    fontSize: '1.125rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0.02em',
    fontFamily: 'Georgia, serif',
  },
  energetic: {
    fontSize: '1.125rem',
    lineHeight: '1.625',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    fontFamily: 'system-ui, sans-serif',
  },
  calm: {
    fontSize: '1rem',
    lineHeight: '1.75',
    fontWeight: 300,
    letterSpacing: '0.02em',
    fontFamily: 'system-ui, sans-serif',
  },
  tech: {
    fontSize: '0.9375rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0em',
    fontFamily: 'monospace',
  },
  creative: {
    fontSize: '1.125rem',
    lineHeight: '1.625',
    fontWeight: 500,
    letterSpacing: '0em',
    fontFamily: 'system-ui, sans-serif',
  },
  corporate: {
    fontSize: '1rem',
    lineHeight: '1.625',
    fontWeight: 400,
    letterSpacing: '0.01em',
    fontFamily: 'system-ui, sans-serif',
  },
}

/**
 * Spacing scales based on vibe
 */
export const spacingScales: Record<Vibe, {
  padding: string
  margin: string
  gap: string
  borderRadius: string
}> = {
  playful: { padding: '1rem', margin: '0.75rem', gap: '0.75rem', borderRadius: '0.75rem' },
  professional: { padding: '1.25rem', margin: '1rem', gap: '1rem', borderRadius: '0.5rem' },
  bold: { padding: '1.5rem', margin: '1.25rem', gap: '1.25rem', borderRadius: '0.375rem' },
  minimal: { padding: '0.875rem', margin: '0.5rem', gap: '0.5rem', borderRadius: '0.25rem' },
  modern: { padding: '1rem', margin: '0.75rem', gap: '0.75rem', borderRadius: '0.5rem' },
  retro: { padding: '1.125rem', margin: '0.875rem', gap: '0.875rem', borderRadius: '0.625rem' },
  elegant: { padding: '1.25rem', margin: '1rem', gap: '1rem', borderRadius: '0.75rem' },
  energetic: { padding: '1.125rem', margin: '0.875rem', gap: '0.875rem', borderRadius: '0.5rem' },
  calm: { padding: '1rem', margin: '0.75rem', gap: '0.75rem', borderRadius: '0.625rem' },
  tech: { padding: '0.75rem', margin: '0.5rem', gap: '0.5rem', borderRadius: '0.25rem' },
  creative: { padding: '1rem', margin: '0.75rem', gap: '0.75rem', borderRadius: '0.5rem' },
  corporate: { padding: '1.25rem', margin: '1rem', gap: '1rem', borderRadius: '0.5rem' },
}

/**
 * Apply vibe-based styling with typography and spacing
 */
export function applyVibeStyles(vibe: Vibe): React.CSSProperties {
  const typography = typographyScales[vibe]
  const spacing = spacingScales[vibe]

  return {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    fontWeight: typography.fontWeight,
    letterSpacing: typography.letterSpacing,
    // CSS variables for vibe
    ['--flow-font-size' as string]: typography.fontSize,
    ['--flow-line-height' as string]: typography.lineHeight,
    ['--flow-font-weight' as string]: typography.fontWeight.toString(),
    ['--flow-letter-spacing' as string]: typography.letterSpacing,
    ['--flow-padding' as string]: spacing.padding,
    ['--flow-margin' as string]: spacing.margin,
    ['--flow-gap' as string]: spacing.gap,
    ['--flow-border-radius' as string]: spacing.borderRadius,
  }
}

/**
 * Get component styles combining palette and vibe
 */
export function getComponentStyles(palette: Palette, vibe: Vibe): React.CSSProperties {
  return {
    ...applyPaletteStyles(palette),
    ...applyVibeStyles(vibe),
  }
}

/**
 * Get button styles based on palette
 */
export function getButtonStyles(palette: Palette, vibe: Vibe): React.CSSProperties {
  const spacing = spacingScales[vibe]
  return {
    backgroundColor: palette.accent,
    color: palette.background,
    border: `2px solid ${palette.accent}`,
    borderRadius: spacing.borderRadius,
    ...applyVibeStyles(vibe),
  }
}

/**
 * Get animation styles from DSL animations object
 */
export function getAnimationStyles(animations?: Record<string, unknown>): React.CSSProperties {
  if (!animations) {
    return {}
  }

  const styles: React.CSSProperties = {}

  // Handle fade-in animation
  if (animations.fadeIn) {
    styles.animation = 'fadeIn 0.5s ease-in-out'
  }

  // Handle slide-in animations
  if (animations.slideIn) {
    const direction = (animations.slideIn as Record<string, unknown>)?.direction || 'up'
    styles.animation = `slideIn${String(direction).charAt(0).toUpperCase() + String(direction).slice(1)} 0.5s ease-out`
  }

  // Handle scale animation
  if (animations.scale) {
    styles.animation = 'scaleIn 0.3s ease-out'
  }

  // Custom animation duration
  if (animations.duration) {
    const duration = String(animations.duration)
    if (styles.animation) {
      styles.animation = styles.animation.replace(/\d+\.?\d*s/, `${duration}ms`)
    }
  }

  // Custom animation delay
  if (animations.delay) {
    styles.animationDelay = `${animations.delay}ms`
  }

  return styles
}

/**
 * Get typography scale for a vibe
 */
export function getTypographyScale(vibe: Vibe) {
  return typographyScales[vibe]
}

/**
 * Get spacing scale for a vibe
 */
export function getSpacingScale(vibe: Vibe) {
  return spacingScales[vibe]
}

