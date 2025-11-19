# Flow Templates

Schema-validated flow templates map interpreted intents into deterministic screen plans. JSON definitions live in `lib/flow/templates/definitions/<domain>/` and are loaded via `loader.ts`.

## Schema Highlights

- `screens[]` – Ordered list of `FlowTemplateScreen` entries describing the pattern family/variant, intent hints, and hero defaults.
- `metadata` – Versioning + estimated screen count for tooling.
- `customization` *(optional)* – Declares author-provided hooks:
  - `screenOrder` – Preferred ordering of screen IDs (reroutes sequencing when present).
  - `screenOverrides` – Per-screen adjustments (pattern variant swaps, updated hints, hero defaults).
  - `fields` – User-exposed knobs (string/enum) that downstream planners can surface in UI.

## Customization Hooks

`mapTemplateToScreenSequence(template, intent, options)` now accepts `TemplateCustomizationOptions`:

- `screenOrder` – Override the template order at runtime.
- `screenOverrides` – Merge extra overrides on top of template-defined ones.
- `fieldValues` – Resolve `customization.fields` into `textPlan.customFields` for every screen.

Templates can document defaults in JSON (e.g., `saas-onboarding-v1` defines hero CTA label + accent color fields). Runtime callers may supply new values—tests in `tests/unit/templates/selector.test.ts` cover both template metadata and runtime overrides.

## Adding a Template

1. Author a JSON file that matches `flowTemplateSchema` (see `schema.ts`).
2. Import the file inside `loader.ts` and append it to `rawTemplates`.
3. Run `npm test` to exercise schema validation + selector behavior.
4. Update `DOMAIN_FALLBACKS` (in `selector.ts`) if the domain is brand new.

Finance example: `finance-fintech-growth-v1` demonstrates a compliant fintech funnel referencing `HERO_CENTER_TEXT`, `DASHBOARD_OVERVIEW`, and `CTA_SPLIT_SCREEN` patterns.
