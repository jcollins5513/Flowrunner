import componentsIndex from '@/components/library/index.json'
import magicComponentsIndex from '@/components/library/magic/index.json'
import type React from 'react'
import type {
  ComponentLibrary,
  ComponentSource,
} from './component-types'
import type { ComponentCategory, LibraryComponent, LibraryComponentType } from './component-types'

const HIGH_IMPACT_VIBES: string[] = ['bold', 'energetic', 'playful']
const DEFAULT_SCREEN_TYPES = ['marketing', 'onboarding', 'pricing', 'dashboard']

type LibraryIndexComponent = {
  name: string
  sanitized_name: string
  type: string
  recommended_slots?: string[]
}

const manualRegistry: LibraryComponent[] = [
  {
    id: 'safe.text.generate',
    name: 'Text Generate Effect',
    library: 'shadcn',
    category: 'safe',
    role: 'hero',
    type: 'text',
    screenTypes: ['onboarding', 'pricing', 'dashboard'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('./component-adapters')).TextGenerateAdapter,
  },
  {
    id: 'safe.hero.highlight',
    name: 'Hero Highlight Demo',
    library: 'shadcn',
    category: 'safe',
    role: 'hero',
    type: 'hero',
    screenTypes: ['onboarding', 'marketing'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('./component-adapters')).HeroHighlightAdapter,
  },
  {
    id: 'safe.button.primary',
    name: 'Shadcn Primary Button',
    library: 'shadcn',
    category: 'safe',
    role: 'cta',
    type: 'button',
    screenTypes: ['onboarding', 'pricing', 'dashboard'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('@/components/ui/button')).Button,
  },
  {
    id: 'safe.background.aurora',
    name: 'Aurora Background',
    library: 'shadcn',
    category: 'safe',
    role: 'background',
    type: 'background',
    screenTypes: ['onboarding', 'marketing'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('@/components/ui/aurora-background')).AuroraBackground,
  },
  {
    id: 'advanced.text.animated-gradient',
    name: 'Animated Gradient Text',
    library: 'magicui',
    category: 'advanced',
    role: 'hero',
    type: 'text',
    screenTypes: ['onboarding', 'marketing'],
    formFactor: 'both',
    source: 'magic',
    load: async () =>
      (await import('@/components/library/magic/components/animated-gradient-text/code')).AnimatedGradientTextDemo,
  },
  {
    id: 'advanced.text.word-rotate',
    name: 'Word Rotate',
    library: 'magicui',
    category: 'advanced',
    role: 'body',
    type: 'text',
    screenTypes: ['onboarding', 'dashboard'],
    formFactor: 'both',
    source: 'magic',
    load: async () => (await import('@/components/library/magic/components/word-rotate/code')).WordRotateDemo,
  },
  {
    id: 'advanced.button.shimmer',
    name: 'Shimmer Button',
    library: 'magicui',
    category: 'advanced',
    role: 'cta',
    type: 'button',
    screenTypes: ['onboarding', 'pricing'],
    formFactor: 'both',
    source: 'magic',
    load: async () => (await import('@/components/library/magic/components/shimmer-button/code')).ShimmerButtonDemo,
  },
  {
    id: 'advanced.card.magic',
    name: 'Magic Card',
    library: 'magicui',
    category: 'advanced',
    role: 'form',
    type: 'card',
    screenTypes: ['onboarding', 'dashboard'],
    formFactor: 'both',
    source: 'magic',
    load: async () => (await import('@/components/library/magic/components/magic-card/code')).MagicCardDemo,
  },
]

const registry: LibraryComponent[] = [
  ...manualRegistry,
  ...componentsIndex.components.map((component) =>
    normalizeComponent(component, 'safe', 'aceternity', 'components')
  ),
  ...magicComponentsIndex.components.map((component) =>
    normalizeComponent(component, 'advanced', 'magicui', 'magic')
  ),
]

export function getComponentRegistry(): LibraryComponent[] {
  return registry
}

export function getComponentsByType(type: LibraryComponentType): LibraryComponent[] {
  return registry.filter((component) => component.type === type)
}

export function getComponentById(id: string): LibraryComponent | undefined {
  return registry.find((component) => component.id === id)
}

