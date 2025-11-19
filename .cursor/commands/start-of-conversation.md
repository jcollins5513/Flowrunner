# Next Conversation Prompt

Continue work on **FlowRunner** — the AI-driven visual UI flow generator.

## Current Status

✅ Phase 4 Prompt Interpreter System is complete:
- Intent extraction with OpenAI provider + mock provider + caching
- Flow template system with 4 domain templates (E-commerce, SaaS, Mobile, Finance)
- Template customization hooks + selector/mapper utilities
- VCR-style test fixtures for interpreter outputs

✅ Phase 5.1 & 5.2 Image Generation System is complete:
- OpenAI/DALL-E 3 provider with retry logic, timeout handling, and prompt enhancement
- Image generation service with progress callbacks
- Job queue system with deduplication, concurrency limits, and polling
- Palette extraction using `node-vibrant` with WCAG contrast validation
- Full orchestrator wiring generation → palette extraction

## Next Steps

Move into **Phase 5.3: Vibe Inference** per `granular-plan.md` (section 5.3).

### Priority Tasks
1. **Vibe Inference Service (5.3)**
   - Create vibe inference service that analyzes image characteristics (color saturation, composition style, visual weight, mood indicators)
   - Map image analysis to vibe descriptors (Playful, Professional, Bold, Minimal, etc.)
   - Store vibe in image metadata
   - Allow manual vibe override
   - Create vibe-to-pattern compatibility mapping
   - Add Vitest coverage with fixture images

### Suggested Files / Locations
- `lib/images/vibe/` (new) for vibe inference service + schema + tests
- Integrate with existing `lib/images/orchestrator.ts` to add vibe extraction after palette
- Update `granular-plan.md` once 5.3 milestone is complete

### Principles / Constraints
- Keep pipeline deterministic: Prompt → Intent → Template → Screens → Pattern → Variant → Image → Palette → **Vibe** → DSL → Validate → Persist → Render
- Vibe inference can use LLM or rule-based system (start with rule-based, add LLM option later)
- Vibe helps determine compatible patterns
- All schemas require Zod validation + Vitest coverage

Start by designing the vibe inference schema and rule-based analyzer, then integrate it into the image orchestrator so the full image generation pipeline (image → palette → vibe) can be exercised end-to-end.

--- End Command ---
