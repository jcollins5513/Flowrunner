# FlowRunner — Master Plan  
### AI–Art–Directed, Multi-Screen UI Flow Generator

FlowRunner is a next-generation, AI-driven visual UI composer.  
It transforms a natural-language prompt into a **multi-screen, fully illustrated, themed UI flow**, powered by:

- AI-generated hero images
- Reusable image library
- Layout pattern families with deterministic variants
- A Zod-validated DSL
- A real React renderer
- Editable UI like MagicPath
- Flow navigation creation by clicking real components
- Image editing via Nano-Banana
- Full community content sharing
- Export to Figma
- Export to Cursor for building real apps

FlowRunner is not a template generator.  
It is a **visual design engine** that uses AI imagery as the primary driver of UI design.

---

# 1. Core Concept

FlowRunner does the opposite of typical UI generators:

- It does **not** generate boxes and placeholders.  
- It does **not** rely on static UI templates.  

Instead:

**FlowRunner generates UI screens where the visual identity comes from AI-generated hero images, and the layout adapts to the images.**

Every screen:

1. Has an AI-generated hero image (with metadata).  
2. Has a theme and palette extracted from imagery.  
3. Uses a deterministic pattern + variant.  
4. Integrates animations, overlays, and vibe.  
5. Is editable at every layer: imagery, text, layout, palette.  
6. Is part of a multi-screen flow that evolves from user interactions.

---

# 2. System Goals

FlowRunner must:

- Produce visually rich, illustrated, branded screens.
- Allow the user to visually explore flows.
- Let the user click UI components to continue generating new screens.
- Allow editing every screen (like MagicPath).
- Allow editing images with Nano-Banana.
- Save all generated images to a reusable library.
- Allow selecting images from the library when generating new screens.
- Allow the public to share and remix flows in the community gallery.
- Connect with Figma for export.
- Connect with Cursor to turn designs into buildable interfaces.
- Ensure all output is stable, consistent, validated, and renderable.

---

# 3. High-Level Architecture

FlowRunner is composed of five major systems:

## 3.1 Prompt Interpreter
Extracts:
- Domain
- Style cues
- Visual themes
- Tone
- Color mood
- User intent

## 3.2 Flow Composer
Builds multi-screen flows using fixed templates.

## 3.3 Image System
Generates all hero and supporting images.  
Includes:
- Reusable image library
- Metadata tagging
- Palette extraction
- Vibe inference
- Nano-Banana editing

## 3.4 DSL Generator (Strict + Creative)
Builds a Zod-validated DSL document representing each screen.

## 3.5 React Renderer
Renders screens from DSL exactly and predictably.

---

# 4. Deterministic Pipeline

FlowRunner uses a strict pipeline to ensure consistent outputs.

1. **Prompt Intake → Intent Object**
2. **Domain → Flow Template**
3. **Template → Screen Sequence**
4. **Screen → Pattern Family**
5. **Pattern → Variant (5 per family)**
6. **Generate Hero Image**
7. **Extract Palette & Vibe**
8. **Fill Components with Creative Text**
9. **Assemble DSL**
10. **Validate via Zod**
11. **Persist Revision**
12. **Render UI**

Every execution follows this pipeline.

---

# 5. Screen-Level Architecture

Each screen includes:

- `hero_image` (AI-generated)
- `supporting_images` (optional)
- `palette` (primary/secondary/accent/background)
- `vibe` (stylistic descriptor)
- `pattern_family`
- `pattern_variant`
- `components` (title, subtitle, buttons, etc.)
- `animations`
- `navigation` (optional links for flow)
- `metadata` (tags, visual descriptors, etc.)

Everything must be reproducible and referencable.

---

# 6. AI Hero Image System

Hero images are the **centerpiece** of FlowRunner.

### FlowRunner must:
- Generate a creative hero image for every screen.  
- Generate images in a consistent style for multi-screen flows.  
- Store images in the library with full metadata.  
- Allow user to reuse any previously generated image.  
- Allow user to upload images.
- Allow editing via Nano-Banana.

