import { prisma } from './client'
import type { HeroImageWithPalette } from '../images/orchestrator'

export interface PersistHeroImageOptions {
  userId?: string | null
  domain?: string | null
}

/**
 * Persist hero image metadata (palette + vibe) using Prisma.
 * Ensures the renderer can reference stored assets without losing extracted styling data.
 */
export async function persistHeroImageMetadata(
  heroImage: HeroImageWithPalette,
  options: PersistHeroImageOptions = {}
) {
  const paletteJson = heroImage.palette ? JSON.stringify(heroImage.palette) : null

  const baseData = {
    url: heroImage.image.url,
    prompt: heroImage.image.prompt ?? null,
    seed: heroImage.image.seed ?? null,
    aspectRatio: heroImage.image.aspectRatio ?? null,
    style: heroImage.image.style ?? null,
    extractedPalette: paletteJson,
    vibe: heroImage.vibe ?? null,
    domain: options.domain ?? null,
    userId: options.userId ?? null,
  }

  if (heroImage.imageId) {
    return prisma.image.upsert({
      where: { id: heroImage.imageId },
      update: baseData,
      create: {
        id: heroImage.imageId,
        ...baseData,
      },
    })
  }

  return prisma.image.create({
    data: baseData,
  })
}

