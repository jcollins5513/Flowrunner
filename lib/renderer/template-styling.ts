/**
 * Template-Based Styling System
 * 
 * Provides rich CSS classes based on vibe patterns extracted from templates.
 * This is a client-safe synchronous implementation that doesn't require filesystem access.
 */

import type { Vibe } from '../dsl/types'

// Note: Template loading from filesystem has been removed as it requires Node.js APIs
// which are not available in client components. The vibe-based styling below provides
// rich styling patterns extracted from template analysis without needing file system access.

/**
 * Get default styling classes for a component type based on common patterns
 * Enhanced with richer default styling from template patterns
 */
export function getDefaultStyleClasses(componentType: string): string {
  switch (componentType) {
    case 'title':
      // Enhanced title styling inspired by templates
      return 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight'
    case 'subtitle':
      // Enhanced subtitle styling
      return 'text-xl md:text-2xl text-muted-foreground leading-relaxed'
    case 'button':
      // Enhanced button styling with hover states
      return 'px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 active:scale-95'
    case 'text':
      return 'text-base md:text-lg leading-relaxed'
    default:
      return ''
  }
}

/**
 * Get rich styling classes based on vibe keywords
 * This provides immediate styling without async template loading
 * Enhanced with patterns from template analysis
 */
export function getVibeBasedClasses(componentType: string, vibe: string): string {
  const vibeLower = vibe.toLowerCase()
  const baseClasses = getDefaultStyleClasses(componentType)
  
  // Add vibe-specific enhancements inspired by template patterns
  const vibeClasses: string[] = []
  
  // Dark/Cyberpunk/Glass themes (from cyberpunk template)
  if (vibeLower.includes('dark') || vibeLower.includes('cyber') || vibeLower.includes('glass') || vibeLower.includes('aura-dark')) {
    if (componentType === 'title') {
      vibeClasses.push(
        'text-white',
        'drop-shadow-lg',
        'font-black',
        'tracking-widest',
        'neon-text-cyan',
        'z-10',
        'mix-blend-overlay'
      )
    }
    if (componentType === 'subtitle') {
      vibeClasses.push('text-slate-300', 'selection:bg-cyan-500', 'selection:text-white')
    }
    if (componentType === 'button') {
      vibeClasses.push(
        'px-5 py-1.5',
        'bg-cyan-500/10',
        'backdrop-blur-sm',
        'border',
        'border-cyan-500/50',
        'text-cyan-400',
        'font-mono',
        'text-xs',
        'hover:bg-cyan-500',
        'hover:text-black',
        'transition-all',
        'clip-tech'
      )
    }
    if (componentType === 'text') {
      vibeClasses.push('text-slate-300', 'selection:bg-cyan-500')
    }
  }
  
  // Bold/Energetic themes
  if (vibeLower.includes('bold') || vibeLower.includes('energetic') || vibeLower.includes('playful')) {
    if (componentType === 'title') {
      vibeClasses.push('font-black', 'tracking-tighter', 'animate-pulse')
    }
    if (componentType === 'button') {
      vibeClasses.push('shadow-lg', 'hover:shadow-xl', 'hover:scale-110', 'active:scale-95')
    }
  }
  
  // Elegant/Minimal themes
  if (vibeLower.includes('elegant') || vibeLower.includes('minimal') || vibeLower.includes('clean')) {
    if (componentType === 'title') {
      vibeClasses.push('font-light', 'tracking-wide', 'opacity-90')
    }
    if (componentType === 'button') {
      vibeClasses.push('px-8 py-4', 'rounded-full', 'font-semibold')
    }
  }
  
  // Portfolio/Artisan themes (from digital artisan template)
  if (vibeLower.includes('portfolio') || vibeLower.includes('artisan') || vibeLower.includes('creative')) {
    if (componentType === 'title') {
      vibeClasses.push('relative', 'flex', 'flex-col', 'items-center', 'text-center', 'mix-blend-overlay', 'opacity-80')
    }
    if (componentType === 'button') {
      vibeClasses.push('px-6 py-3', 'bg-gradient-to-r', 'from-purple-500 to-pink-500', 'text-white', 'rounded-lg')
    }
  }
  
  // Dating/Mobile themes (from dating app template)
  if (vibeLower.includes('dating') || vibeLower.includes('mobile') || vibeLower.includes('app')) {
    if (componentType === 'title') {
      vibeClasses.push('text-white', 'font-semibold')
    }
    if (componentType === 'button') {
      vibeClasses.push(
        'w-full px-3 py-3',
        'flex items-center gap-3',
        'transition-colors',
        'hover:bg-white/5',
        'rounded-lg'
      )
    }
  }
  
  return vibeClasses.length > 0 
    ? `${baseClasses} ${vibeClasses.join(' ')}`
    : baseClasses
}

