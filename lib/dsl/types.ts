// DSL TypeScript types
// This file will contain all DSL type definitions

export type PatternFamily = 
  // Common UI Patterns
  | 'ONB_HERO_TOP'
  | 'FEAT_IMAGE_TEXT_RIGHT'
  | 'DEMO_DEVICE_FULLBLEED'
  | 'ACT_FORM_MINIMAL'
  | 'CTA_SPLIT_SCREEN'
  | 'HERO_CENTER_TEXT'
  | 'FEAT_IMAGE_TEXT_LEFT'
  | 'FEAT_IMAGE_TEXT_CENTER'
  | 'TESTIMONIAL_CARD_GRID'
  | 'PRICING_TABLE'
  | 'ABOUT_TEAM_GRID'
  | 'BLOG_HERO_CENTER'
  | 'PRODUCT_SHOWCASE'
  | 'FOOTER_MULTI_COLUMN'
  | 'NAV_HEADER_STICKY'
  | 'STATS_COUNTER_ROW'
  | 'LOGO_CLOUD_BANNER'
  | 'FAQ_ACCORDION'
  | 'GALLERY_GRID'
  | 'TIMELINE_VERTICAL'
  | 'COMPARISON_TABLE'
  | 'NEWSLETTER_SIGNUP'
  | 'CONTACT_FORM'
  | 'MAP_EMBED'
  // E-commerce Domain
  | 'PRODUCT_DETAIL'
  | 'CART_SUMMARY'
  | 'CHECKOUT_STEPS'
  | 'ORDER_CONFIRMATION'
  | 'PRODUCT_GRID'
  | 'CATEGORY_FILTER'
  // SaaS Domain
  | 'DASHBOARD_OVERVIEW'
  | 'DASHBOARD_SIDEBAR'
  | 'ONB_STEP_WIZARD'
  | 'FEAT_COMPARISON'
  | 'PRICING_TIERED'
  | 'INTEGRATION_LIST'
  // Mobile App Domain
  | 'SPLASH_SCREEN'
  | 'ONB_SWIPE_CARDS'
  | 'SETTINGS_LIST'
  | 'PROFILE_HEADER'

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

