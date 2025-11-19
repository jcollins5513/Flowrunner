import { describe, expect, it } from 'vitest'
import { getTemplateById, listTemplates } from '@/lib/flow/templates/loader'
import { flowTemplateSchema } from '@/lib/flow/templates/schema'
import ecommerceStorefront from '@/lib/flow/templates/definitions/ecommerce/template-storefront.json'

describe('flow template loader', () => {
  it('validates raw JSON definitions against the schema', () => {
    const parsed = flowTemplateSchema.parse(ecommerceStorefront)
    expect(parsed.id).toBe('ecommerce-storefront-v1')
    expect(parsed.screens).toHaveLength(4)
  })

  it('lists all templates with defensive copies', () => {
    const templates = listTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(4)

    const template = templates[0]
    const firstScreenName = template.screens[0]?.name
    template.screens[0].name = 'Mutated'

    const freshTemplates = listTemplates()
    expect(freshTemplates[0].screens[0]?.name).toBe(firstScreenName)
  })

  it('retrieves template by id and returns undefined when missing', () => {
    const template = getTemplateById('saas-onboarding-v1')
    expect(template?.domain).toBe('saas')

    expect(getTemplateById('missing-template')).toBeUndefined()
  })
})
