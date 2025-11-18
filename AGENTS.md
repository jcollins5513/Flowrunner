# FlowRunner — Codex Instructions

## Project Overview

FlowRunner is an AI-driven visual UI composer that generates multi-screen, fully illustrated, themed UI flows. The system transforms natural-language prompts into complete UI screens powered by AI-generated hero images, reusable image libraries, layout pattern families, and a Zod-validated DSL.

**Core Principle**: FlowRunner generates UI screens where the visual identity comes from AI-generated hero images, and the layout adapts to the images—not the other way around.

---

## Critical Layout Requirements

### Container-Based Layout System

**ALWAYS use container-based layouts for all UI components and screens.**

1. **Container Wrappers**: All screen layouts must be wrapped in container elements with max-width constraints:
   - Use semantic container elements (`<div>`, `<section>`, `<main>`) with max-width classes or styles
   - Prefer Tailwind container utilities: `container`, `container-sm`, `container-md`, `container-lg`, `container-xl`
   - Apply `mx-auto` for centering containers
   - Example: `<div className="container mx-auto px-4">...</div>`

2. **Container Queries**: When implementing responsive layouts:
   - Use CSS Container Queries (`@container`) for component-level responsiveness
   - Define container context with `container-type: inline-size` or `container-type: size`
   - Use container query units (`cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, `cqmax`) for sizing within containers
   - Example: `@container (min-width: 768px) { ... }`

3. **Pattern Layout Structure**: All pattern layouts must:
   - Wrap the entire screen in a container element
   - Use container-based grid/flex layouts within the container
   - Never use full-width layouts without container constraints
   - Ensure hero images and components respect container boundaries

4. **Component-Level Containers**: Individual components should:
   - Be wrapped in their own container contexts when needed
   - Use container queries for internal responsive behavior
   - Maintain consistent spacing and padding within containers

**DO NOT**:
- Use full-width layouts without container wrappers
- Apply viewport-based units (`vw`, `vh`) without container constraints
- Create layouts that break container boundaries
- Use absolute positioning that escapes container bounds (unless explicitly required by pattern)

---

## Architecture Principles

### 1. Deterministic Pipeline

FlowRunner follows a strict, deterministic pipeline. Every implementation must respect this order:

1. Prompt Intake → Intent Object
2. Domain → Flow Template
3. Template → Screen Sequence
4. Screen → Pattern Family
5. Pattern → Variant (5 per family)
6. Generate Hero Image
7. Extract Palette & Vibe
8. Fill Components with Creative Text
9. Assemble DSL
10. Validate via Zod
11. Persist Revision
12. Render UI

**Never skip steps or change the order.**

### 2. Pattern System

- **12 pattern families** with **5 variants each** (60 total patterns)
- All patterns are JSON-defined in `lib/patterns/definitions/`
- Patterns must be Zod-validated before use
- Pattern contracts are fixed—do not invent new layout structures
- Pattern positions use grid coordinates (x, y, width, height)
- All patterns must support container-based layouts

### 3. DSL (Domain-Specific Language)

- DSL is Zod-validated—all schemas in `lib/dsl/`
- Required fields: `hero_image`, `palette`, `vibe`, `pattern_family`, `pattern_variant`, `components`
- Never add new DSL fields without updating schemas and validation
- All DSL documents must pass Zod validation before rendering

### 4. Image System

- Hero images are **mandatory** for every screen
- Never replace hero images with gradients or placeholders
- All images must be stored with metadata (prompt, seed, aspect ratio, style, palette, vibe)
- Image library is in `lib/db/` (Prisma + SQLite)
- Images must be reusable and searchable

### 5. React Renderer

- Renderer is in `components/renderer/`
- `ScreenRenderer.tsx` is the main renderer component
- `PatternLayout.tsx` applies pattern definitions
- All components must respect container-based layouts
- Components are in `components/renderer/` (Button, Title, Subtitle, HeroImage, etc.)

---

## Code Standards

### TypeScript

- Use strict TypeScript—all types must be defined
- Import types from `lib/dsl/types.ts` and `types/` directory
- Use Zod schemas for runtime validation
- Never use `any` types

### React

- Use functional components with hooks
- Prefer `useMemo` and `useCallback` for expensive operations
- Use React 18+ features (Suspense, concurrent rendering)
- All components must be container-aware

### Styling

- Use Tailwind CSS for utility classes
- Apply container-based layout classes
- Use CSS variables for palette colors (defined in `app/globals.css`)
- Support dark mode via `.dark` class
- Use container queries for responsive design

### File Structure

- DSL schemas: `lib/dsl/`
- Pattern definitions: `lib/patterns/definitions/`
- Renderer components: `components/renderer/`
- UI components: `components/ui/`
- Database: `lib/db/` (Prisma)
- Types: `types/`

---

## What to Build

### ✅ Completed

- DSL schemas with Zod validation
- Pattern definition system (12 families × 5 variants)
- Image metadata database schema
- Basic renderer infrastructure
- Pattern layout system

### 🚧 In Progress / To Build

- Full flow-engine (multi-screen flow generation)
- Complete editing layer (MagicPath-style)
- Navigation layer (click-through flow creation)
- Image library UI and search
- Community system (sharing, remixing)
- Export infrastructure (Figma, Cursor)
- Nano-Banana image editing integration

---

## What NOT to Do

**NEVER**:
- Invent new layout structures (use existing patterns only)
- Add new components without updating component library
- Add new DSL fields without schema updates
- Skip hero images (they are mandatory)
- Replace images with gradients or placeholders
- Break the deterministic pipeline
- Use full-width layouts without containers
- Create layouts that ignore container constraints

---

## Testing Requirements

- All DSL schemas must have validation tests
- Pattern definitions must be validated
- Renderer components must be tested
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Test files in `tests/` directory

---

## Database

- Prisma ORM with SQLite
- Schema in `prisma/schema.prisma`
- Database client in `lib/db/client.ts`
- All revisions must be stored with full metadata

---

## Pattern Families

The 12 pattern families are:
1. `ONB_HERO_TOP` - Onboarding hero top
2. `FEAT_IMAGE_TEXT_RIGHT` - Feature image text right
3. `FEAT_IMAGE_TEXT_LEFT` - Feature image text left
4. `DEMO_DEVICE_FULLBLEED` - Demo device full bleed
5. `ACT_FORM_MINIMAL` - Action form minimal
6. `HERO_CENTER_TEXT` - Hero center text
7. `NEWSLETTER_SIGNUP` - Newsletter signup
8. `PRICING_TABLE` - Pricing table
9. `PRODUCT_DETAIL` - Product detail
10. `TESTIMONIAL_CARD_GRID` - Testimonial card grid
11. `DASHBOARD_OVERVIEW` - Dashboard overview
12. `CTA_SPLIT_SCREEN` - CTA split screen

Each family has 5 variants. All variants are JSON files in `lib/patterns/definitions/{FAMILY}/variant-{1-5}.json`.

---

## Key Files to Reference

- `master-plan.md` - High-level project roadmap (DO NOT MODIFY)
- `granular-plan.md` - Detailed task breakdown
- `lib/dsl/schemas.ts` - Zod validation schemas
- `lib/patterns/schema.ts` - Pattern definition schema
- `components/renderer/ScreenRenderer.tsx` - Main renderer
- `lib/renderer/pattern-layout.tsx` - Pattern layout application

---

## Working Agreements

- Always run `npm test` after modifying code
- Run `npm run lint` before committing
- Update `granular-plan.md` when completing tasks (check off items)
- Never modify `master-plan.md` unless explicitly instructed
- Always use container-based layouts for UI
- Validate all DSL documents with Zod before rendering
- Store all generated images with full metadata
- Follow the deterministic pipeline strictly

---

## Questions?

When in doubt:
1. Check `master-plan.md` for high-level guidance
2. Review existing pattern definitions for examples
3. Look at `components/renderer/` for renderer patterns
4. Ensure container-based layouts are used
5. Validate with Zod schemas

