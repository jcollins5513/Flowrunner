/**
 * Component Selector
 * 
 * Intelligently selects library components based on DSL component type,
 * vibe, pattern, slot, and palette context.
 * 
 * This selector is isomorphic and can be used in both server and client contexts
 * because the registry is defined statically with explicit imports.
 */

import type {
  ComponentSelectionContext,
  LibraryComponent,
  LibraryComponentType,
} from './component-types'
import {
  getComponentRegistry,
  getComponentsByType,
  prefersAdvanced,
} from './component-registry'

/**
 * Select appropriate library component for a DSL component
 */
export async function selectLibraryComponent(
  context: ComponentSelectionContext
): Promise<LibraryComponent | null> {
  if (!context.hasAccess || context.componentType === 'image') {
    return null
  }

  const desiredCategory = prefersAdvanced(context.vibe, context.categoryPreference)
  const typeMatches = matchType(context.componentType)
  const registry = getComponentRegistry()

  const candidates = registry.filter((component) =>
    typeMatches.includes(component.type)
  )

  if (candidates.length === 0) {
    return null
  }

  const slotRole = normalizeSlotRole(context.slot)
  
  const filteredByRole = slotRole
    ? candidates.filter((component) => component.role === slotRole || component.role === context.componentType)
    : candidates

  const filteredByScreenType = context.screenType
    ? filteredByRole.filter(
        (component) =>
          !component.screenTypes || component.screenTypes.includes(context.screenType as string)
      )
    : filteredByRole

  const filteredByFormFactor = context.formFactor
    ? filteredByScreenType.filter(
        (component) => !component.formFactor || component.formFactor === 'both' || component.formFactor === context.formFactor
      )
    : filteredByScreenType

  const prioritized = prioritizeByCategory(filteredByFormFactor, desiredCategory)
  
  if (!prioritized.length) {
    return null
  }

  return prioritized[0]
}

/**
 * Apply specific selection rules based on vibe and component type
 */
function prioritizeByCategory(
  candidates: LibraryComponent[],
  requestedCategory: string
): LibraryComponent[] {
  const primary = candidates.filter((component) => component.category === requestedCategory)
  const safeFallback = requestedCategory === 'safe'
    ? []
    : candidates.filter((component) => component.category === 'safe')
  return primary.length ? primary : safeFallback
}

function normalizeSlotRole(slot?: string): string | undefined {
  if (!slot) return undefined
  if (slot.includes('hero')) return 'hero'
  if (slot.includes('button') || slot.includes('cta')) return 'cta'
  if (slot.includes('form')) return 'form'
  if (slot.includes('title') || slot.includes('subtitle')) return 'hero'
  return slot
}

export function matchType(
  componentType: ComponentSelectionContext['componentType']
): LibraryComponentType[] {
  if (componentType === 'title' || componentType === 'subtitle') {
    return ['text', 'hero']
  }
  if (componentType === 'text') {
    return ['text']
  }
  if (componentType === 'button') {
    return ['button']
  }
  if (componentType === 'form') {
    return ['form', 'card']
  }
  if (componentType === 'image' || componentType === 'media' || componentType === 'hero') {
    return ['hero', 'media', 'gallery', 'background']
  }
  if (componentType === 'icon') {
    return ['icon', 'button', 'text']
  }
  if (componentType === 'list') {
    return ['list', 'card', 'widget']
  }
  if (componentType === 'card') {
    return ['card', 'widget']
  }
  if (componentType === 'gallery') {
    return ['gallery', 'media', 'background']
  }
  if (componentType === 'background') {
    return ['background', 'hero']
  }
  if (componentType === 'navigation') {
    return ['navigation']
  }
  return []
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
    screenType?: string
  }
): Promise<LibraryComponent | null> {
  if (!context.hasAccess) {
    return null
  }

  const category = prefersAdvanced(context.vibe)
  const backgrounds = getComponentsByType('background')
  const slotRole = normalizeSlotRole(context.slot)

  const filtered = backgrounds.filter((component) => {
    const matchesRole = slotRole ? component.role === slotRole || component.role === 'background' : true
    const matchesScreen = context.screenType
      ? !component.screenTypes || component.screenTypes.includes(context.screenType)
      : true
    return matchesRole && matchesScreen
  })

  const prioritized = prioritizeByCategory(filtered, category)
  if (prioritized.length) {
    return prioritized[0]
  }

  return filtered[0] ?? null
}

