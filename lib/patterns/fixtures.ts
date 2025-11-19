import { type ScreenDSL, type Palette, type Vibe, type PatternFamily, type PatternVariant } from '../dsl/types'
import { PATTERN_FAMILY_METADATA } from './metadata'

export const PREVIEW_PALETTES: Palette[] = [
  { primary: '#0f172a', secondary: '#475569', accent: '#2563eb', background: '#f8fafc' },
  { primary: '#111827', secondary: '#6b7280', accent: '#0ea5e9', background: '#fdf4ff' },
  { primary: '#1c1917', secondary: '#57534e', accent: '#f97316', background: '#fff7ed' },
  { primary: '#0b1a2a', secondary: '#64748b', accent: '#22d3ee', background: '#0f172a' },
]

export const PREVIEW_VIBES: Vibe[] = ['modern', 'professional', 'bold', 'minimal', 'creative']

const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&h=800&fit=crop'
const SUPPORTING_IMAGE_URL = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop'

const DEFAULT_COMPONENT_LIBRARY = {
  title: {
    type: 'title',
    content: 'FlowRunner orchestrates rich, image-led screens',
  },
  subtitle: {
    type: 'subtitle',
    content: 'AI-generated hero art drives the entire visual identity.',
  },
  text: {
    type: 'text',
    content: 'Compose multi-screen flows with deterministic patterns and reusable image systems.',
  },
  button: {
    type: 'button',
    content: 'Generate next screen',
    props: {
      variant: 'primary',
    },
  },
  form: {
    type: 'form',
    content: 'Join the FlowRunner beta',
    props: {
      fields: [
        { id: 'name', label: 'Full name', placeholder: 'Alex Rivera' },
        { id: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
      ],
      submitLabel: 'Request access',
    },
  },
  image: {
    type: 'image',
    content: 'Supporting illustration',
    props: {
      url: SUPPORTING_IMAGE_URL,
    },
  },
} as const

function cloneComponent<T extends keyof typeof DEFAULT_COMPONENT_LIBRARY>(type: T) {
  return JSON.parse(JSON.stringify(DEFAULT_COMPONENT_LIBRARY[type])) as (typeof DEFAULT_COMPONENT_LIBRARY)[T]
}

export interface PatternFixtureOptions {
  paletteIndex?: number
  paletteOverride?: Palette
  vibe?: Vibe
}

export function createPatternFixtureDSL(
  family: PatternFamily,
  variant: PatternVariant,
  options: PatternFixtureOptions = {}
): ScreenDSL {
  const metadata = PATTERN_FAMILY_METADATA[family]
  const palette =
    options.paletteOverride ??
    PREVIEW_PALETTES[options.paletteIndex ?? 0] ??
    PREVIEW_PALETTES[0]
  const vibe = options.vibe ?? PREVIEW_VIBES[0]

  const slotTypes = Array.from(
    new Set([...metadata.componentSlots.required, ...metadata.componentSlots.optional])
  )

  const components = slotTypes
    .map((slot) => {
      const component = cloneComponent(slot as keyof typeof DEFAULT_COMPONENT_LIBRARY)
      if (!component) {
        return null
      }
      return {
        ...component,
        content: `${component.content}`,
      }
    })
    .filter(Boolean) as ScreenDSL['components']

  return {
    hero_image: {
      id: `${family}-hero`,
      url: HERO_IMAGE_URL,
    },
    palette,
    vibe,
    pattern_family: family,
    pattern_variant: variant,
    components,
  }
}

