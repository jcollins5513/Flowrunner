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
  props?: {
    // Existing props
    variant?: string
    size?: string
    fields?: Array<Record<string, unknown>>
    description?: string
    submitLabel?: string
    onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
    url?: string
    id?: string
    // Library component props (optional)
    libraryComponent?: string // e.g., "animated-gradient-text", "rainbow-button"
    libraryProps?: Record<string, any> // Component-specific props for library component
    [key: string]: unknown // Allow other props
  }
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
// Note: palette fields are optional to match the orchestrator's Palette type
export interface HeroImageWithPalette {
  image: {
    url: string
    prompt?: string
    seed?: number
    aspectRatio?: string
    style?: string
  }
  palette: {
    primary: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  vibe?: Vibe
  imageId?: string
}

