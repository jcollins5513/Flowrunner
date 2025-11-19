import { describe, expect, it, vi } from 'vitest'
import { ImageGenerationService } from '../../../lib/images/generation/service'
import { MockImageProvider } from '../../../lib/images/generation/providers/mock'
import { imageGenerationRequestSchema } from '../../../lib/images/generation/types'

describe('ImageGenerationService', () => {
  it('generates image using configured provider', async () => {
    const provider = new MockImageProvider({ fixedUrl: 'https://example.com/test.png' })
    const service = new ImageGenerationService({ provider })

    const request = imageGenerationRequestSchema.parse({
      prompt: 'A beautiful sunset over mountains',
      aspectRatio: '16:9',
    })

    const result = await service.generateHeroImage(request)

    expect(result.url).toBe('https://example.com/test.png')
    expect(result.prompt).toBe('A beautiful sunset over mountains')
    expect(result.aspectRatio).toBe('16:9')
    expect(result.metadata.provider).toBe('mock-image-provider')
  })

  it('calls progress callback during generation', async () => {
    const provider = new MockImageProvider({ latencyMs: 50 })
    const onProgress = vi.fn()
    const service = new ImageGenerationService({ provider, onProgress })

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Test image',
      aspectRatio: '1:1',
    })

    await service.generateHeroImage(request)

    expect(onProgress).toHaveBeenCalledWith({ stage: 'generating', progress: 0 })
    expect(onProgress).toHaveBeenCalledWith({ stage: 'complete', progress: 100 })
  })

  it('handles provider failures gracefully', async () => {
    const provider = new MockImageProvider({ shouldFail: true })
    const onProgress = vi.fn()
    const service = new ImageGenerationService({ provider, onProgress })

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Test image',
      aspectRatio: '16:9',
    })

    await expect(service.generateHeroImage(request)).rejects.toThrow()
    expect(onProgress).toHaveBeenCalledWith({ stage: 'error', progress: 0 })
  })

  it('throws when no provider is configured', async () => {
    const service = new ImageGenerationService()
    const request = imageGenerationRequestSchema.parse({
      prompt: 'Test image',
      aspectRatio: '16:9',
    })

    await expect(service.generateHeroImage(request)).rejects.toThrow('No image generation provider')
  })
})

