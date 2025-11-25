import { IntentInterpreter, InterpretOptions } from './interpreter'
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

const defaultInterpreter = new IntentInterpreter(new MockIntentProvider())

export const runPromptToTemplatePipeline = async (
  prompt: string,
  options: InterpretOptions & { interpreter?: IntentInterpreter } = {},
): Promise<PromptPipelineResult> => {
  const interpreter = options.interpreter ?? defaultInterpreter
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

  return {
    intent,
    template,
    sequence,
  }
}
