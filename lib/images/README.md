# Image Generation, Palette Extraction & Vibe Inference

Phase 5 introduces AI-powered hero image generation with automatic palette extraction and vibe inference for FlowRunner screens.

## Components

1. **Generation Types** – `generation/types.ts` defines Zod schemas for image requests/results, style enums, and aspect ratios.
2. **Provider Interface** – `generation/provider.ts` exposes `ImageGenerationProvider` for pluggable backends (OpenAI/DALL-E, mock, etc.).
3. **OpenAI Provider** – `generation/providers/openai.ts` implements DALL-E 3 integration with prompt enhancement, retry logic, and timeout handling.
4. **Mock Provider** – `generation/providers/mock.ts` provides deterministic test fixtures.
5. **Service** – `generation/service.ts` orchestrates provider calls with progress callbacks.
6. **Queue** – `generation/queue.ts` manages job lifecycle, deduplication, and concurrent limits.
7. **Palette Extraction** – `palette.ts` uses `node-vibrant` to extract color palettes with WCAG contrast validation.
8. **Vibe Inference** – `vibe/` analyzes image characteristics (color saturation, composition, visual weight, mood) and maps to vibe descriptors (playful, professional, bold, minimal, etc.).
9. **Orchestrator** – `orchestrator.ts` wires generation → palette extraction → vibe inference for complete hero image workflows.

## Usage

### Basic Generation

```typescript
import { ImageGenerationService } from './lib/images/generation/service'
import { OpenAIImageProvider } from './lib/images/generation/providers/openai'
import { imageGenerationRequestSchema } from './lib/images/generation/types'

const provider = new OpenAIImageProvider()
const service = new ImageGenerationService({ provider })

const request = imageGenerationRequestSchema.parse({
  prompt: 'A vibrant sunset over mountains',
  aspectRatio: '16:9',
  style: 'photographic',
  colorMood: 'warm',
})

const result = await service.generateHeroImage(request)
console.log(result.url)
```

### Queue-Based Generation

```typescript
import { ImageGenerationQueue } from './lib/images/generation/queue'

const queue = new ImageGenerationQueue(service, { maxConcurrent: 3 })

const jobId = await queue.requestHeroImage(request)
const job = await queue.pollJob(jobId, 30000)

if (job.status === 'completed') {
  console.log(job.result?.url)
}
```

### Full Orchestration (Generation + Palette + Vibe)

```typescript
import { ImageOrchestrator } from './lib/images/orchestrator'

const orchestrator = new ImageOrchestrator({
  service,
  autoExtractPalette: true,
  autoInferVibe: true, // Enabled by default
})

const { image, palette, vibe, vibeAnalysis } = await orchestrator.generateHeroImageWithPalette(request)
console.log(image.url, palette.primary, vibe) // e.g., 'modern'
console.log(vibeAnalysis?.confidence) // e.g., 0.85
```

### Vibe Inference

```typescript
import { inferVibe } from './lib/images/vibe/infer'
import { extractPalette } from './lib/images/palette'

// Infer vibe from image
const palette = await extractPalette({ url: imageUrl })
const vibeAnalysis = await inferVibe({
  url: imageUrl,
  palette,
  includeReasoning: true, // Optional: include reasoning steps
})

console.log(vibeAnalysis.vibe) // e.g., 'playful'
console.log(vibeAnalysis.confidence) // 0-1 score
console.log(vibeAnalysis.characteristics) // Detailed analysis
console.log(vibeAnalysis.reasoning) // Optional reasoning array
```

### Vibe-to-Pattern Compatibility

```typescript
import { getCompatiblePatterns, isPatternCompatible } from './lib/images/vibe/compatibility'
import { PATTERN_FAMILIES } from './lib/patterns/families'

// Get compatible patterns for a vibe
const patterns = getCompatiblePatterns('playful')
// Returns: ['ONB_HERO_TOP', 'FEAT_IMAGE_TEXT_RIGHT', ...]

// Check if a pattern is compatible with a vibe
const isCompatible = isPatternCompatible('modern', PATTERN_FAMILIES.DASHBOARD_OVERVIEW)
// Returns: true
```

## Environment Variables

- `OPENAI_API_KEY` – Required for OpenAI provider
- `OPENAI_IMAGE_MODEL` – Optional, defaults to `dall-e-3`

