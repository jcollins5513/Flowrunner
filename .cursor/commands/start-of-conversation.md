# Next Conversation Prompt

Continue work on **FlowRunner** — the AI-driven visual UI flow generator.

## Current Status

✅ **Phase A: Ship Preparation (Basic Version) is COMPLETE:**
- ✅ Navigation component (`components/navigation/AppHeader.tsx`)
- ✅ Updated home page with navigation and CTAs
- ✅ Flow creation page (`app/(dashboard)/flows/new/page.tsx`)
- ✅ Flow editor page (`app/(dashboard)/flows/[flowId]/edit/page.tsx`) with:
  - Screen display using InteractiveScreen component
  - Screen generation via `generateNextScreen`
  - Navigation diagram in Diagram tab
  - Basic settings tab for flow metadata
- ✅ Gallery integration (Edit buttons on flow cards, fixed editor links)
- ✅ Error handling and loading states across all pages

**Core Flow is Now Functional:**
- Users can create flows → Edit flows → Generate screens → View navigation diagrams → Save changes
- All basic navigation paths are connected and working

## Next Focus: Phase A.6 - Advanced Editing & Polish

The basic editor is functional, but lacks full editing capabilities. The next phase should add comprehensive editing features and polish the user experience.

### Phase A.6: Advanced Editing & Polish

**Goal:** Add full editing capabilities to the flow editor and improve the overall UX.

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

#### A.6.5 Testing & Bug Fixes
- [ ] Test complete editing flow end-to-end
- [ ] Fix any issues discovered during testing
- [ ] Ensure all API endpoints work correctly from UI
- [ ] Verify navigation diagram updates correctly after edits

**Technical Notes:**
- Use existing editing components from `components/editing/`
- All editing should update DSL via `PUT /api/flows/[flowId]/screens/[screenId]`
- Ensure revisions are created on all edits (backend already handles this)
- Keep container-based layouts throughout

---

## Key Files / Locations

### Files to Update:
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

## Principles / Constraints

- Use existing editing components (don't reinvent)
- Ensure all edits create revisions (backend handles this automatically)
- Maintain container-based layouts
- Prioritize functionality, add polish incrementally
- Test thoroughly as features are added

---

## Completed Phases Summary

- ✅ Phase 12.1-12.4: Click-Through Interface, Screen Generation, Navigation Diagram, Branching
- ✅ Phase 13.1: Revision Tracking
- ✅ Phase A.1-A.4: Core Navigation, Flow Creation, Basic Editor, Gallery Integration

---

## Next Session Goals

1. Add edit mode toggle to flow editor
2. Integrate all editing components into editor
3. Add screen management (delete, reorder)
4. Add "Save as Flow" to playground
5. Improve UX with loading states, toasts, and better feedback

This will complete the editing layer and make the app fully functional for end-to-end usage!
