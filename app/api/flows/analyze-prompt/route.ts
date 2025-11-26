import { NextResponse } from 'next/server'
import { IntentInterpreter } from '@/lib/ai/intent/interpreter'
import { MockIntentProvider } from '@/lib/ai/intent/providers/mock'
import { analyzeIntentCompleteness } from '@/lib/ai/intent/question-generator'

const defaultInterpreter = new IntentInterpreter(new MockIntentProvider())

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

    if (analysis.sufficient && analysis.intent) {
      return NextResponse.json({
        sufficient: true,
        intent: analysis.intent,
        structuredPrompt: analysis.intent, // The Intent IS the structured prompt
      })
    }

    return NextResponse.json({
      sufficient: false,
      questions: analysis.questions,
      partialIntent: analysis.partialIntent,
    })
  } catch (error) {
    console.error('Error analyzing prompt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze prompt' },
      { status: 500 }
    )
  }
}

