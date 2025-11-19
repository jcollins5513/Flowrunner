import OpenAI from 'openai'
import { ImageGenerationProvider, ImageGenerationProviderOptions } from '../provider'
import { ImageGenerationRequest, ImageGenerationResult, imageGenerationResultSchema } from '../types'

const ASPECT_RATIO_TO_DALLE_SIZE: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1792, height: 1024 },
  '4:3': { width: 1344, height: 1024 },
  '9:16': { width: 1024, height: 1792 },
  '21:9': { width: 2048, height: 896 },
  '16:10': { width: 1792, height: 1120 },
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
    const size = ASPECT_RATIO_TO_DALLE_SIZE[request.aspectRatio] ?? ASPECT_RATIO_TO_DALLE_SIZE['16:9']

    let lastError: Error | undefined
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const completion = await Promise.race([
          this.client.images.generate({
            model: this.model,
            prompt: dallePrompt,
            size: `${size.width}x${size.height}`,
            quality: 'hd',
            n: 1,
            ...(request.seed && { seed: request.seed }),
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Image generation timeout')), this.timeoutMs)
          ),
        ])

        const imageUrl = completion.data[0]?.url
        if (!imageUrl) {
          throw new Error('OpenAI did not return an image URL')
        }

        return imageGenerationResultSchema.parse({
          url: imageUrl,
          seed: request.seed ?? completion.data[0]?.revised_prompt ? undefined : undefined,
          prompt: request.prompt,
          style: request.style,
          aspectRatio: request.aspectRatio,
          metadata: {
            provider: this.name,
            model: this.model,
            generationId: completion.data[0]?.url,
            revisedPrompt: completion.data[0]?.revised_prompt,
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

