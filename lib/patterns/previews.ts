import type { PatternFamily, PatternVariant, Palette, Vibe } from '../dsl/types'
import type { PatternDomain } from './families'
import previews from './previews.json'

export interface PatternPreview {
  family: PatternFamily
  variant: PatternVariant
  displayName: string
  description: string
  domain: PatternDomain
  thumbnail: string
  tags: string[]
  palette: Palette
  vibe: Vibe
  requiredSlots: string[]
  optionalSlots: string[]
}

export const PATTERN_PREVIEWS: PatternPreview[] = previews as PatternPreview[]

export function getPatternPreview(family: PatternFamily, variant: PatternVariant): PatternPreview | undefined {
  return PATTERN_PREVIEWS.find((preview) => preview.family === family && preview.variant === variant)
}

export function getPatternPreviewsByFamily(family: PatternFamily): PatternPreview[] {
  return PATTERN_PREVIEWS.filter((preview) => preview.family === family)
}

