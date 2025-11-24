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

    // Use a valid placeholder image URL (placeholder.com service)
    const url = this.options.fixedUrl ?? `https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=Mock+Image`

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

