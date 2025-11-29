/**
 * Type definitions for library component integration
 */

import type { Vibe } from '../dsl/types'
import type { PatternFamily } from '../patterns/families'
import type React from 'react'

export type ComponentCategory = 'safe' | 'advanced'

export type ComponentLibrary = 'shadcn' | 'aceternity' | 'magicui' | 'custom'

export type ComponentSource = 'magic' | 'aceternity' | 'components'

export type LibraryComponentType = 'background' | 'card' | 'button' | 'text' | 'widget'

export interface LibraryComponent {
  id: string
  name: string
  library: ComponentLibrary
  category: ComponentCategory
  role: string
  type: LibraryComponentType
  /**
   * Optional screen intent tags (e.g. onboarding, pricing)
   */
  screenTypes?: string[]
  /**
   * Form factor support for the component.
   */
  formFactor?: 'mobile' | 'web' | 'both'
  /**
   * Optional source indicator for backwards compatibility with existing
   * component folders.
   */
  source?: ComponentSource
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
  componentType: 'title' | 'subtitle' | 'button' | 'form' | 'text' | 'image'
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
   * Preferred category for this selection. Defaults to safe.
   */
  categoryPreference?: ComponentCategory
  /**
   * Form factor hint for the selector.
   */
  formFactor?: 'mobile' | 'web' | 'both'
}



