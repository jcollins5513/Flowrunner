import { ImageGenerationProvider } from './provider'
import { ImageGenerationRequest, ImageGenerationResult } from './types'

export interface ImageGenerationServiceOptions {
  provider?: ImageGenerationProvider
  onProgress?: (status: { stage: string; progress?: number }) => void
}

export class ImageGenerationService {
  constructor(private options: ImageGenerationServiceOptions = {}) {}

  async generateHeroImage(
    request: ImageGenerationRequest,
    provider?: ImageGenerationProvider
  ): Promise<ImageGenerationResult> {
    const activeProvider = provider ?? this.options.provider
    if (!activeProvider) {
      throw new Error('No image generation provider configured')
    }

    this.options.onProgress?.({ stage: 'generating', progress: 0 })

    try {
      const result = await activeProvider.generateImage(request)
      this.options.onProgress?.({ stage: 'complete', progress: 100 })
      return result
    } catch (error) {
      this.options.onProgress?.({ stage: 'error', progress: 0 })
      throw error
    }
  }
}

