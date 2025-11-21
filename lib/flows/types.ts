// Flow Engine Types
// Types for flow management, screen sequences, and navigation graphs

import type { ScreenDSL, FlowDSL, Palette, Vibe, Component, PatternFamily, PatternVariant } from '../dsl/types'

/**
 * Flow metadata and configuration
 */
export interface FlowMetadata {
  id: string
  name: string
  description?: string
  domain?: string
  theme?: string
  style?: string
  isPublic: boolean
  userId?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Screen sequence entry with order and relationships
 */
export interface ScreenSequenceEntry {
  screenId: string
  order: number
  parentScreenId?: string
  childScreenIds: string[]
  navigationTargets: string[] // Screen IDs this screen can navigate to
}

/**
 * Flow navigation graph
 * Represents all navigation connections between screens in a flow
 */
export interface FlowNavigationGraph {
  flowId: string
  entryScreenId?: string // First screen in the flow
  screens: Map<string, ScreenSequenceEntry>
  navigationPaths: NavigationPath[]
}

/**
 * A navigation path from one screen to another
 */
export interface NavigationPath {
  fromScreenId: string
  toScreenId: string
  trigger?: string // e.g., 'button-click', 'form-submit', 'auto-advance'
  condition?: string // Optional condition for conditional navigation
}

/**
 * Flow theme consistency configuration
 */
export interface FlowThemeConfig {
  primaryPalette?: Palette // Master palette to apply across all screens
  primaryVibe?: Vibe // Master vibe to maintain consistency
  allowVariation: boolean // Whether screens can have slight variations
  variationTolerance: 'strict' | 'moderate' | 'loose' // How much variation is allowed
}

/**
 * Flow creation options
 */
export interface CreateFlowOptions {
  name: string
  description?: string
  domain?: string
  theme?: string
  style?: string
  userId?: string
  isPublic?: boolean
  initialScreens?: ScreenDSL[]
  themeConfig?: FlowThemeConfig
}

/**
 * Flow update options
 */
export interface UpdateFlowOptions {
  name?: string
  description?: string
  domain?: string
  theme?: string
  style?: string
  isPublic?: boolean
  themeConfig?: FlowThemeConfig
}

/**
 * Screen insertion options
 */
export interface InsertScreenOptions {
  screenDSL: ScreenDSL
  position?: 'start' | 'end' | number // Position in sequence
  afterScreenId?: string // Insert after specific screen
  beforeScreenId?: string // Insert before specific screen
  navigationFrom?: string // Screen ID that should navigate to this new screen
  heroImageId?: string
}

/**
 * Screen reordering options
 */
export interface ReorderScreenOptions {
  screenId: string
  newOrder: number
  orAfterScreenId?: string
  orBeforeScreenId?: string
}

/**
 * Flow clone options
 */
export interface CloneFlowOptions {
  newName: string
  newDescription?: string
  userId?: string
  includeScreens?: boolean
  includeRevisions?: boolean
  resetNavigation?: boolean // Whether to reset navigation graph
}

/**
 * Flow query/filter options
 */
export interface FlowQueryOptions {
  userId?: string
  domain?: string
  theme?: string
  isPublic?: boolean
  search?: string // Search in name/description
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Flow statistics
 */
export interface FlowStats {
  flowId: string
  screenCount: number
  totalRevisions: number
  lastUpdated: Date
  averagePaletteConsistency?: number // 0-1 score
  averageVibeConsistency?: number // 0-1 score
}

/**
 * Context passed when the user triggers generation of the next screen
 */
export interface NextScreenTriggerContext {
  sourceScreenId?: string
  screen: ScreenDSL
  component: Component
  componentType: Component['type']
  slotName?: string
  trigger: 'click'
  targetScreenId?: string // For linking to existing screens
}

/**
 * Context extracted from current screen for next screen generation
 */
export interface ScreenContext {
  palette: Palette
  vibe: Vibe
  patternFamily: PatternFamily
  patternVariant: PatternVariant
  components: Component[]
  flowMetadata?: {
    domain?: string
    theme?: string
    style?: string
  }
}

/**
 * Options for generating next screen
 */
export interface GenerateNextScreenOptions {
  flowId?: string
  userPrompt?: string // Override inferred prompt
  onProgress?: (stage: string, progress: number) => void
  imageOrchestrator?: any // ImageOrchestrator instance
  flowEngine?: any // FlowEngine instance
}

/**
 * Result of next screen generation
 */
export interface GenerateNextScreenResult {
  screenId: string
  screenDSL: ScreenDSL
  navigationPath?: {
    fromScreenId: string
    toScreenId: string
  }
}

