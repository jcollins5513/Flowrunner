/**
 * Component Registry
 * 
 * Loads and indexes all library components from Magic UI, Aceternity, and components directories.
 * Provides fast lookup by type, slot, vibe, and pattern compatibility.
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type {
  LibraryComponent,
  ComponentMetadata,
  ComponentSource,
  LibraryComponentType,
} from './component-types'
import type { Vibe } from '../dsl/types'
import type { PatternFamily } from '../patterns/families'

const LIBRARY_BASE_PATH = join(process.cwd(), 'components/library')

// Component registry cache
let componentRegistry: LibraryComponent[] | null = null
let registryLoadPromise: Promise<LibraryComponent[]> | null = null

/**
 * Load metadata for a single component
 */
async function loadComponentMetadata(
  source: ComponentSource,
  slug: string
): Promise<ComponentMetadata | null> {
  try {
    let metadataPath: string
    if (source === 'magic') {
      metadataPath = join(LIBRARY_BASE_PATH, 'magic', 'components', slug, 'metadata.json')
    } else if (source === 'aceternity') {
      metadataPath = join(LIBRARY_BASE_PATH, 'aceternity', 'components', slug, 'metadata.json')
    } else {
      metadataPath = join(LIBRARY_BASE_PATH, 'components', slug, 'metadata.json')
    }

    const metadataContent = await readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent) as ComponentMetadata

    // Ensure source is set
    if (!metadata.source) {
      metadata.source = source
    }

    return metadata
  } catch (error) {
    console.warn(`Failed to load metadata for ${source}/${slug}:`, error)
    return null
  }
}

/**
 * Get component file path
 */
function getComponentFilePath(source: ComponentSource, slug: string): string {
  if (source === 'magic') {
    return join('components/library/magic/components', slug, 'code.tsx')
  } else if (source === 'aceternity') {
    return join('components/library/aceternity/components', slug, 'code.tsx')
  } else {
    return join('components/library/components', slug, 'code.tsx')
  }
}

/**
 * Infer vibe compatibility from component metadata
 */
function inferVibeCompatibility(metadata: ComponentMetadata): Vibe[] | undefined {
  const vibes: Vibe[] = []
  const desc = metadata.description.toLowerCase()
  const name = metadata.name.toLowerCase()
  const tags = metadata.tags.map((t) => t.toLowerCase())

  // Energetic indicators
  if (
    desc.includes('animated') ||
    desc.includes('gradient') ||
    desc.includes('shiny') ||
    name.includes('animated') ||
    name.includes('gradient')
  ) {
    vibes.push('energetic')
  }

  // Playful indicators
  if (
    desc.includes('rainbow') ||
    desc.includes('ripple') ||
    desc.includes('morphing') ||
    name.includes('rainbow') ||
    name.includes('ripple')
  ) {
    vibes.push('playful')
  }

  // Professional indicators
  if (
    desc.includes('reveal') ||
    desc.includes('shadow') ||
    desc.includes('minimal') ||
    name.includes('reveal')
  ) {
    vibes.push('professional')
  }

  // Tech indicators
  if (
    desc.includes('typing') ||
    desc.includes('terminal') ||
    desc.includes('code') ||
    name.includes('typing') ||
    name.includes('terminal')
  ) {
    vibes.push('tech')
  }

  // Modern indicators
  if (
    desc.includes('shimmer') ||
    desc.includes('glow') ||
    desc.includes('modern') ||
    name.includes('shimmer')
  ) {
    vibes.push('modern')
  }

  return vibes.length > 0 ? vibes : undefined
}

/**
 * Infer pattern compatibility from recommended slots
 */
function inferPatternCompatibility(
  recommendedSlots: string[]
): PatternFamily[] | undefined {
  const patterns: PatternFamily[] = []

  // Hero-related slots suggest hero patterns
  if (recommendedSlots.some((slot) => slot.includes('hero'))) {
    patterns.push('ONB_HERO_TOP', 'HERO_CENTER_TEXT')
  }

  // Background slots suggest various patterns
  if (recommendedSlots.some((slot) => slot.includes('background'))) {
    patterns.push(
      'ONB_HERO_TOP',
      'HERO_CENTER_TEXT',
      'FEAT_IMAGE_TEXT_LEFT',
      'FEAT_IMAGE_TEXT_RIGHT'
    )
  }

  // Content slots suggest feature patterns
  if (recommendedSlots.some((slot) => slot.includes('content'))) {
    patterns.push('FEAT_IMAGE_TEXT_LEFT', 'FEAT_IMAGE_TEXT_RIGHT', 'PRODUCT_DETAIL')
  }

  return patterns.length > 0 ? patterns : undefined
}

/**
 * Load all components from a source directory
 */
