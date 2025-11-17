# Pattern Taxonomy — AI, Editor UX, and QA Playbook

This document defines the pattern taxonomy system for FlowRunner, providing guidance for:
- **AI/LLM**: Pattern selection and generation decisions
- **Editor UX**: Pattern selection interface and user guidance
- **QA Testing**: Systematic test coverage and validation

---

## Pattern Family Structure

### Total Coverage
- **12 pattern families** (currently defined and available)
- **5 variants per family** = 60 total pattern definitions
- **4 domains**: Common, E-commerce, SaaS, Mobile App

### Pattern Family Categories

#### Common UI Patterns (8 families)
Universal patterns usable across any domain:
- `ONB_HERO_TOP` - Onboarding hero with image at top
- `FEAT_IMAGE_TEXT_RIGHT` - Feature section, image left, text right
- `FEAT_IMAGE_TEXT_LEFT` - Feature section, image right, text left
- `CTA_SPLIT_SCREEN` - Split-screen call-to-action
- `HERO_CENTER_TEXT` - Centered hero with text overlay
- `NEWSLETTER_SIGNUP` - Newsletter signup form
- `PRICING_TABLE` - Pricing table layout
- `TESTIMONIAL_CARD_GRID` - Testimonial grid

#### Domain-Specific Patterns (4 families)
Targeted patterns for specific use cases:
- `DEMO_DEVICE_FULLBLEED` - Full-bleed device mockup (Common/Mobile)
- `ACT_FORM_MINIMAL` - Minimal action form (Common)
- `DASHBOARD_OVERVIEW` - Dashboard overview (SaaS)
- `PRODUCT_DETAIL` - Product detail page (E-commerce)

---

## Pattern Selection Logic

### For AI/LLM Pattern Selection

When selecting a pattern family, consider:

1. **Screen Intent** (from user prompt):
   - Onboarding → `ONB_HERO_TOP`
   - Feature showcase → `FEAT_IMAGE_TEXT_RIGHT` or `FEAT_IMAGE_TEXT_LEFT`
   - Pricing → `PRICING_TABLE`
   - Product page → `PRODUCT_DETAIL`
   - Dashboard → `DASHBOARD_OVERVIEW`
   - Newsletter signup → `NEWSLETTER_SIGNUP`
   - Testimonials → `TESTIMONIAL_CARD_GRID`
   - Call-to-action → `CTA_SPLIT_SCREEN`
   - Device demo → `DEMO_DEVICE_FULLBLEED`

2. **Content Requirements**:
   - **Hero image required**: All patterns support hero images
   - **Form needed**: `ACT_FORM_MINIMAL`, `NEWSLETTER_SIGNUP`
   - **Multiple items**: `PRICING_TABLE`, `TESTIMONIAL_CARD_GRID`
   - **Text-heavy**: `FEAT_IMAGE_TEXT_LEFT`, `FEAT_IMAGE_TEXT_RIGHT`

3. **Layout Preferences**:
   - **Split layouts**: `CTA_SPLIT_SCREEN`, `FEAT_IMAGE_TEXT_*`
   - **Single column**: `ONB_HERO_TOP`, `HERO_CENTER_TEXT`, `ACT_FORM_MINIMAL`
   - **Grid layouts**: `PRICING_TABLE`, `TESTIMONIAL_CARD_GRID`, `DASHBOARD_OVERVIEW`

4. **Image Placement**:
   - **Top**: `ONB_HERO_TOP`, `DEMO_DEVICE_FULLBLEED`
   - **Left**: `FEAT_IMAGE_TEXT_RIGHT`, `CTA_SPLIT_SCREEN`
   - **Right**: `FEAT_IMAGE_TEXT_LEFT`
   - **Center/Background**: `HERO_CENTER_TEXT`, `NEWSLETTER_SIGNUP`

5. **Domain Context**:
   - **E-commerce**: `PRODUCT_DETAIL` (plus common patterns)
   - **SaaS**: `DASHBOARD_OVERVIEW` (plus common patterns)
   - **Mobile App**: `DEMO_DEVICE_FULLBLEED` (plus common patterns)
   - **General**: Common UI patterns

### Variant Selection (1-5)

Variants offer layout variations within the same family:
- **Variant 1**: Standard/default layout
- **Variant 2**: Wider/narrower proportions
- **Variant 3**: Compact spacing
- **Variant 4**: Spacious/premium spacing
- **Variant 5**: Asymmetric or alternative layout

**AI Selection Heuristics**:
- Default to **variant 1** unless specific layout needs are indicated
- Use **variant 3** for dense content or mobile-first designs
- Use **variant 4** for premium/branded experiences
- Use **variant 2 or 5** for specific visual emphasis needs

---

## Component Slot Requirements

Each pattern family defines:
- **Required slots**: Must be filled for valid DSL
- **Optional slots**: Can be included for enhanced content

