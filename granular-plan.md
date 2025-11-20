# FlowRunner — Granular Plan
### Detailed Task Breakdown from Master Plan

This document breaks down the master-plan.md into actionable, step-by-step tasks with logical ordering, dependencies, and technical considerations.

---

## Phase 1: Foundation & Setup

### 1.1 Project Initialization
- [x] Initialize Node.js/TypeScript project structure
- [x] Set up package.json with dependencies (React, Zod, Prisma, etc.)
- [x] Configure TypeScript with strict mode
- [x] Set up build tooling (Vite/Next.js/Webpack)
- [x] Create directory structure (src/, lib/, types/, etc.)
- [x] Set up ESLint and Prettier
- [ ] Initialize Git repository
- [x] Create .env.example for environment variables
- [x] Set up testing framework (Vitest/Jest)

**Technical Notes:**
- Choose framework: Next.js recommended for SSR/SSG capabilities
- Ensure TypeScript strict mode for type safety
- Set up path aliases for clean imports

---

### 1.2 Database Setup
- [x] Initialize SQLite database
- [x] Set up Prisma ORM
- [x] Design initial schema (will expand in later phases)
  - [x] User model (if auth needed)
  - [x] Flow model
  - [x] Screen model
  - [x] Image model
  - [x] Revision model
- [x] Create Prisma migrations
- [x] Set up database connection utilities
- [ ] Create seed script for development data

**Technical Notes:**
- SQLite for local development, PostgreSQL for production
- Use Prisma migrations for schema versioning
- Design schema to support revision tracking from the start

---

## Phase 2: Core Data Models & Schemas

### 2.1 DSL Schema Definition
- [x] Define TypeScript interfaces for DSL structure
  - [x] HeroImage type
  - [x] SupportingImages array type
  - [x] Palette type (primary/secondary/accent/background)
  - [x] Vibe type (string enum or union)
  - [x] PatternFamily type (enum of 12 families)
  - [x] PatternVariant type (1-5 per family)
  - [x] Components array type
  - [x] Navigation object type
  - [x] Animations object type
  - [x] Metadata object type
- [x] Create Zod schemas for DSL validation
  - [x] ScreenDSL schema
  - [x] FlowDSL schema
  - [x] Component schemas (title, subtitle, button, etc.)
- [x] Add validation error handling
- [x] Create DSL type exports
- [x] Write unit tests for schema validation

**Technical Notes:**
- Zod schemas must match TypeScript types exactly
- Include helpful error messages for validation failures
- Support partial DSL for incremental updates

---

### 2.2 Screen Data Model
- [x] Create Screen entity in Prisma schema
  - [x] id, flowId, revisionId
  - [x] heroImageId (relation)
  - [x] supportingImageIds (array)
  - [x] palette (JSON)
  - [x] vibe (string)
  - [x] patternFamily (enum)
  - [x] patternVariant (int 1-5)
  - [x] components (JSON)
  - [x] navigation (JSON)
  - [x] animations (JSON)
  - [x] metadata (JSON)
  - [x] createdAt, updatedAt
- [x] Create Flow entity in Prisma schema
  - [x] id, userId
  - [x] name, description
  - [x] domain (enum)
  - [x] theme, style
  - [x] screenIds (relation)
  - [x] isPublic (boolean)
  - [x] createdAt, updatedAt
- [x] Create Revision entity in Prisma schema
  - [x] id, flowId, screenId
  - [x] dslSnapshot (JSON)
  - [x] version (int)
  - [x] createdAt
- [x] Run Prisma migrations
- [x] Create Prisma client utilities
- [ ] Write repository functions for CRUD operations

**Technical Notes:**
- Use JSON fields for flexible component/navigation structures
- Ensure foreign key constraints for data integrity
- Add indexes for common queries (flowId, userId, etc.)

---

### 2.3 Image Metadata Model
- [x] Create Image entity in Prisma schema
  - [x] id, userId
  - [x] url (storage path)
  - [x] prompt (string)
  - [x] seed (int, nullable)
  - [x] aspectRatio (string)
  - [x] style (enum: 3D, clay, vector, neon, editorial, etc.)
  - [x] extractedPalette (JSON)
  - [x] vibe (string)
  - [x] patternCompatibilityTags (array)
  - [x] domain (string, nullable)
  - [x] isPublic (boolean)
  - [x] parentImageId (for edited versions)
  - [x] createdAt, updatedAt
- [ ] Create ImageVersion entity for Nano-Banana edits
  - [ ] id, imageId
  - [ ] editType (enum)
  - [ ] editPrompt (string)
  - [ ] url (new edited image)
  - [ ] createdAt
- [ ] Add image storage utilities (local/S3)
- [ ] Create image metadata extraction functions
- [ ] Write repository functions for image operations

**Technical Notes:**
- Store images in cloud storage (S3/Cloudinary) for production
- Implement image optimization/compression
- Track version history for edited images

---

## Phase 3: Pattern System

