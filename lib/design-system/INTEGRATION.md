# Design System Integration

The design system has been integrated with FlowRunner's component rendering pipeline.

## Architecture

### Component Hierarchy

1. **Library Components** (MagicUI/Aceternity) - Premium, advanced tier
2. **Design System Components** - Base components with safe/advanced tiers
3. **Legacy Components** - Fallback (kept for backward compatibility)

### Rendering Flow

```
DSL Component
  ↓
Library Component Renderer (if enabled & available)
  ↓ (fallback)
Design System Adapter (safe/advanced tier)
  ↓ (fallback)
Legacy Component
```

## Design System Components

### Base Components
- `Button` - Base button with variants
- `SafeButton` - Secondary variant (safe tier)
- `AdvancedButton` - Primary variant with gradient (advanced tier)
- `Card` - Card container
- `Surface` - Glassmorphism surface
- `Icon` - Lucide React icon wrapper
- `Background` - Animated background variants

### Radix Primitives
- `Dialog` - Modal dialogs
- `Select` - Dropdown selects
- `Tabs` - Tab navigation
- `Checkbox` - Checkbox input
- `RadioGroup` - Radio button groups
- `ScrollArea` - Scrollable containers
- `HoverCard` - Hover tooltips
- `Label` - Form labels

### Adapters

Adapters bridge DSL components to design system components:

- `ButtonAdapter` - Maps DSL button props to design system Button
- `TitleAdapter` - Maps DSL title to design system styling
- `SubtitleAdapter` - Maps DSL subtitle to design system styling
- `TextAdapter` - Maps DSL text to design system styling

## Integration Points

### Component Factory (`lib/renderer/component-factory.tsx`)

The component factory now:
1. Tries library components first (if enabled)
2. Falls back to design system adapters
3. Uses legacy components as final fallback

### Tier System

- **Safe Tier**: Uses `SafeButton`, basic styling
- **Advanced Tier**: Uses `AdvancedButton`, gradient effects, enhanced styling

The tier is determined by:
- `libraryContext.tierPreference` (from vibe analysis)
- Defaults to "safe" if not specified

## Usage

### In Component Factory

```tsx
// Design system adapter is used as default render
<ButtonAdapter
  content={component.content}
  variant={dsVariant}
  size={dsSize}
  icon={buttonIcon}
  tier={libraryContext.tierPreference || "safe"}
/>
```

### Direct Usage

```tsx
import { SafeButton, AdvancedButton, Icon } from '@/lib/design-system';

// Safe tier
<SafeButton onClick={handleClick}>Click me</SafeButton>

// Advanced tier
<AdvancedButton onClick={handleClick}>Click me</AdvancedButton>

// With icon
<SafeButton iconLeft={<Icon name="Plus" />}>Add</SafeButton>
```

### From Registry

```tsx
import { designSystemRegistry } from '@/lib/design-system';

const SafeButton = designSystemRegistry.safe.button;
const AdvancedButton = designSystemRegistry.advanced.button;
```

## Design Tokens

Design tokens are available in `lib/design-system/tokens.ts`:

- Colors (primary, secondary, accent)
- Shadows (card, button, buttonHover)
- Spacing (xs, sm, md, lg, xl)
- Border radius (sm, md, lg, xl, full)

## Styling

All design system components use:
- Dark theme (slate-900/950 backgrounds)
- Glassmorphism effects (backdrop-blur, transparency)
- Purple/pink gradient accents
- Consistent spacing and typography

## Future Enhancements

1. Add more component adapters (Form, Image, etc.)
2. Create design system variants for advanced components
3. Add theme customization
4. Integrate with palette system for dynamic colors

