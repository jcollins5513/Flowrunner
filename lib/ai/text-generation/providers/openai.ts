import OpenAI from 'openai'
import {
  TextGenerationInput,
  TextGenerationProvider,
  TextGenerationResult,
  TextLengthConstraints,
} from '../types'

export interface OpenAITextGenerationProviderOptions {
  apiKey?: string
  model?: string
  temperature?: number
  topP?: number
  systemPrompt?: string
}

interface OpenAITextGenerationResponse {
  title: string
  subtitle: string
  body: string
  buttonLabels: string[]
  formLabels: string[]
}

const defaultSystemPrompt = `You are FlowRunner's creative copywriter. Generate concise, product-ready UI text that matches the
vibe and tone while staying within strict character limits. Return JSON with keys: title, subtitle, body, buttonLabels (array), formLabels (array). Avoid quotes inside values.`

const buildUserPrompt = (input: TextGenerationInput, constraints: TextLengthConstraints): string => {
  const locale = input.locale ?? 'en-US'
  const actions = input.actions?.length ? `\nPrimary actions: ${input.actions.join(', ')}` : ''
  const formFields = input.formFields?.length ? `\nForm fields: ${input.formFields.join(', ')}` : ''
  const existingCopy = input.existingCopy ? `\nExisting copy to preserve tone: ${JSON.stringify(input.existingCopy)}` : ''
  const hero = input.heroDescription ? `\nHero image description: ${input.heroDescription}` : ''
  const pattern = input.patternFamily ? `\nPattern family: ${input.patternFamily}` : ''
  const purpose = input.screenPurpose ? `\nScreen purpose: ${input.screenPurpose}` : ''

  return [
    `Locale: ${locale}`,
    `Audience: ${input.audience ?? 'general'}`,
    `Vibe: ${input.vibe ?? 'aligned to prompt'}`,
    `Tone: ${input.tone ?? 'aligned to prompt'}`,
    `Prompt: ${input.prompt}`,
    input.normalizedPrompt ? `Normalized prompt: ${input.normalizedPrompt}` : undefined,
    pattern,
    purpose,
    hero,
    actions,
    formFields,
    existingCopy,
    `Character limits -> title: ${constraints.title}, subtitle: ${constraints.subtitle}, body: ${constraints.body}, buttonLabel: ${constraints.buttonLabel}, formLabel: ${constraints.formLabel}`,
    'Keep button labels action-oriented. Form labels should be short field names.',
  ]
    .filter(Boolean)
    .join('\n')
}

export class OpenAITextGenerationProvider implements TextGenerationProvider {
  public readonly name = 'openai-text-generation-provider'
  private client: OpenAI
  private model: string
  private temperature: number
  private topP: number
  private systemPrompt: string

  constructor(options: OpenAITextGenerationProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use OpenAITextGenerationProvider')
    }

    this.client = new OpenAI({ apiKey })
    this.model = options.model ?? process.env.OPENAI_TEXT_MODEL ?? 'gpt-5-mini'
    this.temperature = options.temperature ?? 0.7
    this.topP = options.topP ?? 1
    this.systemPrompt = options.systemPrompt ?? defaultSystemPrompt
  }

  async generate(input: TextGenerationInput, constraints: TextLengthConstraints): Promise<TextGenerationResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      top_p: this.topP,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: buildUserPrompt(input, constraints) },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI did not return content for text generation')
    }

    let parsed: OpenAITextGenerationResponse
    try {
      parsed = JSON.parse(content) as OpenAITextGenerationResponse
    } catch (error) {
      throw new Error('Failed to parse OpenAI text generation response')
    }

    return {
      title: parsed.title,
      subtitle: parsed.subtitle,
      body: parsed.body,
      buttonLabels: parsed.buttonLabels ?? [],
      formLabels: parsed.formLabels ?? [],
      metadata: {
        model: this.model,
        completionId: completion.id,
        provider: this.name,
      },
    }
  }
}
