// Pattern family definitions and registry
// All pattern families are fixed and not user-extensible

export const PATTERN_FAMILIES = {
  ONB_HERO_TOP: 'ONB_HERO_TOP',
  FEAT_IMAGE_TEXT_RIGHT: 'FEAT_IMAGE_TEXT_RIGHT',
  FEAT_IMAGE_TEXT_LEFT: 'FEAT_IMAGE_TEXT_LEFT',
  CTA_SPLIT_SCREEN: 'CTA_SPLIT_SCREEN',
  HERO_CENTER_TEXT: 'HERO_CENTER_TEXT',
  NEWSLETTER_SIGNUP: 'NEWSLETTER_SIGNUP',
  PRICING_TABLE: 'PRICING_TABLE',
  TESTIMONIAL_CARD_GRID: 'TESTIMONIAL_CARD_GRID',
  DEMO_DEVICE_FULLBLEED: 'DEMO_DEVICE_FULLBLEED',
  ACT_FORM_MINIMAL: 'ACT_FORM_MINIMAL',
  DASHBOARD_OVERVIEW: 'DASHBOARD_OVERVIEW',
  PRODUCT_DETAIL: 'PRODUCT_DETAIL',
} as const

export type PatternFamily = typeof PATTERN_FAMILIES[keyof typeof PATTERN_FAMILIES]

// Array of all pattern families for iteration
export const ALL_PATTERN_FAMILIES = Object.values(PATTERN_FAMILIES)

// Pattern family domains
export const PATTERN_DOMAINS = {
  COMMON: 'common',
  ECOMMERCE: 'ecommerce',
  SAAS: 'saas',
  MOBILE: 'mobile',
} as const

export type PatternDomain = typeof PATTERN_DOMAINS[keyof typeof PATTERN_DOMAINS]

