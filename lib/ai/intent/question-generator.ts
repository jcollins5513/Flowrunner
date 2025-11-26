import type { Intent, IntentConfidence } from './intent.schema'

export interface FollowUpQuestion {
  id: string
  field: 'domain' | 'styleCues' | 'visualTheme' | 'tone' | 'colorMood'
  question: string
  type: 'select' | 'multi-select' | 'text'
  options?: Array<{ value: string; label: string }>
  required: boolean
}

export interface PromptAnalysisResult {
  sufficient: boolean
  intent?: Intent
  questions?: FollowUpQuestion[]
  partialIntent?: Partial<Intent>
}

const CONFIDENCE_THRESHOLD = 0.5 // If confidence is below this, ask follow-up

const DOMAIN_OPTIONS = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
]

const STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'modern', label: 'Modern' },
  { value: 'playful', label: 'Playful' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'retro', label: 'Retro' },
  { value: 'futuristic', label: 'Futuristic' },
]

const VISUAL_THEME_OPTIONS = [
  { value: 'illustrated', label: 'Illustrated' },
  { value: 'photographic', label: 'Photographic' },
  { value: '3d', label: '3D' },
  { value: 'collage', label: 'Collage' },
  { value: 'line_art', label: 'Line Art' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'bold', label: 'Bold' },
  { value: 'calm', label: 'Calm' },
  { value: 'energetic', label: 'Energetic' },
]

const COLOR_MOOD_OPTIONS = [
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'muted', label: 'Muted' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neon', label: 'Neon' },
  { value: 'monochrome', label: 'Monochrome' },
]

/**
 * Analyze if an Intent has sufficient information or needs follow-up questions
 */
export function analyzeIntentCompleteness(intent: Intent): PromptAnalysisResult {
  const confidence = intent.confidence
  const questions: FollowUpQuestion[] = []

  // Check domain confidence
  if (confidence.domain < CONFIDENCE_THRESHOLD) {
    questions.push({
      id: 'domain',
      field: 'domain',
      question: 'What domain or industry is this for?',
      type: 'select',
      options: DOMAIN_OPTIONS,
      required: false,
    })
  }

  // Check style confidence
  if (confidence.style < CONFIDENCE_THRESHOLD) {
    questions.push({
      id: 'style',
      field: 'styleCues',
      question: 'What style should this have? (Select up to 3)',
      type: 'multi-select',
      options: STYLE_OPTIONS,
      required: false,
    })
  }

  // Check visual theme confidence
  if (confidence.theme < CONFIDENCE_THRESHOLD) {
    questions.push({
      id: 'visualTheme',
      field: 'visualTheme',
      question: 'What visual style should the images use?',
      type: 'select',
      options: VISUAL_THEME_OPTIONS,
      required: false,
    })
  }

  // Check tone confidence
  if (confidence.tone < CONFIDENCE_THRESHOLD) {
    questions.push({
      id: 'tone',
      field: 'tone',
      question: 'What tone should the messaging have?',
      type: 'select',
      options: TONE_OPTIONS,
      required: false,
    })
  }

  // Check color mood confidence
  if (confidence.color < CONFIDENCE_THRESHOLD) {
    questions.push({
      id: 'colorMood',
      field: 'colorMood',
      question: 'What color mood should the design have?',
      type: 'select',
      options: COLOR_MOOD_OPTIONS,
      required: false,
    })
  }

  // If fallback was applied, we definitely need more info
  if (intent.fallback?.applied) {
    questions.push({
      id: 'general',
      field: 'domain', // Use domain as placeholder (not used for text type)
      question: intent.fallback.reason || 'Could you provide more details about what you\'re building?',
      type: 'text',
      required: true,
    } as FollowUpQuestion)
  }

  if (questions.length > 0) {
    return {
      sufficient: false,
      questions,
      partialIntent: {
        domain: intent.domain,
        styleCues: intent.styleCues,
        visualTheme: intent.visualTheme,
        tone: intent.tone,
        colorMood: intent.colorMood,
      },
    }
  }

  return {
    sufficient: true,
    intent,
  }
}

