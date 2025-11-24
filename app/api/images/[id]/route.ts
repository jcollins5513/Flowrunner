import { NextRequest, NextResponse } from 'next/server'
import { ImageRepository } from '@/lib/images/repository'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const repository = new ImageRepository()
    const image = await repository.getImageById(id)

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Deserialize JSON fields for response
    const palette = ImageRepository.deserializePalette(image.extractedPalette)
    const patternTags = ImageRepository.deserializePatternTags(image.patternCompatibilityTags)

    // Return full image data
    return NextResponse.json({
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      seed: image.seed,
      aspectRatio: image.aspectRatio,
      style: image.style,
      palette,
      vibe: image.vibe,
      patternCompatibilityTags: patternTags,
      domain: image.domain,
      userId: image.userId,
      isPublic: image.isPublic,
      isFavorite: image.isFavorite,
      usageCount: image.usageCount,
      parentImageId: image.parentImageId,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}

