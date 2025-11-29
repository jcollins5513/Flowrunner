/**
 * Type definitions for library component integration
 */

import type React from 'react'
import { z } from 'zod'

import type { Vibe } from '../dsl/types'
import type { PatternFamily } from '../patterns/families'

export type ComponentTier = 'safe' | 'advanced'

export type ComponentCategory =
  | 'action'
  | 'content'
  | 'layout'
  | 'navigation'
  | 'form'
  | 'hero'
  | 'background'
  | 'media'
  | 'input'

export type ComponentLibrary = 'shadcn' | 'aceternity' | 'magicui' | 'custom' | 'heroui'

export type ComponentSource = 'magic' | 'aceternity' | 'components'

export type ComponentComplexity = 'simple' | 'standard' | 'high'

export type LibraryComponentType =
  | 'background'
  | 'card'
  | 'button'
  | 'text'
  | 'widget'
  | 'hero'
  | 'navigation'
  | 'form'
  | 'media'
  | 'gallery'
  | 'icon'
  | 'list'

export interface ComponentAffinities {
  slots?: Record<string, number>
  screenTypes?: Record<string, number>
  complexity?: Partial<Record<ComponentComplexity, number>>
  vibes?: Partial<Record<Vibe, number>>
}

export interface LibraryComponent {
  id: string
  name: string
  library: ComponentLibrary
  tier: ComponentTier
  category: ComponentCategory
  role: string
  type: LibraryComponentType
  allowedSlots?: string[]
  slotRoles?: string[]
  screenTypes?: string[]
  /**
   * Form factor support for the component.
   */
  formFactor?: 'mobile' | 'web' | 'both'
  /**
   * How visually complex the component is.
   */
  complexity: ComponentComplexity
  affinities?: ComponentAffinities
  /**
   * Optional source indicator for backwards compatibility with existing
   * component folders.
   */
  source?: ComponentSource
  /**
   * Optional schema describing supported props for DSL validation.
   */
  propsSchema?: z.ZodTypeAny
  /**
   * Concrete component implementation if already loaded.
   */
  component?: React.ComponentType<any>
  /**
   * Lazy loader used by the component loader to fetch the implementation.
   */
  load?: () => Promise<React.ComponentType<any>>
}

export interface ComponentSelectionContext {
  componentType:
    | 'title'
    | 'subtitle'
    | 'button'
    | 'form'
    | 'text'
    | 'image'
    | 'media'
    | 'icon'
    | 'list'
    | 'card'
    | 'gallery'
    | 'background'
    | 'navigation'
    | 'hero'
  vibe: Vibe
  palette: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  pattern: PatternFamily
  slot?: string
  hasAccess: boolean
  /**
   * Target screen intent (e.g. onboarding, pricing, dashboard)
   */
  screenType?: string
  /**
   * Preferred tier for this selection. Defaults to safe.
   */
  tierPreference?: ComponentTier
  /**
   * Form factor hint for the selector.
   */
  formFactor?: 'mobile' | 'web' | 'both'
  /**
   * Requested complexity target for the component.
   */
  requestedComplexity?: ComponentComplexity
  /**
   * Requested category (action/content/etc) used for preference scoring.
   */
  requestedCategory?: ComponentCategory
  /**
   * Explicit registry id to use (e.g., when user upgrades an element).
   */
  requestedComponentId?: string
  /**
   * Whether the caller wants upgrade options returned alongside safe defaults.
   */
  allowUpgrades?: boolean
  /**
   * Whether the caller explicitly allows advanced components (premium replacement).
   */
  allowAdvancedSelection?: boolean
}
