import { vi } from 'vitest'
import { IntentInterpreter } from '@/lib/ai/intent/interpreter'
import { MockIntentProvider } from '@/lib/ai/intent/providers/mock'
import { ImageOrchestrator } from '@/lib/images/orchestrator'
import { ImageGenerationService } from '@/lib/images/generation/service'
import { MockImageProvider } from '@/lib/images/generation/providers/mock'
import * as paletteModule from '@/lib/images/palette'
import * as vibeModule from '@/lib/images/vibe'
import type { VibeAnalysis } from '@/lib/images/vibe'
import type { Palette } from '@/lib/images/palette'

export const pipelinePrompt =
  'Compose a SaaS onboarding hero with modern minimal styling and cool colors'

export const deterministicPalette: Palette = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#38bdf8',
  background: '#e2e8f0',
  text: '#0b1224',
}

export const deterministicVibe: VibeAnalysis = {
  vibe: 'modern',
  confidence: 0.98,
  characteristics: {
    colorSaturation: 0.35,
    visualWeight: 0.42,
    compositionComplexity: 0.28,
    colorTemperature: -0.2,
    brightness: 0.64,
  },
}

export const createDeterministicInterpreter = () =>
  new IntentInterpreter(
    new MockIntentProvider({
      fixedResponse: {
        domain: 'saas',
        styleCues: ['modern', 'minimal'],
        visualTheme: 'illustrated',
        tone: 'friendly',
        colorMood: 'cool',
        confidence: {
          domain: 0.99,
          style: 0.99,
          theme: 0.99,
          tone: 0.99,
          color: 0.99,
        },
        metadata: { recordingId: 'integration-deterministic' },
      },
    }),
    {
      providerMetadata: { testFixture: 'prompt-pipeline' },
    }
  )

export const createDeterministicOrchestrator = () =>
  new ImageOrchestrator({
    service: new ImageGenerationService({
      provider: new MockImageProvider({
        fixedUrl: 'https://example.com/integration-hero.png',
        latencyMs: 0,
      }),
    }),
    autoExtractPalette: true,
    autoInferVibe: true,
    autoPersist: false,
  })

export const mockImageAnalysis = () => {
  const paletteSpy = vi
    .spyOn(paletteModule, 'extractPalette')
    .mockResolvedValue(deterministicPalette)

  const vibeSpy = vi.spyOn(vibeModule, 'inferVibe').mockResolvedValue(deterministicVibe)

  return { paletteSpy, vibeSpy }
}
