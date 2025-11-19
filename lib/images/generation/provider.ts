import { ImageGenerationRequest, ImageGenerationResult } from './types'

export interface ImageGenerationProvider {
  name: string
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>
}

export interface ImageGenerationProviderOptions {
  maxRetries?: number
  retryDelayMs?: number
  timeoutMs?: number
}

