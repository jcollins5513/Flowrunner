import { IntentInterpreter, InterpretOptions } from './interpreter'
import { MockIntentProvider } from './providers/mock'
import { selectTemplateForIntent, mapTemplateToScreenSequence, ScreenGenerationPlan } from '../../flow/templates/selector'
import { FlowTemplate } from '../../flow/templates/schema'
import { Intent } from './intent.schema'

export interface PromptPipelineResult {
  intent: Intent
  template: FlowTemplate
  sequence: ScreenGenerationPlan[]
}

const defaultInterpreter = new IntentInterpreter(new MockIntentProvider())

export const runPromptToTemplatePipeline = async (
  prompt: string,
  options: InterpretOptions & { interpreter?: IntentInterpreter } = {}
): Promise<PromptPipelineResult> => {
  const interpreter = options.interpreter ?? defaultInterpreter
  const intent = await interpreter.interpret(prompt, options)
  const template = selectTemplateForIntent(intent)
  const sequence = mapTemplateToScreenSequence(template, intent)

  return {
    intent,
    template,
    sequence,
  }
}
