// Zod schema for pattern definitions
import { z } from 'zod'
import { ALL_PATTERN_FAMILIES } from './families'

// Component position schema for grid/flex layouts
const componentPositionSchema = z.object({
  x: z.number().int().min(0).describe('Grid column or flex order position'),
  y: z.number().int().min(0).describe('Grid row position'),
  width: z.number().int().positive().describe('Width in grid columns or flex basis'),
  height: z.number().int().positive().optional().describe('Height in grid rows'),
})

// Image placement schema
const imagePlacementSchema = z.object({
  position: z.string().describe('Image position identifier (e.g., "top", "left", "center", "full-bleed")'),
  size: z.string().describe('Image size constraint (e.g., "full", "half", "third", "contain")'),
})

// Responsive breakpoint schema
const breakpointSchema = z.object({
  mobile: z.object({
    gridTemplate: z.string().optional(),
    padding: z.number().optional(),
    gap: z.number().optional(),
  }).optional(),
  tablet: z.object({
    gridTemplate: z.string().optional(),
    padding: z.number().optional(),
    gap: z.number().optional(),
  }).optional(),
  desktop: z.object({
    gridTemplate: z.string().optional(),
    padding: z.number().optional(),
    gap: z.number().optional(),
  }).optional(),
})

// Pattern definition schema
export const patternDefinitionSchema = z.object({
  family: z.enum(ALL_PATTERN_FAMILIES as [string, ...string[]]).describe('Pattern family identifier'),
  variant: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).describe('Pattern variant number (1-5)'),
  name: z.string().min(1).describe('Human-readable variant name'),
  description: z.string().describe('Variant description'),
  layout: z.object({
    structure: z.enum(['grid', 'flex']).describe('Layout structure type'),
    gridTemplate: z.string().optional().describe('CSS grid template definition (e.g., "1fr 1fr" or "repeat(3, 1fr)")'),
    flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional().describe('Flex direction (required if structure is flex)'),
    positions: z.record(componentPositionSchema).describe('Component position mapping (component slot name -> position)'),
  }).refine(
    (data) => {
      if (data.structure === 'flex') {
        return !!data.flexDirection
      }
      if (data.structure === 'grid') {
        return !!data.gridTemplate
      }
      return true
    },
    {
      message: 'Grid structure requires gridTemplate, flex structure requires flexDirection',
    }
  ),
  componentSlots: z.object({
    required: z.array(z.string()).describe('Array of required component slot identifiers'),
    optional: z.array(z.string()).describe('Array of optional component slot identifiers'),
  }),
  spacing: z.object({
    padding: z.number().int().min(0).describe('Container padding in pixels'),
    gap: z.number().int().min(0).describe('Grid/flex gap in pixels'),
  }),
  responsive: z.object({
    breakpoints: breakpointSchema.describe('Responsive breakpoint overrides'),
  }),
  imagePlacement: z.object({
    hero: imagePlacementSchema.describe('Hero image placement configuration'),
    supporting: z.array(imagePlacementSchema).optional().describe('Supporting image placements (if applicable)'),
  }),
}).superRefine((value, ctx) => {
  const hasHeroSlot = Boolean(value.layout.positions.hero_image)
  if (!hasHeroSlot && !value.imagePlacement.hero) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'hero_image placement must be declared in layout.positions or imagePlacement.hero',
      path: ['layout', 'positions'],
    })
  }

  value.componentSlots.required.forEach((slot) => {
    if (!value.layout.positions[slot]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Required slot ${slot} is missing a layout position`,
        path: ['layout', 'positions', slot],
      })
    }
  })
})

export type PatternDefinition = z.infer<typeof patternDefinitionSchema>