### 3.1 Pattern Family Definitions
- [x] Define fixed pattern family registry (40+ families across commons + domain-specific)
  - [x] ONB_HERO_TOP, FEAT_IMAGE_TEXT_RIGHT, DEMO_DEVICE_FULLBLEED, ACT_FORM_MINIMAL, etc.
- [x] Create pattern family metadata
  - [x] Display name
  - [x] Description
  - [x] Use cases
  - [x] Component slot definitions
- [x] Publish registry/constants for DSL + renderer (non user-extensible)
- [x] Document taxonomy for AI + editor UX + QA playbook
- [x] **Testing:** add snapshot/unit tests to ensure metadata exports stay stable and catch accidental renames/removals.

**Technical Notes:**
- Families are the canonical contract between DSL, renderer, AI planner, and validation.
- Metadata feeds pattern selection UI, compatibility scoring, and docs.

---

### 3.2 Pattern Variant System
- [x] Define JSON pattern format (layout positions, spacing, responsive, image placement)
- [x] Implement pattern contract validator + compatibility checker
- [x] Build loader + API delivery (`/api/patterns/[family]/variant-[variant]`)
- [x] Author baseline pattern sets for renderer validation
  - [x] ONB_HERO_TOP (5 variants)
  - [x] FEAT_IMAGE_TEXT_RIGHT (5 variants)
  - [x] CTA_SPLIT_SCREEN (5 variants)
  - [x] HERO_CENTER_TEXT (5 variants)
- [x] Expand remaining families after renderer QA
  - [x] DEMO_DEVICE_FULLBLEED (5 variants)
  - [x] ACT_FORM_MINIMAL (5 variants)
  - [x] DASHBOARD_OVERVIEW (5 variants)
  - [x] PRODUCT_DETAIL (5 variants)
  - [x] FEAT_IMAGE_TEXT_LEFT (5 variants)
  - [x] NEWSLETTER_SIGNUP (5 variants)
  - [x] PRICING_TABLE (5 variants)
  - [x] TESTIMONIAL_CARD_GRID (5 variants)
  - [x] Goal: ≥12 families × 5 variants once renderer parity verified (✅ 12 families × 5 variants = 60 patterns)
- [x] Generate preview metadata (rendered thumbnails, tags) for UI
- [x] Build automated pattern smoke tests:
  - [x] Validate every JSON against schema + validator.
  - [x] Renderer regression suite (mount DSL fixture per variant, screenshot diff in CI before scaling to 200+ patterns).

**Execution Flow (new approach):**
1. Ship a minimal deterministic set (4 families) to unblock renderer.
2. Validate rendering + DSL pipeline end-to-end.
3. Iterate on spacing/responsiveness with real screens + gather feedback.
4. Scale to full library with tooling once renderer + tests are green.

---

### 3.3 Pattern Validation
- [x] Create Zod schema for pattern definitions (layout, spacing, responsive)
- [x] Validate pattern JSON files on load/ingest
- [x] Validate DSL against pattern contract (required slots, image rules)
- [x] Create pattern compatibility checker (vibe/style/palette heuristics)
- [x] Write tests for validation + compatibility
- [x] Add error messaging for invalid patterns
- [x] Integrate validation into DSL persistence + renderer blocking paths
- [x] Add telemetry for pattern load/validation failures
- [x] Add regression suite: iterate through every pattern, render canonical DSL, assert slot coverage + screenshot diff threshold.

**Technical Notes:**
- Validation runs before rendering and before assembling DSL in the flow engine.
- Compatibility scoring helps AI choose families that fit image/vibe constraints.

---

## Phase 4: Prompt Interpreter System

### 4.1 Intent Extraction
- [x] Set up AI/LLM integration (OpenAI/Anthropic)
- [x] Create prompt interpreter service
- [x] Implement domain extraction
  - [x] E-commerce, SaaS, Mobile App, etc.
- [x] Implement style cue extraction
  - [x] Modern, retro, minimal, bold, etc.
- [x] Implement visual theme extraction
- [x] Implement tone extraction
- [x] Implement color mood extraction
- [x] Create Intent object type
- [x] Add error handling for API failures
- [x] Implement caching for similar prompts

**Technical Notes:**
- Use structured output from LLM for consistent parsing
- Fallback to defaults if extraction fails
- Consider prompt engineering for better results
- [x] Testing: record representative prompts/responses (VCR) and assert parser output shape so downstream stages don’t regress.

---

### 4.2 Flow Template System
- [x] Define flow template structure
- [x] Create flow templates for each domain
  - [x] E-commerce flow template
  - [x] SaaS onboarding template
  - [x] Mobile app template
  - [x] [Additional domain templates]
- [x] Implement template selector (Domain → Template)
- [x] Create template-to-screen-sequence mapper
- [x] Add template customization options
- [x] Store templates as JSON files
- [x] Create template loader utility

**Technical Notes:**
- Templates define screen sequence and flow structure
- Templates should be deterministic and reproducible

---

## Phase 5: Image Generation System

