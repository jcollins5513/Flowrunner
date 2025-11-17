# Component Library Registry

This document tracks which components come from which libraries and how they're integrated into FlowRunner's renderer system.

## Component Library Architecture

FlowRunner uses a **multi-library approach** where components can be pulled from different sources:

1. **shadcn/ui** - Primary UI component library (copy-to-project, Tailwind-based)
2. **Radix UI Primitives** - Headless components for accessibility
3. **Custom Components** - FlowRunner-specific components
4. **Lucide React** - Icon library

---

## Component Mapping

### From shadcn/ui Library (`components/ui/`)

| Component | File | Usage in Renderer |
|-----------|------|-------------------|
| `Button` | `components/ui/button.tsx` | Used by `components/renderer/Button.tsx` |
| `Input` | `components/ui/input.tsx` | Used by `components/renderer/Form.tsx` |
| `Label` | `components/ui/label.tsx` | Used by `components/renderer/Form.tsx` |
| `Card` | `components/ui/card.tsx` | Used by `components/renderer/Form.tsx` |

**Adding More shadcn/ui Components:**
```bash
# Use shadcn CLI to add components
npx shadcn@latest add [component-name]
```

### From Radix UI Primitives

| Package | Purpose | Used In |
|---------|---------|---------|
| `@radix-ui/react-slot` | Polymorphic component wrapper | Button component |
| `@radix-ui/react-label` | Accessible label component | Form components |
| `@radix-ui/react-dialog` | Modal dialogs | (Future: Editor dialogs) |
| `@radix-ui/react-select` | Select dropdowns | (Future: Pattern selector) |

**Adding More Radix Primitives:**
```bash
npm install @radix-ui/react-[primitive-name]
```

### Custom Components (`components/renderer/`)

| Component | File | Notes |
|-----------|------|-------|
| `Title` | `components/renderer/Title.tsx` | Custom, uses shadcn/ui styling tokens |
| `Subtitle` | `components/renderer/Subtitle.tsx` | Custom, uses shadcn/ui styling tokens |
| `Text` | `components/renderer/Text.tsx` | Custom, uses shadcn/ui styling tokens |
| `HeroImage` | `components/renderer/HeroImage.tsx` | FlowRunner-specific, Next/Image wrapper |
| `Form` | `components/renderer/Form.tsx` | Uses shadcn/ui Card, Input, Label, Button |

---

## Component Factory Integration

The `lib/renderer/component-factory.tsx` routes DSL component types to the appropriate renderer:

```typescript
// Current routing:
'title' → components/renderer/Title.tsx (custom)
'subtitle' → components/renderer/Subtitle.tsx (custom)
'button' → components/renderer/Button.tsx → components/ui/button.tsx (shadcn/ui)
'form' → components/renderer/Form.tsx → components/ui/* (shadcn/ui)
'text' → components/renderer/Text.tsx (custom)
'image' → components/renderer/HeroImage.tsx (custom)
```

---

## Adding New Components

### Option 1: Add from shadcn/ui

```bash
# Install shadcn/ui component
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add select
# etc.
```

Then use it in renderer components or directly in component-factory.

### Option 2: Add from Radix UI

```bash
# Install Radix primitive
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tabs
# etc.
```

Then create wrapper component in `components/ui/` or use directly.

### Option 3: Add Custom Component

Create in `components/renderer/` following the pattern:
- Import utilities from `@/lib/utils` for `cn()` helper
- Use shadcn/ui CSS variables for consistent theming
- Follow existing component interface patterns

---

## Styling System

All components use:
- **Tailwind CSS** for utility classes
- **shadcn/ui CSS variables** for theming (defined in `app/globals.css`)
- **`cn()` utility** from `lib/utils.ts` for class merging

### CSS Variables Available

```css
--background
--foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--destructive / --destructive-foreground
--border
--input
--ring
--radius
```

---

## Component Variants

shadcn/ui components support variants via `class-variance-authority`:

### Button Variants
- `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`

Can be extended via DSL `props` field:
```typescript
{
  type: 'button',
  content: 'Click me',
  props: { variant: 'outline', size: 'lg' }
}
```

---

## Future Component Additions

Potential components to add:

**From shadcn/ui:**
- `Badge` - For tags, labels
- `Alert` - For notifications
- `Select` - For dropdowns
- `Tabs` - For tabbed interfaces
- `Dialog` - For modals
- `DropdownMenu` - For menus
- `Tooltip` - For hover hints
- `Separator` - For dividers

**From Radix UI:**
- `@radix-ui/react-tabs` - Tab components
- `@radix-ui/react-accordion` - Accordion components
- `@radix-ui/react-tooltip` - Tooltip primitives

**Custom:**
- Pricing tier cards (for PRICING_TABLE pattern)
- Testimonial cards (for TESTIMONIAL_CARD_GRID)
- Product cards (for PRODUCT_GRID)
- Navigation components (for NAV_HEADER_STICKY)

---

## Integration Guidelines

1. **Keep renderer components thin** - They should be wrappers that apply DSL props to library components
2. **Use `cn()` utility** - Always use `cn()` for className merging
3. **Respect palette/vibe** - Apply DSL palette and vibe styles via `style` prop or CSS variables
4. **Maintain accessibility** - Use Radix primitives for interactive components
5. **Document additions** - Update this file when adding new components

---

## Testing Component Libraries

Components should be tested to ensure:
- ✅ Library components render correctly
- ✅ DSL props map to component props correctly
- ✅ Styling (palette/vibe) applies correctly
- ✅ Responsive behavior works
- ✅ Accessibility features work

