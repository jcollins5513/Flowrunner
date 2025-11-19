import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  analyzeColorSaturation,
  analyzeVisualWeight,
  analyzeComposition,
  analyzeMoodIndicators,
} from '../../../../lib/images/vibe/analyzer'
import type { Palette } from '../../../../lib/images/palette'

vi.mock('node-vibrant', () => ({
  default: {
    from: vi.fn(() => ({
      getPalette: vi.fn(() =>
        Promise.resolve({
          Vibrant: { hex: '#FF5733', hsl: [10, 0.8, 0.6] },
          Muted: { hex: '#8B4513', hsl: [25, 0.5, 0.4] },
          LightVibrant: { hex: '#FFB347', hsl: [30, 0.7, 0.7] },
          LightMuted: { hex: '#F5DEB3', hsl: [35, 0.3, 0.8] },
          DarkVibrant: { hex: '#8B0000', hsl: [0, 1.0, 0.3] },
          DarkMuted: { hex: '#2F4F4F', hsl: [180, 0.3, 0.3] },
        })
      ),
    })),
  },
}))

vi.mock('sharp', () => {
  return {
    default: vi.fn((buffer: Buffer) => ({
      greyscale: vi.fn().mockReturnThis(),
      normalize: vi.fn().mockReturnThis(),
      stats: vi.fn(() =>
        Promise.resolve({
          channels: [
            {
              mean: 128,
              stdev: 64,
            },
          ],
        })
      ),
      metadata: vi.fn(() =>
        Promise.resolve({
          width: 1920,
          height: 1080,
        })
      ),
    })),
  }
})

// Mock fetch for image URLs
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  } as Response)
) as typeof fetch

describe('Vibe Analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('analyzeColorSaturation', () => {
    it('calculates average saturation from vibrant palette', async () => {
      const saturation = await analyzeColorSaturation('https://example.com/test.jpg')
      
      // Should calculate average of HSL saturation values
      // (0.8 + 0.5 + 0.7 + 0.3 + 1.0 + 0.3) / 6 ≈ 0.583
      expect(saturation).toBeGreaterThan(0.4)
      expect(saturation).toBeLessThan(0.7)
      expect(saturation).toBeGreaterThanOrEqual(0)
      expect(saturation).toBeLessThanOrEqual(1)
    })

    it('returns default saturation on error', async () => {
      const Vibrant = await import('node-vibrant')
      vi.mocked(Vibrant.default.from).mockImplementationOnce(() => {
        throw new Error('Extraction failed')
      })

      const saturation = await analyzeColorSaturation('https://example.com/broken.jpg')
      expect(saturation).toBe(0.5)
    })
  })

  describe('analyzeVisualWeight', () => {
    it('calculates visual weight from image brightness and contrast', async () => {
      const weight = await analyzeVisualWeight('https://example.com/test.jpg')
      
      expect(weight).toBeGreaterThanOrEqual(0)
      expect(weight).toBeLessThanOrEqual(1)
    })

    it('returns default visual weight on error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Fetch failed'))) as typeof fetch

      const weight = await analyzeVisualWeight('https://example.com/broken.jpg')
      expect(weight).toBe(0.5)
    })
  })

  describe('analyzeComposition', () => {
    it('analyzes image dimensions and aspect ratio', async () => {
      // Ensure fetch is properly mocked
      global.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        } as Response)
      ) as typeof fetch

      const composition = await analyzeComposition('https://example.com/test.jpg')
      
      expect(composition.width).toBe(1920)
      expect(composition.height).toBe(1080)
      expect(composition.aspectRatio).toBeCloseTo(1920 / 1080, 2)
      expect(composition.isLandscape).toBe(true)
      expect(composition.isPortrait).toBe(false)
      expect(composition.isSquare).toBe(false)
    })

    it('handles square images', async () => {
      // Ensure fetch is properly mocked
      global.fetch = vi.fn(() =>
        Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        } as Response)
      ) as typeof fetch

      const sharp = await import('sharp')
      vi.mocked(sharp.default).mockImplementationOnce((buffer: Buffer) => ({
        metadata: vi.fn(() =>
          Promise.resolve({
            width: 1000,
            height: 1000,
          })
        ),
      }))

      const composition = await analyzeComposition('https://example.com/square.jpg')
      expect(composition.isSquare).toBe(true)
    })

    it('returns default composition on error', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Fetch failed'))) as typeof fetch

      const composition = await analyzeComposition('https://example.com/broken.jpg')
      expect(composition.aspectRatio).toBe(1)
      expect(composition.isSquare).toBe(true)
    })
  })

  describe('analyzeMoodIndicators', () => {
    const mockPalette: Palette = {
      primary: '#FF5733',
      secondary: '#8B4513',
      accent: '#FFB347',
      background: '#FFFFFF',
      text: '#1F2937',
    }

    it('analyzes mood indicators from palette and visual weight', async () => {
      const mood = await analyzeMoodIndicators('https://example.com/test.jpg', mockPalette, 0.6)
      
      expect(mood.colorTemperature).toBeGreaterThanOrEqual(-1)
      expect(mood.colorTemperature).toBeLessThanOrEqual(1)
      expect(mood.saturation).toBeGreaterThanOrEqual(0)
      expect(mood.saturation).toBeLessThanOrEqual(1)
      expect(mood.brightness).toBe(0.6)
      expect(mood.contrast).toBeGreaterThanOrEqual(0)
      expect(mood.contrast).toBeLessThanOrEqual(1)
    })
  })
})

