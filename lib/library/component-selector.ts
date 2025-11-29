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
import { getComponentById, getComponentRegistry, prefersAdvanced } from './component-registry'
import { scoreComponents } from './component-scoring'
import { getUpgradeOptions, type UpgradeOption } from './component-upgrades'

export interface ComponentSelectionResult {
  component: LibraryComponent
  upgrades: UpgradeOption[]
  score: number
  reasons: string[]
}

/**
 * Select appropriate library component for a DSL component
 */
export async function selectLibraryComponent(
  context: ComponentSelectionContext
): Promise<ComponentSelectionResult | null> {
  if (!context.hasAccess || context.componentType === 'image') {
    return null
  }

  const typeMatches = matchType(context.componentType)
  const registry = getComponentRegistry()

  const requestedComponent = context.requestedComponentId
    ? getComponentById(context.requestedComponentId)
    : undefined

  const allowAdvancedSelection = Boolean(context.allowAdvancedSelection)
  const tierPreference = prefersAdvanced(context.vibe, context.tierPreference)
  const slotRole = normalizeSlotRole(context.slot)

  if (
    requestedComponent &&
    typeMatches.includes(requestedComponent.type) &&
    (requestedComponent.tier === 'safe' || (context.hasAccess && allowAdvancedSelection))
  ) {
    return {
      component: requestedComponent,
      upgrades:
        requestedComponent.tier === 'safe' && context.allowUpgrades && context.hasAccess
          ? getUpgradeOptions(requestedComponent.id)
          : [],
      score: 100,
      reasons: ['Explicit request'],
    }
  }

  const compatibleCandidates = registry.filter((component) => {
    const matchesType = typeMatches.includes(component.type)
    if (!matchesType) return false

    const matchesSlot = slotRole
      ?
          component.slotRoles?.includes(slotRole) ||
          component.allowedSlots?.some(
            (slot) => slot === slotRole || slot.startsWith(`${slotRole}.`) || slotRole.startsWith(`${slot}.`)
          )
      : true

    const matchesScreen = context.screenType
      ? !component.screenTypes || component.screenTypes.includes(context.screenType)
      : true

    return matchesSlot && matchesScreen
  })

  const safeCandidates = compatibleCandidates.filter((component) => component.tier === 'safe')
  const advancedCandidates = compatibleCandidates.filter(
    (component) => component.tier === 'advanced'
  )

  const safeScores = scoreComponents(safeCandidates, context)
  const safeSelection = safeScores[0]

  if (!safeSelection) {
    return null
  }

  let selected = safeSelection

  if (allowAdvancedSelection && context.hasAccess && tierPreference === 'advanced') {
    const advancedScores = scoreComponents(advancedCandidates, context)
    if (advancedScores[0]) {
      selected = advancedScores[0]
    }
  }

  const upgrades = context.allowUpgrades && context.hasAccess && selected.component.tier === 'safe'
    ? getUpgradeOptions(selected.component.id)
    : []

  return { component: selected.component, upgrades, score: selected.score, reasons: selected.reasons }
}

function normalizeSlotRole(slot?: string): string | undefined {
  if (!slot) return undefined
  if (slot.includes('hero')) return 'hero'
  if (slot.includes('button') || slot.includes('cta')) return 'cta'
  if (slot.includes('form')) return 'form'
  if (slot.includes('title') || slot.includes('subtitle')) return 'hero'
  if (slot.includes('nav')) return 'navigation'
  if (slot.includes('background')) return 'background'
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
  const backgrounds = getComponentRegistry().filter((component) => component.type === 'background')
  const slotRole = normalizeSlotRole(context.slot)

  const filtered = backgrounds.filter((component) => {
    const matchesRole = slotRole
      ? component.role === slotRole || component.slotRoles?.includes(slotRole)
      : true
    const matchesScreen = context.screenType
      ? !component.screenTypes || component.screenTypes.includes(context.screenType)
      : true
    return matchesRole && matchesScreen
  })

  const prioritized = category === 'advanced'
    ? filtered.filter((component) => component.tier === 'advanced')
    : filtered.filter((component) => component.tier === 'safe')

  if (prioritized.length) {
    return prioritized[0]
  }

  return filtered[0] ?? null
}