### 5.1 AI Image Generation Integration
- [x] Set up image generation API (DALL-E/Midjourney/Stable Diffusion)
- [x] Create image generation service
- [x] Implement hero image generation
  - [x] Accept prompt, style, aspect ratio
  - [x] Return image URL and metadata
- [x] Implement style parameter mapping
  - [x] 3D, clay, vector, neon, editorial styles
- [x] Implement aspect ratio handling
- [x] Add seed support for reproducibility
- [x] Implement retry logic for API failures
- [x] Add rate limiting and quota management
- [x] Create image generation queue system

**Technical Notes:**
- Choose image generation API based on quality/cost
- Store seeds for reproducible generations
- Implement async processing for long-running generations

---

### 5.2 Palette Extraction
- [x] Integrate color extraction library (color-thief/vibrant.js)
- [x] Create palette extraction service
- [x] Extract primary color from hero image
- [x] Extract secondary colors
- [x] Extract accent colors
- [x] Extract background color
- [x] Create palette harmonization algorithm
- [x] Store extracted palette in image metadata
- [x] Add palette validation (ensure contrast, accessibility)

**Technical Notes:**
- Palette extraction must be deterministic
- Consider color accessibility (WCAG contrast ratios)
- Support manual palette override
- [x] Testing: fixture images with known palettes; ensure extraction matches expectations and passes contrast checks.

---

### 5.3 Vibe Inference
- [x] Create vibe inference service
- [x] Analyze image characteristics
  - [x] Color saturation
  - [x] Composition style
  - [x] Visual weight
  - [x] Mood indicators
- [x] Map to vibe descriptors
  - [x] Playful, Professional, Bold, Minimal, etc.
- [x] Store vibe in image metadata
- [x] Allow manual vibe override
- [x] Create vibe-to-pattern compatibility mapping

**Technical Notes:**
- Vibe inference can use LLM or rule-based system
- Vibe helps determine compatible patterns

---

### 5.4 Image Storage & Management
- [ ] Set up image storage (local dev / S3 production)
- [ ] Create image upload service
- [ ] Implement image optimization
  - [ ] Compression
  - [ ] Format conversion (WebP)
  - [ ] Multiple sizes (thumbnails)
- [x] Create image retrieval service
- [ ] Implement image deletion (with safety checks)
- [x] Add image metadata persistence
- [ ] Create image URL generation utilities

**Technical Notes:**
- Use CDN for image delivery
- Implement proper image cleanup on deletion
- Support both generated and uploaded images
- ✅ Minimal persistence complete: repository service, API endpoints, orchestrator integration

---

## Phase 6: Reusable Image Library

### 6.1 Library Database Schema
- [ ] Extend Image model with library-specific fields
  - [ ] isFavorite (boolean)
  - [ ] tags (array)
  - [ ] usageCount (int)
- [ ] Create LibraryCollection entity (optional)
  - [ ] id, userId, name
  - [ ] imageIds (relation)
- [ ] Add indexes for search performance
- [ ] Run Prisma migrations

---

### 6.2 Library Search & Filter
- [ ] Create search service
  - [ ] Search by prompt text
  - [ ] Search by tags
  - [ ] Search by domain
- [ ] Create filter service
  - [ ] Filter by palette
  - [ ] Filter by vibe
  - [ ] Filter by style
  - [ ] Filter by pattern compatibility
  - [ ] Filter by date range
- [ ] Implement pagination
- [ ] Add sorting options (newest, most used, etc.)
- [ ] Create search/filter API endpoints
- [ ] Optimize database queries with proper indexes

**Technical Notes:**
- Use full-text search for prompt/tag searching
- Consider Elasticsearch for advanced search (future)

---

### 6.3 Library UI Components
- [ ] Create library browser component
- [ ] Create image grid/list view
- [ ] Create filter sidebar component
- [ ] Create search bar component
- [ ] Create image detail modal
- [ ] Create image selection interface
- [ ] Add favorite/unfavorite functionality
- [ ] Add image tagging UI
- [ ] Implement infinite scroll or pagination
- [ ] Add image preview on hover
- [ ] Create upload drag-and-drop interface

**Technical Notes:**
- Use virtual scrolling for large image lists
- Implement lazy loading for images
- Add keyboard navigation support

---

### 6.4 Image Selection Integration
- [ ] Create image picker component
- [ ] Integrate with screen generation flow
- [ ] Allow selecting from library during generation
- [ ] Show compatible images based on pattern
- [ ] Allow image replacement in editing mode
- [ ] Add "use this image" action in library
- [ ] Track image usage statistics

**Technical Notes:**
- Image selection should be seamless in generation flow
- Show image compatibility hints

---

## Phase 7: Nano-Banana Image Editing

### 7.1 Editing API Integration
- [ ] Research and integrate Nano-Banana API (or similar)
- [ ] Create image editing service wrapper
- [ ] Implement prompt-based edits
- [ ] Implement masking functionality
- [ ] Implement add/remove object
- [ ] Implement style transformation
- [ ] Implement palette harmonization
- [ ] Implement negative-space adjustments
- [ ] Implement background redrawing
- [ ] Implement aspect ratio fixes
- [ ] Add editing job queue system
- [ ] Handle editing callbacks/webhooks

