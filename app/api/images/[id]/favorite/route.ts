import { NextRequest, NextResponse } from 'next/server'
import { ImageRepository } from '@/lib/images/repository'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isFavorite } = body

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json(
        { error: 'isFavorite must be a boolean' },
        { status: 400 }
      )
    }

    const repository = new ImageRepository()
    const image = await repository.updateFavorite(id, isFavorite)

    return NextResponse.json({
      id: image.id,
      isFavorite: image.isFavorite,
    })
  } catch (error) {
    console.error('Error updating favorite status:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    )
  }
}

