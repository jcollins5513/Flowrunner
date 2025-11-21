// DSL Assembler Service
// Assembles complete ScreenDSL objects from various inputs following the deterministic pipeline

import {
  type ScreenDSL,
  type HeroImage,
  type Component,
  type Navigation,
  type Palette,
  type PatternFamily,
  type PatternVariant,
  type Vibe,
} from './types'
import { type PartialScreenDSL } from './schemas'
import { validateScreenDSL } from './validator'
import type { HeroImageWithPalette } from '../images/orchestrator'
import type { TextGenerationResult } from '../ai/text-generation/types'
import { PATTERN_FAMILY_METADATA } from '../patterns/metadata'

/**
 * Input data for assembling a ScreenDSL
 */
export interface DSLAssemblyInput {
  // Required inputs
  heroImage: HeroImageWithPalette
  patternFamily: PatternFamily
  patternVariant: PatternVariant

  // Optional inputs
  supportingImages?: HeroImageWithPalette[]
  components?: Component[]
  textGeneration?: TextGenerationResult
  navigation?: Navigation
  animations?: Record<string, unknown>
  metadata?: Record<string, unknown>

  // Overrides (take precedence over extracted values)
  paletteOverride?: Palette
  vibeOverride?: Vibe
}

/**
 * Options for DSL assembly
 */
export interface DSLAssemblyOptions {
  /**
   * Whether to validate the assembled DSL (default: true)
   */
  validate?: boolean

  /**
   * Whether to throw on validation errors (default: true)
   * If false, returns validation errors in the result
   */
  throwOnValidationError?: boolean

  /**
   * Whether to use pattern metadata to generate required components
   * if components are not provided (default: true)
   */
  autoGenerateComponents?: boolean
}

/**
 * Result of DSL assembly
 */
export interface DSLAssemblyResult {
  dsl: ScreenDSL
  validationErrors?: string[]
}

/**
 * DSL Assembler Service
 * Follows the deterministic pipeline to assemble complete ScreenDSL objects
 */
export class DSLAssembler {
  /**
   * Assemble a complete ScreenDSL from input data
   */
  async assemble(input: DSLAssemblyInput, options: DSLAssemblyOptions = {}): Promise<DSLAssemblyResult> {
    const {
      validate = true,
      throwOnValidationError = true,
      autoGenerateComponents = true,
    } = options

    // Step 1: Assemble hero_image from image metadata
    const hero_image = this.assembleHeroImage(input.heroImage)

    // Step 2: Assemble supporting_images array
    const supporting_images = this.assembleSupportingImages(input.supportingImages)

    // Step 3: Assemble palette from extracted colors (or use override)
    const palette = this.assemblePalette(input.heroImage, input.paletteOverride)

    // Step 4: Add vibe from inference (or use override)
    const vibe = this.assembleVibe(input.heroImage, input.vibeOverride)

    // Step 5: Assemble components array with generated text
    const components = await this.assembleComponents(
      input,
      autoGenerateComponents
    )

    // Step 6: Build navigation object
    const navigation = this.assembleNavigation(input.navigation)

    // Step 7: Add animations (default or provided)
    const animations = this.assembleAnimations(input.animations)

    // Step 8: Assemble metadata object
    const metadata = this.assembleMetadata(input.metadata, input)

    // Step 9: Create complete ScreenDSL object
    const dsl: ScreenDSL = {
      hero_image,
      ...(supporting_images && supporting_images.length > 0 && { supporting_images }),
      palette,
      vibe,
      pattern_family: input.patternFamily,
      pattern_variant: input.patternVariant,
      components,
      ...(navigation && { navigation }),
      ...(animations && Object.keys(animations).length > 0 && { animations }),
      ...(metadata && Object.keys(metadata).length > 0 && { metadata }),
    }

    // Step 10: Validate DSL against Zod schema
    if (validate) {
      const validationResult = validateScreenDSL(dsl)
      if (!validationResult.success) {
        if (throwOnValidationError) {
          throw validationResult.error || new Error('DSL validation failed')
        }
        return {
          dsl,
          validationErrors: validationResult.formattedErrors || ['Unknown validation error'],
        }
      }
    }

    return { dsl }
  }