**Technical Notes:**
- Editing may be async - implement polling or webhooks
- Store editing parameters for reproducibility
- Handle editing failures gracefully

---

### 7.2 Editing UI
- [ ] Create image editor component
- [ ] Add editing toolbar
- [ ] Implement prompt input for edits
- [ ] Create masking tool UI
- [ ] Add style transformation selector
- [ ] Create palette harmonization controls
- [ ] Add aspect ratio adjustment UI
- [ ] Create before/after comparison view
- [ ] Add edit history timeline
- [ ] Implement undo/redo for edits
- [ ] Add edit preview before applying

**Technical Notes:**
- Editing UI should be intuitive and responsive
- Show loading states during async edits
- Allow canceling in-progress edits

---

### 7.3 Edit Version Tracking
- [ ] Create version relationship in database
- [ ] Link edited images to parent images
- [ ] Store edit metadata (type, prompt, parameters)
- [ ] Create version history viewer
- [ ] Allow reverting to previous versions
- [ ] Implement version branching (multiple edits from same parent)
- [ ] Add version comparison UI

**Technical Notes:**
- Edited images become new library entries
- Maintain parent-child relationships
- Support multiple edit branches

---

## Phase 8: DSL Generator

### 8.1 Creative Text Generation
- [ ] Set up LLM for creative text generation
- [ ] Create text generation service
- [ ] Generate titles based on context
- [ ] Generate subtitles
- [ ] Generate button labels
- [ ] Generate form labels
- [ ] Generate body text
- [ ] Ensure text matches vibe and tone
- [ ] Add text length constraints
- [ ] Implement text caching for similar contexts

**Technical Notes:**
- Use same LLM provider as prompt interpreter
- Text should match screen context and flow theme
- Support multiple languages (future)
- [ ] Testing: snapshot DSL text fields for deterministic fixtures; enforce length constraints in unit tests.

---

### 8.2 DSL Assembly
- [ ] Create DSL assembler service
- [ ] Assemble hero_image from image metadata
- [ ] Assemble supporting_images array
- [ ] Assemble palette from extracted colors
- [ ] Add vibe from inference
- [ ] Add pattern_family and pattern_variant
- [ ] Assemble components array with generated text
- [ ] Build navigation object
- [ ] Add animations (default or inferred)
- [ ] Assemble metadata object
- [ ] Create complete ScreenDSL object
- [ ] Validate DSL against Zod schema
- [ ] Handle validation errors gracefully

**Technical Notes:**
- DSL assembly must follow deterministic pipeline
- All fields must be validated before proceeding
- Support partial DSL updates for editing
- [ ] Testing: integration tests from prompt → image → pattern → renderer to ensure round-trip before releasing new stages.

---

### 8.3 DSL Validation Layer
- [ ] Create validation service wrapper
- [ ] Validate complete DSL documents
- [ ] Validate partial DSL updates
- [ ] Provide detailed error messages
- [ ] Validate pattern compatibility
- [ ] Validate component types against pattern
- [ ] Validate palette format
- [ ] Create validation error formatter
- [ ] Add validation to API endpoints
- [ ] Write comprehensive validation tests

**Technical Notes:**
- Validation must catch all invalid states
- Error messages should guide users to fix issues

---

## Phase 9: React Renderer

### 9.1 Renderer Core
- [x] Create React renderer shell (`ScreenRenderer`)
- [x] Implement DSL-to-React transformer for core components (title/subtitle/button/text/image)
- [ ] Implement remaining component renderers (forms, supporting images, navigation affordances)
- [ ] Implement responsive layout system (respect pattern breakpoints)
- [ ] Add error boundaries + telemetry
- [ ] Create renderer utilities (palette/vibe styling extensions, hooks)
- [ ] Build `RendererPreview` internal tool to inspect pattern variants quickly
- [ ] Testing:
  - [ ] Jest/unit tests for component factory + palette/vibe utilities
  - [ ] Playwright visual regression per pattern family (CI gate)
  - [ ] Storybook/Chromatic coverage for manual QA across devices

**Technical Notes:**
- Renderer must match DSL exactly
- Use pattern definitions to determine layout
- Support SSR if using Next.js

---

### 9.2 Pattern Layout Renderer
- [x] Create pattern layout scaffolding + API loader
- [x] Apply pattern layout rules for grid; [ ] extend to flex patterns
- [ ] Handle responsive breakpoints (CSS + pattern config)
- [ ] Apply spacing + hero/supporting image placement precisely
- [ ] Render supporting images, overlays, animations
- [ ] Add layout debugging overlay (slot outlines, names)
- [ ] Testing: mount each pattern in CI, compare DOM structure + bounding boxes/screenshot diff.

