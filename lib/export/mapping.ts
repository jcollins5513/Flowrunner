import crypto from 'node:crypto'
import JSZip from 'jszip'

import type { Component, HeroImage, ScreenDSL } from '@/lib/dsl/types'
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
  assets: ExportAsset[]
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
      hash: string
    }>
  }
  files: CursorScreenFile[]
  assets: ExportAsset[]
}

export interface ExportAsset {
  id: string
  url: string
  filename: string
  slot: string
  kind: 'hero' | 'supporting'
  prompt?: string
}

interface SlotContext {
  slotName: string
  component?: Component
  heroImage?: HeroImage
  palette: ScreenDSL['palette']
  vibe: ScreenDSL['vibe']
}

interface GridContext {
  columns: number[]
  spacing: PatternDefinition['spacing']
  layoutWidth: number
  rowUnit: number
}

const DEFAULT_FRAME_WIDTH = 1440
const DEFAULT_ROW_UNIT = 220

function hexToRgb(hex: string): FigmaColor {
  const sanitized = hex.replace('#', '')
  const bigint = Number.parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 }
}

function parseGridTemplate(template: string | undefined): number[] {
  if (!template) return [1]

  const repeatMatch = template.match(/repeat\((\d+),\s*([\d.]+)fr\)/)
  if (repeatMatch) {
    const count = Number.parseInt(repeatMatch[1], 10)
    const value = Number.parseFloat(repeatMatch[2])
    return Array.from({ length: count }).map(() => value)
  }

  return template
    .split(/\s+/)
    .map((segment) => Number.parseFloat(segment.replace('fr', '')))
    .filter((value) => !Number.isNaN(value) && value > 0)
}

function computeGridContext(pattern: PatternDefinition): GridContext {
  const columns = parseGridTemplate(pattern.layout.gridTemplate)
  const layoutWidth = DEFAULT_FRAME_WIDTH - pattern.spacing.padding * 2
  const normalizedColumns = columns.length > 0 ? columns : [1]
  return {
    columns: normalizedColumns,
    spacing: pattern.spacing,
    layoutWidth,
    rowUnit: DEFAULT_ROW_UNIT,
  }
}

function computeColumnWidths(grid: GridContext): number[] {
  const totalFractions = grid.columns.reduce((sum, column) => sum + column, 0)
  if (totalFractions === 0) {
    return grid.columns.map(() => grid.layoutWidth / grid.columns.length)
  }

  return grid.columns.map(
    (fraction) => (fraction / totalFractions) * (grid.layoutWidth - grid.spacing.gap * (grid.columns.length - 1))
  )
}

function computeBoundingBox(
  position: PatternDefinition['layout']['positions'][string],
  gridContext: GridContext,
  columnWidths: number[]
): Required<FigmaNode['absoluteBoundingBox']> {
  const gapTotalX = gridContext.spacing.gap * position.x
  const xOffset = gridContext.spacing.padding + columnWidths.slice(0, position.x).reduce((sum, width) => sum + width, 0)
  const slotColumns = columnWidths.slice(position.x, position.x + position.width)
  const width = slotColumns.reduce((sum, width) => sum + width, 0) + gridContext.spacing.gap * Math.max(position.width - 1, 0)

  const height = gridContext.rowUnit * (position.height ?? 1) + gridContext.spacing.gap * Math.max((position.height ?? 1) - 1, 0)
  const y = gridContext.spacing.padding + (gridContext.rowUnit + gridContext.spacing.gap) * position.y

  return { width, height, x: xOffset + gapTotalX, y }
}

function ensurePluginData(
  pluginData: Record<string, unknown> | undefined,
  additions: Record<string, unknown>
): Record<string, unknown> {
  return { ...(pluginData ?? {}), ...additions }
}

