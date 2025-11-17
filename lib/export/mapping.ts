import type { Component, ScreenDSL } from '@/lib/dsl/types'
import type { PatternDefinition } from '@/lib/patterns/schema'

export type FigmaNodeType = 'FRAME' | 'TEXT' | 'RECTANGLE' | 'COMPONENT' | 'INSTANCE'

export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaNode {
  id: string
  type: FigmaNodeType
  name: string
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  itemSpacing?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  children?: FigmaNode[]
  fills?: Array<{ type: 'SOLID' | 'IMAGE'; color?: FigmaColor; imageRef?: string }>
  characters?: string
  pluginData?: Record<string, unknown>
  absoluteBoundingBox?: { width: number; height: number; x?: number; y?: number }
}

export interface FigmaExportPayload {
  name: string
  nodes: FigmaNode[]
  colorStyles: Record<'primary' | 'secondary' | 'accent' | 'background', FigmaColor>
  metadata: {
    patternFamily: string
    patternVariant: number
    vibe: string
  }
}

export interface CursorScreenFile {
  path: string
  contents: string
}

export interface CursorExportBundle {
  manifest: {
    generatedAt: string
    screens: Array<{
      slug: string
      patternFamily: string
      patternVariant: number
      palette: ScreenDSL['palette']
      vibe: ScreenDSL['vibe']
    }>
  }
  files: CursorScreenFile[]
}

function hexToRgb(hex: string): FigmaColor {
  const sanitized = hex.replace('#', '')
  const bigint = Number.parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 }
}

function componentToFigmaNode(component: Component, palette: ScreenDSL['palette']): FigmaNode {
  switch (component.type) {
    case 'title':
      return {
        id: `title-${component.content}`,
        type: 'TEXT',
        name: 'Title',
        characters: component.content,
        pluginData: { componentType: component.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.primary) }],
      }
    case 'subtitle':
      return {
        id: `subtitle-${component.content}`,
        type: 'TEXT',
        name: 'Subtitle',
        characters: component.content,
        pluginData: { componentType: component.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.secondary) }],
      }
    case 'text':
      return {
        id: `text-${component.content}`,
        type: 'TEXT',
        name: 'Body',
        characters: component.content,
        pluginData: { componentType: component.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.secondary) }],
      }
    case 'button':
      return {
        id: `button-${component.content}`,
        type: 'FRAME',
        name: 'Button / Primary',
        layoutMode: 'HORIZONTAL',
        padding: { top: 12, right: 20, bottom: 12, left: 20 },
        itemSpacing: 8,
        fills: [{ type: 'SOLID', color: hexToRgb(palette.accent) }],
        pluginData: { componentType: component.type },
        children: [
          {
            id: `button-text-${component.content}`,
            type: 'TEXT',
            name: 'Label',
            characters: component.content,
            fills: [{ type: 'SOLID', color: hexToRgb('#ffffff') }],
          },
        ],
      }
    case 'form': {
      const fields = component.props?.fields ?? []
      return {
        id: `form-${component.content}`,
        type: 'FRAME',
        name: 'Form',
        layoutMode: 'VERTICAL',
        itemSpacing: 12,
        pluginData: { componentType: component.type },
        children: fields.map((field) => ({
          id: `field-${field.id}`,
          type: 'FRAME',
          name: `Field / ${field.label}`,
          layoutMode: 'VERTICAL',
          itemSpacing: 4,
          children: [
            {
              id: `field-label-${field.id}`,
              type: 'TEXT',
              name: 'Label',
              characters: field.label,
              fills: [{ type: 'SOLID', color: hexToRgb(palette.primary) }],
            },
            {
              id: `field-input-${field.id}`,
              type: 'RECTANGLE',
              name: 'Input',
              fills: [{ type: 'SOLID', color: hexToRgb('#ffffff') }],
            },
          ],
        })),
      }
    }
    default:
      return {
        id: `component-${component.type}`,
        type: 'FRAME',
        name: `Slot / ${component.type}`,
        pluginData: { componentType: component.type },
      }
  }
}

export function buildFigmaExportPayload(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): FigmaExportPayload {
  const frame: FigmaNode = {
    id: `screen-${dsl.metadata?.step ?? '0'}`,
    type: 'FRAME',
    name: `${dsl.pattern_family} · v${dsl.pattern_variant}`,
    layoutMode: 'NONE',
    padding: {
      top: pattern.spacing.padding,
      right: pattern.spacing.padding,
      bottom: pattern.spacing.padding,
      left: pattern.spacing.padding,
    },
    itemSpacing: pattern.spacing.gap,
    pluginData: {
      navigation: dsl.navigation,
      vibe: dsl.vibe,
      responsive: pattern.responsive,
    },
    children: dsl.components.map((component) => componentToFigmaNode(component, dsl.palette)),
  }

  return {
    name: `FlowRunner · ${dsl.metadata?.prompt ?? 'Screen'}`,
    nodes: [frame],
    colorStyles: {
      primary: hexToRgb(dsl.palette.primary),
      secondary: hexToRgb(dsl.palette.secondary),
      accent: hexToRgb(dsl.palette.accent),
      background: hexToRgb(dsl.palette.background),
    },
    metadata: {
      patternFamily: dsl.pattern_family,
      patternVariant: dsl.pattern_variant,
      vibe: dsl.vibe,
    },
  }
}

export function buildCursorExportBundle(screens: ScreenDSL[]): CursorExportBundle {
  const manifest = {
    generatedAt: new Date().toISOString(),
    screens: screens.map((screen, index) => ({
      slug: `screen-${index + 1}`,
      patternFamily: screen.pattern_family,
      patternVariant: screen.pattern_variant,
      palette: screen.palette,
      vibe: screen.vibe,
    })),
  }

  const files: CursorScreenFile[] = []

  screens.forEach((screen, index) => {
    const slug = `screen-${index + 1}`
    const dslPath = `dsl/${slug}.json`
    files.push({ path: dslPath, contents: JSON.stringify(screen, null, 2) })

    const screenComponent = `import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'\nimport dsl from '../${dslPath}' assert { type: 'json' }\n\nexport default function Screen() {\n  return <ScreenRenderer dsl={dsl} />\n}\n`

    files.push({ path: `screens/${slug}.tsx`, contents: screenComponent })
  })

  files.push({ path: 'flow.json', contents: JSON.stringify(manifest, null, 2) })

  return { manifest, files }
}
