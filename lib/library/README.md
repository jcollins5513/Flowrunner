# Library Component Integration

This system integrates components from Magic UI, Aceternity, and the component library into FlowRunner's renderer. Components are automatically selected based on vibe, pattern, and context, with graceful fallback to default components.

## Architecture

### Core Components

1. **Component Registry** (`component-registry.ts`)
   - Loads and indexes all library components from metadata files
   - Provides fast lookup by type, slot, vibe, and pattern
   - Caches component metadata for performance

2. **Component Selector** (`component-selector.ts`)
   - Intelligently selects library components based on:
     - DSL component type (title, button, etc.)
     - Vibe (energetic → animated-gradient-text)
     - Pattern family (HERO_CENTER_TEXT → hero-highlight)
     - Slot position (hero.background → background-beams)

3. **Component Loader** (`component-loader.ts`)
   - Dynamically loads React components from library files
   - Handles different export patterns
   - Caches loaded components

4. **Feature Gating** (`feature-gate.ts`)
   - Checks user access to library components (paid feature)
   - Placeholder implementation - connect to subscription system
   - Returns `false` by default until subscription system is connected

5. **Component Wrappers** (`wrappers/`)
   - Wrap library components to integrate with DSL
   - Apply FlowRunner palette and vibe
   - Handle errors gracefully with fallback

6. **Component Factory Integration** (`lib/renderer/component-factory.tsx`)
   - Enhanced to support library components
   - Automatically selects and renders library components when available
   - Falls back to default components if library component unavailable

7. **Background Effects** (`components/renderer/ScreenRenderer.tsx`)
   - Renders background components (hero-highlight, background-beams, etc.)
   - Applied as background layer with proper z-indexing

## Usage

### Automatic Selection

Library components are automatically selected based on context:

```typescript
// In ScreenRenderer, library context is passed automatically
<ScreenRenderer
  dsl={screenDSL}
  userId={userId}
  enableLibraryComponents={true}
/>
```

### Explicit Selection

Components can explicitly specify a library component:

```typescript
const component: Component = {
  type: 'title',
  content: 'Welcome',
  props: {
    libraryComponent: 'animated-gradient-text', // Explicit selection
    // or
    libraryComponent: 'magic/animated-gradient-text', // With source
  }
}
```

## Component Selection Rules

### Text Components (title, subtitle, text)
- `energetic` → `animated-gradient-text`, `animated-shiny-text`
- `playful` → `morphing-text`, `word-rotate`
- `professional` → `text-reveal`, `line-shadow-text`
- `tech` → `typing-animation`, `sparkles-text`

### Button Components
- `playful` → `rainbow-button`, `ripple-button`
- `modern` → `shimmer-button`, `moving-border`
- `energetic` → `border-beam`

### Card Components
- Forms → `magic-card`
- Feature cards → `3d-card-effect`, `glare-card`, `comet-card`

### Background Components
- Hero sections → `hero-highlight`, `background-beams`, `aurora-background`
- Sections → `background-gradient`, `wavy-background`, `meteors`

## Feature Gating

Library components are a paid feature. The system checks access via:

```typescript
import { canUseLibraryComponents } from '@/lib/library/feature-gate'

const hasAccess = await canUseLibraryComponents(userId)
```

**Current Implementation:**
- Returns `false` by default (no access)
- Can be overridden for testing: `ENABLE_LIBRARY_COMPONENTS=true`
- TODO: Connect to subscription system

## Known Limitations

1. **Registry Directory**: Many components import from `@/registry/magicui/...` which doesn't exist yet. Components will fail to load until registry is set up or components are extracted from demos.

2. **Component Extraction**: Demo components wrap actual components. The loader attempts to extract them, but some may need manual setup.

3. **Import Paths**: Component imports may need adjustment based on your project structure.

## Future Enhancements

1. Set up registry directory with actual component implementations
2. Extract components from demo wrappers automatically
3. Connect feature gating to subscription system
4. Add component preview/selection UI
5. Support component props customization
6. Add component usage analytics

## Testing

To test library components:

1. Set `ENABLE_LIBRARY_COMPONENTS=true` in environment
2. Or modify `feature-gate.ts` to return `true` temporarily
3. Components will automatically be selected based on vibe/pattern
4. Check console for loading errors (expected until registry is set up)
