# Next Conversation Prompt

Continue work on **FlowRunner** — the AI-driven visual UI flow generator.

## Current Status

✅ **Phase A: Ship Preparation (Basic Version) - IN PROGRESS:**
- ✅ Navigation component (`components/navigation/AppHeader.tsx`)
- ✅ Updated home page with navigation and CTAs
- ✅ Flow creation page (`app/(dashboard)/flows/new/page.tsx`) - **RECENTLY IMPROVED**
  - Combined flow creation + first screen generation in single form
  - Added guidance fields (domain, style, visualTheme, tone, colorMood) to steer AI
  - Fixed DSL validation errors and Select component warnings
  - Improved error handling and user feedback
- ✅ Flow editor page (`app/(dashboard)/flows/[flowId]/edit/page.tsx`) - **RECENTLY IMPROVED**
  - Fixed "Create Your First Screen" form visibility (only shows when no screens exist)
  - Added error display from URL query parameters
  - Improved screen loading and refresh logic
- ✅ Gallery integration (Edit buttons on flow cards, fixed editor links)
- ✅ Error handling and loading states across all pages

**Recent Improvements:**
- Streamlined flow creation workflow (single form instead of two-step process)
- Fixed DSL validation errors in generate-first-screen endpoint
- Fixed React Select component warnings
- Improved error handling with detailed logging and user feedback
- Fixed mock image provider URL validation

## Current Issue to Resolve

**Screen Generation Still Failing:**
- DSL validation is still failing when generating the first screen
- Error: "DSL validation failed" (500 error)
- Need to debug and fix the actual validation issue
- Check server logs for detailed validation errors (we added extensive logging)

## Next Focus: Fix Screen Generation + Phase A.6

### Immediate Priority: Debug & Fix Screen Generation

1. **Investigate DSL Validation Failure**
   - Check server console logs for detailed validation errors
   - Verify hero image URL format is valid (we changed to `via.placeholder.com`)
   - Ensure all required DSL fields are present and valid
   - Test the `buildScreenDSLFromPlan` function with mock data
   - Verify palette, vibe, pattern_family, pattern_variant are all valid

2. **Fix Any Remaining Issues**
   - Ensure hero_image.id is always a string
   - Ensure hero_image.url passes Zod URL validation
   - Verify all palette fields (primary, secondary, accent, background) are present
   - Verify vibe is a valid enum value
   - Check that components array has at least one element

3. **Test End-to-End Flow**
   - Create a new flow from `/flows/new`
   - Verify first screen is generated successfully
   - Verify edit page loads with the screen (no "Create Your First Screen" form)
   - Verify screen renders correctly

### Then: Phase A.6 - Advanced Editing & Polish

Once screen generation is working, proceed with:

#### A.6.1 Full Editing Integration
- [ ] Integrate editing components into editor (EditableTitle, EditableSubtitle, EditableText, EditableButton, etc.)
- [ ] Add edit mode toggle in editor
- [ ] Enable inline editing of all screen components
- [ ] Connect palette editor to editor page
- [ ] Connect vibe selector to editor page
- [ ] Connect pattern family/variant selectors to editor page
- [ ] Add image replacement UI (ImageReplacer component)
- [ ] Ensure all edits save via API and update DSL

#### A.6.2 Screen Management
- [ ] Add screen deletion functionality
- [ ] Add screen reordering UI (drag-and-drop or up/down buttons)
- [ ] Add "Duplicate Screen" feature
- [ ] Add screen list sidebar in editor

#### A.6.3 Playground Integration
- [ ] Add "Save as Flow" button to flow playground (`app/flow-playground/page.tsx`)
- [ ] Convert playground screens to flow format
- [ ] Redirect to new flow editor after saving

#### A.6.4 UX Improvements
- [ ] Add loading states during screen generation
- [ ] Add success/error toast notifications
- [ ] Improve editor layout and spacing
- [ ] Add keyboard shortcuts for common actions
- [ ] Add confirmation dialogs for destructive actions
- [ ] Improve empty states and messaging

---

## Key Files / Locations

### Files to Debug:
- `app/api/flows/[flowId]/generate-first-screen/route.ts` - Check validation errors in logs
- `lib/flows/next-screen-generator.ts` - Verify DSL construction
- `lib/images/generation/providers/mock.ts` - Verify URL format
- `lib/dsl/validator.ts` - Check validation logic

### Files to Update (After Fix):
- Flow Editor: `app/(dashboard)/flows/[flowId]/edit/page.tsx` - Add editing mode and integrate editing components
- Flow Playground: `app/flow-playground/page.tsx` - Add save functionality
- Editing Components: `components/editing/` - All components already exist, need integration

### Components to Integrate:
- `EditModeToggle` - Toggle edit/view mode
- `EditableTitle`, `EditableSubtitle`, `EditableText` - Text editing
- `EditableButton`, `EditableForm` - Component editing
- `PaletteEditor` - Palette editing
- `VibeSelector` - Vibe editing
- `PatternFamilySelector`, `PatternVariantSelector` - Pattern editing
- `ImageReplacer`, `ImageLibraryPicker` - Image editing

### API Endpoints to Use:
- `PUT /api/flows/[flowId]/screens/[screenId]` - Update screen DSL
- `DELETE /api/flows/[flowId]/screens/[screenId]` - Delete screen
- `POST /api/flows` - Save playground as flow

---

## Debugging Steps

1. **Check Server Logs**
   - Look for "DSL validation failed" errors
   - Check the detailed validation error messages we added
   - Look for "DSL that failed validation" JSON output

2. **Verify DSL Structure**
   - Check that `hero_image.url` is a valid URL format
   - Verify `hero_image.id` is a string
   - Check that `palette` has all required fields
   - Verify `vibe` is a valid enum value
   - Ensure `pattern_family` and `pattern_variant` are valid

3. **Test with Mock Data**
   - Create a test DSL object manually
   - Run it through `validateScreenDSL`
   - See what specific field is failing

---

## Principles / Constraints

- Use existing editing components (don't reinvent)
- Ensure all edits create revisions (backend handles this automatically)
- Maintain container-based layouts
- Prioritize fixing screen generation before adding new features
- Test thoroughly as issues are fixed

---

## Completed Phases Summary

- ✅ Phase 12.1-12.4: Click-Through Interface, Screen Generation, Navigation Diagram, Branching
- ✅ Phase 13.1: Revision Tracking
- ✅ Phase A.1-A.4: Core Navigation, Flow Creation, Basic Editor, Gallery Integration
- ✅ Phase A.2: Streamlined flow creation with combined form
- ✅ Phase A.3: Fixed form visibility and error handling

---

## Next Session Goals

1. **IMMEDIATE:** Debug and fix DSL validation error preventing screen generation
2. **THEN:** Add edit mode toggle to flow editor
3. **THEN:** Integrate all editing components into editor
4. **THEN:** Add screen management (delete, reorder)
5. **THEN:** Add "Save as Flow" to playground
6. **THEN:** Improve UX with loading states, toasts, and better feedback

**Priority:** Fix screen generation first, then proceed with editing features!
