// Image Update Utilities
// Handles automatic palette/vibe extraction and update on image replacement

import type { ScreenDSL, HeroImage, Palette, Vibe } from '../dsl/types'

export interface ImageUpdateResult {
  dsl: ScreenDSL
  updatedPalette?: Palette
  updatedVibe?: Vibe
}

/**
 * Update screen DSL with new image and extract palette/vibe
 */
export function updateImageInDSL(
  dsl: ScreenDSL,
  newImage: HeroImage
): ImageUpdateResult {
  // Extract palette from new image if available
  const updatedPalette = newImage.extractedPalette || dsl.palette

  // Extract vibe from new image if available
  const updatedVibe = newImage.vibe || dsl.vibe

  // Update DSL with new image and extracted values
  const updatedDSL: ScreenDSL = {
    ...dsl,
    hero_image: newImage,
    palette: updatedPalette,
    vibe: updatedVibe,
  }

  return {
    dsl: updatedDSL,
    updatedPalette,
    updatedVibe,
  }
}

/**
 * Check if palette should be updated based on image
 */
export function shouldUpdatePalette(image: HeroImage): boolean {
  return !!image.extractedPalette
}

/**
 * Check if vibe should be updated based on image
 */
export function shouldUpdateVibe(image: HeroImage): boolean {
  return !!image.vibe
}