async function loadComponentsFromSource(
  source: ComponentSource
): Promise<LibraryComponent[]> {
  const components: LibraryComponent[] = []

  try {
    let componentsPath: string
    if (source === 'magic') {
      componentsPath = join(LIBRARY_BASE_PATH, 'magic', 'components')
    } else if (source === 'aceternity') {
      componentsPath = join(LIBRARY_BASE_PATH, 'aceternity', 'components')
    } else {
      componentsPath = join(LIBRARY_BASE_PATH, 'components')
    }

    const entries = await readdir(componentsPath, { withFileTypes: true })
    const directories = entries.filter((entry) => entry.isDirectory())

    for (const dir of directories) {
      const slug = dir.name
      const metadata = await loadComponentMetadata(source, slug)

      if (!metadata) {
        continue
      }

      // Map metadata type to LibraryComponentType
      let componentType: LibraryComponentType = 'widget'
      if (metadata.type === 'background') {
        componentType = 'background'
      } else if (metadata.type === 'card' || metadata.category === 'card') {
        componentType = 'card'
      } else if (metadata.type === 'button' || metadata.category === 'button') {
        componentType = 'button'
      } else if (
        metadata.type === 'component' &&
        (metadata.category === 'text' ||
          slug.includes('text') ||
          slug.includes('gradient') ||
          slug.includes('typing'))
      ) {
        componentType = 'text'
      }

      const libraryComponent: LibraryComponent = {
        slug,
        name: metadata.name,
        source,
        type: componentType,
        recommendedSlots: metadata.recommended_slots || [],
        metadata,
        component: null, // Will be lazy loaded
        vibeCompatibility: inferVibeCompatibility(metadata),
        patternCompatibility: inferPatternCompatibility(metadata.recommended_slots || []),
        filePath: getComponentFilePath(source, slug),
      }

      components.push(libraryComponent)
    }
  } catch (error) {
    console.error(`Failed to load components from ${source}:`, error)
  }

  return components
}

/**
 * Load all library components
 */
export async function loadComponentRegistry(): Promise<LibraryComponent[]> {
  // Return cached registry if available
  if (componentRegistry) {
    return componentRegistry
  }

  // Return existing load promise if in progress
  if (registryLoadPromise) {
    return registryLoadPromise
  }

  // Start loading
  registryLoadPromise = (async () => {
    try {
      const [magicComponents, aceternityComponents, componentsComponents] = await Promise.all([
        loadComponentsFromSource('magic'),
        loadComponentsFromSource('aceternity'),
        loadComponentsFromSource('components'),
      ])

      componentRegistry = [
        ...magicComponents,
        ...aceternityComponents,
        ...componentsComponents,
      ]

      return componentRegistry
    } catch (error) {
      console.error('Failed to load component registry:', error)
      return []
    } finally {
      registryLoadPromise = null
    }
  })()

  return registryLoadPromise
}

/**
 * Get all components from registry
 */
export async function getAllComponents(): Promise<LibraryComponent[]> {
  return loadComponentRegistry()
}

/**
 * Get components by type
 */
export async function getComponentsByType(
  type: LibraryComponentType
): Promise<LibraryComponent[]> {
  const registry = await loadComponentRegistry()
  return registry.filter((comp) => comp.type === type)
}

/**
 * Get components by source
 */
export async function getComponentsBySource(
  source: ComponentSource
): Promise<LibraryComponent[]> {
  const registry = await loadComponentRegistry()
  return registry.filter((comp) => comp.source === source)
}

/**
 * Get components compatible with a slot
 */
export async function getComponentsForSlot(
  slot: string
): Promise<LibraryComponent[]> {
  const registry = await loadComponentRegistry()
  return registry.filter((comp) =>
    comp.recommendedSlots.some((s) => s === slot || slot.includes(s) || s.includes(slot))
  )
}

/**
 * Get components compatible with a vibe
 */
export async function getComponentsForVibe(vibe: Vibe): Promise<LibraryComponent[]> {
  const registry = await loadComponentRegistry()
  return registry.filter(
    (comp) =>
      !comp.vibeCompatibility || comp.vibeCompatibility.includes(vibe)
  )
}

/**
 * Get components compatible with a pattern
 */
export async function getComponentsForPattern(
  pattern: PatternFamily
): Promise<LibraryComponent[]> {
  const registry = await loadComponentRegistry()
  return registry.filter(
    (comp) =>
      !comp.patternCompatibility || comp.patternCompatibility.includes(pattern)
  )
}

/**
 * Find component by slug
 */
export async function getComponentBySlug(
  slug: string,
  source?: ComponentSource
): Promise<LibraryComponent | null> {
  const registry = await loadComponentRegistry()
  const component = registry.find(
    (comp) => comp.slug === slug && (!source || comp.source === source)
  )
  return component || null
}

/**
 * Clear registry cache (useful for development)
 */
export function clearRegistryCache(): void {
  componentRegistry = null
  registryLoadPromise = null
}


