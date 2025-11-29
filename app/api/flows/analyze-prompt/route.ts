import { NextResponse } from 'next/server'
import { IntentInterpreter } from '@/lib/ai/intent/interpreter'
import { MockIntentProvider } from '@/lib/ai/intent/providers/mock'
import { analyzeIntentCompleteness } from '@/lib/ai/intent/question-generator'
import { ScreenSpecInterpreter } from '@/lib/ai/screen-spec/interpreter'

const defaultInterpreter = new IntentInterpreter(new MockIntentProvider())

// Build ScreenSpec interpreter with fallback handling
const buildScreenSpecInterpreter = (): ScreenSpecInterpreter | null => {
  try {
    return new ScreenSpecInterpreter()
  } catch (error) {
    console.warn('[DEBUG:ScreenSpec] ScreenSpec interpreter unavailable:', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate Intent from prompt
    const intent = await defaultInterpreter.interpret(prompt)

    // Analyze if Intent is sufficient or needs follow-up questions
    const analysis = analyzeIntentCompleteness(intent)

    // Generate ScreenSpec from prompt (after intent analysis, preserving pipeline order)
    let screenSpec = null
    const screenSpecInterpreter = buildScreenSpecInterpreter()
    if (screenSpecInterpreter) {
      try {
        screenSpec = await screenSpecInterpreter.interpret(prompt)
        console.log('[DEBUG:ScreenSpec] ScreenSpec generated in analyze-prompt:', {
          screenName: screenSpec.screenName,
          screenType: screenSpec.screenType,
        })
      } catch (error) {
        console.error('[DEBUG:ScreenSpec] Error generating ScreenSpec:', error)
        // Continue without ScreenSpec - it's optional
      }
    }

    if (analysis.sufficient && analysis.intent) {
      return NextResponse.json({
        sufficient: true,
        intent: analysis.intent,
        structuredPrompt: analysis.intent, // The Intent IS the structured prompt
        screenSpec: screenSpec, // Include ScreenSpec in response
      })
    }

    return NextResponse.json({
      sufficient: false,
      questions: analysis.questions,
      partialIntent: analysis.partialIntent,
      screenSpec: screenSpec, // Include ScreenSpec even if questions are needed
    })
  } catch (error) {
    console.error('Error analyzing prompt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze prompt' },
      { status: 500 }
    )
  }
}

