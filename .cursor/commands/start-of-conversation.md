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

✅ Phase 5.3 Vibe Inference is complete:
- Rule-based vibe inference service analyzing image characteristics (color saturation, composition, visual weight, mood)
- Maps to 12 vibe descriptors (playful, professional, bold, minimal, modern, retro, elegant, energetic, calm, tech, creative, corporate)
- Vibe-to-pattern compatibility mapping
- Full integration with orchestrator pipeline
- Comprehensive Vitest test coverage

✅ Phase 5.4 Minimal Image Persistence is complete:
- ImageRepository service for saving/retrieving images with full metadata
- Automatic persistence in orchestrator (image → palette → vibe → save to DB)
- API endpoints: GET /api/images (list with filters) and GET /api/images/[id] (retrieve by ID)
- JSON serialization for palette and pattern tags
- Comprehensive test coverage

## Next Steps

Move into **Phase 6: Reusable Image Library** per `granular-plan.md` (section 6).

### Priority Tasks
1. **Library Database Schema Extensions (6.1)**
   - Extend Image model with library-specific fields (isFavorite, tags, usageCount already exist in schema)
   - Create LibraryCollection entity (optional) for organizing images
   - Add indexes for search performance
   - Run Prisma migrations if needed

2. **Library Search & Filter (6.2)**
   - Create search service (by prompt text, tags, domain)
   - Create filter service (by palette, vibe, style, pattern compatibility, date range)
   - Implement pagination and sorting
   - Create search/filter API endpoints
   - Optimize database queries with proper indexes

### Suggested Files / Locations
- `lib/images/library/` (new) for search/filter services
- Extend `lib/images/repository.ts` with search/filter methods
- Create API endpoints in `app/api/images/search/` and `app/api/images/filter/`
- Update `granular-plan.md` once 6.1 and 6.2 milestones are complete

### Principles / Constraints
- Build on existing Image model and ImageRepository
- Search should be fast and support pagination
- Filters should be composable (multiple filters at once)
- Use database indexes for performance
- All search/filter operations should be testable with mocks

### Note
Phase 5.4 completed minimal persistence (metadata + URL storage). Full storage infrastructure (S3, optimization, thumbnails) can be added later based on actual needs. The current system stores image URLs and metadata, which is sufficient for building the library UI.
