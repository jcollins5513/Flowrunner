# Library System

The library system provides integration with external component libraries (Aura, Magic, Aceternity) to enhance FlowRunner's pattern selection and layout generation.

## Aura Template Integration

The aura library contains full landing page templates that can be used to:

1. **Guide Pattern Selection**: Analyze aura templates to suggest which FlowRunner pattern family/variant to use
2. **Enhance Layout Generation**: Use aura templates as reference for layout structures
3. **Provide Visual Inspiration**: Map aura templates to patterns for design reference

### Usage

#### Basic Pattern Suggestion

```typescript
import { suggestPatternFromAura } from '@/lib/library/aura-pattern-guide'

const suggestion = await suggestPatternFromAura({
  domain: 'saas',
  description: 'landing page with hero section',
  tags: ['hero', 'cta']
})

if (suggestion.patternFamily) {
  // Use suggested pattern
  console.log(`Suggested: ${suggestion.patternFamily} variant ${suggestion.patternVariant}`)
  console.log(`Confidence: ${suggestion.confidence}`)
}
```

#### Enhance Existing Pattern Selection

```typescript
import { enhancePatternWithAura } from '@/lib/library/aura-pattern-guide'

const enhanced = await enhancePatternWithAura(
  'HERO_CENTER_TEXT',
  2,
  { domain: 'saas', vibe: 'modern' }
)

console.log(`Enhanced variant: ${enhanced.enhancedVariant}`)
console.log(`Reference templates:`, enhanced.referenceTemplates)
```

#### Get Reference Templates

```typescript
import { getAuraReferencesForPattern } from '@/lib/library/aura-pattern-guide'

const references = await getAuraReferencesForPattern('ONB_HERO_TOP', 3)

references.forEach((ref) => {
  console.log(`${ref.name}: ${ref.confidence} confidence`)
  // Use ref.screenshotPath for visual reference
})
```

### Architecture

- **`aura-analyzer.ts`**: Analyzes HTML and metadata to extract layout patterns
- **`aura-pattern-matcher.ts`**: Matches aura templates to FlowRunner patterns
- **`aura-loader.ts`**: Loads and indexes aura templates from the library directory
- **`aura-pattern-guide.ts`**: High-level API for using aura templates in pattern selection

### Integration Points

The aura template system can be integrated into:

1. **Template Selection** (`lib/flow/templates/selector.ts`): Use aura templates to inform pattern selection
2. **Screen Generation** (`lib/flows/build-screen-dsl.ts`): Enhance pattern selection with aura guidance
3. **Next Screen Generation** (`lib/flows/next-screen-generator.ts`): Use aura templates to suggest next screen patterns

### Pattern Mapping

Aura templates are mapped to FlowRunner patterns based on:

- **Metadata tags**: Direct tag matching (e.g., "pricing" → `PRICING_TABLE`)
- **Layout analysis**: HTML structure analysis (e.g., hero position → pattern family)
- **Description keywords**: Semantic matching from template descriptions

### Confidence Scores

All pattern suggestions include confidence scores (0-1):

- **0.8-1.0**: High confidence - strong match, safe to use
- **0.6-0.8**: Medium confidence - good match, consider with context
- **0.4-0.6**: Low confidence - weak match, use as fallback only
- **<0.4**: Very low confidence - not recommended

