# Next Conversation Prompt

Continue work on **FlowRunner** — the AI-driven visual UI flow generator.

## Current Status

✅ Phase 3 Pattern System is fully complete:
- 12 families × 5 variants finalized with JSON definitions.
- Preview metadata + thumbnails live (`lib/patterns/previews.json`, `public/pattern-previews/`).
- Automated coverage:
  - Vitest smoke suite validates all 60 definitions against fixtures.
  - Playwright snapshots cover every family/variant.
- Telemetry + health endpoint (`lib/telemetry/patterns.ts`, `GET /api/patterns/health`) monitor load/validation parity.

## Next Steps

Move into **Phase 4: Prompt Interpreter System** per `granular-plan.md` (sections 4.1 & 4.2).

### Priority Tasks
1. **Intent Extraction (4.1)**
   - Scaffold AI/LLM service wrapper (start with mocked provider + interface for OpenAI/Anthropic).
   - Define `Intent` object (domain, style cues, visual theme, tone, color mood) with Zod schema + TS types.
   - Implement structured parsing + fallbacks, including error handling and caching hooks.
2. **Flow Template System (4.2)**
   - Draft template schema + JSON loaders for domain-specific flows (E-commerce, SaaS onboarding, Mobile app).
   - Implement Domain → Template selector and template-to-screen-sequence mapper.
   - Plan customization hooks + persistence for templates.

### Suggested Files / Locations
- `lib/ai/intent/` (new) for interpreter service + schema + tests.
- `lib/flow/templates/` (new) for template definitions & loader utilities.
- Update `granular-plan.md` once 4.1/4.2 milestones are complete.

### Principles / Constraints
- Keep pipeline deterministic: Prompt → Intent → Template → Screens → Pattern → Variant → Image → Palette → DSL → Validate → Persist → Render.
- All schemas require Zod validation + Vitest coverage.
- Design services so future LLM providers or caching layers can be swapped without touching downstream stages.

Start by outlining the Intent schema + interpreter interfaces, then stub the flow template loader so Prompt → Template selection can be exercised end-to-end with fixtures.
