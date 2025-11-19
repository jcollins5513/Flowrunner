import { Intent } from '../intent.schema'
import { IntentProvider, IntentProviderInput, IntentProviderResult } from '../interpreter'

export interface MockIntentProviderOptions {
  shouldFail?: boolean
  fixedResponse?: IntentProviderResult
  latencyMs?: number
}

const keywordMap: Record<Intent['domain'], string[]> = {
  ecommerce: ['shop', 'store', 'checkout', 'cart', 'retail'],
  saas: ['dashboard', 'metrics', 'subscription', 'onboarding', 'saas'],
  mobile_app: ['mobile', 'app', 'gesture', 'ios', 'android'],
  marketing: ['campaign', 'landing', 'promo', 'hero'],
  finance: ['finance', 'bank', 'portfolio', 'investment'],
  healthcare: ['health', 'wellness', 'clinic', 'care', 'medical'],
}

const toneByKeyword: Record<string, Intent['tone']> = {
  playful: 'friendly',
  epic: 'bold',
  calm: 'calm',
  energetic: 'energetic',
}

const colorMoodByKeyword: Record<string, Intent['colorMood']> = {
  neon: 'neon',
  muted: 'muted',
  warm: 'warm',
  cool: 'cool',
}

const selectDomain = (prompt: string): Intent['domain'] => {
  for (const [domain, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => prompt.includes(keyword))) {
      return domain as Intent['domain']
    }
  }
  return 'saas'
}

const selectTone = (prompt: string): Intent['tone'] => {
  for (const [keyword, tone] of Object.entries(toneByKeyword)) {
    if (prompt.includes(keyword)) {
      return tone
    }
  }
  return 'professional'
}

const selectColorMood = (prompt: string): Intent['colorMood'] => {
  for (const [keyword, mood] of Object.entries(colorMoodByKeyword)) {
    if (prompt.includes(keyword)) {
      return mood
    }
  }
  return 'vibrant'
}

const selectStyleCues = (prompt: string): Intent['styleCues'] => {
  const cues: Intent['styleCues'] = []
  if (prompt.includes('minimal')) cues.push('minimal')
  if (prompt.includes('luxury')) cues.push('luxury')
  if (prompt.includes('retro')) cues.push('retro')
  if (cues.length === 0) cues.push('modern')
  return cues.slice(0, 3)
}

const selectVisualTheme = (prompt: string): Intent['visualTheme'] => {
  if (prompt.includes('3d')) return '3d'
  if (prompt.includes('photo')) return 'photographic'
  if (prompt.includes('collage')) return 'collage'
  if (prompt.includes('line')) return 'line_art'
  return 'illustrated'
}

export class MockIntentProvider implements IntentProvider {
  public readonly name = 'mock-intent-provider'

  constructor(private options: MockIntentProviderOptions = {}) {}

  async generateIntent(input: IntentProviderInput): Promise<IntentProviderResult> {
    if (this.options.shouldFail) {
      throw new Error('Mock provider forced failure')
    }

    if (this.options.latencyMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.latencyMs))
    }

    if (this.options.fixedResponse) {
      return this.options.fixedResponse
    }

    const prompt = input.normalizedPrompt
    return {
      domain: selectDomain(prompt),
      styleCues: selectStyleCues(prompt),
      visualTheme: selectVisualTheme(prompt),
      tone: selectTone(prompt),
      colorMood: selectColorMood(prompt),
      confidence: {
        domain: 0.85,
        style: 0.75,
        theme: 0.7,
        tone: 0.65,
        color: 0.6,
      },
      metadata: {
        provider: this.name,
        normalizedPrompt: prompt,
        locale: input.locale ?? 'default',
      },
    }
  }
}
