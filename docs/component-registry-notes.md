# Component registry + selection notes

## Pipeline trace
- **Prompt intake**: `/app/api/flows/[flowId]/generate-first-screen/route.ts` and `lib/flows/next-screen-generator.ts` both call `runPromptToTemplatePipeline` to derive a `ScreenGenerationPlan`, then build a Screen DSL through `buildScreenDSLFromPlan`.
- **DSL assembly**: `buildScreenDSLFromPlan` loads the pattern definition and fills slots deterministically from the plan + hero image metadata. The renderer consumes this DSL directly; no dev-only shortcuts are used.
- **Rendering chain**: `components/renderer/ScreenRenderer.tsx` passes DSL components into `renderComponent` (`lib/renderer/component-factory.tsx`). When library components are enabled, `LibraryComponentRenderer` invokes `selectLibraryComponent` → `component-registry` → `loadComponentImplementation` so both dev and prod use the same selection logic.

## Safe vs advanced libraries
- **Safe components**: pulled from `components/ui` and `components/library/components`. These are the default for onboarding, pricing, and dashboard intents. Examples: `HeroHighlightDemo`, `TextGenerateEffect`, `Shadcn Primary Button`, `AuroraBackgroundDemo`.
- **Advanced components**: higher-impact MagicUI entries under `components/library/magic/components` (e.g., `AnimatedGradientTextDemo`, `WordRotateDemo`, `ShimmerButtonDemo`, `MagicCardDemo`).

## Registry shape (`lib/library/component-registry.ts`)
Every entry includes:
- `id`, `name`, `library`, `category` (`safe` | `advanced`), `role`, `type`, optional `screenTypes`, optional `formFactor`, and a `load` function that imports the real implementation.
- The registry is the single source of truth; there is no filesystem introspection.

## Selector rules (`lib/library/component-selector.ts`)
- Maps DSL component types to registry `type` buckets (`text`, `button`, `card`, `background`).
- Derives a category preference from vibe (`bold`/`energetic`/`playful` → `advanced`; otherwise `safe`) unless an explicit category is provided.
- Filters by role (derived from the slot), screenType, and formFactor, then prefers matching category with a safe fallback.

## How to add a component
1. Create/import the component under `components/ui`, `components/library/components`, or `components/library/magic/components`.
2. Add an explicit registry entry with `id`, `category` (`safe` vs `advanced`), `role` (`hero`, `cta`, `form`, etc.), `type` (`text`/`button`/`card`/`background`), and optional `screenTypes`/`formFactor`/`library`.
3. Expose the component via a `load` function that directly imports the desired export (no metadata files are required).
4. If a new role is introduced, update `normalizeSlotRole` in `component-selector` so slots map cleanly to registry roles.

## Current wiring answers
- **Is the registry populated with real components?** Yes—entries explicitly import safe Shadcn components and advanced MagicUI demos.
- **Is the selector using the registry?** Yes—`selectLibraryComponent` filters the static registry by type/role/category and never returns mock placeholders.
- **Is `library-component-renderer` wired to registry entries?** Yes—it calls the selector directly and loads the concrete implementation before rendering wrappers; there is no API indirection.
- **What prevented real components from being used?** Previously the renderer fetched API metadata and relied on filesystem-driven registry state; the new static registry + direct selector removes that dev-only shortcut so the production path is always used.
