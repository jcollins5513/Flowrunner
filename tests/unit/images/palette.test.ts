import { describe, expect, it, vi, beforeEach } from 'vitest'
import { extractPalette, validateContrast, paletteSchema } from '../../../lib/images/palette'

vi.mock('node-vibrant', () => ({
  default: {
    from: vi.fn(() => ({
      getPalette: vi.fn(() =>
        Promise.resolve({
          Vibrant: { hex: '#FF5733' },
          Muted: { hex: '#8B4513' },
          LightVibrant: { hex: '#FFB347' },
          LightMuted: { hex: '#F5DEB3' },
          DarkVibrant: { hex: '#8B0000' },
          DarkMuted: { hex: '#2F4F4F' },
        })
      ),
    })),
  },
}))

describe('Palette Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts palette from image URL', async () => {
    const palette = await extractPalette({ url: 'https://example.com/test.jpg' })

    expect(palette.primary).toBe('#FF5733')
    expect(palette.secondary).toBeDefined()
    expect(palette.accent).toBeDefined()
    expect(paletteSchema.parse(palette)).toBeDefined()
  })

  it('uses fallback palette on extraction failure', async () => {
    const Vibrant = await import('node-vibrant')
    vi.mocked(Vibrant.default.from).mockImplementationOnce(() => {
      throw new Error('Extraction failed')
    })

    const fallback = {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#FF0000',
      background: '#F0F0F0',
      text: '#333333',
    }

    const palette = await extractPalette({
      url: 'https://example.com/broken.jpg',
      fallback,
    })

    expect(palette.primary).toBe('#000000')
    expect(palette.secondary).toBe('#FFFFFF')
  })

  it('validates contrast ratios', () => {
    expect(validateContrast('#000000', '#FFFFFF', 4.5)).toBe(true)
    expect(validateContrast('#FFFFFF', '#FFFFFF', 4.5)).toBe(false)
    expect(validateContrast('#333333', '#FFFFFF', 4.5)).toBe(true)
  })

  it('adjusts text color for accessibility when contrast is low', async () => {
    const Vibrant = await import('node-vibrant')
    vi.mocked(Vibrant.default.from).mockImplementationOnce(() => ({
      getPalette: vi.fn(() =>
        Promise.resolve({
          Vibrant: { hex: '#FFFFFF' },
          Muted: { hex: '#FFFFFF' },
          LightVibrant: { hex: '#FFFFFF' },
          LightMuted: { hex: '#FFFFFF' },
          DarkVibrant: { hex: '#FFFFFF' },
          DarkMuted: { hex: '#FFFFFF' },
        })
      ),
    }))

    const palette = await extractPalette({
      url: 'https://example.com/low-contrast.jpg',
      minContrast: 4.5,
    })

    expect(palette.text).toBe('#1F2937')
  })
})

