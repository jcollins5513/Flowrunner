# FlowRunner — Codex Instructions (Revised: Deterministic Layout + Safe/Advanced Component System)

## Project Overview

FlowRunner is an AI‑driven UI generation engine that converts natural‑language prompts into **deterministic multi‑screen flows**. The system produces consistent structure using a strict Row/Column/Stack layout DSL, and applies visual identity through themed style packs, AI‑generated images, and advanced component upgrades.

**Core Principle:**  
**Structure is deterministic. Style is expressive.**

---

## Layout Requirements

FlowRunner does **NOT** use container‑based layout as the foundation.  
It uses a strict structural model:

### Layout Primitives
- `row`
- `column`
- `stack`
- `slot`

### Grid System
- 12‑column grid  
- Fixed spans per breakpoint  
- No arbitrary CSS units  

### Pattern Library
- Each screen uses *one* pattern family + pattern variant  
- Patterns define layout only  
- Stored in `lib/patterns/definitions/`

### Components Fill Slots
Patterns define **where**.  
The registry decides **what**.

---

## Component System

FlowRunner has two component tiers:

### 1. SAFE COMPONENTS (Default)
Used for:
- All initial screen generations  
- Basic text, buttons, cards, containers  
- Derived from shadcn, simple Aceternity components  

### 2. ADVANCED COMPONENTS (Premium)
Only unlocked after user interaction:
- MagicUI  
- Cinematic hero sections  
- Animated backgrounds  
- 3D cards  
- Advanced gallery modules  

#### Upgrade Flow
1. User clicks a safe component  
2. Options:
   - Link to another screen
   - Replace with advanced (paywalled)
3. Choosing advanced rewrites DSL  
4. Render updates accordingly  

### Metadata Requirements
Every component must include:
- `tier`: safe | advanced  
- `type`: button | card | hero | gallery | etc.  
- `role`: hero.title | hero.media | section.card | etc.  
- `screenTypes`: applicable screen types  
- `complexity`: simple | standard | high  

These belong in `lib/library/component-registry.ts`.

---

## Component Loading & Registry

### Key Files
- component-loader.ts  
- component-registry.ts  
- component-selector.ts  
- library-component-renderer.tsx  

### Rules
1. Explicit imports only  
2. Tier + category must be defined  
3. Selector must honor:
   - slot.role  
   - screenType  
   - requestedCategory  
   - userTier  
4. Safe components used by default  
5. Advanced requires premium  

---

## Pipeline (Updated & Enforced)

1. **Prompt Intake → Prompt Rewriting**
   - User’s raw prompt is sent to the LLM first  
   - LLM rewrites the prompt to improve clarity, specificity, and structure  
   - If required structural details are missing (screen type, content type, hero needs, flow intent),  
     LLM must ask the user targeted clarifying questions  
   - Only after all answers are collected does the pipeline continue  

2. Intent → Screen Type  
3. Screen Type → Pattern Family  
4. Choose Pattern Variant  
5. Generate Hero Image (stub or real)  
6. Extract Colors/Palette  
7. Apply Style Pack  
8. Build Layout DSL  
9. Fill Slots with Safe Components  
10. Zod Validate  
11. Persist Revision  
12. Render  
13. Allow User Edits (link screens, replace with advanced)  

This order is **mandatory**.

---

## Visual Identity System

### Hero Images
- Required for every screen  
- AI‑generated or library-sourced  
- Must store: palette, vibe, prompt  

### Style Packs
AI‑generated theme tokens:
- Colors  
- Shadows  
- Radius  
- Typography  
- Surface textures  

### Advanced Style Enhancements
- MagicUI animations  
- 3D components  
- Cinematic hero compositions  

---

## Export System (Premium)

Exporting is paywalled and matches the advanced tier.

### Figma Export (Premium)
- Converts DSL → Figma frames  
- Maps rows/columns/stacks → layers  
- Converts components → Figma variants  
- Includes palette + hero images  
- Output must be deterministic  

### Cursor Export (Premium)
- Exports DSL → React component tree  
- Generates folder structure  
- Includes hero images + theme tokens  
- Matches the final screen exactly  

### Export Rules
- Only available to paid users  
- Free users see disabled export buttons  
- Exports must reflect the final DSL, not regenerated content  

---

## What NOT to Do

Never:
- Use container-based layout  
- Allow AI to invent structure  
- Use advanced components during generation  
- Skip hero images  
- Modify patterns without updating schemas  
- Add components without registry metadata  
- Break deterministic pipeline order  

---

## Key Files

- master-plan.md  
- granular-plan.md  
- lib/dsl/*  
- lib/patterns/definitions/*  
- components/renderer/*  
- lib/library/*  
- prisma/schema.prisma  

---

## Testing Requirements

- Validate DSL with Zod  
- Ensure pattern schemas pass  
- Verify registry metadata completeness  
- Test safe → advanced swapping  
- Test deterministic render output  
- Test paywall restrictions  
