# Intent Interpreter System

Phase 4 introduces a deterministic prompt interpreter that converts raw prompts into structured `Intent` objects, then picks the best flow template and maps its screens into generation plans.

## Components

1. **Schema** – `intent.schema.ts` defines the Zod validator + enums for domains, style cues, tones, color moods, and themes. All downstream systems should import the exported types to stay aligned.
2. **Interpreter** – `interpreter.ts` is provider-agnostic. Pass any `IntentProvider` implementation and call `interpret(prompt, options)` to receive validated intents with caching + normalization.
3. **Providers** – `providers/mock.ts` ships a deterministic mock provider for local development. Real providers (OpenAI, Anthropic, etc.) should implement the same interface and return partial intent payloads; the interpreter handles defaults and validation.
4. **Templates** – `lib/flow/templates/` contains schema-validated JSON templates, a loader, and selector utilities that map an `Intent` to a deterministic screen sequence plan.
5. **Pipeline** – `pipeline.ts` composes the interpreter with the template selector for a Prompt → Intent → Template → Screen plan flow. Use `runPromptToTemplatePipeline(prompt)` to exercise the whole path.

## Swapping Providers

- Implement `IntentProvider` with `name` + `generateIntent()`.
- Return partial intent data; the interpreter merges defaults and validates.
- Throwing from `generateIntent` triggers the fallback intent (defaults + recorded reason).
- Inject custom providers via `new IntentInterpreter(yourProvider)` or pass `{ interpreter }` into `runPromptToTemplatePipeline`.

### OpenAI Provider

- `providers/openai.ts` wraps the official OpenAI SDK for structured intent extraction.
- Configurable via `OPENAI_API_KEY`, optional `OPENAI_INTENT_MODEL`, `temperature`, and `topP`.
- Responses use JSON-mode chat completions constrained to FlowRunner enums; the provider sanitizes outputs before handing them to the interpreter.
- Ideal for production; swap in Anthropic or other LLMs by following the same interface.

### Telemetry & Observability

- Pass `onEvent` into `IntentInterpreter` to observe `cache_hit`, `cache_miss`, `cache_store`, `provider_success`, `provider_failure`, and `fallback_applied` events.
- Events include prompt hash, locale, provider name, duration, and error reason when relevant—pipe them into tracing/logging to debug LLM behavior.

## Caching & Normalization

- Prompts are normalized (trim + lowercase + whitespace collapse) before caching.
- Cache key = `normalizedPrompt|locale`. Pass `forceRefresh: true` to bypass.
- Provide your own cache map through the interpreter constructor to plug into Redis/In-memory stores later.

### Recorded Fixtures

- `tests/unit/intent/interpreter.recordings.test.ts` replays fixtures from `tests/fixtures/ai/intent/recordings.json` to ensure interpreter output remains stable without hitting a live LLM.
- Add new recordings whenever you tweak prompt engineering so downstream systems have regression coverage.

## Extending Templates

1. Add a JSON file under `lib/flow/templates/definitions/<domain>/` that matches `flowTemplateSchema`.
2. Import it inside `loader.ts` and append to `rawTemplates`.
3. Run `npm test` to validate schema + loader tests.
4. Optionally expand `DOMAIN_FALLBACKS` inside `selector.ts` so new domains get proper scoring.

This keeps the deterministic pipeline intact: Prompt → Intent → Template → Screen Plan precedes pattern/variant selection, hero generation, palette extraction, DSL assembly, and rendering.
