# Image Generation & Palette Extraction

Phase 5 introduces AI-powered hero image generation with automatic palette extraction for FlowRunner screens.

## Components

1. **Generation Types** – `generation/types.ts` defines Zod schemas for image requests/results, style enums, and aspect ratios.
2. **Provider Interface** – `generation/provider.ts` exposes `ImageGenerationProvider` for pluggable backends (OpenAI/DALL-E, mock, etc.).
3. **OpenAI Provider** – `generation/providers/openai.ts` implements DALL-E 3 integration with prompt enhancement, retry logic, and timeout handling.
4. **Mock Provider** – `generation/providers/mock.ts` provides deterministic test fixtures.
5. **Service** – `generation/service.ts` orchestrates provider calls with progress callbacks.
6. **Queue** – `generation/queue.ts` manages job lifecycle, deduplication, and concurrent limits.
7. **Palette Extraction** – `palette.ts` uses `node-vibrant` to extract color palettes with WCAG contrast validation.
8. **Orchestrator** – `orchestrator.ts` wires generation → palette extraction for complete hero image workflows.

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

### Full Orchestration (Generation + Palette)

```typescript
import { ImageOrchestrator } from './lib/images/orchestrator'

const orchestrator = new ImageOrchestrator({
  service,
  autoExtractPalette: true,
})

const { image, palette } = await orchestrator.generateHeroImageWithPalette(request)
console.log(image.url, palette.primary)
```

## Environment Variables

- `OPENAI_API_KEY` – Required for OpenAI provider
- `OPENAI_IMAGE_MODEL` – Optional, defaults to `dall-e-3`

## Retry & Error Handling

- Providers implement retry logic (default: 3 attempts with exponential backoff)
- Queue handles job failures and exposes error details
- Palette extraction falls back to default palette on failure
- Contrast validation ensures WCAG compliance for text colors

## Testing

- Mock provider enables deterministic tests without API calls
- Queue tests cover deduplication, concurrency limits, and polling
- Palette tests mock `node-vibrant` and validate contrast checks

## Integration with Pipeline

The image orchestrator integrates with the Phase 4 intent → template pipeline:

1. Intent interpreter extracts visual theme + color mood
2. Template provides hero defaults (vibe, aspect ratio, image prompt)
3. Image orchestrator generates hero image
4. Palette extraction runs automatically
5. Results feed into DSL assembly (Phase 8)

