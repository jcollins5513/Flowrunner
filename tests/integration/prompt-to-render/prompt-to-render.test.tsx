import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { assembleScreenFromPrompt } from '@/lib/flow/prompt-to-render'
import type { HeroImageWithPalette } from '@/lib/images/orchestrator'
import type { ScreenDSL } from '@/lib/dsl/types'
import { persistHeroImageMetadata } from '@/lib/db/hero-image-persistence'

vi.mock('@/lib/db/hero-image-persistence', () => ({
  persistHeroImageMetadata: vi.fn(async (heroImage: HeroImageWithPalette) => ({
    id: heroImage.imageId ?? 'persisted-hero-id',
  })),
}))

describe('Prompt → render pipeline', () => {
  const heroImage: HeroImageWithPalette = {
    image: {
      url: 'https://example.com/hero.png',
      prompt: 'test hero',
      seed: 42,
      aspectRatio: '16:9',
      style: 'clay',
    },
    palette: {
      primary: '#123456',
      secondary: '#abcdef',
      accent: '#fedcba',
      background: '#654321',
      text: '#111111',
    },
    vibe: 'playful',
    imageId: 'hero-image-fixture',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('assembles a screen from prompt with palette + vibe flowing into the renderer', async () => {
    const result = await assembleScreenFromPrompt('friendly onboarding hero', {
      prebuiltHeroImage: heroImage,
      persist: false,
    })

    expect(result.screenDSL.palette.primary).toBe('#123456')
    expect(result.screenDSL.hero_image.extractedPalette?.primary).toBe('#123456')
    expect(result.screenDSL.vibe).toBe('playful')
    expect(persistHeroImageMetadata).toHaveBeenCalled()

    render(<ScreenRenderer dsl={result.screenDSL} />)

    await waitFor(() => {
      expect(screen.queryByText(/DSL Validation Failed/i)).toBeNull()
      expect(screen.getByText(/Continue/i)).toBeInTheDocument()
    })
  })

  it('blocks invalid palettes via Zod validation before rendering', async () => {
    const invalidDSL: ScreenDSL = {
      hero_image: {
        id: 'invalid',
        url: 'https://example.com/invalid.png',
      },
      palette: {
        primary: 'blue' as unknown as '#000',
        secondary: '#ffffff',
        accent: '#ff0000',
        background: '#000000',
      },
      vibe: 'modern',
      pattern_family: 'ONB_HERO_TOP',
      pattern_variant: 1,
      components: [
        { type: 'title', content: 'Bad palette' },
        { type: 'button', content: 'Continue' },
      ],
    }

    render(<ScreenRenderer dsl={invalidDSL} />)

    expect(
      await screen.findByText(/DSL Validation Failed/i, { selector: 'h3,div,p,span' })
    ).toBeInTheDocument()
  })
})