**Technical Notes:**
- Layout must be pixel-perfect to pattern definition
- Support all 60 pattern variants
- Test each pattern variant rendering

---

### 9.3 Styling System
- [x] Initial palette/vibe utility
- [ ] Build theme provider hooking palette + typography tokens
- [ ] Apply palette to components (foreground/background/accent)
- [ ] Implement vibe-informed typography + spacing adjustments
- [ ] Create animation helpers for DSL `animations`
- [ ] Ensure accessibility (contrast tests, focus states)
- [ ] Create style utilities
- [ ] Testing: automated contrast checker + story-level visual tests; add CI job verifying WCAG thresholds.

**Technical Notes:**
- Styling must respect extracted palette
- Vibe should influence styling choices
- Ensure WCAG compliance

---

### 9.4 Image Rendering
- [x] Create optimized hero image component (Next/Image)
- [ ] Implement lazy loading
- [ ] Add image placeholder/skeleton
- [ ] Handle image loading errors
- [ ] Support different aspect ratios
- [ ] Implement image optimization (next/image or similar)
- [ ] Add image zoom/viewer (optional)

**Technical Notes:**
- Use optimized image formats (WebP)
- Implement proper loading states
- Handle broken image URLs gracefully
- [ ] Testing: verify Next/Image remote patterns cover AI domains; add fixtures for fallback logic.

---

## Phase 10: Flow Composer

### 10.1 Flow Engine Core
- [ ] Create flow engine service
- [ ] Implement flow creation
- [ ] Implement screen sequence management
- [ ] Handle flow-level theme consistency
- [ ] Implement flow-level palette cohesion
- [ ] Create flow navigation graph
- [ ] Add flow metadata management
- [ ] Implement flow cloning
- [ ] Add flow deletion (with safety checks)

**Technical Notes:**
- Flow engine coordinates all screens in a flow
- Maintain flow-level consistency across screens
- [ ] Testing: unit tests for flow-state mutations; integration tests using renderer mock to ensure DSL consistency.

---

### 10.2 Screen Sequence Management
- [ ] Create screen sequence data structure
- [ ] Implement screen ordering
- [ ] Add screen insertion at position
- [ ] Implement screen removal
- [ ] Handle screen reordering (drag-and-drop)
- [ ] Maintain screen relationships
- [ ] Update navigation links on reorder
- [ ] Validate screen sequence integrity

**Technical Notes:**
- Screen sequence must maintain navigation integrity
- Handle edge cases (first/last screen)
- [ ] Testing: automated tests verifying navigation graph updates + pattern compatibility after reordering/removal.

---

### 10.3 Flow-Level Consistency
- [ ] Implement theme consistency checker
- [ ] Ensure palette cohesion across screens
- [ ] Maintain style consistency
- [ ] Create flow-level style overrides
- [ ] Add flow theme editor
- [ ] Implement flow-wide updates
- [ ] Add consistency warnings

**Technical Notes:**
- Flow-level consistency improves user experience
- Allow overrides but warn about inconsistencies

---

## Phase 11: MagicPath-Style Editing

### 11.1 Editing Layer Architecture
- [ ] Create editing context provider
- [ ] Implement edit mode toggle
- [ ] Create editable component wrappers
- [ ] Add edit state management
- [ ] Implement edit history/undo system
- [ ] Create edit validation layer
- [ ] Add edit conflict resolution

**Technical Notes:**
- Editing should feel instant and responsive
- Support undo/redo for all edit types
- [ ] Testing: Playwright flows covering edit → render → export, ensuring validation errors block invalid states.

---

### 11.2 Component-Level Editing
- [ ] Create inline text editor
- [ ] Implement text editing (title, subtitle, body)
- [ ] Add button label editing
- [ ] Create form field editing
- [ ] Implement component reordering (if allowed by pattern)
- [ ] Add component deletion (if allowed)
- [ ] Create component addition (if allowed by pattern)
- [ ] Add component type switching
- [ ] Implement live preview updates

**Technical Notes:**
- Editing must respect pattern constraints
- Changes should update DSL immediately
- Show visual feedback during editing

---

### 11.3 Image Editing Integration
- [ ] Add "Replace Image" action
- [ ] Integrate image library picker
- [ ] Add "Edit with Nano-Banana" action
- [ ] Open Nano-Banana editor in modal
- [ ] Handle edited image replacement
- [ ] Update palette on image change
- [ ] Update vibe on image change
- [ ] Refresh preview after image update

**Technical Notes:**
- Image changes should trigger palette/vibe updates
- Seamless integration with image library

---

### 11.4 Layout & Pattern Editing
- [ ] Create pattern variant selector
- [ ] Implement variant switching
- [ ] Handle component migration between variants
- [ ] Validate component compatibility with new variant
- [ ] Update layout on variant change
- [ ] Add layout customization (spacing, alignment)
- [ ] Create pattern family selector
- [ ] Handle pattern family switching

**Technical Notes:**
- Pattern switching must preserve compatible components
- Warn about incompatible components
- Support partial component migration

