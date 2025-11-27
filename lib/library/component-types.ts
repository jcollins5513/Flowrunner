/**
 * Type definitions for library component integration
 */

import type { Vibe } from '../dsl/types'
import type { PatternFamily } from '../patterns/families'
import type React from 'react'

export type ComponentSource = 'magic' | 'aceternity' | 'components'

export type LibraryComponentType = 'background' | 'card' | 'button' | 'text' | 'widget'

export interface ComponentMetadata {
  name: string
  slug: string
  description: string
  tags: string[]
  category: string
  type: LibraryComponentType
  layout_role?: string
  recommended_slots: string[]
  interaction_profile?: string
  preferred_size?: string
  z_index_role?: string
  usage_notes?: string
  theme_requirements?: string[]
  data_requirements?: Array<Record<string, unknown>>
  domain_tags?: string[]
  source: ComponentSource
  client_only?: boolean
  imports?: string[]
  dependencies?: string[]
  props?: Array<{
    Prop?: string
    'Prop name'?: string
    Type: string
    Default?: string
    Description: string
    Required?: string
  }>
}

export interface LibraryComponent {
  slug: string
  name: string
  source: ComponentSource
  type: LibraryComponentType
  recommendedSlots: string[]
  metadata: ComponentMetadata
  component: React.ComponentType<any> | null // Lazy loaded, null until loaded
  vibeCompatibility?: Vibe[]
  patternCompatibility?: PatternFamily[]
  filePath: string // Path to code.tsx file
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
}

