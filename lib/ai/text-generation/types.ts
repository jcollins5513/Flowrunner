export type TextFieldType = 'title' | 'subtitle' | 'body' | 'buttonLabel' | 'formLabel'

export interface TextLengthConstraints {
  title: number
  subtitle: number
  body: number
  buttonLabel: number
  formLabel: number
}

export const DEFAULT_LENGTH_CONSTRAINTS: TextLengthConstraints = {
  title: 72,
  subtitle: 140,
  body: 320,
  buttonLabel: 28,
  formLabel: 48,
}

export interface TextGenerationInput {
  prompt: string
  normalizedPrompt?: string
  vibe?: string
  tone?: string
  audience?: string
  locale?: string
  patternFamily?: string
  screenPurpose?: string
  heroDescription?: string
  actions?: string[]
  formFields?: string[]
  existingCopy?: Partial<TextGenerationResult>
  lengthConstraints?: Partial<TextLengthConstraints>
  cacheKey?: string
}

export interface TextGenerationResult {
  title: string
  subtitle: string
  body: string
  buttonLabels: string[]
  formLabels: string[]
  metadata?: {
    model?: string
    completionId?: string
    provider?: string
    cacheHit?: boolean
  }
}

export interface TextGenerationProvider {
  generate(input: TextGenerationInput, constraints: TextLengthConstraints): Promise<TextGenerationResult>
}
