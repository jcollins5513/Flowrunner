import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ImageOrchestrator } from '../../../../lib/images/orchestrator'
import { ImageGenerationService } from '../../../../lib/images/generation/service'
import { ImageGenerationQueue } from '../../../../lib/images/generation/queue'
import { MockImageProvider } from '../../../../lib/images/generation/providers/mock'

// Mock node-vibrant (required by vibe analyzer)
vi.mock('node-vibrant', () => ({
  default: {
    from: vi.fn(() => ({
      getPalette: vi.fn(() => Promise.resolve({})),
    })),
  },
}))

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

describe('Image Orchestrator with Vibe Inference', () => {
  let orchestrator: ImageOrchestrator
  let service: ImageGenerationService
  let queue: ImageGenerationQueue

  beforeEach(() => {
    vi.clearAllMocks()
    const provider = new MockImageProvider()
    service = new ImageGenerationService({ provider })
    queue = new ImageGenerationQueue(service)
    orchestrator = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: true,
    })
  })

  it('includes vibe in result when autoInferVibe is enabled', async () => {
    const request = {
      prompt: 'A modern tech workspace',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
    }

    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.vibe).toBe('modern')
    expect(result.vibeAnalysis).toBeDefined()
    expect(result.vibeAnalysis?.confidence).toBe(0.85)
    expect(result.vibeAnalysis?.characteristics).toBeDefined()
  })

  it('does not include vibe when autoInferVibe is disabled', async () => {
    const orchestratorWithoutVibe = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
      autoInferVibe: false,
    })

    const request = {
      prompt: 'A modern tech workspace',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
    }

    const result = await orchestratorWithoutVibe.generateHeroImageWithPalette(request)

    expect(result.vibe).toBeUndefined()
    expect(result.vibeAnalysis).toBeUndefined()
  })

  it('includes vibe by default when autoInferVibe is not specified', async () => {
    const orchestratorDefault = new ImageOrchestrator({
      service,
      queue,
      autoExtractPalette: true,
    })

    const request = {
      prompt: 'A modern tech workspace',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
    }

    const result = await orchestratorDefault.generateHeroImageWithPalette(request)

    expect(result.vibe).toBeDefined()
    expect(result.vibeAnalysis).toBeDefined()
  })

  it('includes both palette and vibe in result', async () => {
    const request = {
      prompt: 'A modern tech workspace',
      aspectRatio: '16:9' as const,
      style: 'photographic' as const,
    }

    const result = await orchestrator.generateHeroImageWithPalette(request)

    expect(result.palette).toBeDefined()
    expect(result.palette.primary).toBe('#3B82F6')
    expect(result.vibe).toBe('modern')
    expect(result.vibeAnalysis).toBeDefined()
  })
})

