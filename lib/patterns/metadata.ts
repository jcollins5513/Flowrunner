// Pattern family metadata
// Contains display names, descriptions, use cases, and component slot definitions

import { PATTERN_FAMILIES, PATTERN_DOMAINS, type PatternFamily, type PatternDomain } from './families'

export interface PatternFamilyMetadata {
  displayName: string
  description: string
  useCases: string[]
  componentSlots: {
    required: string[]
    optional: string[]
  }
  domain: PatternDomain
}

export const PATTERN_FAMILY_METADATA: Record<PatternFamily, PatternFamilyMetadata> = {
  [PATTERN_FAMILIES.ONB_HERO_TOP]: {
    displayName: 'Onboarding Hero Top',
    description:
      'Hero section with hero image at the top and onboarding copy stacks underneath.',
    useCases: ['User onboarding', 'Welcome screens', 'Product introductions'],
    componentSlots: {
      required: ['title', 'subtitle', 'button'],
      optional: ['text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT]: {
    displayName: 'Feature Image Text Right',
    description: 'Two-column feature layout with image leading and copy on the right.',
    useCases: ['Feature highlights', 'Product storytelling', 'Launch updates'],
    componentSlots: {
      required: ['title', 'subtitle'],
      optional: ['text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT]: {
    displayName: 'Feature Image Text Left',
    description: 'Mirrored feature layout with copy leading and image on the right.',
    useCases: ['Feature highlights', 'Case studies', 'Content sections'],
    componentSlots: {
      required: ['title', 'subtitle'],
      optional: ['text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.CTA_SPLIT_SCREEN]: {
    displayName: 'CTA Split Screen',
    description: 'Split-screen call-to-action with hero art supporting persuasive copy.',
    useCases: ['Conversion targets', 'Product launches', 'Campaign CTAs'],
    componentSlots: {
      required: ['title', 'button'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.HERO_CENTER_TEXT]: {
    displayName: 'Hero Center Text',
    description: 'Full-width hero surface with centered typography and backdrop image.',
    useCases: ['Landing hero', 'Event splash', 'Premium announcements'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.NEWSLETTER_SIGNUP]: {
    displayName: 'Newsletter Signup',
    description: 'Email capture form with concise framing content and CTA controls.',
    useCases: ['Newsletter capture', 'Beta waitlists', 'Lead generation'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.PRICING_TABLE]: {
    displayName: 'Pricing Table',
    description: 'Multi-column pricing layout with tier comparisons and CTAs.',
    useCases: ['Pricing pages', 'Plan comparisons', 'Upgrade prompts'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.TESTIMONIAL_CARD_GRID]: {
    displayName: 'Testimonial Card Grid',
    description: 'Grid of testimonial cards for social proof and customer stories.',
    useCases: ['Testimonials', 'Customer showcases', 'Review highlights'],
    componentSlots: {
      required: ['title'],
      optional: ['text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.DEMO_DEVICE_FULLBLEED]: {
    displayName: 'Demo Device Full Bleed',
    description: 'Full-bleed device mockup hero to showcase product UI snapshots.',
    useCases: ['App demos', 'Device mockups', 'Experience overviews'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.MOBILE,
  },
  [PATTERN_FAMILIES.ACT_FORM_MINIMAL]: {
    displayName: 'Action Form Minimal',
    description: 'Minimal form-first layout for focused user actions.',
    useCases: ['Signup/login', 'Simple forms', 'Waitlist capture'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.DASHBOARD_OVERVIEW]: {
    displayName: 'Dashboard Overview',
    description: 'Modular dashboard grid for KPIs, charts, and product telemetry.',
    useCases: ['Product dashboards', 'Analytics hubs', 'SaaS overview screens'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.PRODUCT_DETAIL]: {
    displayName: 'Product Detail',
    description: 'E-commerce product detail canvas with imagery, copy, and CTAs.',
    useCases: ['Product detail pages', 'Merch highlights', 'Marketplace listings'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
}

// Helper function to get metadata for a pattern family
export function getPatternFamilyMetadata(family: PatternFamily): PatternFamilyMetadata {
  return PATTERN_FAMILY_METADATA[family]
}

// Helper function to get all families by domain
export function getPatternFamiliesByDomain(domain: PatternDomain): PatternFamily[] {
  return Object.entries(PATTERN_FAMILY_METADATA)
    .filter(([_, metadata]) => metadata.domain === domain)
    .map(([family]) => family as PatternFamily)
}

