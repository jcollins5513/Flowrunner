import { IntentInterpreter, InterpretOptions } from './interpreter'
import { OpenAIIntentProvider } from './providers/openai'
import { MockIntentProvider } from './providers/mock'
import { selectTemplateForIntent, mapTemplateToScreenSequence, ScreenGenerationPlan } from '../../flow/templates/selector'
import { FlowTemplate } from '../../flow/templates/schema'
import { Intent } from './intent.schema'
import { pipelineTelemetry } from '../../telemetry/pipeline'

export interface PromptPipelineResult {
  intent: Intent
  template: FlowTemplate
  sequence: ScreenGenerationPlan[]
}

const buildDefaultInterpreter = (): IntentInterpreter => {
  try {
    const interpreter = new IntentInterpreter(new OpenAIIntentProvider())
    console.log('[DEBUG:Intent] Using OpenAI intent provider')
    return interpreter
  } catch (error) {
    console.warn('[DEBUG:Intent] OpenAI provider unavailable, falling back to Mock provider:', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    pipelineTelemetry.logStage('intent_interpretation', 'error', {
      message: 'openai_intent_unavailable',
      metadata: { reason: error instanceof Error ? error.message : 'unknown', fallback: 'mock_provider' },
    })
    const mockInterpreter = new IntentInterpreter(new MockIntentProvider())
    console.log('[DEBUG:Intent] Using Mock intent provider')
    return mockInterpreter
  }
}

export const runPromptToTemplatePipeline = async (
  prompt: string,
  options: InterpretOptions & { interpreter?: IntentInterpreter } = {},
): Promise<PromptPipelineResult> => {
  const timestamp = Date.now()
  const interpreter = options.interpreter ?? buildDefaultInterpreter()
  console.log(`[DEBUG:Intent:${timestamp}] Starting intent interpretation:`, {
    provider: interpreter.providerName,
    promptLength: prompt.trim().length,
    promptPreview: prompt.substring(0, 100),
  })
  
  pipelineTelemetry.logStage('prompt_intake', 'success', {
    metadata: { locale: options.locale ?? 'default', promptLength: prompt.trim().length },
  })

  const intent = (await pipelineTelemetry.timeStage(
    'intent_interpretation',
    () => interpreter.interpret(prompt, options),
    { provider: interpreter.providerName, locale: options.locale ?? 'default' },
  )) as Intent
  
  console.log(`[DEBUG:Intent:${timestamp}] Intent interpreted:`, {
    domain: intent.domain,
    tone: intent.tone,
    styleCues: intent.styleCues,
    colorMood: intent.colorMood,
    visualTheme: intent.visualTheme,
    normalizedPrompt: intent.normalizedPrompt?.substring(0, 100),
    fullIntent: intent,
  })
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pipeline.ts:40',message:'Intent interpreted',data:{originalPrompt:prompt,interpretedDomain:intent.domain,interpretedTone:intent.tone,normalizedPrompt:intent.normalizedPrompt?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  console.log(`[DEBUG:Intent:${timestamp}] Selecting template for intent...`)
  const template = (await pipelineTelemetry.timeStage(
    'template_selection',
    () => Promise.resolve(selectTemplateForIntent(intent)),
    { domain: intent.domain },
  )) as FlowTemplate

  console.log(`[DEBUG:Intent:${timestamp}] Template selected:`, {
    templateId: template.id,
    templateDomain: template.domain,
    templateName: template.name,
    screenCount: template.screens.length,
  })

  console.log(`[DEBUG:Intent:${timestamp}] Mapping template to screen sequence...`)
  const sequence = (await pipelineTelemetry.timeStage(
    'screen_sequence',
    () => Promise.resolve(mapTemplateToScreenSequence(template, intent)),
    { templateId: template.id ?? 'unlabeled_template' },
  )) as ScreenGenerationPlan[]

  console.log(`[DEBUG:Intent:${timestamp}] Screen sequence generated:`, {
    sequenceLength: sequence.length,
    screens: sequence.map((s, i) => ({
      order: i,
      screenId: s.screenId,
      name: s.name,
      patternFamily: s.pattern.family,
      patternVariant: s.pattern.variant,
    })),
  })

  return {
    intent,
    template,
    sequence,
  }
}
