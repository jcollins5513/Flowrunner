import OpenAI from 'openai'
import { ImageGenerationProvider, ImageGenerationProviderOptions } from '../provider'
import { ImageGenerationRequest, ImageGenerationResult, imageGenerationResultSchema } from '../types'

type DALLE3Size = '1024x1024' | '1792x1024' | '1024x1792' | '1024x1536' | '1536x1024'

const ASPECT_RATIO_TO_DALLE_SIZE: Record<string, DALLE3Size> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '4:3': '1536x1024',
  '9:16': '1024x1792',
  '21:9': '1792x1024', // Closest match for 21:9
  '16:10': '1792x1024', // Closest match for 16:10
  '3:4': '1024x1536',
}

const STYLE_TO_DALLE_PROMPT: Record<string, string> = {
  '3d': '3D render, high detail, depth of field',
  clay: 'claymation style, soft textures, matte finish',
  vector: 'vector illustration, clean lines, flat colors',
  neon: 'neon lights, glowing effects, dark background',
  editorial: 'editorial photography, professional lighting, magazine style',
  illustrated: 'illustration, artistic style',
  photographic: 'photography, realistic, high quality',
  collage: 'collage art, mixed media, layered composition',
  line_art: 'line art, minimal, black and white',
}

const COLOR_MOOD_TO_PROMPT: Record<string, string> = {
  vibrant: 'vibrant colors, saturated, bold',
  muted: 'muted colors, pastel, soft tones',
  warm: 'warm color palette, oranges, reds, yellows',
  cool: 'cool color palette, blues, greens, purples',
  neon: 'neon colors, electric, bright',
  monochrome: 'monochrome, grayscale, black and white',
}

const buildDALLEPrompt = (request: ImageGenerationRequest): string => {
  let prompt = request.prompt

  if (request.style && STYLE_TO_DALLE_PROMPT[request.style]) {
    prompt = `${STYLE_TO_DALLE_PROMPT[request.style]}, ${prompt}`
  }

  if (request.visualTheme && STYLE_TO_DALLE_PROMPT[request.visualTheme]) {
    prompt = `${STYLE_TO_DALLE_PROMPT[request.visualTheme]}, ${prompt}`
  }

  if (request.colorMood && COLOR_MOOD_TO_PROMPT[request.colorMood]) {
    prompt = `${prompt}, ${COLOR_MOOD_TO_PROMPT[request.colorMood]}`
  }

  return prompt
}

export interface OpenAIImageProviderOptions extends ImageGenerationProviderOptions {
  apiKey?: string
  model?: string
}

export class OpenAIImageProvider implements ImageGenerationProvider {
  public readonly name = 'openai-image-provider'
  private client: OpenAI
  private model: string
  private maxRetries: number
  private retryDelayMs: number
  private timeoutMs: number

  constructor(private options: OpenAIImageProviderOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use OpenAIImageProvider')
    }

    this.client = new OpenAI({ apiKey })
    this.model = options.model ?? process.env.OPENAI_IMAGE_MODEL ?? 'dall-e-3'
    this.maxRetries = options.maxRetries ?? 3
    this.retryDelayMs = options.retryDelayMs ?? 1000
    this.timeoutMs = options.timeoutMs ?? 60000
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const dallePrompt = buildDALLEPrompt(request)
    const size: DALLE3Size = ASPECT_RATIO_TO_DALLE_SIZE[request.aspectRatio] ?? '1792x1024'

    let lastError: Error | undefined
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const completion = await Promise.race([
          this.client.images.generate({
            model: this.model,
            prompt: dallePrompt,
            size,
            quality: 'hd',
            n: 1,
            ...(request.seed && { seed: request.seed }),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Image generation timeout')), this.timeoutMs)
          ),
        ])

        if (!completion.data || completion.data.length === 0) {
          throw new Error('OpenAI did not return image data')
        }

        const imageData = completion.data[0]
        const imageUrl = imageData?.url
        if (!imageUrl) {
          throw new Error('OpenAI did not return an image URL')
        }

        return imageGenerationResultSchema.parse({
          url: imageUrl,
          seed: request.seed ?? undefined,
          prompt: request.prompt,
          style: request.style,
          aspectRatio: request.aspectRatio,
          metadata: {
            provider: this.name,
            model: this.model,
            generationId: imageUrl,
            revisedPrompt: imageData?.revised_prompt,
          },
        })
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs * (attempt + 1)))
        }
      }
    }

    throw lastError ?? new Error('Image generation failed after retries')
  }
}