## Retry & Error Handling

- Providers implement retry logic (default: 3 attempts with exponential backoff)
- Queue handles job failures and exposes error details
- Palette extraction falls back to default palette on failure
- Vibe inference uses rule-based analysis with fallback to default characteristics
- Contrast validation ensures WCAG compliance for text colors

## Testing

- Mock provider enables deterministic tests without API calls
- Queue tests cover deduplication, concurrency limits, and polling
- Palette tests mock `node-vibrant` and validate contrast checks
- Vibe inference tests cover analyzer utilities, rule-based scoring, and compatibility mapping
- Persistence tests mock Prisma client and validate repository operations

## Image Persistence

Generated images are automatically persisted to the database with full metadata:

```typescript
import { ImageOrchestrator } from './lib/images/orchestrator'

const orchestrator = new ImageOrchestrator({
  service,
  autoExtractPalette: true,
  autoInferVibe: true,
  autoPersist: true, // Enabled by default
  userId: 'user-123', // Optional: associate with user
})

const { image, palette, vibe, imageId } = await orchestrator.generateHeroImageWithPalette(request)
console.log(imageId) // Database ID of saved image
```

### Image Repository

Manually save or retrieve images:

```typescript
import { ImageRepository } from './lib/images/repository'

const repository = new ImageRepository()

// Save an image
const savedImage = await repository.saveImage({
  url: 'https://example.com/image.jpg',
  prompt: 'A beautiful sunset',
  seed: 12345,
  aspectRatio: '16:9',
  style: 'photographic',
  palette: { primary: '#FF5733', ... },
  vibe: 'modern',
  userId: 'user-123',
})

// Retrieve by ID
const image = await repository.getImageById('image-id')

// Query with filters
const images = await repository.queryImages(
  { vibe: 'modern', domain: 'ecommerce' },
  { limit: 20, offset: 0 }
)
```

### API Endpoints

**GET /api/images** - List images with optional filters
- Query params: `userId`, `domain`, `vibe`, `style`, `limit`, `offset`
- Returns paginated list of images with basic metadata

**GET /api/images/[id]** - Get image by ID
- Returns full image data including deserialized palette and pattern tags

## Integration with Pipeline

The image orchestrator integrates with the Phase 4 intent → template pipeline:

1. Intent interpreter extracts visual theme + color mood
2. Template provides hero defaults (vibe, aspect ratio, image prompt)
3. Image orchestrator generates hero image
4. Palette extraction runs automatically
5. Vibe inference analyzes image characteristics and maps to vibe descriptor
6. Image is persisted to database with all metadata (if autoPersist enabled)
7. Results (image, palette, vibe, imageId) feed into DSL assembly (Phase 8)

## Vibe Inference Details

### Supported Vibes

The system supports 12 vibe types:
- `playful` - High saturation, bright colors, varied composition
- `professional` - Moderate saturation, balanced colors, structured composition
- `bold` - High contrast, saturated colors, strong visual weight
- `minimal` - Low saturation, high brightness, simple composition
- `modern` - Balanced saturation, cool tones, clean composition
- `retro` - Warm tones, moderate saturation, specific color palettes
- `elegant` - Low-moderate saturation, refined colors, balanced composition
- `energetic` - High saturation, warm tones, dynamic composition
- `calm` - Low saturation, cool tones, balanced composition
- `tech` - Cool tones, moderate-high saturation, structured composition
- `creative` - High saturation, varied colors, dynamic composition
- `corporate` - Low-moderate saturation, neutral tones, structured composition

### Analysis Characteristics

Vibe inference analyzes:
- **Color Saturation** (0-1): Average saturation from vibrant palette
- **Visual Weight** (0-1): Brightness and contrast intensity
- **Composition Complexity** (0-1): Complexity based on aspect ratio and dimensions
- **Color Temperature** (-1 to 1): Cool (negative) to warm (positive) tones
- **Brightness** (0-1): Overall image brightness

### Manual Override

Vibe can be manually overridden:

```typescript
const vibeAnalysis = await inferVibe({
  url: imageUrl,
  palette,
  manualOverride: 'minimal', // Forces this vibe
})
```

### Pattern Compatibility

Each vibe has compatible pattern families that work well together. Use `getCompatiblePatterns(vibe)` to filter pattern selection based on inferred vibe.