---

### 11.5 Palette & Vibe Editing
- [ ] Create palette editor UI
- [ ] Allow manual color selection
- [ ] Implement color picker
- [ ] Add palette regeneration from image
- [ ] Create vibe selector
- [ ] Allow manual vibe override
- [ ] Update styling on palette/vibe change
- [ ] Add palette/vibe preview

**Technical Notes:**
- Palette changes should update all components
- Maintain color accessibility

---

### 11.6 Navigation Editing
- [ ] Create navigation editor
- [ ] Make components clickable in edit mode
- [ ] Add "Set as Navigation Target" action
- [ ] Create navigation link configuration
- [ ] Implement navigation removal
- [ ] Add navigation type selection (internal/external)
- [ ] Update navigation map on changes
- [ ] Visualize navigation in flow diagram

**Technical Notes:**
- Navigation editing is key to flow building
- Show visual feedback for clickable elements

---

### 11.7 Live Preview System
- [ ] Create preview renderer
- [ ] Implement real-time preview updates
- [ ] Add preview refresh on DSL changes
- [ ] Optimize preview performance
- [ ] Add preview error handling
- [ ] Create preview comparison (before/after)
- [ ] Implement preview export (screenshot)

**Technical Notes:**
- Preview must update instantly on edits
- Optimize to prevent lag with complex screens

---

## Phase 12: Flow Navigation Builder

### 12.1 Click-Through Interface
- [ ] Create interactive screen renderer
- [ ] Make navigation components clickable
- [ ] Add click detection on buttons/links
- [ ] Show click feedback/hover states
- [ ] Implement click-to-generate flow
- [ ] Create "Generate Next Screen" action menu
- [ ] Add context menu on component click
- [ ] Handle multiple navigation options

**Technical Notes:**
- Click detection must be accurate
- Support both explicit and inferred navigation
- [ ] Testing: E2E verifying “select button → generate next screen” round-trip pipeline.

---

### 12.2 Next Screen Generation
- [ ] Create next screen generator service
- [ ] Extract context from current screen
- [ ] Infer next screen intent from click
- [ ] Allow user prompt override
- [ ] Generate next screen using pipeline
- [ ] Link new screen to navigation
- [ ] Update flow navigation graph
- [ ] Add screen to flow sequence
- [ ] Show generation progress

**Technical Notes:**
- Context inference improves UX
- Allow manual prompt for control

---

### 12.3 Navigation Diagram
- [ ] Create flow visualization component
- [ ] Render screen nodes
- [ ] Render navigation arrows/links
- [ ] Implement interactive diagram
- [ ] Add screen selection in diagram
- [ ] Allow navigation editing in diagram
- [ ] Add zoom/pan controls
- [ ] Show screen thumbnails
- [ ] Highlight active screen
- [ ] Support branching flows

**Technical Notes:**
- Use a graph visualization library (D3, React Flow)
- Diagram should be interactive and informative

---

### 12.4 Flow Branching
- [ ] Support multiple navigation paths
- [ ] Create branch points in flow
- [ ] Handle conditional navigation
- [ ] Add branch labels/descriptions
- [ ] Visualize branches in diagram
- [ ] Allow branch deletion
- [ ] Implement branch merging
- [ ] Add branch testing/preview

**Technical Notes:**
- Branching enables complex user flows
- Support both linear and branched flows

---

## Phase 13: Revision System

### 13.1 Revision Tracking
- [ ] Extend Revision model with all required fields
- [ ] Implement revision creation on generation
- [ ] Store complete DSL snapshot
- [ ] Store screen state
- [ ] Store asset references
- [ ] Store pattern mappings
- [ ] Store palette & vibe data
- [ ] Add revision metadata (user, timestamp, change type)
- [ ] Implement revision numbering

**Technical Notes:**
- Every generation creates a new revision
- Revisions enable undo/redo and history

---

### 13.2 Revision History
- [ ] Create revision history viewer
- [ ] Display revision list with metadata
- [ ] Show revision diff/preview
- [ ] Implement revision comparison
- [ ] Add revision restoration
- [ ] Create revision timeline
- [ ] Add revision search/filter
- [ ] Implement revision branching

**Technical Notes:**
- Revision history is crucial for collaboration
- Support viewing and restoring any revision

---

### 13.3 Persistence Layer
- [ ] Create revision repository functions
- [ ] Implement revision saving
- [ ] Implement revision loading
- [ ] Add revision querying
- [ ] Implement revision deletion (with safety)
- [ ] Add revision cleanup (old revisions)
- [ ] Optimize revision storage
- [ ] Add revision export

**Technical Notes:**
- Revisions can grow large - implement cleanup strategy
- Optimize queries for performance

---

## Phase 14: Community Gallery

### 14.1 Sharing System
- [ ] Add sharing permissions to Flow model
- [ ] Implement flow publishing
- [ ] Create share link generation
- [ ] Add sharing settings UI
- [ ] Implement unsharing
- [ ] Add share analytics (views, remixes)
- [ ] Create share preview
- [ ] Add share expiration (optional)

