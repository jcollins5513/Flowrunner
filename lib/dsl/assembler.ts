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
import { deterministicId } from '../utils/deterministic'
import { validateDSLAgainstPattern } from '../patterns/validator'
import type { PatternDefinition } from '../patterns/schema'
import { SUPPORTED_COMPONENT_TYPES } from '../renderer/component-factory'

/**
 * Input data for assembling a ScreenDSL
 */
export interface DSLAssemblyInput {
  // Required inputs
  heroImage: HeroImageWithPalette
  patternFamily: PatternFamily
  patternVariant: PatternVariant
  patternDefinition?: PatternDefinition

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
    const { validate = true, throwOnValidationError = true } = options

    // Step 1: Assemble hero_image from image metadata
    const hero_image = this.assembleHeroImage(input.heroImage)

    // Step 2: Assemble supporting_images array
    const supporting_images = this.assembleSupportingImages(input.supportingImages)

    // Step 3: Assemble palette from extracted colors (or use override)
    const palette = this.assemblePalette(input.heroImage, input.paletteOverride)

    // Step 4: Add vibe from inference (or use override)
    const vibe = this.assembleVibe(input.heroImage, input.vibeOverride)

    // Step 5: Assemble components array with generated text
    const components = await this.assembleComponents(input)

    // Step 6: Build navigation object
    const navigation = this.assembleNavigation(input.navigation)

    // Step 7: Add animations (default or provided)
    const animations = this.assembleAnimations(input.animations)

    // Step 8: Assemble metadata object
    const metadata = this.assembleMetadata(input.metadata)

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

      if (input.patternDefinition) {
        const patternValidation = validateDSLAgainstPattern(dsl, input.patternDefinition)
        if (!patternValidation.valid) {
          const formattedErrors = patternValidation.errors.map((error) => `${error.field}:${error.code}`)
          if (throwOnValidationError) {
            throw new Error(`Pattern validation failed: ${formattedErrors.join(', ')}`)
          }
          return {
            dsl,
            validationErrors: formattedErrors,
          }
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

    const idSeed = `${imageId ?? ''}-${image.url}-${image.prompt ?? ''}-${image.seed ?? ''}`
    const stableId = imageId ?? deterministicId('hero', idSeed)

    return {
      id: stableId,
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

  private validateComponentTypes(
    components: Component[],
    patternDefinition?: PatternDefinition,
    patternFamily?: PatternFamily
  ): void {
    const allowedTypes = new Set(SUPPORTED_COMPONENT_TYPES)
    const slotContract = patternDefinition?.componentSlots ?? PATTERN_FAMILY_METADATA[patternFamily as PatternFamily]?.componentSlots
    const requiredSlots = new Set(slotContract?.required ?? [])
    const optionalSlots = new Set(slotContract?.optional ?? [])

    const providedTypes = new Set<Component['type']>()

    components.forEach((component) => {
      if (!allowedTypes.has(component.type)) {
        throw new Error(`Unsupported component type ${component.type}`)
      }

      if (patternDefinition) {
        const layoutSlots = new Set(Object.keys(patternDefinition.layout.positions))
        if (!layoutSlots.has(component.type)) {
          throw new Error(`Component ${component.type} does not match pattern layout positions`)
        }
      }

      if (slotContract) {
        const isKnownSlot = requiredSlots.has(component.type) || optionalSlots.has(component.type)
        if (!isKnownSlot) {
          throw new Error(`Component ${component.type} is not declared in componentSlots`)
        }
      }

      providedTypes.add(component.type)
    })

    requiredSlots.forEach((slot) => {
      if (!providedTypes.has(slot as Component['type'])) {
        throw new Error(`Missing required component for slot ${slot}`)
      }
    })
  }

  /**
   * Assemble components array with generated text
   */
  private async assembleComponents(input: DSLAssemblyInput): Promise<Component[]> {
    if (input.components && input.components.length > 0) {
      this.validateComponentTypes(input.components, input.patternDefinition, input.patternFamily)
      return input.components
    }

    if (input.textGeneration) {
      const generated = this.buildComponentsFromTextGeneration(
        input.textGeneration,
        input.patternFamily
      )
      this.validateComponentTypes(generated, input.patternDefinition, input.patternFamily)
      return generated
    }

    throw new Error('Components must be supplied for DSL assembly; auto-generation is disabled')
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
        content: textGen.formLabels.join(' • '),
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

    const providedTypes = new Set(components.map((component) => component.type))
    required.forEach((slot) => {
      if (!providedTypes.has(slot as Component['type'])) {
        throw new Error(`Missing required component content for slot ${slot}`)
      }
    })

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
    providedMetadata?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!providedMetadata) {
      return undefined
    }

    const metadata: Record<string, unknown> = {
      ...providedMetadata,
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined
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