  /**
   * Assemble hero_image from image metadata
   */
  private assembleHeroImage(heroImage: HeroImageWithPalette): HeroImage {
    const { image, palette, vibe, imageId } = heroImage

    // Convert image palette to DSL palette format (remove optional text field)
    const extractedPalette: Palette | undefined = palette
      ? {
          primary: palette.primary,
          secondary: palette.secondary ?? palette.primary,
          accent: palette.accent ?? palette.primary,
          background: palette.background ?? '#FFFFFF',
        }
      : undefined

    return {
      id: imageId || `hero-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: image.url,
      prompt: image.prompt,
      seed: image.seed,
      aspectRatio: image.aspectRatio,
      style: image.style,
      extractedPalette,
      vibe,
    }
  }

  /**
   * Assemble supporting_images array
   */
  private assembleSupportingImages(
    supportingImages?: HeroImageWithPalette[]
  ): HeroImage[] | undefined {
    if (!supportingImages || supportingImages.length === 0) {
      return undefined
    }

    return supportingImages.map((img) => this.assembleHeroImage(img))
  }

  /**
   * Assemble palette from extracted colors
   */
  private assemblePalette(
    heroImage: HeroImageWithPalette,
    override?: Palette
  ): Palette {
    if (override) {
      return override
    }

    const { palette } = heroImage

    // Convert image palette to DSL palette format
    // DSL palette requires: primary, secondary, accent, background
    return {
      primary: palette.primary,
      secondary: palette.secondary ?? palette.primary,
      accent: palette.accent ?? palette.primary,
      background: palette.background ?? '#FFFFFF',
    }
  }

  /**
   * Add vibe from inference
   */
  private assembleVibe(
    heroImage: HeroImageWithPalette,
    override?: Vibe
  ): Vibe {
    if (override) {
      return override
    }

    // Use vibe from image inference, or default to 'modern'
    return heroImage.vibe ?? 'modern'
  }

  /**
   * Assemble components array with generated text
   */
  private async assembleComponents(
    input: DSLAssemblyInput,
    autoGenerate: boolean
  ): Promise<Component[]> {
    // If components are provided, use them
    if (input.components && input.components.length > 0) {
      return input.components
    }

    // If text generation result is provided, build components from it
    if (input.textGeneration) {
      return this.buildComponentsFromTextGeneration(
        input.textGeneration,
        input.patternFamily
      )
    }

    // If auto-generate is enabled, create components based on pattern requirements
    if (autoGenerate) {
      return this.generateComponentsFromPattern(input.patternFamily)
    }

    // Default: return empty array (will fail validation, but that's expected)
    return []
  }

  /**
   * Build components from text generation result
   */
  private buildComponentsFromTextGeneration(
    textGen: TextGenerationResult,
    patternFamily: PatternFamily
  ): Component[] {
    const components: Component[] = []
    const metadata = PATTERN_FAMILY_METADATA[patternFamily]
    const { required, optional } = metadata.componentSlots

    // Add required components first
    if (required.includes('title') && textGen.title) {
      components.push({
        type: 'title',
        content: textGen.title,
      })
    }

    if (required.includes('subtitle') && textGen.subtitle) {
      components.push({
        type: 'subtitle',
        content: textGen.subtitle,
      })
    }

    if (required.includes('text') && textGen.body) {
      components.push({
        type: 'text',
        content: textGen.body,
      })
    }

    if (required.includes('button') && textGen.buttonLabels.length > 0) {
      components.push({
        type: 'button',
        content: textGen.buttonLabels[0],
      })
    }

    if (required.includes('form') && textGen.formLabels.length > 0) {
      components.push({
        type: 'form',
        content: JSON.stringify({
          fields: textGen.formLabels.map((label) => ({
            name: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            type: 'text',
          })),
        }),
        props: {
          fields: textGen.formLabels.map((label) => ({
            name: label.toLowerCase().replace(/\s+/g, '_'),
            label,
            type: 'text',
          })),
        },
      })
    }

    // Add optional components if available
    if (optional.includes('subtitle') && !required.includes('subtitle') && textGen.subtitle) {
      components.push({
        type: 'subtitle',
        content: textGen.subtitle,
      })
    }

    if (optional.includes('text') && !required.includes('text') && textGen.body) {
      components.push({
        type: 'text',
        content: textGen.body,
      })
    }

    if (optional.includes('button') && !required.includes('button') && textGen.buttonLabels.length > 0) {
      components.push({
        type: 'button',
        content: textGen.buttonLabels[0],
      })
    }

    return components
  }

  /**
   * Generate components from pattern requirements
   */
  private generateComponentsFromPattern(patternFamily: PatternFamily): Component[] {
    const metadata = PATTERN_FAMILY_METADATA[patternFamily]
    const { required, optional } = metadata.componentSlots
    const components: Component[] = []

    // Add required components with default content
    if (required.includes('title')) {
      components.push({
        type: 'title',
        content: 'Welcome',
      })
    }

    if (required.includes('subtitle')) {
      components.push({
        type: 'subtitle',
        content: 'Get started today',
      })
    }

    if (required.includes('text')) {
      components.push({
        type: 'text',
        content: 'This is placeholder text that should be replaced with generated content.',
      })
    }

    if (required.includes('button')) {
      components.push({
        type: 'button',
        content: 'Continue',
      })
    }

    if (required.includes('form')) {
      components.push({
        type: 'form',
        content: JSON.stringify({
          fields: [
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'name', label: 'Name', type: 'text' },
          ],
        }),
        props: {
          fields: [
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'name', label: 'Name', type: 'text' },
          ],
        },
      })
    }

    // Add some optional components
    if (optional.includes('subtitle') && !required.includes('subtitle')) {
      components.push({
        type: 'subtitle',
        content: 'Additional information',
      })
    }

    return components
  }

  /**
   * Build navigation object
   */
  private assembleNavigation(navigation?: Navigation): Navigation | undefined {
    if (!navigation) {
      return undefined
    }

    // Validate navigation structure
    if (navigation.type === 'internal' && !navigation.screenId) {
      // Return undefined if internal navigation is missing screenId
      return undefined
    }

    if (navigation.type === 'external' && !navigation.url) {
      // Return undefined if external navigation is missing url
      return undefined
    }

    return navigation
  }

  /**
   * Add animations (default or provided)
   */
  private assembleAnimations(
    animations?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!animations || Object.keys(animations).length === 0) {
      // Return default animations or undefined
      return undefined
    }

    return animations
  }

  /**
   * Assemble metadata object
   */
  private assembleMetadata(
    providedMetadata?: Record<string, unknown>,
    input?: DSLAssemblyInput
  ): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {
      ...providedMetadata,
      assembledAt: new Date().toISOString(),
      assemblerVersion: '1.0.0',
    }

    if (input?.heroImage.imageId) {
      metadata.heroImageId = input.heroImage.imageId
    }

    if (input?.heroImage.image.metadata) {
      metadata.imageMetadata = input.heroImage.image.metadata
    }

    if (Object.keys(metadata).length === 0) {
      return undefined
    }

    return metadata
  }


  /**
   * Update an existing DSL with partial data
   * Useful for editing scenarios
   */
  async updateDSL(
    existingDSL: ScreenDSL,
    updates: PartialScreenDSL,
    options: DSLAssemblyOptions = {}
  ): Promise<DSLAssemblyResult> {
    const {
      validate = true,
      throwOnValidationError = true,
    } = options

    // Merge updates into existing DSL
    const updatedDSL: ScreenDSL = {
      ...existingDSL,
      ...updates,
      // Deep merge for nested objects
      hero_image: updates.hero_image ?? existingDSL.hero_image,
      palette: updates.palette ?? existingDSL.palette,
      components: updates.components ?? existingDSL.components,
      navigation: updates.navigation ?? existingDSL.navigation,
      animations: updates.animations ?? existingDSL.animations,
      metadata: {
        ...existingDSL.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Validate updated DSL
    if (validate) {
      const validationResult = validateScreenDSL(updatedDSL)
      if (!validationResult.success) {
        if (throwOnValidationError) {
          throw validationResult.error || new Error('DSL validation failed')
        }
        return {
          dsl: updatedDSL,
          validationErrors: validationResult.formattedErrors || ['Unknown validation error'],
        }
      }
    }

    return { dsl: updatedDSL }
  }
}

/**
 * Default DSL assembler instance
 */
export const dslAssembler = new DSLAssembler()

