# Pattern System

The pattern system defines layout structures, component slots, and validation rules for all screen layouts in FlowRunner.

## Structure

- **Pattern Families**: 40+ families covering common UI patterns and domain-specific layouts
- **Pattern Variants**: Each family has 5 variants with distinct layouts
- **Total Patterns**: 200+ pattern definitions (40+ families × 5 variants)

## Files

- `families.ts` - Pattern family enum and registry
- `metadata.ts` - Pattern family metadata (display names, descriptions, use cases)
- `schema.ts` - Zod schema for pattern definitions
- `loader.ts` - Pattern loader utility with caching
- `validator.ts` - DSL-to-pattern contract validator
- `compatibility.ts` - Pattern compatibility checker
- `definitions/` - JSON pattern definition files organized by family

## Pattern Definition Format

Each pattern JSON file follows this structure:

```json
{
  "family": "PATTERN_FAMILY_NAME",
  "variant": 1,
  "name": "Human-readable variant name",
  "description": "Variant description",
  "layout": {
    "structure": "grid" | "flex",
    "gridTemplate": "1fr 1fr" (for grid),
    "flexDirection": "row" | "column" (for flex),
    "positions": {
      "component_slot": { "x": 0, "y": 0, "width": 1, "height": 1 }
    }
  },
  "componentSlots": {
    "required": ["title", "subtitle"],
    "optional": ["text", "button"]
  },
  "spacing": {
    "padding": 24,
    "gap": 16
  },
  "responsive": {
    "breakpoints": {
      "mobile": { "padding": 16, "gap": 12 },
      "tablet": { "padding": 20, "gap": 14 },
      "desktop": { "padding": 24, "gap": 16 }
    }
  },
  "imagePlacement": {
    "hero": {
      "position": "top" | "left" | "right" | "center" | "full-bleed",
      "size": "full" | "half" | "third" | "contain"
    },
    "supporting": [
      { "position": "left", "size": "third" }
    ]
  }
}
```

## Component Slots

Component slots map to DSL component types:
- `title` - Title component
- `subtitle` - Subtitle component
- `button` - Button component
- `form` - Form component
- `text` - Text/body component
- `image` - Image component

## Usage

```typescript
import { loadPattern } from './lib/patterns/loader'
import { validateDSLWithPattern } from './lib/patterns/validator'
import { calculateCompatibility } from './lib/patterns/compatibility'

// Load a pattern
const pattern = loadPattern('ONB_HERO_TOP', 1)

// Validate DSL against pattern
const result = validateDSLWithPattern(screenDSL)

// Check compatibility
const compatibility = calculateCompatibility(heroImage, palette, pattern)
```

## Pattern Families

### Common UI Patterns (24 families)
- ONB_HERO_TOP, FEAT_IMAGE_TEXT_RIGHT, DEMO_DEVICE_FULLBLEED, ACT_FORM_MINIMAL
- CTA_SPLIT_SCREEN, HERO_CENTER_TEXT, FEAT_IMAGE_TEXT_LEFT, FEAT_IMAGE_TEXT_CENTER
- TESTIMONIAL_CARD_GRID, PRICING_TABLE, ABOUT_TEAM_GRID, BLOG_HERO_CENTER
- PRODUCT_SHOWCASE, FOOTER_MULTI_COLUMN, NAV_HEADER_STICKY, STATS_COUNTER_ROW
- LOGO_CLOUD_BANNER, FAQ_ACCORDION, GALLERY_GRID, TIMELINE_VERTICAL
- COMPARISON_TABLE, NEWSLETTER_SIGNUP, CONTACT_FORM, MAP_EMBED

### E-commerce Domain (6 families)
- PRODUCT_DETAIL, CART_SUMMARY, CHECKOUT_STEPS, ORDER_CONFIRMATION, PRODUCT_GRID, CATEGORY_FILTER

### SaaS Domain (6 families)
- DASHBOARD_OVERVIEW, DASHBOARD_SIDEBAR, ONB_STEP_WIZARD, FEAT_COMPARISON, PRICING_TIERED, INTEGRATION_LIST

### Mobile App Domain (4 families)
- SPLASH_SCREEN, ONB_SWIPE_CARDS, SETTINGS_LIST, PROFILE_HEADER

## Creating New Patterns

1. Create directory: `lib/patterns/definitions/{FAMILY_NAME}/`
2. Create 5 variant files: `variant-1.json` through `variant-5.json`
3. Follow the pattern definition format above
4. Ensure variants show clear progression/differences
5. Validate against schema using `patternDefinitionSchema.parse()`

## Validation

All patterns are validated:
- On load (Zod schema validation)
- Against DSL contracts (required slots, component types)
- For compatibility (vibe, style, palette)

