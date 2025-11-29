import type { ComponentCategory, LibraryComponent, LibraryComponentType } from './component-types'

const HIGH_IMPACT_VIBES: string[] = ['bold', 'energetic', 'playful']

// TODO: This registry currently only has 8 components but there are 100+ components available
// in components/library/components/ and components/library/magic/components/
// All components need to be registered here with proper id, category, role, type, screenTypes, etc.
const registry: LibraryComponent[] = [
  {
    id: 'safe.hero.highlight',
    name: 'Hero Highlight Demo',
    library: 'shadcn',
    category: 'safe',
    role: 'hero',
    type: 'text',
    screenTypes: ['onboarding', 'marketing'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('./component-adapters')).HeroHighlightAdapter,
  },
  {
    id: 'safe.text.generate',
    name: 'Text Generate Effect',
    library: 'shadcn',
    category: 'safe',
    role: 'body',
    type: 'text',
    screenTypes: ['onboarding', 'pricing', 'dashboard'],
    formFactor: 'both',
    source: 'components',
    load: async () => (await import('./component-adapters')).TextGenerateAdapter,
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
    load: async () => (await import('@/components/library/magic/components/animated-gradient-text/code')).AnimatedGradientTextDemo,
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