**Technical Notes:**
- Sharing should be opt-in
- Support both public and link-based sharing

---

### 14.2 Gallery UI
- [ ] Create gallery page/component
- [ ] Implement gallery grid layout
- [ ] Add gallery filtering
  - [ ] By domain
  - [ ] By style
  - [ ] By popularity
  - [ ] By date
- [ ] Add gallery search
- [ ] Create flow detail view
- [ ] Add flow preview
- [ ] Implement pagination
- [ ] Add sorting options
- [ ] Create gallery categories

**Technical Notes:**
- Gallery should be discoverable and browsable
- Optimize for performance with many flows

---

### 14.3 Remix Functionality
- [ ] Create remix action
- [ ] Implement flow cloning for remix
- [ ] Allow image replacement in remix
- [ ] Allow theme modification in remix
- [ ] Track remix relationships
- [ ] Show remix chain/history
- [ ] Add remix attribution
- [ ] Create remix UI flow

**Technical Notes:**
- Remixing should be easy and intuitive
- Maintain attribution chain

---

### 14.4 Community Content Types
- [ ] Support sharing flows
- [ ] Support sharing individual screens
- [ ] Support sharing hero images
- [ ] Support sharing prompt templates
- [ ] Support sharing style packs
- [ ] Create content type filters
- [ ] Add content type badges
- [ ] Implement content type-specific views

**Technical Notes:**
- Different content types need different sharing UIs
- Style packs could be reusable theme configurations

---

## Phase 15: Export System

### 15.1 Figma Export
- [x] Research Figma API/plugin architecture
- [x] Create Figma export service
- [x] Convert DSL to Figma JSON format
- [x] Map components to Figma elements
- [x] Convert images to Figma images
- [x] Preserve palette in Figma
- [x] Preserve layout structure
- [x] Create Figma frames for screens
- [ ] Implement auto-layout compatibility
- [ ] Add Figma export UI
- [ ] Handle export errors
- [ ] Test Figma import

**Technical Notes:**
- Figma API may require plugin or file API
- Ensure exported files are usable in Figma
- Preserve as much metadata as possible
- [ ] Testing: snapshot exported JSON; manual import smoke test in CI.

---

### 15.2 Cursor Export
- [x] Create Cursor export format
- [x] Export DSL as JSON
- [x] Export React components
- [x] Export assets (images)
- [x] Create project structure
- [x] Generate Cursor-compatible files
- [x] Add export metadata
- [x] Create export bundle (zip)
- [ ] Add Cursor export UI
- [x] Document export format

**Technical Notes:**
- Cursor export should enable building real apps
- Include all necessary files and dependencies
- [ ] Testing: run exported bundle through Cursor CLI/test harness.

---

### 15.3 Screen Export
- [ ] Implement PNG export
  - [ ] Use headless browser or canvas
  - [ ] Render screen to image
  - [ ] Handle high-DPI exports
- [ ] Implement JPG export
- [ ] Implement JSON DSL export
- [ ] Implement React component export
- [ ] Add export options (resolution, format)
- [ ] Create export UI
- [ ] Add batch export for flows

**Technical Notes:**
- Use puppeteer or similar for high-quality exports
- Support different resolutions and formats

---

### 15.4 Flow Bundle Export
- [ ] Create flow bundle format
- [ ] Include all screens
- [ ] Include all assets
- [ ] Include metadata
- [ ] Include DSL files
- [ ] Create ZIP bundle
- [ ] Add bundle manifest
- [ ] Implement bundle import
- [ ] Add export/import UI

**Technical Notes:**
- Bundles enable offline sharing and backup
- Include version information in bundle

---

## Phase 16: Integration & Polish

### 16.1 API Layer
- [ ] Create REST API structure
- [ ] Implement flow endpoints
  - [ ] GET /api/flows
  - [ ] POST /api/flows
  - [ ] GET /api/flows/:id
  - [ ] PUT /api/flows/:id
  - [ ] DELETE /api/flows/:id
- [ ] Implement screen endpoints
- [ ] Implement image endpoints
- [ ] Implement generation endpoints
- [ ] Add authentication (if needed)
- [ ] Add rate limiting
- [ ] Add API error handling
- [ ] Create API documentation

**Technical Notes:**
- Use Next.js API routes or separate Express server
- Add proper error handling and status codes

---

### 16.2 Frontend Application
- [ ] Create main application layout
- [ ] Implement routing
- [ ] Create home/dashboard page
- [ ] Create flow creation page
- [ ] Create flow editor page
- [ ] Create library page
- [ ] Create gallery page
- [ ] Create settings page
- [ ] Add navigation menu
- [ ] Implement responsive design
- [ ] Add loading states
- [ ] Add error states
- [ ] Implement toast notifications

**Technical Notes:**
- Use Next.js App Router or React Router
- Ensure responsive design for all pages

---

