/**
 * Aura Template Loader
 * 
 * Loads and indexes aura templates from the library directory.
 */

import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import type { AuraTemplateMetadata } from './aura-analyzer'

export interface AuraTemplate {
  slug: string
  metadata: AuraTemplateMetadata
  html: string | null
  screenshotPath: string | null
}

const AURA_LIBRARY_PATH = join(process.cwd(), 'components/library/aura/components')

/**
 * Load metadata for a single aura template
 */
export async function loadAuraTemplateMetadata(
  templateSlug: string
): Promise<AuraTemplateMetadata | null> {
  try {
    const metadataPath = join(
      AURA_LIBRARY_PATH,
      templateSlug,
      'metadata.json'
    )
    const metadataContent = await readFile(metadataPath, 'utf-8')
    return JSON.parse(metadataContent) as AuraTemplateMetadata
  } catch (error) {
    console.error(`Failed to load metadata for ${templateSlug}:`, error)
    return null
  }
}

/**
 * Load HTML for a single aura template
 */
export async function loadAuraTemplateHTML(
  templateSlug: string
): Promise<string | null> {
  try {
    const htmlPath = join(AURA_LIBRARY_PATH, templateSlug, 'code.html')
    return await readFile(htmlPath, 'utf-8')
  } catch (error) {
    console.error(`Failed to load HTML for ${templateSlug}:`, error)
    return null
  }
}

/**
 * Load complete aura template (metadata + HTML)
 */
export async function loadAuraTemplate(
  templateSlug: string
): Promise<AuraTemplate | null> {
  const metadata = await loadAuraTemplateMetadata(templateSlug)
  if (!metadata) {
    return null
  }

  const html = await loadAuraTemplateHTML(templateSlug)
  const screenshotPath = join(
    AURA_LIBRARY_PATH,
    templateSlug,
    'screenshot.png'
  )

  return {
    slug: templateSlug,
    metadata,
    html,
    screenshotPath,
  }
}

/**
 * List all available aura templates
 */
export async function listAuraTemplates(): Promise<string[]> {
  try {
    const entries = await readdir(AURA_LIBRARY_PATH, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch (error) {
    console.error('Failed to list aura templates:', error)
    return []
  }
}

/**
 * Load all aura templates (lazy - metadata only by default)
 */
export async function loadAllAuraTemplates(
  includeHTML = false
): Promise<AuraTemplate[]> {
  const slugs = await listAuraTemplates()
  const templates = await Promise.all(
    slugs.map(async (slug) => {
      const metadata = await loadAuraTemplateMetadata(slug)
      if (!metadata) {
        return null
      }

      const html = includeHTML ? await loadAuraTemplateHTML(slug) : null
      const screenshotPath = join(
        AURA_LIBRARY_PATH,
        slug,
        'screenshot.png'
      )

      return {
        slug,
        metadata,
        html,
        screenshotPath,
      }
    })
  )

  return templates.filter(
    (template): template is AuraTemplate => template !== null
  )
}

/**
 * Index aura templates by pattern family
 */
export async function indexAuraTemplatesByPattern(): Promise<
  Record<string, AuraTemplate[]>
> {
  const templates = await loadAllAuraTemplates(false) // Metadata only for indexing
  const index: Record<string, AuraTemplate[]> = {}

  // Import matcher dynamically to avoid circular dependencies
  const { mapAuraToPatternFamily } = await import('./aura-analyzer')

  for (const template of templates) {
    const patternFamily = mapAuraToPatternFamily(template.metadata)
    if (patternFamily) {
      if (!index[patternFamily]) {
        index[patternFamily] = []
      }
      index[patternFamily].push(template)
    }
  }

  return index
}