### Component Slot Types
- `title` - Main heading (most patterns require)
- `subtitle` - Supporting heading
- `text` - Body text/description
- `button` - Call-to-action button
- `form` - Form input fields (for signup/login)
- `image` - Supporting images (separate from hero)

### Pattern Slot Requirements Quick Reference

| Pattern Family | Required Slots | Common Optional Slots |
|---------------|----------------|----------------------|
| `ONB_HERO_TOP` | title, subtitle, button | text |
| `FEAT_IMAGE_TEXT_RIGHT` | title, subtitle | text, button, image |
| `FEAT_IMAGE_TEXT_LEFT` | title, subtitle | text, button, image |
| `CTA_SPLIT_SCREEN` | title, button | subtitle, text, image |
| `HERO_CENTER_TEXT` | title | subtitle, button, text |
| `NEWSLETTER_SIGNUP` | title, form | subtitle, button, text |
| `PRICING_TABLE` | title | subtitle, text, button |
| `TESTIMONIAL_CARD_GRID` | title | text, image |
| `DEMO_DEVICE_FULLBLEED` | title | subtitle, text, button |
| `ACT_FORM_MINIMAL` | title, form | subtitle, button, text |
| `DASHBOARD_OVERVIEW` | title | subtitle, text, image |
| `PRODUCT_DETAIL` | title | subtitle, text, button, image |

---

## Editor UX Guidelines

### Pattern Selection Interface

When presenting pattern options to users:

1. **Group by Domain**: 
   - Common patterns first (most versatile)
   - Domain-specific patterns in separate sections

2. **Show Visual Previews**:
   - Display variant thumbnails (1-5) for each family
   - Highlight required vs optional component slots
   - Show responsive breakpoint examples

3. **Provide Context**:
   - Display use case descriptions
   - Show compatible vibe/styles
   - Indicate image placement expectations

4. **Pattern Metadata Display**:
   ```
   [Pattern Family Name]
   - Description: [Short description]
   - Use Cases: [List of use cases]
   - Required: [Required component slots]
   - Optional: [Optional component slots]
   - Image Placement: [Hero image position]
   ```

### Pattern Switching UX

When users switch patterns:
- **Preserve compatible components**: Move title, subtitle, text if slot exists
- **Warn about incompatible slots**: Alert if required slots won't be filled
- **Suggest alternatives**: Recommend similar patterns if current is incompatible
- **Maintain image**: Preserve hero image across compatible patterns

---

## QA Playbook

### Pattern Validation Testing

#### 1. Schema Validation
- [ ] All 60 pattern JSON files validate against `patternDefinitionSchema`
- [ ] Family and variant match filename/directory structure
- [ ] All required fields present (layout, componentSlots, spacing, responsive, imagePlacement)
- [ ] Grid templates valid CSS grid syntax
- [ ] Component positions fit within grid bounds

#### 2. DSL Contract Validation
- [ ] DSL with required slots only → validates against pattern
- [ ] DSL missing required slot → validation error
- [ ] DSL with optional slots → validates successfully
- [ ] Component types match pattern slot expectations

#### 3. Pattern Loading Tests
- [ ] All 60 patterns load via `/api/patterns/[family]/variant-[variant]`
- [ ] Loaded patterns cache correctly
- [ ] Invalid family/variant returns 404
- [ ] Pattern loader handles network errors gracefully

#### 4. Compatibility Tests
- [ ] Pattern compatibility checker evaluates vibe/style/palette
- [ ] Compatible patterns scored higher than incompatible
- [ ] Image placement preferences respected

#### 5. Renderer Integration Tests
- [ ] Each pattern family renders correctly with canonical DSL
- [ ] All variants render without layout errors
- [ ] Responsive breakpoints work (mobile, tablet, desktop)
- [ ] Component slots position correctly in grid/flex
- [ ] Image placement matches pattern definition

### Test Coverage Matrix

| Pattern Family | Variants | Schema Valid | DSL Valid | Loader Test | Renderer Test |
|---------------|----------|--------------|-----------|-------------|---------------|
| ONB_HERO_TOP | 5 | ✓ | ✓ | ✓ | ✓ |
| FEAT_IMAGE_TEXT_RIGHT | 5 | ✓ | ✓ | ✓ | ✓ |
| FEAT_IMAGE_TEXT_LEFT | 5 | ✓ | ✓ | ✓ | ✓ |
| CTA_SPLIT_SCREEN | 5 | ✓ | ✓ | ✓ | ✓ |
| HERO_CENTER_TEXT | 5 | ✓ | ✓ | ✓ | ✓ |
| NEWSLETTER_SIGNUP | 5 | ✓ | ✓ | ✓ | ✓ |
| PRICING_TABLE | 5 | ✓ | ✓ | ✓ | ✓ |
| TESTIMONIAL_CARD_GRID | 5 | ✓ | ✓ | ✓ | ✓ |
| DEMO_DEVICE_FULLBLEED | 5 | ✓ | ✓ | ✓ | ✓ |
| ACT_FORM_MINIMAL | 5 | ✓ | ✓ | ✓ | ✓ |
| DASHBOARD_OVERVIEW | 5 | ✓ | ✓ | ✓ | ✓ |
| PRODUCT_DETAIL | 5 | ✓ | ✓ | ✓ | ✓ |

