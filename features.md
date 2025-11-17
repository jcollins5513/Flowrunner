
# FlowRunner — Features

## 1. AI Image Generation
- Hero image generation for every screen
- Creative composition modes
- Style controls (3D, clay, neon, editorial, vector)
- Supporting images per pattern
- Negative-space awareness

## 2. Reusable Image Library
- Persistent image catalog
- Full metadata indexing
- Filtering by style, palette, vibe, domain
- User-uploaded images
- User favorites
- Version history for edited images
- Compatible images auto-suggested during screen creation

## 3. Nano-Banana Image Editing
- Prompt-based image edits
- Masking and selective edits
- Background rewrite
- Add/remove elements
- Style transfer
- Palette harmonization
- Regenerate variants

## 4. Pattern System
- 12 layout pattern families
- 5 variants per family
- JSON-defined pattern contracts
- Fixed slot structure
- Deterministic layout rules
- Zod-validated constraints

## 5. Multi-Screen Flow Generation
- Domain-based flow templates
- Flow-level theme consistency
- Reuse hero images across multiple screens
- Flow-level palette cohesion
- Automatic navigation wiring

## 6. MagicPath-Style Full Editability
- Component-level editing
- Layout variant switching
- Hero image swapping
- Palette & vibe editing
- Re-render live previews
- Instant pattern reload
- Full round-trip updates

## 7. Flow Navigation Builder
- Click a button → generate next screen
- Visual navigation diagram
- Reorder screens
- Add branching flows
- Edit navigation links

## 8. Community Gallery
- Shared flows
- Shared screens
- Shared hero images
- Remix/import
- Tags, search, filters

## 9. Export Ecosystem
### To Figma
- Frames, layers, components
- Auto-layout compatible
- Preserves palette and vibe

### To Cursor
- DSL + React component export
- Cursor uses project rules to build real apps

### Others
- PNG/JPG screen exports
- DSL JSON export
- Full-flow zip export

## 10. Persistence Layer
- SQLite + Prisma
- Flow → revision → screen → asset model
- Version history for flows and images

## 11. Renderer
- React renderer with 1:1 DSL parity
- Pattern-driven layouts
- Theme-driven styling
- Hero-image-based color application

## 12. Strict Validation
- Zod validation for every DSL output
- Pattern contract enforcement
- Component type enforcement
