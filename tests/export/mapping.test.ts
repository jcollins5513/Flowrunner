import { describe, expect, it } from 'vitest'

import type { ScreenDSL } from '@/lib/dsl/types'
import type { PatternDefinition } from '@/lib/patterns/schema'
import { buildCursorExportBundle, buildFigmaExportPayload } from '@/lib/export/mapping'

const samplePattern: PatternDefinition = {
  family: 'ONB_HERO_TOP',
  variant: 1,
  name: 'Hero Stack - Text First',
  description: 'Sample pattern definition for export tests',
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
  componentSlots: { required: ['title', 'subtitle'], optional: ['text'] },
  spacing: { padding: 24, gap: 16 },
  responsive: { breakpoints: {} },
  imagePlacement: { hero: { position: 'top', size: 'full' }, supporting: [{ position: 'right', size: 'half' }] },
}

const sampleDsl: ScreenDSL = {
  hero_image: { id: 'hero-test', url: 'https://example.com/hero.jpg', prompt: 'hero prompt' },
  supporting_images: [{ id: 'support-1', url: 'https://example.com/support.jpg', prompt: 'support prompt' }],
  palette: { primary: '#0f172a', secondary: '#475569', accent: '#2563eb', background: '#f8fafc' },
  vibe: 'modern',
  pattern_family: 'ONB_HERO_TOP',
  pattern_variant: 1,
  components: [
    { type: 'title', content: 'Sample Title' },
    { type: 'subtitle', content: 'Subtitle body' },
    { type: 'button', content: 'Get started' },
  ],
  navigation: { type: 'internal', target: 'next' },
}

describe('export mapping', () => {
  it('maps Figma payload with slot bounding boxes and assets', () => {
    const payload = buildFigmaExportPayload(sampleDsl, samplePattern)

    expect(payload.assets).toHaveLength(2)
    expect(payload.assets.map((asset) => asset.slot)).toContain('hero_image')
    expect(payload.assets.map((asset) => asset.slot)).toContain('supporting_image_0')
    
    // The first node is the frame, which contains children
    const frame = payload.nodes[0]
    expect(frame).toBeDefined()
    expect(frame?.type).toBe('FRAME')
    expect(frame?.children?.length).toBeGreaterThan(0)

    // Find hero_image node in frame children
    const heroNode = frame?.children?.find((node) => node.name === 'hero_image')
    expect(heroNode).toBeDefined()
    expect(heroNode?.fills?.[0]?.type).toBe('IMAGE')
    expect(heroNode?.pluginData).toMatchObject({ 
      slot: 'hero_image', 
      pattern: 'ONB_HERO_TOP',
      variant: 1
    })
    expect(heroNode?.absoluteBoundingBox?.width).toBeGreaterThan(0)
    expect(heroNode?.absoluteBoundingBox?.height).toBeGreaterThan(0)
  })

  it('builds cursor bundle with hashes and asset list', () => {
    const bundle = buildCursorExportBundle([sampleDsl])

    expect(bundle.manifest.screens[0]?.hash.length).toBe(64)
    expect(bundle.assets).toHaveLength(2)
    expect(bundle.files.some((file) => file.path.startsWith('dsl/'))).toBe(true)
  })
})
