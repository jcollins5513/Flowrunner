# Export Mapping & Snapshot Plan

## Goals
- Guarantee 1:1 translation from FlowRunner's DSL + pattern contracts to third-party destinations.
- Preserve palette, vibe, layout intent, and navigation metadata.
- Provide preview snapshots for triage (pattern QA, design reviews, export confirmations).

## Shared Inputs
- `ScreenDSL` object (hero/supporting images, palette, vibe, component array, navigation metadata).
- `PatternDefinition` (grid template, slot coordinates, spacing, responsive overrides).
- Component renderer catalog (`components/renderer/*`) for Cursor exports and snapshot generation.

---

## 1. Figma Export Mapping

### 1.1 File + Page Structure
| FlowRunner concept | Figma artifact |
| --- | --- |
| Flow | Figma file (or page) named `<flow-name> · FlowRunner` |
| Screen | Frame (Desktop preset 1440 × 1024). Each frame tagged with `pattern_family` + `pattern_variant` |
| Navigation | Frame metadata stored in `pluginData.navigation` (`{ type, target }`) |
| Palette | Global color styles: `Primary`, `Secondary`, `Accent`, `Background` |
| Vibe | Text style suffix (e.g., `Display / Modern`) + `pluginData.vibe` |

### 1.2 Layout Translation
1. Create root frame with Auto Layout disabled; set padding/gap from `pattern.spacing`.
2. Emulate CSS grid via nested auto-layout frames:
   - For each row in `pattern.layout.gridTemplate`, create an auto-layout frame containing column frames sized according to template fraction.
   - Place slot frames (`slot-${name}`) at the intersection defined by `positions[name]` (x,y,width,height) using absolute positioning within the row frame.
3. Responsive variants: store alternative positions in `pluginData.responsive` for later overrides.

### 1.3 Component Slot Mapping
| DSL component | Figma nodes |
| --- | --- |
| `title` | Text node `Heading / Display` with font weight `700`, fills `palette.primary` |
| `subtitle` | Text node `Heading / Subtitle` |
| `text` | Text node `Body / Base` |
| `button` | Auto-layout frame (`Button / Primary`) containing text + rectangle background using `palette.accent` |
| `form` | Auto-layout stack of input rectangles; each field becomes a nested frame (`label`, `input`) |
| `image` / `hero_image` | Rectangle with image fill referencing uploaded image. Store `hero_image.prompt` in `pluginData.imagePrompt` |

Pattern-specific slots (e.g., `supporting_image_0`) become Figma component instances named `Pattern / <family> / <slot>` to keep auditability.

### 1.4 Asset Handling
- Upload hero/supporting images via Figma REST `images.fill`. Cache mapping of FlowRunner asset IDs → Figma image hash.
- Register shared gradients for vibes requiring overlays (e.g., `bold`, `creative`).

### 1.5 Output Payload
```json
{
  "document": { "children": [/* frames per screen */] },
  "styles": {
    "colors": { /* palette */ },
    "text": { /* vibe styles */ }
  },
  "components": {
    "Pattern/ONB_HERO_TOP/hero_image": { /* slot template */ }
  }
}
```
This payload feeds either a Figma plugin (runs inside editor) or the REST `POST /v1/files/:key` file import when allowed.

---

## 2. Cursor Export Mapping

### 2.1 Artifacts
| FlowRunner concept | Cursor export |
| --- | --- |
| Flow | `flowrunner-export/flow.json` (top-level DSL) |
| Screen | `screens/<slug>.tsx` using `ScreenRenderer` + serialized DSL |
| Pattern definition | Linked JSON under `patterns/<family>/variant-<n>.json` |
| Assets | `/public/images/<asset-id>.jpg` |

### 2.2 Screen File Template
```tsx
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import screenDsl from '../dsl/onb-step-1.json'

export default function Screen() {
  return <ScreenRenderer dsl={screenDsl} />
}
```
- Cursor's project rules can swap `ScreenRenderer` with in-project components if desired.
- Buttons keep the expanded `onComponentClick` contract (type, component payload, slot + event context) so Cursor workflows can attach handlers automatically or replay click locations.

### 2.3 DSL Serialization
- Persist each `ScreenDSL` to `/dsl/screen-${id}.json`.
- Include `pattern_family`, `pattern_variant`, palette, vibe, hero/supporting images, navigation.
- Package metadata manifest: `{ version, generatedAt, paletteStyles }` to help Cursor apply theme tokens.

### 2.4 Command Summary
1. `npx flowrunner export cursor ./export/cursor` (future CLI) → writes DSL + screen components.
2. Cursor user imports folder; `ScreenRenderer` already references published patterns via `/api/patterns`. For offline portability include pattern JSON in bundle and override loader base path.

---

## 3. Snapshot Generation Plan

### Objectives
- Provide PNG previews per screen for QA, documentation, and export confirmation dialogs.
- Feed marketing/gallery plus Figma cover thumbnails.

### Pipeline
1. **Route**: use `/renderer-preview` (already deterministic). Accept query params `family`, `variant`, `paletteIndex`, `vibeIndex` (to be added) to force states.
2. **Playwright Spec**: create `tests/e2e/export-snapshots.spec.ts` that iterates desired permutations, uses `page.goto('/renderer-preview?...')`, waits for `ScreenRenderer` to load, then `expect(page).toHaveScreenshot('family-variant.png')`.
3. **Storage**: snapshots saved under `tests/e2e/renderer-preview.spec.ts-snapshots/` (existing structure) plus `public/snapshots/<family>/<variant>.png` for runtime preview.
4. **CI Hook**: extend `playwright.config.ts` with project `snapshots` that runs only on demand (`SNAPSHOTS=1 npx playwright test export-snapshots`).
5. **Consumption**: 
   - Figma plugin displays snapshot as placeholder while full frame builds.
   - Cursor export UI shows snapshot next to each screen entry.

### Telemetry & Versioning
- Include `pattern_hash` (hash of JSON) inside snapshot filename to catch drift.
- On mismatch (pattern updated but snapshot not), CLI warns: `Snapshot stale for ONB_HERO_TOP v3`.

---

## Next Implementation Tasks
1. Add query-param control to `/renderer-preview` for deterministic rendering.
2. Implement `lib/export/mapping.ts` to emit intermediary structures for both Figma + Cursor exports.
3. Build CLI wrapper under `scripts/export.ts` to orchestrate mapping + snapshot capture.
4. Connect documentation to `granular-plan.md` Phase 15 once implementation begins.