### Metadata stored:
- prompt
- seed
- aspect ratio
- style (3D, clay, vector, neon, editorial, etc.)
- extracted palette
- vibe
- pattern-compatibility tags

---

# 7. Reusable Image Library

Every generated image must be saved into a persistent, searchable library.

The library supports:

- Browsing images
- Filtering by palette, vibe, style, tags, domain, pattern family
- Selecting images for new screens
- Saving favorites
- Uploading images
- Viewing versions (edited via Nano-Banana)
- Community image import

The library is a first-class feature, not an afterthought.

---

# 8. Nano-Banana Image Editing

Nano-Banana is the integrated image editor.

It supports:
- Prompt-based edits  
- Masking  
- Add/remove object  
- Style transformation  
- Palette harmonization  
- Negative-space adjustments  
- Background redrawing  
- Aspect ratio fixes  

Edited images become **new entries** in the image library.

---

# 9. Layout Pattern System ✅

FlowRunner uses:

- **12 pattern families**
- **5 variants per family**

Examples:
- ONB_HERO_TOP  
- FEAT_IMAGE_TEXT_RIGHT  
- DEMO_DEVICE_FULLBLEED  
- ACT_FORM_MINIMAL  

All patterns:
- Have fixed structure  
- Define component slots  
- Enforce layout rules  
- Are JSON-defined  
- Must be Zod-validated  
- ✅ Validation integrated into DSL persistence + renderer blocking paths  
- ✅ Preview metadata + automated smoke tests + telemetry per family/variant

Cursor must implement all pattern contracts.

---

# 10. MagicPath-Style Editable Screens

After a screen is generated, everything must be editable:

- Hero image → replace/edit with Nano-Banana  
- Text → rewrite  
- Layout → switch variant  
- Palette → regenerate  
- Vibe → modify  
- Components → reorder if allowed  
- Navigation → clickable, define next screen  
- Pattern → user can choose another variant

All edits must update:
- DSL  
- Renderer  
- Pattern contracts  
- Preview  
- Navigation map

---

# 11. Flow Navigation Builder  
(Click-through interface for flows)

Users can:

1. Click a button on the generated UI screen  
2. Choose **Generate Next Screen**  
3. Provide a prompt or rely on inferred context  
4. FlowRunner generates the next screen in sequence

This allows fully interactive, visual flow creation.

---

# 12. Community Gallery

Public gallery containing:
- Shared UI flows  
- Shared screens  
- Shared hero images  
- Prompt templates  
- Style packs  
- Remixable versions of everything  

Users can:
- Import any community flow
- Remix with new images/themes
- Publish their own flows

---

# 13. Exports

FlowRunner supports:

## 13.1 Export to Figma
- Full visual conversion to Figma JSON  
- Frames with images, text, and components  
- Components mapped to Figma elements  
- Palette and vibe preserved  

## 13.2 Export to Cursor
- Export DSL + Renderer + Assets  
- Cursor uses project rules to generate real dev components  

## 13.3 Export Screens
- PNG, JPG  
- JSON DSL  
- React component  

## 13.4 Export Flows
- Zipped bundles with all metadata

---

# 14. DSL (High-Level) ✅ (Complete)

DSL must include:

```ts
hero_image
supporting_images[]
palette
vibe
pattern_family
pattern_variant
components[]
navigation{}
animations{}
metadata{}
✅ Zod validation is mandatory and implemented.

15. Storage + Revision System ✅ (Foundation Complete)
Each generation is stored as a revision.

A revision includes:
DSL snapshot
Screens
Assets
Metadata
Pattern mappings
Palette & vibe data
✅ SQLite + Prisma implemented.

16. What Cursor Must Build
Cursor must build:
- ✅ DSL schemas (Complete: Types + Zod validation + tests)
- Pattern contract system
- ✅ Image metadata system (Database schema complete)
- Full flow-engine
- Renderer
- Editing layer
- Navigation layer
- Image library
- Community system (initial scaffolding)
- Export infrastructure
Cursor must never:

- Invent layout structures
- Add new components
- Add new DSL fields
- Skip hero images
- Replace images with gradients or placeholders