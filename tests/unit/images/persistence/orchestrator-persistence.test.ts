import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ImageOrchestrator } from '../../../../lib/images/orchestrator'
import { ImageGenerationService } from '../../../../lib/images/generation/service'
import { ImageGenerationQueue } from '../../../../lib/images/generation/queue'
import { MockImageProvider } from '../../../../lib/images/generation/providers/mock'

// Mock node-vibrant (required by vibe analyzer)
vi.mock('node-vibrant/node', () => {
  const mockModule = {
    from: vi.fn(() => ({
      getPalette: vi.fn(() => Promise.resolve({})),
    })),
  }

  return { default: mockModule, Vibrant: mockModule }
})

// Mock sharp (required by vibe analyzer)
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    greyscale: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    stats: vi.fn(() => Promise.resolve({ channels: [{ mean: 128, stdev: 64 }] })),
    metadata: vi.fn(() => Promise.resolve({ width: 1920, height: 1080 })),
  })),
}))

// Mock fetch (required by vibe analyzer)
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  } as Response)
) as typeof fetch

// Mock image repository
const mockSaveImage = vi.fn()
vi.mock('../../../../lib/images/repository', () => ({
  ImageRepository: vi.fn().mockImplementation(() => ({
    saveImage: mockSaveImage,
  })),
}))

// Mock palette extraction
vi.mock('../../../../lib/images/palette', () => ({
  extractPalette: vi.fn(() =>
    Promise.resolve({
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1F2937',
    })
  ),
}))

// Mock vibe inference
vi.mock('../../../../lib/images/vibe/infer', () => ({
  inferVibe: vi.fn(() =>
    Promise.resolve({
      vibe: 'modern',
      confidence: 0.85,
      characteristics: {
        colorSaturation: 0.6,
        visualWeight: 0.5,
        compositionComplexity: 0.4,
        colorTemperature: -0.2,
        brightness: 0.6,
      },
    })
  ),
}))

describe('ImageOrchestrator Persistence', () => {
  let orchestrator: ImageOrchestrator
  let service: ImageGenerationService
  let queue: ImageGenerationQueue

  beforeEach(() => {
    vi.clearAllMocks()
    const provider = new MockImageProvider()
    service = new ImageGenerationService({ provider })
    queue = new ImageGenerationQueue(service)
  })

  it('persists image when autoPersist is enabled', async () => {
    mockSaveImage.mockResolvedValue({
      id: 'saved-image-123',
      url: 'https://example.com/image.jpg',
    })

    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: true,
      userId: 'user-123',
    })

    const request = {
      prompt: 'A modern workspace',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
    }

    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.imageId).toBe('saved-image-123')
    expect(mockSaveImage).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.any(String),
        prompt: 'A modern workspace',
        aspectRatio: '16:9',
        style: 'photographic',
        palette: expect.any(Object),
        vibe: 'modern',
        userId: 'user-123',
      })
    )
  })

  it('does not persist when autoPersist is disabled', async () => {
    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: false,
    })

    const request = {
      prompt: 'A modern workspace',
      aspectRatio: '16:9' as const,
    }

    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.imageId).toBeUndefined()
    expect(mockSaveImage).not.toHaveBeenCalled()
  })

  it('persists by default when autoPersist is not specified', async () => {
    mockSaveImage.mockResolvedValue({
      id: 'saved-image-456',
      url: 'https://example.com/image.jpg',
    })

    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
    })

    const request = {
      prompt: 'A modern workspace',
      aspectRatio: '16:9' as const,
    }

    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.imageId).toBe('saved-image-456')
    expect(mockSaveImage).toHaveBeenCalled()
  })

  it('handles persistence errors gracefully', async () => {
    mockSaveImage.mockRejectedValue(new Error('Database error'))

    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: true,
    })

    const request = {
      prompt: 'A modern workspace',
      aspectRatio: '16:9' as const,
    }

    // Should not throw - persistence failure should not break generation
    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.image).toBeDefined()
    expect(result.imageId).toBeUndefined() // Not saved due to error
    expect(mockSaveImage).toHaveBeenCalled()
  })

  it('includes all metadata in persisted image', async () => {
    mockSaveImage.mockResolvedValue({
      id: 'saved-image-789',
      url: 'https://example.com/image.jpg',
    })

    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: true,
      userId: 'user-456',
    })

    const request = {
      prompt: 'A beautiful sunset',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
      seed: 12345,
    }

    await orchestrator.generateHeroImageWithPalette(request)

    expect(mockSaveImage).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.any(String),
        prompt: 'A beautiful sunset',
        seed: 12345,
        aspectRatio: '16:9',
        style: 'photographic',
        palette: expect.objectContaining({
          primary: expect.any(String),
        }),
        vibe: 'modern',
        userId: 'user-456',
      })
    )
  })
})

