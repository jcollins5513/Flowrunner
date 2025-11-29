import OpenAI from 'openai'
import { screenSpecSchema, ScreenSpec, createFallbackScreenSpec } from '@/lib/specs/screen-spec'

export interface ScreenSpecInterpreterOptions {
  apiKey?: string
  model?: string
  temperature?: number
}

const defaultSystemPrompt = `You are FlowRunner's ScreenSpec interpreter. Convert messy user descriptions of screens into a structured ScreenSpec JSON for a deterministic layout engine.

Your task:
- Take the user's text description
- INFER as much detail as possible from context, even if not explicitly stated
- For photo/library screens: infer grid/list layout, toolbar actions, navigation
- For scanner screens: infer camera interface, capture buttons, export options
- For forms: infer input fields, submit buttons, validation
- For dashboards: infer data visualization, metrics, navigation
- Output ONLY valid JSON matching the ScreenSpec schema below
- Do NOT explain. Do NOT wrap in markdown. Do NOT add commentary.

ScreenSpec Schema:
{
  "screenName": string,
  "screenType": "scanner" | "form" | "dashboard" | "detail" | "landing" | "gallery" | "photoLibrary" | "card" | "hero" | "unknown",
  "layout": {
    "topBar"?: {
      "title": string,
      "rightActionButton"?: { "id": string, "label"?: string, "icon"?: string }
    },
    "main": {
      "type": "cameraScanner" | "static" | "list" | "form" | "card" | "gallery" | "grid" | "hero" | "carousel",
      "hasScanFrame"?: boolean,
      "overlayStyle"?: "rounded-frame" | "corners-only" | "none",
      "cardCount"?: number,
      "cardStyle"?: "revolving" | "stacked" | "grid" | "carousel"
    },
    "bottomCenterButton"?: {
      "id": string,
      "variant": "primary" | "ghost",
      "shape": "circle" | "pill",
      "label"?: string,
      "icon"?: string
    },
    "tabBar"?: {
      "activeTabId": string,
      "tabs": [{ "id": string, "label": string, "icon"?: string }]
    },
    "background"?: {
      "type": "animatedGradient" | "solid",
      "emphasis": "subtle" | "strong"
    },
    "fxPreset"?: "none" | "subtle-fade" | "slide-up" | "scale-in" | "parallax" | "glow" | "blur-reveal" | "particle-burst" | "gradient-shift" | "glassmorphism" | "neon" | "retro-scan" | "smooth-float" | "magnetic-hover" | "ripple" | "shimmer" | "morphing" | "cinematic"
  }
}

Examples:
- "PDF scanner with camera enabled and export button" → screenType: "scanner", main.type: "cameraScanner", topBar with export button, bottomCenterButton with camera icon
- "Photo library with toolbar" → screenType: "photoLibrary", main.type: "gallery", topBar with title "Photo Library", rightActionButton with "Select" or "Edit" icon
- "Landing page with revolving cards in parallax background" → screenType: "landing", main.type: "card", main.cardStyle: "revolving", background.type: "animatedGradient", background.emphasis: "strong", fxPreset: "parallax"
- "Login form with email and password" → screenType: "form", main.type: "form", bottomCenterButton with "Sign In" label
- "Dashboard with charts and metrics" → screenType: "dashboard", main.type: "grid", topBar with title "Dashboard"
- "Hero section with CTA button" → screenType: "hero", main.type: "hero", topBar optional, bottomCenterButton with primary variant

INFERENCE RULES:
- If user mentions "landing page" or "hero", use screenType: "landing" or "hero", main.type: "hero" or "card"
- If user mentions "revolving cards" or "rotating cards", use main.type: "card", main.cardStyle: "revolving"
- If user mentions "parallax" or "animated background", use background.type: "animatedGradient", background.emphasis: "strong", fxPreset: "parallax"
- If user mentions "photo library" or "gallery", use screenType: "photoLibrary" or "gallery", main.type: "gallery" or "grid"
- If user mentions "toolbar" or "bar", infer topBar with appropriate action buttons
- If user mentions "camera" or "scanner", use screenType: "scanner", main.type: "cameraScanner"
- If user mentions "button" or "action", infer bottomCenterButton or rightActionButton
- If user mentions "cards" (plural), use main.type: "card" or "grid", infer cardCount if mentioned
- FX PRESET INFERENCE:
  * "parallax" → fxPreset: "parallax"
  * "glow" or "neon" → fxPreset: "neon"
  * "glass" or "frosted" → fxPreset: "glassmorphism"
  * "blur" → fxPreset: "blur-reveal"
  * "particle" → fxPreset: "particle-burst"
  * "gradient shift" → fxPreset: "gradient-shift"
  * "retro" or "vintage" → fxPreset: "retro-scan"
  * "float" or "hover" → fxPreset: "smooth-float"
  * "ripple" → fxPreset: "ripple"
  * "shimmer" or "shine" → fxPreset: "shimmer"
  * "morph" or "fluid" → fxPreset: "morphing"
  * "cinematic" or "dramatic" → fxPreset: "cinematic"
  * "slide" → fxPreset: "slide-up"
  * "scale" → fxPreset: "scale-in"
  * "fade" or "subtle" → fxPreset: "subtle-fade"
  * Default for landing pages: fxPreset: "cinematic"
- Always provide a meaningful screenName based on context
- NEVER use "unknown" if you can infer a more specific type from context

Return ONLY the JSON object, nothing else.`