export function getComponentsByCategory(category: ComponentCategory): LibraryComponent[] {
  return registry.filter((component) => component.category === category)
}

export function prefersAdvanced(vibe: string, requested?: ComponentCategory): ComponentCategory {
  if (requested) return requested
  return HIGH_IMPACT_VIBES.includes(vibe) ? 'advanced' : 'safe'
}

function normalizeComponent(
  component: LibraryIndexComponent,
  category: ComponentCategory,
  library: ComponentLibrary,
  source: ComponentSource
): LibraryComponent {
  const type = mapLibraryType(component)
  const role = deriveRole(component, type)

  return {
    id: `${category}.${component.sanitized_name}`,
    name: component.name,
    library,
    category,
    role,
    type,
    screenTypes: deriveScreenTypes(role, type),
    formFactor: 'both',
    source,
    load: createLoader(source, component.sanitized_name),
  }
}

function deriveRole(
  component: LibraryIndexComponent,
  type: LibraryComponentType
): string {
  const preferredSlot = component.recommended_slots?.[0]
  if (preferredSlot) {
    const [slotRole, secondary] = preferredSlot.split('.')
    if (slotRole) return slotRole
    if (secondary) return secondary
  }

  if (type === 'background') return 'background'
  if (type === 'navigation') return 'navigation'
  if (type === 'hero') return 'hero'
  if (type === 'form') return 'form'
  return 'content'
}

function deriveScreenTypes(role: string, type: LibraryComponentType): string[] {
  if (role === 'hero' || type === 'hero' || type === 'media') {
    return ['marketing', 'onboarding']
  }
  if (role === 'navigation') {
    return ['dashboard', 'marketing']
  }
  if (type === 'background') {
    return ['marketing', 'onboarding']
  }
  if (type === 'form') {
    return ['onboarding', 'pricing', 'dashboard']
  }

  return DEFAULT_SCREEN_TYPES
}

function mapLibraryType(component: LibraryIndexComponent): LibraryComponentType {
  const normalized = component.type.toLowerCase()
  const slug = component.sanitized_name.toLowerCase()

  if (normalized === 'component') return 'widget'
  if (normalized === 'hero' || slug.includes('hero')) return 'hero'
  if (normalized === 'navigation' || slug.includes('navbar') || slug.includes('sidebar')) return 'navigation'
  if (normalized === 'form' || slug.includes('form')) return 'form'
  if (normalized === 'background' || slug.includes('background')) return 'background'
  if (normalized === 'text' || slug.includes('text') || slug.includes('typography')) return 'text'
  if (normalized === 'card' || slug.includes('card')) return 'card'
  if (normalized === 'button' || slug.includes('button')) return 'button'
  if (slug.includes('gallery') || slug.includes('carousel') || slug.includes('slider')) return 'gallery'
  if (slug.includes('icon')) return 'icon'
  if (slug.includes('list') || slug.includes('timeline') || slug.includes('steps')) return 'list'
  if (slug.includes('image') || slug.includes('media') || slug.includes('video')) return 'media'
  if (normalized === 'widget') return 'widget'

  return 'widget'
}

function createLoader(source: ComponentSource, slug: string) {
  return async (): Promise<React.ComponentType<any>> => {
    const module =
      source === 'magic'
        ? await import(`@/components/library/magic/components/${slug}/code`)
        : await import(`@/components/library/components/${slug}/code`)

    const component = findDemoExport(module, slug)
    if (!component) {
      throw new Error(`No demo export found for component ${slug}`)
    }

    return component
  }
}

function findDemoExport(module: Record<string, any>, slug: string): React.ComponentType<any> | undefined {
  const pascal = toPascalCase(slug)
  const candidateNames = [`${pascal}Demo`, `${pascal}Component`, pascal, 'Demo']

  for (const candidate of candidateNames) {
    if (typeof module[candidate] === 'function') {
      return module[candidate]
    }
  }

  const demoKey = Object.keys(module).find(
    (key) => key.toLowerCase().includes('demo') && typeof module[key] === 'function'
  )
  if (demoKey) return module[demoKey]

  const firstComponentKey = Object.keys(module).find((key) => typeof module[key] === 'function')
  if (firstComponentKey) return module[firstComponentKey]

  return undefined
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}
