# 🟢 Start of Conversation — FlowRunner Development

I am continuing work on FlowRunner, an AI-driven visual UI flow generator.

## Current Status

**Completed:**
- ✅ Phase 1: Foundation & Setup (Project initialization, database setup)
- ✅ Phase 2.1: DSL Schema Definition (TypeScript types + Zod validation + tests)
- ✅ Phase 2.2: Database models complete (Flow, Screen, Image, Revision entities)
- ✅ Phase 2.3: Image metadata model schema complete

**Next Priority: Phase 3 — Pattern System**

## Current Task

Begin **Phase 3: Pattern System** from `granular-plan.md`.

**What needs to be done:**
1. **Phase 3.1: Pattern Family Definitions**
   - Define 12 pattern families as TypeScript enums
   - Currently 4 are defined in DSL types (ONB_HERO_TOP, FEAT_IMAGE_TEXT_RIGHT, DEMO_DEVICE_FULLBLEED, ACT_FORM_MINIMAL)
   - Need to define the remaining 8 pattern families
   - Create pattern family metadata (display name, description, use cases, component slots)
   - Create pattern family registry/constants file

2. **Phase 3.2: Pattern Variant System**
   - Define variant structure (1-5 variants per family)
   - Create JSON pattern definition format
   - Define layout structure (grid/flex positions)
   - Define component slots (required/optional)
   - Define spacing rules
   - Define responsive breakpoints
   - Define image placement rules
   - Create pattern definition files for each variant (12 families × 5 variants = 60 patterns)

3. **Phase 3.3: Pattern Validation**
   - Create Zod schema for pattern definitions
   - Validate pattern JSON files on load
   - Validate DSL against selected pattern contract
   - Create pattern compatibility checker

**Reference Files:**
- `granular-plan.md` — See Phase 3 for detailed task breakdown
- `lib/dsl/types.ts` — PatternFamily type already defined (4 families + 8 placeholders)
- `lib/dsl/schemas.ts` — PatternFamily schema already includes all 12 families
- `types/pattern.ts` — PatternDefinition interface already defined
- `master-plan.md` — High-level project vision (DO NOT MODIFY)

**Technical Requirements:**
- Pattern families must be fixed and not user-extensible
- Each family should have clear documentation
- Patterns must be deterministic and JSON-defined
- Pattern definitions must be Zod-validated
- All 60 pattern variants (12 families × 5) must be defined

**Context:**
The DSL validation system is complete. Now we need to build the pattern system that defines how screens are laid out. Patterns are the foundation for the renderer - they define the structure, component slots, and layout rules for each screen variant.

---

**Do not modify `master-plan.md`** — it is locked after creation. Only update `granular-plan.md` to check off completed tasks as you work.

Let's continue building FlowRunner!
