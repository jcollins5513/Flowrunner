# Pattern System

The pattern system defines layout structures, component slots, and validation rules for all screen layouts in FlowRunner.

## Structure

- **Pattern Families**: 12 canonical families covering the FlowRunner pattern taxonomy
- **Pattern Variants**: Each family has 5 deterministic variants
- **Total Patterns**: 60 pattern definitions (12 families × 5 variants)

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

### Common UI Patterns (8 families)
- ONB_HERO_TOP
- FEAT_IMAGE_TEXT_RIGHT
- FEAT_IMAGE_TEXT_LEFT
- CTA_SPLIT_SCREEN
- HERO_CENTER_TEXT
- NEWSLETTER_SIGNUP
- PRICING_TABLE
- TESTIMONIAL_CARD_GRID

### Domain-Specific Patterns (4 families)
- DEMO_DEVICE_FULLBLEED (mobile emphasis)
- ACT_FORM_MINIMAL (action-first surfaces)
- DASHBOARD_OVERVIEW (SaaS telemetry)
- PRODUCT_DETAIL (e-commerce detail page)

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

