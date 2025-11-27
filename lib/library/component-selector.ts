/**
 * Component Selector
 * 
 * Intelligently selects library components based on DSL component type,
 * vibe, pattern, slot, and palette context.
 * 
 * NOTE: This module imports from component-registry which uses Node.js filesystem APIs.
 * When used from client components, consider using API routes instead:
 * - POST /api/library/components/select
 * - POST /api/library/components/background
 * - GET /api/library/components/by-slug
 */

import type { ComponentSelectionContext } from './component-types'
import type { LibraryComponent } from './component-types'
import {
  getAllComponents,
  getComponentsByType,
  getComponentsForSlot,
  getComponentsForVibe,
  getComponentsForPattern,
} from './component-registry'

/**
 * Select appropriate library component for a DSL component
 */
export async function selectLibraryComponent(
  context: ComponentSelectionContext
): Promise<LibraryComponent | null> {
  // If no access, return null (fallback to default)
  if (!context.hasAccess) {
    return null
  }

  const { componentType, vibe, pattern, slot } = context

  // Check if component explicitly specifies a library component
  // This would come from component.props?.libraryComponent
  // For now, we'll handle this in the component factory

  // Get candidate components based on type
  let candidates: LibraryComponent[] = []

  // Map DSL component types to library component types
  if (componentType === 'title' || componentType === 'subtitle' || componentType === 'text') {
    candidates = await getComponentsByType('text')
  } else if (componentType === 'button') {
    candidates = await getComponentsByType('button')
  } else if (componentType === 'form') {
    candidates = await getComponentsByType('card')
  } else if (componentType === 'image') {
    // Images don't use library components
    return null
  } else {
    return null
  }

  if (candidates.length === 0) {
    return null
  }

  // Filter by vibe compatibility
  const vibeCompatible = candidates.filter(
    (comp) => !comp.vibeCompatibility || comp.vibeCompatibility.includes(vibe)
  )

  // Filter by pattern compatibility
  const patternCompatible = vibeCompatible.length > 0
    ? vibeCompatible.filter(
        (comp) => !comp.patternCompatibility || comp.patternCompatibility.includes(pattern)
      )
    : candidates.filter(
        (comp) => !comp.patternCompatibility || comp.patternCompatibility.includes(pattern)
      )

  // Filter by slot if provided
  let slotCompatible = patternCompatible
  if (slot) {
    const slotFiltered = await getComponentsForSlot(slot)
    const slotSlugs = new Set(slotFiltered.map((c) => c.slug))
    slotCompatible = patternCompatible.filter((comp) => slotSlugs.has(comp.slug))
  }

  // Use best match from filtered candidates
  const finalCandidates = slotCompatible.length > 0 ? slotCompatible : patternCompatible.length > 0 ? patternCompatible : vibeCompatible.length > 0 ? vibeCompatible : candidates

  if (finalCandidates.length === 0) {
    return null
  }

  // Apply selection rules based on vibe and component type
  const selected = applySelectionRules(finalCandidates, componentType, vibe)

  return selected || finalCandidates[0] || null
}

/**
 * Apply specific selection rules based on vibe and component type
 */
function applySelectionRules(
  candidates: LibraryComponent[],
  componentType: string,
  vibe: string
): LibraryComponent | null {
  // Text components
  if (componentType === 'title' || componentType === 'subtitle' || componentType === 'text') {
    if (vibe === 'energetic') {
      // Prefer animated gradient or shiny text
      return (
        candidates.find((c) => c.slug.includes('animated-gradient-text')) ||
        candidates.find((c) => c.slug.includes('animated-shiny-text')) ||
        candidates.find((c) => c.slug.includes('gradient')) ||
        null
      )
    }
    if (vibe === 'playful') {
      // Prefer morphing or word rotate
      return (
        candidates.find((c) => c.slug.includes('morphing-text')) ||
        candidates.find((c) => c.slug.includes('word-rotate')) ||
        candidates.find((c) => c.slug.includes('spinning-text')) ||
        null
      )
    }
    if (vibe === 'professional') {
      // Prefer text reveal or line shadow
      return (
        candidates.find((c) => c.slug.includes('text-reveal')) ||
        candidates.find((c) => c.slug.includes('line-shadow-text')) ||
        null
      )
    }
    if (vibe === 'tech') {
      // Prefer typing animation or sparkles
      return (
        candidates.find((c) => c.slug.includes('typing-animation')) ||
        candidates.find((c) => c.slug.includes('sparkles-text')) ||
        candidates.find((c) => c.slug.includes('terminal')) ||
        null
      )
    }
  }

  // Button components
  if (componentType === 'button') {
    if (vibe === 'playful') {
      // Prefer rainbow or ripple button
      return (
        candidates.find((c) => c.slug.includes('rainbow-button')) ||
        candidates.find((c) => c.slug.includes('ripple-button')) ||
        null
      )
    }
    if (vibe === 'modern') {
      // Prefer shimmer or moving border
      return (
        candidates.find((c) => c.slug.includes('shimmer-button')) ||
        candidates.find((c) => c.slug.includes('moving-border')) ||
        null
      )
    }
    if (vibe === 'energetic') {
      // Prefer border beam
      return (
        candidates.find((c) => c.slug.includes('border-beam')) ||
        null
      )
    }
  }

  // Form/Card components
  if (componentType === 'form') {
    // Prefer magic-card for forms
    return (
      candidates.find((c) => c.slug.includes('magic-card')) ||
      candidates.find((c) => c.slug.includes('3d-card-effect')) ||
      candidates.find((c) => c.slug.includes('glare-card')) ||
      null
    )
  }

  return null
}

/**
 * Select background component for a screen
 */
export async function selectBackgroundComponent(
  context: {
    vibe: string
    pattern: string
    slot?: string
    hasAccess: boolean
  }
): Promise<LibraryComponent | null> {
  if (!context.hasAccess) {
    return null
  }

  const backgroundComponents = await getComponentsByType('background')

  if (backgroundComponents.length === 0) {
    return null
  }

  // Filter by slot
  let candidates = backgroundComponents
  if (context.slot) {
    const slotComponents = await getComponentsForSlot(context.slot)
    const slotSlugs = new Set(slotComponents.map((c) => c.slug))
    candidates = backgroundComponents.filter((comp) => slotSlugs.has(comp.slug))
  }

  // Filter by vibe
  const vibeCompatible = candidates.filter(
    (comp) => !comp.vibeCompatibility || comp.vibeCompatibility.includes(context.vibe as any)
  )

  // Filter by pattern
  const patternCompatible = vibeCompatible.filter(
    (comp) => !comp.patternCompatibility || comp.patternCompatibility.includes(context.pattern as any)
  )

  const finalCandidates = patternCompatible.length > 0 ? patternCompatible : vibeCompatible.length > 0 ? vibeCompatible : candidates

  if (finalCandidates.length === 0) {
    return null
  }

  // Prefer hero-highlight for hero sections
  if (context.slot?.includes('hero')) {
    const heroHighlight = finalCandidates.find((c) => c.slug === 'hero-highlight')
    if (heroHighlight) {
      return heroHighlight
    }
  }

  // Prefer background-beams or aurora-background
  const preferred = finalCandidates.find(
    (c) => c.slug === 'background-beams' || c.slug === 'aurora-background'
  )

  return preferred || finalCandidates[0] || null
}