const strictSystemPrompt = `${defaultSystemPrompt}

CRITICAL: You must return ONLY valid JSON. No markdown code blocks, no explanations, no comments. Just the raw JSON object.`

export class ScreenSpecInterpreter {
  private client: OpenAI
  private model: string
  private temperature: number

  constructor(options: ScreenSpecInterpreterOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use ScreenSpecInterpreter')
    }

    this.client = new OpenAI({ apiKey })
    this.model = options.model ?? process.env.OPENAI_SCREENSPEC_MODEL ?? 'gpt-4o-mini'
    this.temperature = options.temperature ?? 0.3
  }

  async interpret(prompt: string): Promise<ScreenSpec> {
    const timestamp = Date.now()
    console.log(`[DEBUG:ScreenSpec:${timestamp}] Interpreting prompt to ScreenSpec:`, {
      promptPreview: prompt.substring(0, 100),
      promptLength: prompt.length,
    })

    try {
      const screenSpec = await this.attemptInterpretation(prompt, defaultSystemPrompt)
      console.log(`[DEBUG:ScreenSpec:${timestamp}] ScreenSpec generated successfully:`, {
        screenName: screenSpec.screenName,
        screenType: screenSpec.screenType,
        hasTopBar: !!screenSpec.layout.topBar,
        hasTabBar: !!screenSpec.layout.tabBar,
        hasBottomButton: !!screenSpec.layout.bottomCenterButton,
      })
      return screenSpec
    } catch (error) {
      console.warn(`[DEBUG:ScreenSpec:${timestamp}] First attempt failed, retrying with stricter prompt:`, {
        error: error instanceof Error ? error.message : String(error),
      })

      try {
        const screenSpec = await this.attemptInterpretation(prompt, strictSystemPrompt)
        console.log(`[DEBUG:ScreenSpec:${timestamp}] ScreenSpec generated on retry:`, {
          screenName: screenSpec.screenName,
          screenType: screenSpec.screenType,
        })
        return screenSpec
      } catch (retryError) {
        console.error(`[DEBUG:ScreenSpec:${timestamp}] Both attempts failed, using fallback:`, {
          error: retryError instanceof Error ? retryError.message : String(retryError),
        })
        const fallback = createFallbackScreenSpec(prompt)
        console.log(`[DEBUG:ScreenSpec:${timestamp}] Using fallback ScreenSpec:`, fallback)
        return fallback
      }
    }
  }

  private async attemptInterpretation(prompt: string, systemPrompt: string): Promise<ScreenSpec> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: this.temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI did not return content for ScreenSpec interpretation')
    }

    // Try to extract JSON if wrapped in markdown
    let jsonContent = content.trim()
    if (jsonContent.startsWith('```')) {
      const match = jsonContent.match(/```(?:json)?\n?(.*?)\n?```/s)
      if (match && match[1]) {
        jsonContent = match[1].trim()
      }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(jsonContent)
    } catch (error) {
      throw new Error(`Failed to parse ScreenSpec JSON: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Validate against schema
    const validated = screenSpecSchema.parse(parsed)
    return validated
  }
}

