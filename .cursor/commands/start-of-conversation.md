# Next Conversation Prompt

FlowRunner is now stable on Next 16 with synchronous pattern loading, working `/api/patterns` delivery, and a deterministic mock hero image. Screen generation succeeds end-to-end, but Phase **A.6: Advanced Editing & Polish** and the new palette/vibe offline fallbacks still need to be implemented.

## What to Tackle Next

1. **Phase A.6.1 – Editing Integration**
   - Wire `EditModeToggle` + editing context into `/flows/[flowId]/edit`.
   - Mount `EditableTitle/Subtitle/Text/Button/Form` so inline edits persist via `FlowProvider` → `PUT /api/flows/[flowId]/screens/[screenId]`.
   - Hook up `PaletteEditor`, `VibeSelector`, and pattern selectors to their APIs/migration utilities.
   - Add hero image replacement flow using `ImageReplacer` + `ImageLibraryPicker`, ensuring palette/vibe refresh.

2. **Phase A.6.2 – Screen Management**
   - Build UI affordances for delete, reorder, duplicate, and a screen list sidebar (using the existing `/api/flows/[flowId]/screens` endpoints).

3. **Phase A.6.3 – Playground Save Flow**
   - Add “Save as Flow” in `app/flow-playground/page.tsx`, convert the playground DSL to a persisted flow, and redirect to the editor.

4. **Phase A.6.4 – Editor UX Polish**
   - Add loading states, toast notifications, and confirmation dialogs for destructive actions.
   - Improve layout spacing/empty states while keeping everything container-based.

5. **Phase 5.2 / 5.3 Follow-Up**
   - Add offline/local-image fallbacks for palette extraction and vibe inference so the mock hero (served from `/images/...`) doesn’t trigger failing fetches.

## Key Files
- `app/(dashboard)/flows/[flowId]/edit/page.tsx`
- `components/editing/*` (EditModeToggle, EditableTitle/Text/Button/Form, PaletteEditor, VibeSelector, Pattern selectors, ImageReplacer, ImageLibraryPicker)
- `lib/flows/next-screen-generator.ts`, `lib/dsl/validator.ts` (ensure edits stay valid)
- `lib/images/palette.ts`, `lib/images/vibe/analyzer.ts` (offline fallbacks)

## Validation / Testing
- Manual flow: create flow → edit text/palette/vibe → reorder screens → observe navigation diagram.
- Ensure `/api/flows/[flowId]/screens/[screenId]` updates succeed and revisions are created.
- Regression: run `npm run lint` and `npm test` (acknowledging existing external-network failures).

Let’s focus this next session on wiring up the editing experience (Phase A.6) and adding the palette/vibe fallbacks so the mock workflow is smooth.*** End Patch
