// DSL TypeScript types
// This file will contain all DSL type definitions

export type PatternFamily = 
  | 'ONB_HERO_TOP'
  | 'FEAT_IMAGE_TEXT_RIGHT'
  | 'FEAT_IMAGE_TEXT_LEFT'
  | 'CTA_SPLIT_SCREEN'
  | 'HERO_CENTER_TEXT'
  | 'NEWSLETTER_SIGNUP'
  | 'PRICING_TABLE'
  | 'TESTIMONIAL_CARD_GRID'
  | 'DEMO_DEVICE_FULLBLEED'
  | 'ACT_FORM_MINIMAL'
  | 'DASHBOARD_OVERVIEW'
  | 'PRODUCT_DETAIL'

export type PatternVariant = 1 | 2 | 3 | 4 | 5

export type Vibe = 
  | 'playful'
  | 'professional'
  | 'bold'
  | 'minimal'
  | 'modern'
  | 'retro'
  | 'elegant'
  | 'energetic'
  | 'calm'
  | 'tech'
  | 'creative'
  | 'corporate'

export interface Palette {
  primary: string
  secondary: string
  accent: string
  background: string
}

export interface HeroImage {
  id: string
  url: string
  prompt?: string
  seed?: number
  aspectRatio?: string
  style?: string
  extractedPalette?: Palette
  vibe?: Vibe
}

export interface Component {
  type: 'title' | 'subtitle' | 'button' | 'form' | 'text' | 'image'
  content: string
  props?: Record<string, unknown>
}

export interface Navigation {
  type: 'internal' | 'external'
  target?: string
  screenId?: string
  url?: string
}

export interface ScreenDSL {
  hero_image: HeroImage
  supporting_images?: HeroImage[]
  palette: Palette
  vibe: Vibe
  pattern_family: PatternFamily
  pattern_variant: PatternVariant
  components: Component[]
  navigation?: Navigation
  animations?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface FlowDSL {
  id: string
  name: string
  description?: string
  domain?: string
  theme?: string
  style?: string
  screens: ScreenDSL[]
}

// Minimal type for hero image with palette (client-safe, doesn't import server-only modules)
// This is a simplified version of HeroImageWithPalette from orchestrator
export interface HeroImageWithPalette {
  image: {
    url: string
    prompt?: string
    seed?: number
    aspectRatio?: string
    style?: string
  }
  palette: Palette
  vibe?: Vibe
  imageId?: string
}

