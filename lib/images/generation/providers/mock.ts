import { ImageGenerationProvider } from '../provider'
import { ImageGenerationRequest, ImageGenerationResult, imageGenerationResultSchema } from '../types'

export interface MockImageProviderOptions {
  shouldFail?: boolean
  latencyMs?: number
  fixedUrl?: string
}

export class MockImageProvider implements ImageGenerationProvider {
  public readonly name = 'mock-image-provider'

  constructor(private options: MockImageProviderOptions = {}) {}

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (this.options.shouldFail) {
      throw new Error('Mock provider forced failure')
    }

    if (this.options.latencyMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.latencyMs))
    }

    // Default to a local image bundled in /public for deterministic previews
    const defaultLocalImage = '/images/1074B412-68B8-411D-95B5-A72FB00C7003_1_105_c.jpeg'

    // Allow callers to override with custom URLs (e.g., tests) via fixedUrl
    const rawUrl = this.options.fixedUrl ?? defaultLocalImage

    const url = resolveToAbsoluteUrl(rawUrl)

    return imageGenerationResultSchema.parse({
      url,
      seed: request.seed ?? 12345,
      prompt: request.prompt,
      style: request.style,
      aspectRatio: request.aspectRatio,
      metadata: {
        provider: this.name,
        model: 'mock-dalle-3',
        generationId: `mock-${Date.now()}`,
      },
    })
  }
}

function resolveToAbsoluteUrl(url: string): string {
  try {
    return new URL(url).toString()
  } catch {
    const baseUrl =
      process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://127.0.0.1:3000')

    // Ensure we have a leading slash when joining with base
    const normalized = url.startsWith('/') ? url : `/${url}`
    return new URL(normalized, baseUrl).toString()
  }
}

