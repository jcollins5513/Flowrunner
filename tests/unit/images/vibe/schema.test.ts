import { describe, expect, it } from 'vitest'
import { vibeSchema, type Vibe } from '../../../../lib/images/vibe/schema'

describe('Vibe Schema', () => {
  it('validates all valid vibe values', () => {
    const validVibes: Vibe[] = [
      'playful',
      'professional',
      'bold',
      'minimal',
      'modern',
      'retro',
      'elegant',
      'energetic',
      'calm',
      'tech',
      'creative',
      'corporate',
    ]

    for (const vibe of validVibes) {
      expect(vibeSchema.parse(vibe)).toBe(vibe)
    }
  })

  it('rejects invalid vibe values', () => {
    expect(() => vibeSchema.parse('invalid')).toThrow()
    expect(() => vibeSchema.parse('')).toThrow()
    expect(() => vibeSchema.parse('playful ')).toThrow()
    expect(() => vibeSchema.parse(123)).toThrow()
  })
})