### 16.3 State Management
- [ ] Set up state management (Zustand/Redux/Context)
- [ ] Create flow state store
- [ ] Create screen state store
- [ ] Create image library state store
- [ ] Create UI state store
- [ ] Implement state persistence
- [ ] Add state synchronization
- [ ] Handle state conflicts

**Technical Notes:**
- Choose state management based on complexity
- Ensure state persists across page navigation

---

### 16.4 Error Handling
- [ ] Create error boundary components
- [ ] Implement global error handler
- [ ] Add error logging
- [ ] Create user-friendly error messages
- [ ] Handle API errors gracefully
- [ ] Handle image generation errors
- [ ] Handle validation errors
- [ ] Add error recovery options

**Technical Notes:**
- Errors should be informative and actionable
- Log errors for debugging

---

### 16.5 Performance Optimization
- [ ] Implement image lazy loading
- [ ] Add code splitting
- [ ] Optimize bundle size
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Add pagination for large lists
- [ ] Implement virtual scrolling
- [ ] Optimize render performance
- [ ] Add performance monitoring

**Technical Notes:**
- Performance is critical for good UX
- Monitor and optimize bottlenecks

---

### 16.6 Testing
- [ ] Write unit tests for core services
- [ ] Write unit tests for DSL validation
- [ ] Write unit tests for pattern system
- [ ] Write integration tests for pipeline
- [ ] Write E2E tests for critical flows
- [ ] Test image generation integration
- [ ] Test export functionality
- [ ] Add test coverage reporting
- [ ] Set up CI/CD testing

**Technical Notes:**
- Aim for high test coverage on critical paths
- E2E tests for user-facing features

---

### 16.7 Documentation
- [ ] Write API documentation
- [ ] Create user guide
- [ ] Document pattern system
- [ ] Document DSL format
- [ ] Create developer setup guide
- [ ] Add code comments
- [ ] Create architecture diagrams
- [ ] Document deployment process

**Technical Notes:**
- Documentation is crucial for maintenance
- Keep documentation up to date

---

### 16.8 Deployment
- [ ] Set up production database
- [ ] Configure production image storage
- [ ] Set up environment variables
- [ ] Configure build process
- [ ] Set up hosting (Vercel/AWS/etc.)
- [ ] Configure CDN for assets
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Add deployment documentation

**Technical Notes:**
- Use production-grade infrastructure
- Ensure proper security and backups

---

## Phase 17: Constraints & Validation

### 17.1 Enforce "Must Build" Requirements
- [ ] Verify DSL schemas are implemented
- [ ] Verify pattern contract system exists
- [ ] Verify image metadata system exists
- [ ] Verify flow-engine is complete
- [ ] Verify renderer works
- [ ] Verify editing layer is functional
- [ ] Verify navigation layer works
- [ ] Verify image library is implemented
- [ ] Verify community system scaffolding exists
- [ ] Verify export infrastructure is in place

---

### 17.2 Enforce "Must Never" Constraints
- [ ] Ensure no layout structures are invented (only use defined patterns)
- [ ] Ensure no new components are added (only use defined types)
- [ ] Ensure no new DSL fields are added (only use defined schema)
- [ ] Ensure hero images are never skipped
- [ ] Ensure images are never replaced with gradients or placeholders
- [ ] Add validation to prevent constraint violations
- [ ] Add tests to enforce constraints

**Technical Notes:**
- These constraints are critical to project integrity
- Add automated checks to prevent violations

---

## Execution Order Summary

**Phase 1-2: Foundation** (Must complete first)
- Project setup, database, schemas

**Phase 3: Patterns** (Required for rendering)
- Pattern system must be complete before renderer

**Phase 4: Prompt Interpreter** (Required for generation)
- Needed to start generation pipeline

**Phase 5-6: Image System** (Core feature)
- Image generation and library are central to FlowRunner

**Phase 7: Editing** (Enhancement)
- Can be built after core image system

**Phase 8-9: DSL & Renderer** (Core feature)
- Required for displaying screens

**Phase 10: Flow Composer** (Core feature)
- Coordinates multi-screen flows

**Phase 11: MagicPath Editing** (Core feature)
- Essential for user experience

**Phase 12: Navigation Builder** (Core feature)
- Enables interactive flow creation

**Phase 13: Revisions** (Important)
- Should be implemented early for data integrity

**Phase 14: Community** (Advanced feature)
- Can be built after core features

**Phase 15: Exports** (Advanced feature)
- Built after core system is stable

**Phase 16: Integration** (Final phase)
- Connects all systems together

**Phase 17: Validation & Testing** (Ongoing)
- Layer regression, schema, and visual tests into every phase.
- CI gate should include: pattern schema tests, renderer visual diff, flow/editor E2E after major milestones.

---

## Notes

- Tasks are ordered by dependency where possible
- Some tasks can be worked on in parallel (e.g., UI components while building services)
- Testing should be done incrementally, not just at the end
- Documentation should be updated as features are built
- Performance optimization should be considered throughout, not just at the end

