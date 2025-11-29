import type { Component } from '@/lib/dsl/types'

import { getComponentById } from './component-registry'
import type { ComponentTier, LibraryComponent } from './component-types'

export interface UpgradeOption {
  fromId: string
  toId: string
  component: LibraryComponent
  compatibleSlots?: string[]
  notes?: string
}

const UPGRADE_MAP: Record<string, string[]> = {
  'safe.button.stateful': ['advanced.button.shimmer', 'advanced.button.rainbow'],
  'safe.card.hover': ['advanced.card.magic'],
  'safe.background.beams': ['advanced.background.retro-grid'],
  'safe.hero.highlight': ['advanced.hero.video'],
  'safe.form.signup': ['advanced.card.magic'],
  'safe.navigation.menu': ['advanced.navigation.dock'],
  'safe.text.generate': ['advanced.text.morphing'],
}

function isCompatibleUpgrade(
  target: LibraryComponent,
  safe?: LibraryComponent
): boolean {
  if (!safe) return false
  if (target.tier !== 'advanced') return false
  if (target.type !== safe.type && target.role !== safe.role) return false

  if (safe.allowedSlots && target.allowedSlots) {
    return safe.allowedSlots.some((slot) => target.allowedSlots?.includes(slot))
  }

  return true
}

export function getUpgradeOptions(safeId: string): UpgradeOption[] {
  const safeComponent = getComponentById(safeId)
  if (!safeComponent || safeComponent.tier !== 'safe') return []

  return (UPGRADE_MAP[safeId] || [])
    .map((advancedId) => getComponentById(advancedId))
    .filter((candidate): candidate is LibraryComponent => !!candidate)
    .filter((candidate) => isCompatibleUpgrade(candidate, safeComponent))
    .map((candidate) => ({
      fromId: safeId,
      toId: candidate.id,
      component: candidate,
      compatibleSlots: candidate.allowedSlots,
      notes: `Upgrade ${safeComponent.name} with ${candidate.name}`,
    }))
}

export function applyComponentUpgrade(
  component: Component,
  upgradeId: string,
  hasPremiumAccess: boolean
): Component {
  if (!hasPremiumAccess) return component

  return {
    ...component,
    props: {
      ...(component.props || {}),
      libraryComponent: upgradeId,
      tierPreference: 'advanced',
      allowAdvancedSelection: true,
    },
  }
}

export function getTierForComponentId(id: string): ComponentTier | undefined {
  return getComponentById(id)?.tier
}
