// API endpoint to generate the first screen for a flow from a user prompt
import { NextResponse } from 'next/server'
import { runPromptToTemplatePipeline } from '@/lib/ai/intent/pipeline'
import { INTENT_CONSTANTS } from '@/lib/ai/intent/intent.schema'
import { ImageOrchestrator } from '@/lib/images/orchestrator'
import { ImageGenerationService } from '@/lib/images/generation/service'
import { MockImageProvider } from '@/lib/images/generation/providers/mock'
import { buildScreenDSLFromPlan } from '@/lib/flows/next-screen-generator'
import { insertScreen } from '@/lib/flows/screen-sequence'
import { FlowEngine } from '@/lib/flows/engine'
import type { ScreenContext } from '@/lib/flows/types'
import { validateScreenDSL } from '@/lib/dsl/validator'
import type { PatternFamily, PatternVariant, Palette, Vibe, Component } from '@/lib/dsl/types'

export async function POST(
  request: Request,
  { params }: { params: { flowId: string } }
) {
  try {
    const body = await request.json()
    const { prompt, guidance } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Stage 1: Run pipeline to get template/sequence
    const pipelineResult = await runPromptToTemplatePipeline(prompt)
    
    // Override intent with guidance fields if provided
    if (guidance && typeof guidance === 'object') {
      if (guidance.domain && typeof guidance.domain === 'string' && INTENT_CONSTANTS.DOMAINS.includes(guidance.domain as any)) {
        pipelineResult.intent.domain = guidance.domain as any
      }
      if (guidance.styleCues && Array.isArray(guidance.styleCues) && guidance.styleCues.length > 0) {
        const validStyles = guidance.styleCues.filter((s: string) =>
          typeof s === 'string' && INTENT_CONSTANTS.STYLE_CUES.includes(s as any)
        )
        if (validStyles.length > 0) {
          pipelineResult.intent.styleCues = validStyles.slice(0, 3) as any
        }
      }
      if (guidance.visualTheme && typeof guidance.visualTheme === 'string' && INTENT_CONSTANTS.VISUAL_THEMES.includes(guidance.visualTheme as any)) {
        pipelineResult.intent.visualTheme = guidance.visualTheme as any
      }
      if (guidance.tone && typeof guidance.tone === 'string' && INTENT_CONSTANTS.TONES.includes(guidance.tone as any)) {
        pipelineResult.intent.tone = guidance.tone as any
      }
      if (guidance.colorMood && typeof guidance.colorMood === 'string' && INTENT_CONSTANTS.COLOR_MOODS.includes(guidance.colorMood as any)) {
        pipelineResult.intent.colorMood = guidance.colorMood as any
      }
    }
    
    // Select first screen from sequence
    const plan = pipelineResult.sequence[0]
    if (!plan) {
      throw new Error('No screen plan generated from template')
    }

    // Stage 2: Generate hero image
    const orchestrator = new ImageOrchestrator({
      service: new ImageGenerationService({ provider: new MockImageProvider() }),
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: true,
    })

    // Get flow metadata for theme
    const flow = await FlowEngine.getFlow(params.flowId)
    const flowTheme = flow?.theme
    
    // Use guidance visualTheme if provided, otherwise fall back to flow theme or plan
    const visualTheme = guidance?.visualTheme || flowTheme || plan.heroPlan.colorMood

    const heroImage = await orchestrator.generateHeroImageWithPalette({
      prompt: plan.heroPlan.imagePrompt,
      aspectRatio: plan.heroPlan.aspectRatio,
      visualTheme: visualTheme,
    })

    // Validate hero image was generated
    if (!heroImage?.image?.url) {
      console.error('Hero image generation failed:', heroImage)
      return NextResponse.json(
        { error: 'Failed to generate hero image' },
        { status: 500 }
      )
    }

    console.log('Generated hero image:', {
      url: heroImage.image.url,
      imageId: heroImage.imageId,
      palette: heroImage.palette,
      vibe: heroImage.vibe,
    })

    // Stage 3: Build DSL
    // Create screen context for first screen with default values
    const defaultPalette: Palette = {
      primary: heroImage.palette?.primary || '#3B82F6',
      secondary: heroImage.palette?.secondary || '#8B5CF6',
      accent: heroImage.palette?.accent || '#F59E0B',
      background: heroImage.palette?.background || '#FFFFFF',
    }
    
    const defaultVibe: Vibe = heroImage.vibe || 'modern'
    const defaultPatternFamily: PatternFamily = plan.pattern.family as PatternFamily
    const defaultPatternVariant: PatternVariant = (plan.pattern.variant as PatternVariant) || 1
    const defaultComponents: Component[] = []

    const screenContext: ScreenContext = {
      palette: defaultPalette,
      vibe: defaultVibe,
      patternFamily: defaultPatternFamily,
      patternVariant: defaultPatternVariant,
      components: defaultComponents,
      flowMetadata: {
        domain: flow?.domain,
        theme: flow?.theme,
        style: flow?.style,
      },
    }

    const screenDSL = buildScreenDSLFromPlan(plan, screenContext, heroImage)

    // Validate DSL before saving
    console.log('Validating DSL:', JSON.stringify(screenDSL, null, 2))
    const validation = validateScreenDSL(screenDSL)
    if (!validation.success) {
      console.error('DSL validation failed:', validation.formattedErrors)
      console.error('Validation error details:', validation.error)
      const errorMessage = validation.formattedErrors?.join(', ') || validation.error?.message || 'Unknown validation error'
      console.error('DSL that failed validation:', JSON.stringify(screenDSL, null, 2))
      
      // Log specific field issues
      if (validation.error instanceof Error && 'issues' in validation.error) {
        console.error('Zod validation issues:', (validation.error as any).issues)
      }
      
      return NextResponse.json(
        { error: `DSL validation failed: ${errorMessage}`, details: validation.formattedErrors },
        { status: 400 }
      )
    }
    
    console.log('DSL validation passed!')

    // Stage 4: Save to flow
    const { screen } = await insertScreen(params.flowId, {
      screenDSL: validation.data,
      position: 'start',
      heroImageId: heroImage.imageId,
    })

    return NextResponse.json({
      screenId: screen.id,
      screenDSL,
    })
  } catch (error) {
    console.error('Error generating first screen:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate first screen' },
      { status: 500 }
    )
  }
}

