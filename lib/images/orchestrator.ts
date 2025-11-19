import { ImageGenerationRequest, ImageGenerationResult } from './generation/types'
import { ImageGenerationService } from './generation/service'
import { ImageGenerationQueue } from './generation/queue'
import { extractPalette, Palette } from './palette'

export interface HeroImageWithPalette {
  image: ImageGenerationResult
  palette: Palette
}

export interface ImageOrchestratorOptions {
  service: ImageGenerationService
  queue?: ImageGenerationQueue
  autoExtractPalette?: boolean
}

export class ImageOrchestrator {
  private queue: ImageGenerationQueue

  constructor(private options: ImageOrchestratorOptions) {
    this.queue = options.queue ?? new ImageGenerationQueue(options.service)
  }

  async generateHeroImageWithPalette(
    request: ImageGenerationRequest,
    options?: { forceNew?: boolean }
  ): Promise<HeroImageWithPalette> {
    const jobId = await this.queue.requestHeroImage(request, options)
    const job = await this.queue.pollJob(jobId)

    if (!job.result) {
      throw job.error ?? new Error('Image generation failed')
    }

    let palette: Palette
    if (this.options.autoExtractPalette !== false) {
      palette = await extractPalette({ url: job.result.url })
    } else {
      palette = {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      }
    }

    return {
      image: job.result,
      palette,
    }
  }
}

