import { describe, expect, it, vi, beforeEach } from 'vitest'
import { inferVibe } from '../../../../lib/images/vibe/infer'
import type { Palette } from '../../../../lib/images/palette'

// Mock the analyzer functions
vi.mock('../../../../lib/images/vibe/analyzer', () => ({
  analyzeColorSaturation: vi.fn(() => Promise.resolve(0.7)),
  analyzeVisualWeight: vi.fn(() => Promise.resolve(0.6)),
  analyzeComposition: vi.fn(() =>
    Promise.resolve({
      aspectRatio: 16 / 9,
      width: 1920,
      height: 1080,
      isPortrait: false,
      isLandscape: true,
      isSquare: false,
    })
  ),
  analyzeMoodIndicators: vi.fn(() =>
    Promise.resolve({
      colorTemperature: 0.3,
      saturation: 0.7,
      brightness: 0.6,
      contrast: 0.5,
    })
  ),
}))

// Mock node-vibrant and sharp
vi.mock('node-vibrant', () => ({
  default: {
    from: vi.fn(() => ({
      getPalette: vi.fn(() => Promise.resolve({})),
    })),
  },
}))

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    greyscale: vi.fn().mockReturnThis(),
    normalize: vi.fn().mockReturnThis(),
    stats: vi.fn(() => Promise.resolve({ channels: [{ mean: 128, stdev: 64 }] })),
    metadata: vi.fn(() => Promise.resolve({ width: 1920, height: 1080 })),
  })),
}))

global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  } as Response)
) as typeof fetch

describe('Vibe Inference', () => {
  const mockPalette: Palette = {
    primary: '#FF5733',
    secondary: '#8B4513',
    accent: '#FFB347',
    background: '#FFFFFF',
    text: '#1F2937',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('infers vibe from image characteristics', async () => {
    const result = await inferVibe({
      url: 'https://example.com/test.jpg',
      palette: mockPalette,
    })

    expect(result.vibe).toBeDefined()
    expect(['playful', 'professional', 'bold', 'minimal', 'modern', 'retro', 'elegant', 'energetic', 'calm', 'tech', 'creative', 'corporate']).toContain(result.vibe)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
    expect(result.characteristics).toBeDefined()
    expect(result.characteristics.colorSaturation).toBeDefined()
    expect(result.characteristics.visualWeight).toBeDefined()
  })

  it('respects manual vibe override', async () => {
    const result = await inferVibe({
      url: 'https://example.com/test.jpg',
      palette: mockPalette,
      manualOverride: 'minimal',
    })

    expect(result.vibe).toBe('minimal')
    expect(result.confidence).toBe(1.0)
  })

  it('includes reasoning when requested', async () => {
    const result = await inferVibe({
      url: 'https://example.com/test.jpg',
      palette: mockPalette,
      includeReasoning: true,
    })

    expect(result.reasoning).toBeDefined()
    expect(Array.isArray(result.reasoning)).toBe(true)
    if (result.reasoning) {
      expect(result.reasoning.length).toBeGreaterThan(0)
    }
  })

  it('does not include reasoning by default', async () => {
    const result = await inferVibe({
      url: 'https://example.com/test.jpg',
      palette: mockPalette,
    })

    expect(result.reasoning).toBeUndefined()
  })

  it('returns valid vibe analysis structure', async () => {
    const result = await inferVibe({
      url: 'https://example.com/test.jpg',
      palette: mockPalette,
    })

    expect(result.characteristics.colorSaturation).toBeGreaterThanOrEqual(0)
    expect(result.characteristics.colorSaturation).toBeLessThanOrEqual(1)
    expect(result.characteristics.visualWeight).toBeGreaterThanOrEqual(0)
    expect(result.characteristics.visualWeight).toBeLessThanOrEqual(1)
    expect(result.characteristics.compositionComplexity).toBeGreaterThanOrEqual(0)
    expect(result.characteristics.compositionComplexity).toBeLessThanOrEqual(1)
    expect(result.characteristics.colorTemperature).toBeGreaterThanOrEqual(-1)
    expect(result.characteristics.colorTemperature).toBeLessThanOrEqual(1)
    expect(result.characteristics.brightness).toBeGreaterThanOrEqual(0)
    expect(result.characteristics.brightness).toBeLessThanOrEqual(1)
  })
})

