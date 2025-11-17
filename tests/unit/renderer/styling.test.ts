import { describe, it, expect } from 'vitest'
import { applyPaletteStyles, applyVibeStyles } from '@/lib/renderer/styling'

describe('renderer styling utilities', () => {
  it('applies palette colors to styles', () => {
    const styles = applyPaletteStyles({
      primary: '#111111',
      secondary: '#222222',
      accent: '#333333',
      background: '#ffffff',
    })

    expect(styles).toMatchObject({ color: '#111111' })
  })

  it('returns vibe-specific typography tokens', () => {
    const professional = applyVibeStyles('professional')
    const playful = applyVibeStyles('playful')

    expect(professional.fontWeight).toBe(400)
    expect(playful.fontWeight).toBe(500)
  })
})

