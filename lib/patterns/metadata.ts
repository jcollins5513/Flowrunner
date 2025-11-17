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
  // Common UI Patterns
  [PATTERN_FAMILIES.ONB_HERO_TOP]: {
    displayName: 'Onboarding Hero Top',
    description: 'Hero section with image at top, text content below. Perfect for first-time user onboarding.',
    useCases: ['User onboarding', 'Welcome screens', 'Product introduction'],
    componentSlots: {
      required: ['title', 'subtitle', 'button'],
      optional: ['text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT]: {
    displayName: 'Feature Image Text Right',
    description: 'Feature section with image on left and text content on right.',
    useCases: ['Feature showcases', 'Product highlights', 'Content sections'],
    componentSlots: {
      required: ['title', 'subtitle'],
      optional: ['text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.DEMO_DEVICE_FULLBLEED]: {
    displayName: 'Demo Device Full Bleed',
    description: 'Full-bleed device mockup showcasing product demos or screenshots.',
    useCases: ['Product demos', 'App showcases', 'Screenshot galleries'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.ACT_FORM_MINIMAL]: {
    displayName: 'Action Form Minimal',
    description: 'Minimal form layout for user actions like signup, login, or contact.',
    useCases: ['Signup forms', 'Login pages', 'Contact forms', 'Newsletter signup'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.CTA_SPLIT_SCREEN]: {
    displayName: 'Call-to-Action Split Screen',
    description: 'Split screen layout with image on one side and CTA content on the other.',
    useCases: ['Call-to-action sections', 'Conversion pages', 'Landing pages'],
    componentSlots: {
      required: ['title', 'button'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.HERO_CENTER_TEXT]: {
    displayName: 'Hero Center Text',
    description: 'Centered hero section with text overlay on background image.',
    useCases: ['Hero sections', 'Landing pages', 'Banner sections'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT]: {
    displayName: 'Feature Image Text Left',
    description: 'Feature section with image on right and text content on left.',
    useCases: ['Feature showcases', 'Content sections', 'Product highlights'],
    componentSlots: {
      required: ['title', 'subtitle'],
      optional: ['text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FEAT_IMAGE_TEXT_CENTER]: {
    displayName: 'Feature Image Text Center',
    description: 'Feature section with centered image and text content.',
    useCases: ['Feature showcases', 'Content sections', 'Product highlights'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.TESTIMONIAL_CARD_GRID]: {
    displayName: 'Testimonial Card Grid',
    description: 'Grid layout displaying customer testimonials in card format.',
    useCases: ['Testimonials', 'Reviews', 'Social proof', 'Customer stories'],
    componentSlots: {
      required: ['title'],
      optional: ['text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.PRICING_TABLE]: {
    displayName: 'Pricing Table',
    description: 'Table layout displaying pricing tiers and plans.',
    useCases: ['Pricing pages', 'Subscription plans', 'Product tiers'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.ABOUT_TEAM_GRID]: {
    displayName: 'About Team Grid',
    description: 'Grid layout showcasing team members with photos and bios.',
    useCases: ['About pages', 'Team sections', 'Meet the team'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.BLOG_HERO_CENTER]: {
    displayName: 'Blog Hero Center',
    description: 'Centered hero section for blog posts and articles.',
    useCases: ['Blog posts', 'Articles', 'Content pages'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.PRODUCT_SHOWCASE]: {
    displayName: 'Product Showcase',
    description: 'Showcase layout highlighting product features and benefits.',
    useCases: ['Product pages', 'Feature showcases', 'Product highlights'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FOOTER_MULTI_COLUMN]: {
    displayName: 'Footer Multi Column',
    description: 'Multi-column footer layout with links, contact info, and social media.',
    useCases: ['Site footers', 'Page footers', 'Footer sections'],
    componentSlots: {
      required: ['text'],
      optional: ['title', 'button'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.NAV_HEADER_STICKY]: {
    displayName: 'Navigation Header Sticky',
    description: 'Sticky navigation header with logo, links, and CTA button.',
    useCases: ['Site headers', 'Navigation bars', 'Top navigation'],
    componentSlots: {
      required: ['title'],
      optional: ['button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.STATS_COUNTER_ROW]: {
    displayName: 'Stats Counter Row',
    description: 'Horizontal row displaying statistics and metrics.',
    useCases: ['Statistics sections', 'Metrics display', 'Achievement showcases'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.LOGO_CLOUD_BANNER]: {
    displayName: 'Logo Cloud Banner',
    description: 'Banner displaying partner/client logos in a cloud layout.',
    useCases: ['Partner logos', 'Client showcases', 'Trust badges'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.FAQ_ACCORDION]: {
    displayName: 'FAQ Accordion',
    description: 'Accordion layout for frequently asked questions.',
    useCases: ['FAQ sections', 'Help pages', 'Support content'],
    componentSlots: {
      required: ['title', 'text'],
      optional: ['subtitle'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.GALLERY_GRID]: {
    displayName: 'Gallery Grid',
    description: 'Grid layout for image galleries and portfolios.',
    useCases: ['Image galleries', 'Portfolios', 'Photo showcases'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.TIMELINE_VERTICAL]: {
    displayName: 'Timeline Vertical',
    description: 'Vertical timeline layout for events, history, or processes.',
    useCases: ['Timelines', 'History sections', 'Process flows'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.COMPARISON_TABLE]: {
    displayName: 'Comparison Table',
    description: 'Table layout comparing features, plans, or options.',
    useCases: ['Feature comparisons', 'Plan comparisons', 'Product comparisons'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.NEWSLETTER_SIGNUP]: {
    displayName: 'Newsletter Signup',
    description: 'Newsletter signup form with email input and CTA.',
    useCases: ['Newsletter signup', 'Email capture', 'Subscription forms'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.CONTACT_FORM]: {
    displayName: 'Contact Form',
    description: 'Contact form layout with name, email, message fields.',
    useCases: ['Contact pages', 'Support forms', 'Inquiry forms'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },
  [PATTERN_FAMILIES.MAP_EMBED]: {
    displayName: 'Map Embed',
    description: 'Layout with embedded map and location information.',
    useCases: ['Location pages', 'Contact pages', 'Store locators'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.COMMON,
  },

  // E-commerce Domain
  [PATTERN_FAMILIES.PRODUCT_DETAIL]: {
    displayName: 'Product Detail Page',
    description: 'Product detail page with images, description, price, and add to cart.',
    useCases: ['Product pages', 'E-commerce', 'Product listings'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button', 'image'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
  [PATTERN_FAMILIES.CART_SUMMARY]: {
    displayName: 'Cart Summary',
    description: 'Shopping cart summary with items, quantities, and checkout button.',
    useCases: ['Shopping carts', 'Checkout pages', 'Cart review'],
    componentSlots: {
      required: ['title', 'button'],
      optional: ['subtitle', 'text'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
  [PATTERN_FAMILIES.CHECKOUT_STEPS]: {
    displayName: 'Checkout Steps',
    description: 'Multi-step checkout process with progress indicator.',
    useCases: ['Checkout flows', 'Payment pages', 'Order processing'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
  [PATTERN_FAMILIES.ORDER_CONFIRMATION]: {
    displayName: 'Order Confirmation',
    description: 'Order confirmation page with order details and next steps.',
    useCases: ['Order confirmations', 'Thank you pages', 'Purchase confirmations'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
  [PATTERN_FAMILIES.PRODUCT_GRID]: {
    displayName: 'Product Grid',
    description: 'Grid layout displaying multiple products with images and prices.',
    useCases: ['Product listings', 'Category pages', 'Shop pages'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'image', 'button'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },
  [PATTERN_FAMILIES.CATEGORY_FILTER]: {
    displayName: 'Category Filter',
    description: 'Product category page with filters and product grid.',
    useCases: ['Category pages', 'Filtered listings', 'Shop pages'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'form', 'image'],
    },
    domain: PATTERN_DOMAINS.ECOMMERCE,
  },

  // SaaS Domain
  [PATTERN_FAMILIES.DASHBOARD_OVERVIEW]: {
    displayName: 'Dashboard Overview',
    description: 'Dashboard overview with metrics, charts, and key information.',
    useCases: ['Dashboards', 'Analytics pages', 'Overview screens'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.DASHBOARD_SIDEBAR]: {
    displayName: 'Dashboard with Sidebar',
    description: 'Dashboard layout with sidebar navigation and main content area.',
    useCases: ['Dashboards', 'Admin panels', 'App interfaces'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.ONB_STEP_WIZARD]: {
    displayName: 'Onboarding Step Wizard',
    description: 'Multi-step onboarding wizard with progress tracking.',
    useCases: ['User onboarding', 'Setup wizards', 'Onboarding flows'],
    componentSlots: {
      required: ['title', 'form'],
      optional: ['subtitle', 'button', 'text'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.FEAT_COMPARISON]: {
    displayName: 'Feature Comparison',
    description: 'Feature comparison table for plans or products.',
    useCases: ['Feature comparisons', 'Plan comparisons', 'Product comparisons'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.PRICING_TIERED]: {
    displayName: 'Pricing Tiered',
    description: 'Tiered pricing layout with multiple plan options.',
    useCases: ['Pricing pages', 'Subscription plans', 'Plan selection'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'button'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },
  [PATTERN_FAMILIES.INTEGRATION_LIST]: {
    displayName: 'Integration List',
    description: 'List of integrations with logos and descriptions.',
    useCases: ['Integration pages', 'App directories', 'Integration showcases'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image', 'button'],
    },
    domain: PATTERN_DOMAINS.SAAS,
  },

  // Mobile App Domain
  [PATTERN_FAMILIES.SPLASH_SCREEN]: {
    displayName: 'Splash Screen',
    description: 'App splash screen with logo and loading indicator.',
    useCases: ['App launch', 'Splash screens', 'Loading screens'],
    componentSlots: {
      required: ['title'],
      optional: ['image'],
    },
    domain: PATTERN_DOMAINS.MOBILE,
  },
  [PATTERN_FAMILIES.ONB_SWIPE_CARDS]: {
    displayName: 'Onboarding Swipe Cards',
    description: 'Swipeable card-based onboarding flow.',
    useCases: ['App onboarding', 'Tutorial screens', 'Introduction flows'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image', 'button'],
    },
    domain: PATTERN_DOMAINS.MOBILE,
  },
  [PATTERN_FAMILIES.SETTINGS_LIST]: {
    displayName: 'Settings List',
    description: 'Settings screen with list of options and toggles.',
    useCases: ['Settings pages', 'Preferences', 'Configuration screens'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'form'],
    },
    domain: PATTERN_DOMAINS.MOBILE,
  },
  [PATTERN_FAMILIES.PROFILE_HEADER]: {
    displayName: 'Profile Header',
    description: 'Profile header with avatar, name, and action buttons.',
    useCases: ['Profile pages', 'User profiles', 'Account pages'],
    componentSlots: {
      required: ['title'],
      optional: ['subtitle', 'text', 'image', 'button'],
    },
    domain: PATTERN_DOMAINS.MOBILE,
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

