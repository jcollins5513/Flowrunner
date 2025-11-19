import ecommerceStorefront from './definitions/ecommerce/template-storefront.json'
import saasOnboarding from './definitions/saas/template-onboarding.json'
import mobileIntro from './definitions/mobile/template-app-intro.json'
import financeGrowth from './definitions/finance/template-fintech-growth.json'
import { FlowTemplate, flowTemplateSchema } from './schema'

const rawTemplates = [ecommerceStorefront, saasOnboarding, mobileIntro, financeGrowth] as const

let templateCache: FlowTemplate[] | null = null
let templateMap: Map<string, FlowTemplate> | null = null

const buildCache = () => {
  if (templateCache && templateMap) return
  const parsed = rawTemplates.map((template) => flowTemplateSchema.parse(template))
  templateCache = parsed
  templateMap = new Map(parsed.map((template) => [template.id, template]))
}

const cloneTemplate = (template: FlowTemplate): FlowTemplate =>
  JSON.parse(JSON.stringify(template)) as FlowTemplate

export const listTemplates = (): FlowTemplate[] => {
  buildCache()
  return (templateCache ?? []).map((template) => cloneTemplate(template))
}

export const getTemplateById = (id: string): FlowTemplate | undefined => {
  buildCache()
  if (!templateMap?.has(id)) return undefined
  return cloneTemplate(templateMap.get(id) as FlowTemplate)
}
