// API endpoint to generate the first screen for a flow from a user prompt
import { NextResponse } from 'next/server'
import { runPromptToTemplatePipeline } from '@/lib/ai/intent/pipeline'
import { ImageOrchestrator } from '@/lib/images/orchestrator'
import { ImageGenerationService } from '@/lib/images/generation/service'
import { MockImageProvider } from '@/lib/images/generation/providers/mock'
import { buildScreenDSLFromPlan } from '@/lib/flows/build-screen-dsl'
import { insertScreen } from '@/lib/flows/screen-sequence'
import { FlowEngine } from '@/lib/flows/engine'
import type { ScreenContext } from '@/lib/flows/types'
import { validateScreenDSL } from '@/lib/dsl/validator'
import type { PatternFamily, PatternVariant, Palette, Vibe, Component } from '@/lib/dsl/types'
import { ASPECT_RATIOS, AspectRatio } from '@/lib/images/generation/types'
import { persistHeroImageMetadata } from '@/lib/db/hero-image-persistence'
import type { ScreenSpec } from '@/lib/specs/screen-spec'
import { screenSpecSchema } from '@/lib/specs/screen-spec'
import { applyScreenSpecToPlan } from '@/lib/flows/screen-spec-mapper'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ flowId: string }> }
) {
  try {
    const { flowId } = await params
    const body = await request.json()
    const { prompt, screenSpec: rawScreenSpec } = body

    // [DEBUG:PromptIntake] Log prompt intake
    const timestamp = Date.now()
    console.log(`[DEBUG:PromptIntake:${timestamp}] Request body received:`, {
      flowId,
      promptLength: prompt?.length ?? 0,
      promptPreview: prompt?.substring(0, 100) ?? 'null',
      hasScreenSpec: !!rawScreenSpec,
      screenSpecType: typeof rawScreenSpec,
      screenSpecPreview: rawScreenSpec ? JSON.stringify(rawScreenSpec).substring(0, 200) : 'null',
    })

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error(`[DEBUG:PromptIntake:${timestamp}] Prompt validation failed:`, {
        prompt,
        type: typeof prompt,
        isEmpty: !prompt?.trim(),
      })
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log(`[DEBUG:PromptIntake:${timestamp}] Prompt validated successfully, length: ${prompt.trim().length}`)

    // Parse and validate ScreenSpec if provided
    let screenSpec: ScreenSpec | null = null
    if (rawScreenSpec) {
      console.log(`[DEBUG:PromptIntake:${timestamp}] Raw ScreenSpec received:`, {
        rawType: typeof rawScreenSpec,
        rawKeys: typeof rawScreenSpec === 'object' ? Object.keys(rawScreenSpec) : 'not an object',
        rawValue: JSON.stringify(rawScreenSpec).substring(0, 500),
      })
      try {
        screenSpec = screenSpecSchema.parse(rawScreenSpec)
        console.log(`[DEBUG:PromptIntake:${timestamp}] ScreenSpec received and validated:`, {
          screenName: screenSpec.screenName,
          screenType: screenSpec.screenType,
          hasTopBar: !!screenSpec.layout.topBar,
          hasTabBar: !!screenSpec.layout.tabBar,
          hasBottomButton: !!screenSpec.layout.bottomCenterButton,
          fullScreenSpec: JSON.stringify(screenSpec, null, 2),
        })
      } catch (error) {
        console.error(`[DEBUG:PromptIntake:${timestamp}] ScreenSpec validation failed:`, {
          error: error instanceof Error ? error.message : String(error),
          errorDetails: error,
          rawScreenSpec: JSON.stringify(rawScreenSpec).substring(0, 500),
        })
        // Continue without ScreenSpec
      }
    } else {
      console.warn(`[DEBUG:PromptIntake:${timestamp}] No ScreenSpec provided in request body`)
    }

    // Stage 1: Run pipeline to get template/sequence
    // The Intent Interpreter will infer all fields from the prompt
    console.log(`[DEBUG:PromptIntake:${timestamp}] Starting pipeline execution...`)
    const pipelineResult = await runPromptToTemplatePipeline(prompt)
    console.log(`[DEBUG:PromptIntake:${timestamp}] Pipeline completed:`, {
      templateId: pipelineResult.template.id,
      templateDomain: pipelineResult.template.domain,
      sequenceLength: pipelineResult.sequence.length,
    })
    
    // Select first screen from sequence
    let plan = pipelineResult.sequence[0]
    console.log(`[DEBUG:PromptIntake:${timestamp}] Selected plan from sequence:`, {
      planIndex: 0,
      planName: plan?.name,
      planScreenId: plan?.screenId,
      patternFamily: plan?.pattern.family,
      patternVariant: plan?.pattern.variant,
      templateId: plan?.templateId,
    })
    if (!plan) {
      console.error(`[DEBUG:PromptIntake:${timestamp}] No plan found in sequence:`, {
        sequenceLength: pipelineResult.sequence.length,
        sequence: pipelineResult.sequence.map((p, i) => ({ index: i, screenId: p.screenId, name: p.name })),
      })
      throw new Error('No screen plan generated from template')
    }

    // Apply ScreenSpec overrides to plan if available
    if (screenSpec) {
      console.log(`[DEBUG:PromptIntake:${timestamp}] Applying ScreenSpec to plan BEFORE override:`, {
        originalPatternFamily: plan.pattern.family,
        originalPatternVariant: plan.pattern.variant,
        screenSpecScreenType: screenSpec.screenType,
      })
      plan = applyScreenSpecToPlan(plan, screenSpec)
      console.log(`[DEBUG:PromptIntake:${timestamp}] Plan after ScreenSpec override:`, {
        patternFamily: plan.pattern.family,
        patternVariant: plan.pattern.variant,
        screenType: screenSpec.screenType,
        planName: plan.name,
      })
    } else {
      console.warn(`[DEBUG:PromptIntake:${timestamp}] No ScreenSpec available to override plan - using default template pattern`)
    }

    // Stage 2: Generate hero image
    const orchestrator = new ImageOrchestrator({
      service: new ImageGenerationService({ provider: new MockImageProvider() }),
      autoExtractPalette: true,
      autoInferVibe: true,
      autoPersist: true,
    })

    // Get flow metadata for theme
    const flow = await FlowEngine.getFlow(flowId)
    const flowTheme = flow?.theme
    
    // Use intent visualTheme if available, otherwise fall back to flow theme or plan
    const visualTheme = pipelineResult.intent.visualTheme || flowTheme || plan.heroPlan.colorMood

    const resolveAspectRatio = (value: string | undefined): AspectRatio => {
      if (value && (ASPECT_RATIOS as readonly string[]).includes(value)) {
        return value as AspectRatio
      }
      return '16:9'
    }

    const heroImage = await orchestrator.generateHeroImageWithPalette({
      prompt: plan.heroPlan.imagePrompt,
      aspectRatio: resolveAspectRatio(plan.heroPlan.aspectRatio),
      visualTheme: visualTheme,
    })

    try {
      await persistHeroImageMetadata(heroImage, {
        userId: flow.userId ?? undefined,
        domain: flow.domain,
      })
    } catch (error) {
      console.warn('Failed to persist hero image metadata for first screen', error)
    }

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

    console.log(`[DEBUG:PromptIntake:${timestamp}] Building screen DSL from plan...`)
    const screenDSL = buildScreenDSLFromPlan(plan, screenContext, heroImage, screenSpec)
    console.log(`[DEBUG:PromptIntake:${timestamp}] Screen DSL built:`, {
      patternFamily: screenDSL.pattern_family,
      patternVariant: screenDSL.pattern_variant,
      componentCount: screenDSL.components?.length ?? 0,
      componentTypes: screenDSL.components?.map(c => c.type) ?? [],
    })

    // Ensure components array is never empty before validation
    if (!screenDSL.components || screenDSL.components.length === 0) {
      console.warn(`[DEBUG:PromptIntake:${timestamp}] Components array is empty, adding fallback title component`)
      screenDSL.components = [{
        type: 'title',
        content: plan.name || 'Welcome',
        props: {
          fontSize: 'text-4xl',
          fontWeight: 'font-bold',
          textAlign: 'text-center',
        },
      }]
    }

    // Validate DSL before saving
    console.log('Validating DSL:', JSON.stringify(screenDSL, null, 2))
    const validation = validateScreenDSL(screenDSL)
    if (!validation.success || !validation.data) {
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

    const validatedDSL = validation.data

    // Stage 4: Save to flow
    const { screen } = await insertScreen(flowId, {
      screenDSL: validatedDSL,
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

