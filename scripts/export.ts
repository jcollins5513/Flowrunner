import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'

import type { ScreenDSL } from '@/lib/dsl/types'
import type { PatternDefinition } from '@/lib/patterns/schema'
import { buildCursorExportBundle, buildFigmaExportPayload, generateCursorZip } from '@/lib/export/mapping'

interface ExportPipelineOptions {
  screens: ScreenDSL[]
  patterns: PatternDefinition[]
  outputDir?: string
}

function resolvePatternForScreen(screen: ScreenDSL, patterns: PatternDefinition[]): PatternDefinition {
  const pattern = patterns.find(
    (candidate) => candidate.family === screen.pattern_family && candidate.variant === screen.pattern_variant
  )

  if (!pattern) {
    throw new Error(`Missing pattern definition for ${screen.pattern_family} v${screen.pattern_variant}`)
  }

  return pattern
}

export async function runExportPipeline({ screens, patterns, outputDir = 'test-results/exports' }: ExportPipelineOptions) {
  if (screens.length === 0) {
    throw new Error('No screens provided for export')
  }

  await mkdir(outputDir, { recursive: true })

  const cursorBundle = buildCursorExportBundle(screens)
  const cursorZip = await generateCursorZip(cursorBundle)
  await writeFile(path.join(outputDir, 'cursor-export.zip'), cursorZip)

  const primaryPattern = resolvePatternForScreen(screens[0], patterns)
  const figmaPayload = buildFigmaExportPayload(screens[0], primaryPattern)
  await writeFile(path.join(outputDir, 'figma-payload.json'), JSON.stringify(figmaPayload, null, 2))

  return { cursorBundle, figmaPayload }
}

function createSamplePattern(): PatternDefinition {
  return {
    family: 'ONB_HERO_TOP',
    variant: 1,
    name: 'Hero Stack - Text First',
    description: 'Sample pattern for export orchestration',
    layout: {
      structure: 'grid',
      gridTemplate: '1fr 1fr',
      positions: {
        title: { x: 0, y: 0, width: 2, height: 1 },
        subtitle: { x: 0, y: 1, width: 2, height: 1 },
        hero_image: { x: 0, y: 2, width: 2, height: 2 },
        supporting_image_0: { x: 1, y: 4, width: 1, height: 1 },
      },
    },
    componentSlots: {
      required: ['title', 'subtitle'],
      optional: ['text'],
    },
    spacing: { padding: 24, gap: 16 },
    responsive: { breakpoints: {} },
    imagePlacement: { hero: { position: 'top', size: 'full' }, supporting: [{ position: 'right', size: 'half' }] },
  }
}

function createSampleScreen(): ScreenDSL {
  return {
    hero_image: { id: 'sample-hero', url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200', prompt: 'hero' },
    supporting_images: [
      { id: 'sample-support', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600', prompt: 'supporting' },
    ],
    palette: { primary: '#0f172a', secondary: '#475569', accent: '#2563eb', background: '#f8fafc' },
    vibe: 'modern',
    pattern_family: 'ONB_HERO_TOP',
    pattern_variant: 1,
    components: [
      { type: 'title', content: 'Export orchestration sample' },
      { type: 'subtitle', content: 'Pattern-aware mapping' },
      { type: 'button', content: 'Call to action' },
    ],
    navigation: { type: 'internal', target: 'next-screen' },
  }
}

if (process.env.RUN_EXPORT_SAMPLE === '1') {
  runExportPipeline({ screens: [createSampleScreen()], patterns: [createSamplePattern()] })
    .then(() => {
      console.info('Export artifacts written to test-results/exports')
    })
    .catch((error) => {
      console.error('Export pipeline failed', error)
      process.exitCode = 1
    })
}
