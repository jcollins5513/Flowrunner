import type { Vibe } from './schema'
import type { PatternFamily } from '../../patterns/families'
import { PATTERN_FAMILIES } from '../../patterns/families'

/**
 * Compatibility matrix mapping vibes to compatible pattern families
 * Each vibe has a list of pattern families that work well with that aesthetic
 */
const VIBE_PATTERN_COMPATIBILITY: Record<Vibe, PatternFamily[]> = {
  playful: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
  ],
  professional: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.PRICING_TABLE,
    PATTERN_FAMILIES.DASHBOARD_OVERVIEW,
    PATTERN_FAMILIES.NEWSLETTER_SIGNUP,
  ],
  bold: [
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
    PATTERN_FAMILIES.DEMO_DEVICE_FULLBLEED,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
  ],
  minimal: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.ACT_FORM_MINIMAL,
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.NEWSLETTER_SIGNUP,
    PATTERN_FAMILIES.PRICING_TABLE,
  ],
  modern: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.DASHBOARD_OVERVIEW,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
  ],
  retro: [
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
    PATTERN_FAMILIES.TESTIMONIAL_CARD_GRID,
  ],
  elegant: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.PRICING_TABLE,
    PATTERN_FAMILIES.PRODUCT_DETAIL,
  ],
  energetic: [
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.DEMO_DEVICE_FULLBLEED,
  ],
  calm: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.ACT_FORM_MINIMAL,
    PATTERN_FAMILIES.NEWSLETTER_SIGNUP,
  ],
  tech: [
    PATTERN_FAMILIES.DASHBOARD_OVERVIEW,
    PATTERN_FAMILIES.DEMO_DEVICE_FULLBLEED,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.ONB_HERO_TOP,
  ],
  creative: [
    PATTERN_FAMILIES.HERO_CENTER_TEXT,
    PATTERN_FAMILIES.CTA_SPLIT_SCREEN,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.TESTIMONIAL_CARD_GRID,
  ],
  corporate: [
    PATTERN_FAMILIES.ONB_HERO_TOP,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_RIGHT,
    PATTERN_FAMILIES.FEAT_IMAGE_TEXT_LEFT,
    PATTERN_FAMILIES.PRICING_TABLE,
    PATTERN_FAMILIES.DASHBOARD_OVERVIEW,
    PATTERN_FAMILIES.NEWSLETTER_SIGNUP,
  ],
}

/**
 * Get compatible pattern families for a given vibe
 * @param vibe The vibe to get compatible patterns for
 * @returns Array of compatible pattern families
 */
export const getCompatiblePatterns = (vibe: Vibe): PatternFamily[] => {
  return VIBE_PATTERN_COMPATIBILITY[vibe] ?? []
}

/**
 * Check if a pattern family is compatible with a vibe
 * @param vibe The vibe to check
 * @param patternFamily The pattern family to check compatibility for
 * @returns True if the pattern is compatible with the vibe
 */
export const isPatternCompatible = (vibe: Vibe, patternFamily: PatternFamily): boolean => {
  return getCompatiblePatterns(vibe).includes(patternFamily)
}

/**
 * Get all vibes compatible with a pattern family
 * @param patternFamily The pattern family to find compatible vibes for
 * @returns Array of compatible vibes
 */
export const getCompatibleVibes = (patternFamily: PatternFamily): Vibe[] => {
  const compatibleVibes: Vibe[] = []
  for (const [vibe, patterns] of Object.entries(VIBE_PATTERN_COMPATIBILITY)) {
    if (patterns.includes(patternFamily)) {
      compatibleVibes.push(vibe as Vibe)
    }
  }
  return compatibleVibes
}

