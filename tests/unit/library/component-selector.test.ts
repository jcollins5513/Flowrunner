import { describe, expect, it } from 'vitest'

import type { ComponentSelectionContext } from '@/lib/library/component-types'
import { getComponentRegistry } from '@/lib/library/component-registry'
import { matchType } from '@/lib/library/component-selector'

const DSL_COMPONENT_TYPES: ComponentSelectionContext['componentType'][] = [
  'title',
  'subtitle',
  'text',
  'button',
  'form',
  'image',
  'media',
  'icon',
  'list',
  'card',
  'gallery',
  'background',
  'navigation',
  'hero',
]

describe('component selector type matching', () => {
  const registry = getComponentRegistry()

  DSL_COMPONENT_TYPES.forEach((dslType) => {
    it(`provides registry candidates for ${dslType}`, () => {
      const matches = matchType(dslType)

      expect(matches.length).toBeGreaterThan(0)
      expect(registry.some((component) => matches.includes(component.type))).toBe(true)
    })
  })
})
