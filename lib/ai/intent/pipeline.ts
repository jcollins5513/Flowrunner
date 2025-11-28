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
    return new IntentInterpreter(new OpenAIIntentProvider())
  } catch (error) {
    pipelineTelemetry.logStage('intent_provider_fallback', 'error', {
      message: 'openai_intent_unavailable',
      metadata: { reason: error instanceof Error ? error.message : 'unknown' },
    })
    return new IntentInterpreter(new MockIntentProvider())
  }
}

export const runPromptToTemplatePipeline = async (
  prompt: string,
  options: InterpretOptions & { interpreter?: IntentInterpreter } = {},
): Promise<PromptPipelineResult> => {
  const interpreter = options.interpreter ?? buildDefaultInterpreter()
  pipelineTelemetry.logStage('prompt_intake', 'success', {
    metadata: { locale: options.locale ?? 'default', promptLength: prompt.trim().length },
  })

  const intent = (await pipelineTelemetry.timeStage(
    'intent_interpretation',
    () => interpreter.interpret(prompt, options),
    { provider: interpreter.providerName, locale: options.locale ?? 'default' },
  )) as Intent

  const template = (await pipelineTelemetry.timeStage(
    'template_selection',
    () => Promise.resolve(selectTemplateForIntent(intent)),
    { domain: intent.domain },
  )) as FlowTemplate

  const sequence = (await pipelineTelemetry.timeStage(
    'screen_sequence',
    () => Promise.resolve(mapTemplateToScreenSequence(template, intent)),
    { templateId: template.id ?? 'unlabeled_template' },
  )) as ScreenGenerationPlan[]

  pipelineTelemetry.logStage('pipeline_trace', 'success', {
    metadata: {
      promptLength: prompt.length,
      intent: {
        domain: intent.domain,
        tone: intent.tone,
        styleCues: intent.styleCues,
        colorMood: intent.colorMood,
        visualTheme: intent.visualTheme,
      },
      templateId: template.id,
      screens: sequence.map((screen) => ({
        screenId: screen.screenId,
        patternFamily: screen.pattern.family,
        patternVariant: screen.pattern.variant,
      })),
    },
  })

  return {
    intent,
    template,
    sequence,
  }
}