**Total**: 12 families × 5 variants × 5 test types = 300 test cases

### Visual Regression Testing

- [ ] Screenshot each pattern variant with canonical DSL fixture
- [ ] Compare screenshots across renderer changes
- [ ] Validate responsive breakpoints visually
- [ ] Check image placement accuracy

### Performance Tests

- [ ] Pattern loading time < 50ms (cached)
- [ ] Pattern validation time < 10ms
- [ ] All 60 patterns load in < 500ms (parallel)
- [ ] Pattern cache memory footprint reasonable

---

## Pattern Evolution Guidelines

### Adding New Patterns

1. **Define in `families.ts`**: Add to `PATTERN_FAMILIES` enum
2. **Add metadata in `metadata.ts`**: Display name, description, use cases, slots
3. **Create 5 variants**: JSON files in `definitions/{FAMILY}/variant-{1-5}.json`
4. **Update schema**: Ensure new family in `patternFamilySchema`
5. **Update DSL types**: Add to `PatternFamily` type union
6. **Add tests**: Schema, validation, loader, renderer tests
7. **Update documentation**: This file, README.md

### Modifying Existing Patterns

- **Minor spacing/layout changes**: Update JSON, re-validate, update tests
- **Slot requirement changes**: Update metadata, re-run DSL validation tests
- **Breaking changes**: Version pattern definitions, update renderer accordingly

### Deprecating Patterns

- Mark as deprecated in metadata
- Keep in codebase for backward compatibility
- Hide from editor UI
- Log deprecation warnings on usage

---

## AI Prompt Examples

### Pattern Selection Prompts

**Good prompts for AI to generate**:
- "Create an onboarding screen" → `ONB_HERO_TOP`
- "Showcase a product feature with image" → `FEAT_IMAGE_TEXT_RIGHT` or `FEAT_IMAGE_TEXT_LEFT`
- "Display pricing tiers" → `PRICING_TABLE`
- "Show customer testimonials" → `TESTIMONIAL_CARD_GRID`
- "Create a newsletter signup form" → `NEWSLETTER_SIGNUP`
- "Build a dashboard overview" → `DASHBOARD_OVERVIEW`
- "Show product details page" → `PRODUCT_DETAIL`

**Prompt enhancement hints**:
- "Spacious layout" → Use variant 4
- "Compact design" → Use variant 3
- "Premium feel" → Use variant 4 with generous spacing
- "Mobile-first" → Prioritize mobile responsive breakpoints

---

## Pattern Compatibility Matrix

### Vibe Compatibility

| Pattern Family | Playful | Professional | Bold | Minimal | Modern | Retro |
|---------------|---------|--------------|------|---------|--------|-------|
| ONB_HERO_TOP | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| FEAT_IMAGE_TEXT_* | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CTA_SPLIT_SCREEN | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| HERO_CENTER_TEXT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| NEWSLETTER_SIGNUP | ✓ | ✓ | | ✓ | ✓ | |
| PRICING_TABLE | | ✓ | ✓ | ✓ | ✓ | |
| TESTIMONIAL_CARD_GRID | ✓ | ✓ | | ✓ | ✓ | |
| DEMO_DEVICE_FULLBLEED | | ✓ | ✓ | ✓ | ✓ | |
| ACT_FORM_MINIMAL | | ✓ | | ✓ | ✓ | |
| DASHBOARD_OVERVIEW | | ✓ | | ✓ | ✓ | |
| PRODUCT_DETAIL | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Domain Compatibility

- **Common patterns**: Work for all domains
- **E-commerce**: `PRODUCT_DETAIL` + common patterns
- **SaaS**: `DASHBOARD_OVERVIEW` + common patterns
- **Mobile App**: `DEMO_DEVICE_FULLBLEED` + common patterns

---

## Conclusion

This taxonomy provides a systematic approach to:
- **AI pattern selection**: Clear heuristics for choosing patterns
- **Editor UX**: Structured presentation of pattern options
- **QA testing**: Comprehensive test coverage matrix

The pattern system is designed to be:
- **Deterministic**: Fixed structure, no runtime variation
- **Validated**: All patterns Zod-validated
- **Documented**: Clear metadata and taxonomy
- **Testable**: Systematic test coverage

For implementation details, see:
- `lib/patterns/README.md` - Technical documentation
- `lib/patterns/schema.ts` - Zod validation schema
- `lib/patterns/metadata.ts` - Pattern family metadata
- `lib/patterns/validator.ts` - DSL contract validation