function slotNodeFromImage(slotName: string, heroImage?: HeroImage, palette?: ScreenDSL['palette']): FigmaNode {
  return {
    id: `slot-${slotName}`,
    type: 'RECTANGLE',
    name: slotName,
    fills: heroImage
      ? [
          {
            type: 'IMAGE',
            imageRef: heroImage.id,
          },
        ]
      : palette
        ? [{ type: 'SOLID', color: hexToRgb(palette.background) }]
        : [],
    pluginData: { componentType: slotName, prompt: heroImage?.prompt },
  }
}

function componentToFigmaNode(context: SlotContext): FigmaNode {
  const { component: dslComponent, palette, slotName, heroImage } = context

  if (heroImage) {
    return slotNodeFromImage(slotName, heroImage, palette)
  }

  if (!dslComponent) {
    return {
      id: `slot-${slotName}`,
      type: 'FRAME',
      name: `Slot / ${slotName}`,
      layoutMode: 'NONE',
      pluginData: { componentType: slotName },
    }
  }

  switch (dslComponent.type) {
    case 'title':
      return {
        id: `title-${dslComponent.content}`,
        type: 'TEXT',
        name: 'Title',
        characters: dslComponent.content,
        pluginData: { componentType: dslComponent.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.primary) }],
      }
    case 'subtitle':
      return {
        id: `subtitle-${dslComponent.content}`,
        type: 'TEXT',
        name: 'Subtitle',
        characters: dslComponent.content,
        pluginData: { componentType: dslComponent.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.secondary) }],
      }
    case 'text':
      return {
        id: `text-${dslComponent.content}`,
        type: 'TEXT',
        name: 'Body',
        characters: dslComponent.content,
        pluginData: { componentType: dslComponent.type },
        fills: [{ type: 'SOLID', color: hexToRgb(palette.secondary) }],
      }
    case 'button':
      return {
        id: `button-${dslComponent.content}`,
        type: 'FRAME',
        name: 'Button / Primary',
        layoutMode: 'HORIZONTAL',
        padding: { top: 12, right: 20, bottom: 12, left: 20 },
        itemSpacing: 8,
        fills: [{ type: 'SOLID', color: hexToRgb(palette.accent) }],
        pluginData: { componentType: dslComponent.type },
        children: [
          {
            id: `button-text-${dslComponent.content}`,
            type: 'TEXT',
            name: 'Label',
            characters: dslComponent.content,
            fills: [{ type: 'SOLID', color: hexToRgb('#ffffff') }],
          },
        ],
      }
    case 'form': {
      const fields = Array.isArray(dslComponent.props?.fields)
        ? (dslComponent.props.fields as Array<Record<string, string>>)
        : []
      return {
        id: `form-${dslComponent.content}`,
        type: 'FRAME',
        name: 'Form',
        layoutMode: 'VERTICAL',
        itemSpacing: 12,
        pluginData: { componentType: dslComponent.type },
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
        id: `component-${dslComponent.type}`,
        type: 'FRAME',
        name: `Slot / ${dslComponent.type}`,
        pluginData: { componentType: dslComponent.type },
      }
  }
}

function assetFromImage(slotName: string, image: HeroImage, kind: ExportAsset['kind']): ExportAsset {
  return {
    id: image.id,
    url: image.url,
    filename: `images/${image.id}.jpg`,
    slot: slotName,
    kind,
    prompt: image.prompt,
  }
}

function slotContextFromPattern(
  slotName: string,
  dsl: ScreenDSL,
  position: PatternDefinition['layout']['positions'][string]
): { node: FigmaNode; asset?: ExportAsset } {
  const component = dsl.components.find((candidate) => candidate.type === slotName)
  const supportingImages = dsl.supporting_images ?? []
  const supportingIndexMatch = slotName.match(/supporting_image_(\d+)/)

  if (slotName === 'hero_image') {
    const node = componentToFigmaNode({ slotName, component, palette: dsl.palette, vibe: dsl.vibe, heroImage: dsl.hero_image })
    return { node, asset: assetFromImage(slotName, dsl.hero_image, 'hero') }
  }

  if (supportingIndexMatch) {
    const index = Number.parseInt(supportingIndexMatch[1], 10)
    const image = supportingImages[index]
    const node = componentToFigmaNode({ slotName, component, palette: dsl.palette, vibe: dsl.vibe, heroImage: image })
    return image ? { node, asset: assetFromImage(slotName, image, 'supporting') } : { node }
  }

  const node = componentToFigmaNode({ slotName, component, palette: dsl.palette, vibe: dsl.vibe })
  node.pluginData = ensurePluginData(node.pluginData, { required: (position.height ?? 1) > 0 })
  return { node }
}

