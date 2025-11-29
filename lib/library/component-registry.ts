import { z } from 'zod'

import type {
  ComponentComplexity,
  ComponentTier,
  LibraryComponent,
  LibraryComponentType,
} from './component-types'
import type { ComponentSource } from './component-types'

const DEFAULT_SCREEN_TYPES = ['marketing', 'onboarding', 'pricing', 'dashboard']

const COMMON_PROPS_SCHEMA = z.object({
  className: z.string().optional(),
})

function createLoader(source: ComponentSource, slug: string, exportName: string) {
  return async () => {
    const module =
      source === 'magic'
        ? await import(`@/components/library/magic/components/${slug}/code`)
        : await import(`@/components/library/components/${slug}/code`)
    const component = module[exportName]

    if (!component) {
      throw new Error(`No export named ${exportName} found for component ${slug}`)
    }

    return component
  }
}

function sharedAffinities(
  screenTypes: string[],
  complexity: ComponentComplexity
): LibraryComponent['affinities'] {
  return {
    screenTypes: Object.fromEntries(screenTypes.map((screen) => [screen, 1])),
    complexity: { [complexity]: 1 },
  }
}

const safeComponents: LibraryComponent[] = [
  {
    id: 'safe.text.generate',
    name: 'Text Generate Effect',
    library: 'aceternity',
    tier: 'safe',
    category: 'content',
    role: 'hero',
    type: 'text',
    allowedSlots: ['hero.title', 'hero.subtitle', 'section.heading'],
    slotRoles: ['hero', 'text'],
    screenTypes: DEFAULT_SCREEN_TYPES,
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(DEFAULT_SCREEN_TYPES, 'standard'),
      slots: { 'hero.title': 1, 'hero.subtitle': 0.9 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      words: z.string().optional(),
    }),
    load: createLoader('components', 'text-generate-effect', 'TextGenerateEffectDemo'),
  },
  {
    id: 'safe.button.stateful',
    name: 'Stateful Button',
    library: 'aceternity',
    tier: 'safe',
    category: 'action',
    role: 'cta',
    type: 'button',
    allowedSlots: ['cta', 'hero.primaryCta', 'form.submit'],
    slotRoles: ['cta'],
    screenTypes: ['marketing', 'onboarding', 'dashboard'],
    formFactor: 'both',
    complexity: 'simple',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'simple'),
      slots: { cta: 1, 'form.submit': 0.6 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      label: z.string().optional(),
      href: z.string().optional(),
    }),
    load: createLoader('components', 'stateful-button', 'StatefulButtonDemo'),
  },
  {
    id: 'safe.card.hover',
    name: 'Card Hover Effect',
    library: 'aceternity',
    tier: 'safe',
    category: 'content',
    role: 'feature',
    type: 'card',
    allowedSlots: ['section.card', 'feature.card', 'list.item'],
    slotRoles: ['card'],
    screenTypes: ['marketing', 'dashboard'],
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(['marketing'], 'standard'),
      slots: { 'section.card': 1, 'feature.card': 0.8 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      items: z.array(z.any()).optional(),
    }),
    load: createLoader('components', 'card-hover-effect', 'CardHoverEffectDemo'),
  },
  {
    id: 'safe.background.beams',
    name: 'Background Beams',
    library: 'aceternity',
    tier: 'safe',
    category: 'background',
    role: 'background',
    type: 'background',
    allowedSlots: ['hero.background', 'section.background'],
    slotRoles: ['background'],
    screenTypes: ['marketing', 'onboarding'],
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'standard'),
      slots: { 'hero.background': 1, 'section.background': 0.7 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('components', 'background-beams', 'BackgroundBeams'),
  },
  {
    id: 'safe.hero.highlight',
    name: 'Hero Highlight',
    library: 'aceternity',
    tier: 'safe',
    category: 'hero',
    role: 'hero',
    type: 'hero',
    allowedSlots: ['hero'],
    slotRoles: ['hero'],
    screenTypes: ['marketing', 'onboarding'],
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'standard'),
      slots: { hero: 1 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      heading: z.string().optional(),
      subheading: z.string().optional(),
    }),
    load: createLoader('components', 'hero-highlight', 'HeroHighlightDemo'),
  },
  {
    id: 'safe.form.signup',
    name: 'Signup Form',
    library: 'aceternity',
    tier: 'safe',
    category: 'form',
    role: 'form',
    type: 'form',
    allowedSlots: ['form', 'section.form', 'hero.form'],
    slotRoles: ['form'],
    screenTypes: ['marketing', 'onboarding', 'pricing'],
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'standard'),
      slots: { form: 1, 'section.form': 0.8 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      submitLabel: z.string().optional(),
      fields: z.array(z.record(z.any())).optional(),
    }),
    load: createLoader('components', 'signup-form', 'SignupFormDemo'),
  },
  {
    id: 'safe.navigation.menu',
    name: 'Navbar Menu',
    library: 'aceternity',
    tier: 'safe',
    category: 'navigation',
    role: 'navigation',
    type: 'navigation',
    allowedSlots: ['navigation.primary', 'header.navigation'],
    slotRoles: ['navigation'],
    screenTypes: ['marketing', 'dashboard'],
    formFactor: 'both',
    complexity: 'simple',
    affinities: {
      ...sharedAffinities(['marketing', 'dashboard'], 'simple'),
      slots: { 'navigation.primary': 1 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('components', 'navbar-menu', 'NavbarDemo'),
  },
  {
    id: 'safe.gallery.carousel',
    name: 'Carousel Gallery',
    library: 'aceternity',
    tier: 'safe',
    category: 'media',
    role: 'gallery',
    type: 'gallery',
    allowedSlots: ['gallery', 'media.gallery', 'hero.media'],
    slotRoles: ['media'],
    screenTypes: DEFAULT_SCREEN_TYPES,
    formFactor: 'both',
    complexity: 'standard',
    affinities: {
      ...sharedAffinities(DEFAULT_SCREEN_TYPES, 'standard'),
      slots: { gallery: 1, 'hero.media': 0.6 },
    },
    source: 'components',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('components', 'carousel', 'CarouselDemo'),
  },
]

const advancedComponents: LibraryComponent[] = [
  {
    id: 'advanced.button.shimmer',
    name: 'Shimmer Button',
    library: 'magicui',
    tier: 'advanced',
    category: 'action',
    role: 'cta',
    type: 'button',
    allowedSlots: ['cta', 'hero.primaryCta'],
    slotRoles: ['cta'],
    screenTypes: ['marketing', 'onboarding', 'pricing'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'high'),
      slots: { cta: 1, 'hero.primaryCta': 0.9 },
      vibes: { energetic: 1, bold: 0.9 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      label: z.string().optional(),
    }),
    load: createLoader('magic', 'shimmer-button', 'ShimmerButtonDemo'),
  },
  {
    id: 'advanced.button.rainbow',
    name: 'Rainbow Button',
    library: 'magicui',
    tier: 'advanced',
    category: 'action',
    role: 'cta',
    type: 'button',
    allowedSlots: ['cta', 'hero.primaryCta'],
    slotRoles: ['cta'],
    screenTypes: ['marketing', 'onboarding'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'high'),
      slots: { cta: 1 },
      vibes: { playful: 1, energetic: 0.8 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      label: z.string().optional(),
    }),
    load: createLoader('magic', 'rainbow-button', 'RainbowButtonDemo'),
  },
  {
    id: 'advanced.card.magic',
    name: 'Magic Card',
    library: 'magicui',
    tier: 'advanced',
    category: 'content',
    role: 'feature',
    type: 'card',
    allowedSlots: ['section.card', 'feature.card', 'form'],
    slotRoles: ['card', 'form'],
    screenTypes: ['dashboard', 'onboarding'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['dashboard', 'onboarding'], 'high'),
      slots: { 'section.card': 1, form: 0.7 },
      vibes: { modern: 0.8, bold: 0.7 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('magic', 'magic-card', 'MagicCardDemo'),
  },
  {
    id: 'advanced.background.retro-grid',
    name: 'Retro Grid Background',
    library: 'magicui',
    tier: 'advanced',
    category: 'background',
    role: 'background',
    type: 'background',
    allowedSlots: ['hero.background', 'section.background'],
    slotRoles: ['background'],
    screenTypes: ['marketing', 'onboarding'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['marketing'], 'high'),
      slots: { 'hero.background': 1 },
      vibes: { energetic: 1, playful: 0.8 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('magic', 'retro-grid', 'RetroGridDemo'),
  },
  {
    id: 'advanced.hero.video',
    name: 'Hero Video Dialog',
    library: 'magicui',
    tier: 'advanced',
    category: 'hero',
    role: 'hero',
    type: 'hero',
    allowedSlots: ['hero', 'hero.media'],
    slotRoles: ['hero'],
    screenTypes: ['marketing', 'onboarding'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['marketing', 'onboarding'], 'high'),
      slots: { hero: 1, 'hero.media': 0.7 },
      vibes: { energetic: 1, tech: 0.8 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      videoSrc: z.string().optional(),
      thumbnailSrc: z.string().optional(),
    }),
    load: createLoader('magic', 'hero-video-dialog', 'HeroVideoDialogDemoTopInBottomOut'),
  },
  {
    id: 'advanced.navigation.dock',
    name: 'Dock Navigation',
    library: 'magicui',
    tier: 'advanced',
    category: 'navigation',
    role: 'navigation',
    type: 'navigation',
    allowedSlots: ['navigation.primary', 'footer.navigation'],
    slotRoles: ['navigation'],
    screenTypes: ['dashboard', 'marketing'],
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(['dashboard'], 'high'),
      slots: { 'navigation.primary': 1 },
      vibes: { modern: 1, tech: 0.9 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA,
    load: createLoader('magic', 'dock', 'DockDemo'),
  },
  {
    id: 'advanced.text.morphing',
    name: 'Morphing Text',
    library: 'magicui',
    tier: 'advanced',
    category: 'content',
    role: 'hero',
    type: 'text',
    allowedSlots: ['hero.title', 'section.heading'],
    slotRoles: ['hero', 'text'],
    screenTypes: DEFAULT_SCREEN_TYPES,
    formFactor: 'both',
    complexity: 'high',
    affinities: {
      ...sharedAffinities(DEFAULT_SCREEN_TYPES, 'high'),
      slots: { 'hero.title': 1 },
      vibes: { energetic: 1, playful: 0.8 },
    },
    source: 'magic',
    propsSchema: COMMON_PROPS_SCHEMA.extend({
      texts: z.array(z.string()).optional(),
    }),
    load: createLoader('magic', 'morphing-text', 'MorphingTextDemo'),
  },
]

const registry: LibraryComponent[] = [...safeComponents, ...advancedComponents]

export function getComponentRegistry(): LibraryComponent[] {
  return registry
}

export function getComponentsByType(type: LibraryComponentType): LibraryComponent[] {
  return registry.filter((component) => component.type === type)
}

export function getComponentById(id: string): LibraryComponent | undefined {
  return registry.find((component) => component.id === id)
}

export function getComponentsByTier(tier: ComponentTier): LibraryComponent[] {
  return registry.filter((component) => component.tier === tier)
}

export function prefersAdvanced(vibe: string, requested?: ComponentTier): ComponentTier {
  if (requested) return requested
  const energeticVibes: string[] = ['bold', 'energetic', 'playful']
  return energeticVibes.includes(vibe) ? 'advanced' : 'safe'
}
