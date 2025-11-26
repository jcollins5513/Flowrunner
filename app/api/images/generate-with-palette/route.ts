import { NextRequest, NextResponse } from 'next/server'
import { ImageOrchestrator } from '@/lib/images/orchestrator'
import { ImageGenerationService } from '@/lib/images/generation/service'
import { MockImageProvider } from '@/lib/images/generation/providers/mock'
import type { ImageGenerationRequest } from '@/lib/images/generation/types'

export const dynamic = 'force-dynamic'

const VALID_VISUAL_THEMES = ['illustrated', 'photographic', '3d', 'collage', 'line_art'] as const
type ValidVisualTheme = (typeof VALID_VISUAL_THEMES)[number]

function isValidVisualTheme(value: string | undefined): value is ValidVisualTheme {
  return value !== undefined && VALID_VISUAL_THEMES.includes(value as ValidVisualTheme)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio, visualTheme, autoExtractPalette, autoInferVibe, autoPersist } = body as {
      prompt: string
      aspectRatio?: string
      visualTheme?: string
      autoExtractPalette?: boolean
      autoInferVibe?: boolean
      autoPersist?: boolean
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const orchestrator = new ImageOrchestrator({
      service: new ImageGenerationService({ provider: new MockImageProvider() }),
      autoExtractPalette: autoExtractPalette !== false,
      autoInferVibe: autoInferVibe !== false,
      autoPersist: autoPersist !== false,
    })

    const requestData: ImageGenerationRequest = {
      prompt,
      aspectRatio: (aspectRatio as any) || '16:9',
      visualTheme: isValidVisualTheme(visualTheme) ? visualTheme : undefined,
    }

    const result = await orchestrator.generateHeroImageWithPalette(requestData)

    return NextResponse.json({
      image: result.image,
      palette: result.palette,
      vibe: result.vibe,
      vibeAnalysis: result.vibeAnalysis,
      imageId: result.imageId,
    })
  } catch (error) {
    console.error('Error generating image with palette:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

