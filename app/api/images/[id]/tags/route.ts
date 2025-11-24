import { NextRequest, NextResponse } from 'next/server'
import { ImageRepository } from '@/lib/images/repository'
import { z } from 'zod'

const updateTagsSchema = z.object({
  tags: z.array(z.string()),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateTagsSchema.parse(body)

    const repository = new ImageRepository()
    const image = await repository.updateTags(id, validated.tags)

    const tags = ImageRepository.deserializeTags(image.tags)

    return NextResponse.json({
      id: image.id,
      tags,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating tags:', error)
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    )
  }
}

