import type { ComponentSelectionContext, LibraryComponent } from './component-types'

export interface ScoredComponent {
  component: LibraryComponent
  score: number
  reasons: string[]
}

const SLOT_MATCH_WEIGHT = 3
const SCREEN_TYPE_WEIGHT = 2
const COMPLEXITY_WEIGHT = 2
const VIBE_WEIGHT = 1.5
const CATEGORY_WEIGHT = 1.25

function normalizeSlot(slot?: string): string | undefined {
  if (!slot) return undefined
  if (slot.includes('.')) return slot
  return slot.replace(/\s+/g, '.').toLowerCase()
}

export function scoreComponents(
  components: LibraryComponent[],
  context: Pick<
    ComponentSelectionContext,
    'slot' | 'screenType' | 'vibe' | 'requestedComplexity' | 'requestedCategory'
  >
): ScoredComponent[] {
  const normalizedSlot = normalizeSlot(context.slot)

  const scored = components.map((component) => {
    let score = 0
    const reasons: string[] = []

    if (normalizedSlot) {
      const slotHit = component.allowedSlots?.some((slot) => slot === normalizedSlot)
      const roleHit = component.slotRoles?.some((role) => normalizedSlot.startsWith(role))

      if (slotHit) {
        score += SLOT_MATCH_WEIGHT
        reasons.push(`Matched slot ${normalizedSlot}`)
      } else if (roleHit) {
        score += SLOT_MATCH_WEIGHT * 0.8
        reasons.push(`Matched slot role ${normalizedSlot}`)
      } else if (component.affinities?.slots?.[normalizedSlot]) {
        score += SLOT_MATCH_WEIGHT * component.affinities.slots[normalizedSlot]!
        reasons.push(`Slot affinity for ${normalizedSlot}`)
      }
    }

    if (context.screenType) {
      const allowedScreen =
        !component.screenTypes || component.screenTypes.includes(context.screenType)
      if (allowedScreen) {
        score += SCREEN_TYPE_WEIGHT
        reasons.push(`Supports screen ${context.screenType}`)
        const affinity = component.affinities?.screenTypes?.[context.screenType]
        if (affinity) {
          score += SCREEN_TYPE_WEIGHT * affinity
          reasons.push(`Screen affinity ${context.screenType}`)
        }
      } else {
        score -= SCREEN_TYPE_WEIGHT
        reasons.push(`Screen ${context.screenType} not preferred`)
      }
    }

    if (context.requestedComplexity) {
      if (context.requestedComplexity === component.complexity) {
        score += COMPLEXITY_WEIGHT
        reasons.push(`Complexity ${context.requestedComplexity} matches`)
      } else if (component.affinities?.complexity?.[context.requestedComplexity]) {
        const weight = component.affinities.complexity[context.requestedComplexity]!
        score += COMPLEXITY_WEIGHT * weight
        reasons.push(`Complexity affinity ${context.requestedComplexity}`)
      } else {
        score -= COMPLEXITY_WEIGHT * 0.25
        reasons.push(`Complexity mismatch`)
      }
    }

    if (component.affinities?.vibes?.[context.vibe]) {
      const vibeScore = component.affinities.vibes[context.vibe]!
      score += VIBE_WEIGHT * vibeScore
      reasons.push(`Vibe affinity for ${context.vibe}`)
    }

    if (context.requestedCategory && component.category === context.requestedCategory) {
      score += CATEGORY_WEIGHT
      reasons.push(`Category preference for ${context.requestedCategory}`)
    }

    return { component, score, reasons }
  })

  return scored.sort((a, b) => b.score - a.score)
}