function mapSlotsToNodes(
  dsl: ScreenDSL,
  pattern: PatternDefinition,
  gridContext: GridContext,
  columnWidths: number[]
): { nodes: FigmaNode[]; assets: ExportAsset[] } {
  const nodes: FigmaNode[] = []
  const assets: ExportAsset[] = []

  Object.entries(pattern.layout.positions).forEach(([slotName, position]) => {
    const { node, asset } = slotContextFromPattern(slotName, dsl, position)
    node.absoluteBoundingBox = computeBoundingBox(position, gridContext, columnWidths)
    node.pluginData = ensurePluginData(node.pluginData, {
      slot: slotName,
      pattern: pattern.family,
      variant: pattern.variant,
    })

    nodes.push(node)
    if (asset) {
      assets.push(asset)
    }
  })

  return { nodes, assets }
}

function computeFrameHeight(pattern: PatternDefinition, gridContext: GridContext): number {
  const rowDepth = Math.max(
    ...Object.values(pattern.layout.positions).map((position) => position.y + (position.height ?? 1))
  )

  return (
    gridContext.spacing.padding * 2 +
    gridContext.rowUnit * rowDepth +
    gridContext.spacing.gap * Math.max(rowDepth - 1, 0)
  )
}

function hashScreen(screen: ScreenDSL): string {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(screen))
  return hash.digest('hex')
}

export function buildFigmaExportPayload(
  dsl: ScreenDSL,
  pattern: PatternDefinition
): FigmaExportPayload {
  const gridContext = computeGridContext(pattern)
  const columnWidths = computeColumnWidths(gridContext)
  const { nodes, assets } = mapSlotsToNodes(dsl, pattern, gridContext, columnWidths)

  const frameHeight = computeFrameHeight(pattern, gridContext)

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
    absoluteBoundingBox: { width: DEFAULT_FRAME_WIDTH, height: frameHeight },
    pluginData: {
      navigation: dsl.navigation,
      vibe: dsl.vibe,
      responsive: pattern.responsive,
      pattern: pattern.family,
      variant: pattern.variant,
    },
    children: nodes,
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
    assets,
  }
}

function collectCursorAssets(screens: ScreenDSL[]): ExportAsset[] {
  const assets = new Map<string, ExportAsset>()

  screens.forEach((screen) => {
    assets.set(screen.hero_image.id, assetFromImage('hero_image', screen.hero_image, 'hero'))
    screen.supporting_images?.forEach((image, index) => {
      assets.set(
        image.id,
        assetFromImage(`supporting_image_${index}`, image, 'supporting')
      )
    })
  })

  return Array.from(assets.values())
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
      hash: hashScreen(screen),
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

  const assets = collectCursorAssets(screens)

  return { manifest, files, assets }
}

export async function generateCursorZip(
  bundle: CursorExportBundle,
  options: { includeBinaryAssets?: boolean } = { includeBinaryAssets: false }
): Promise<Uint8Array> {
  const zip = new JSZip()

  bundle.files.forEach((file) => {
    zip.file(file.path, file.contents)
  })

  for (const asset of bundle.assets) {
    if (options.includeBinaryAssets) {
      const response = await fetch(asset.url)
      const buffer = await response.arrayBuffer()
      zip.file(asset.filename, buffer)
    } else {
      zip.file(`${asset.filename}.url`, asset.url)
    }
  }

  const manifest = JSON.stringify(bundle.manifest, null, 2)
  zip.file('manifest.json', manifest)

  return zip.generateAsync({ type: 'uint8array' })
}
