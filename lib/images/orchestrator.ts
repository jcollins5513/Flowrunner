import { ImageGenerationRequest, ImageGenerationResult } from './generation/types'
import { ImageGenerationService } from './generation/service'
import { ImageGenerationQueue } from './generation/queue'
import { extractPalette, Palette } from './palette'
import { inferVibe, type Vibe, type VibeAnalysis } from './vibe'
import { ImageRepository } from './repository'

export interface HeroImageWithPalette {
  image: ImageGenerationResult
  palette: Palette
  vibe?: Vibe
  vibeAnalysis?: VibeAnalysis
  imageId?: string
}

export interface ImageOrchestratorOptions {
  service: ImageGenerationService
  queue?: ImageGenerationQueue
  autoExtractPalette?: boolean
  autoInferVibe?: boolean
  autoPersist?: boolean
  userId?: string
  repository?: ImageRepository
}

export class ImageOrchestrator {
  private queue: ImageGenerationQueue
  private repository: ImageRepository

  constructor(private options: ImageOrchestratorOptions) {
    this.queue = options.queue ?? new ImageGenerationQueue(options.service)
    this.repository = options.repository ?? new ImageRepository()
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

    // Infer vibe if enabled
    let vibe: Vibe | undefined
    let vibeAnalysis: VibeAnalysis | undefined
    if (this.options.autoInferVibe !== false) {
      vibeAnalysis = await inferVibe({
        url: job.result.url,
        palette,
      })
      vibe = vibeAnalysis.vibe
    }

    // Persist image if enabled
    let imageId: string | undefined
    if (this.options.autoPersist !== false) {
      try {
        const savedImage = await this.repository.saveImage({
          url: job.result.url,
          prompt: job.result.prompt,
          seed: job.result.seed,
          aspectRatio: job.result.aspectRatio,
          style: job.result.style,
          palette,
          vibe,
          domain: request.visualTheme ? undefined : undefined, // Can be extracted from request if needed
          userId: this.options.userId ?? null,
        })
        imageId = savedImage.id
      } catch (error) {
        console.warn('Failed to persist image:', error)
        // Don't throw - image generation succeeded, persistence is optional
      }
    }

    return {
      image: job.result,
      palette,
      vibe,
      vibeAnalysis,
      imageId,
    }
  }
}

