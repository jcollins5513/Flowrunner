import { prisma } from '../db/client'
import type { LibraryCollection, LibraryCollectionImage } from '@prisma/client'

/**
 * Data required to create a library collection
 */
export interface CreateCollectionData {
  userId: string
  name: string
  description?: string | null
}

/**
 * Data required to add an image to a collection
 */
export interface AddImageToCollectionData {
  collectionId: string
  imageId: string
  order?: number
}

/**
 * Repository for library collection operations
 */
export class LibraryCollectionRepository {
  /**
   * Create a new library collection
   */
  async createCollection(data: CreateCollectionData): Promise<LibraryCollection> {
    return prisma.libraryCollection.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description ?? null,
      },
    })
  }

  /**
   * Get a collection by ID
   */
  async getCollectionById(id: string): Promise<LibraryCollection | null> {
    return prisma.libraryCollection.findUnique({
      where: { id },
      include: {
        images: {
          include: {
            image: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    })
  }

  /**
   * Get all collections for a user
   */
  async getCollectionsByUser(userId: string): Promise<LibraryCollection[]> {
    return prisma.libraryCollection.findMany({
      where: { userId },
      include: {
        images: {
          include: {
            image: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Update a collection
   */
  async updateCollection(
    id: string,
    data: Partial<Pick<LibraryCollection, 'name' | 'description'>>
  ): Promise<LibraryCollection> {
    return prisma.libraryCollection.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete a collection
   */
  async deleteCollection(id: string): Promise<void> {
    await prisma.libraryCollection.delete({
      where: { id },
    })
  }

  /**
   * Add an image to a collection
   */
  async addImageToCollection(
    data: AddImageToCollectionData
  ): Promise<LibraryCollectionImage> {
    // Check if image is already in collection
    const existing = await prisma.libraryCollectionImage.findUnique({
      where: {
        collectionId_imageId: {
          collectionId: data.collectionId,
          imageId: data.imageId,
        },
      },
    })

    if (existing) {
      return existing
    }

    return prisma.libraryCollectionImage.create({
      data: {
        collectionId: data.collectionId,
        imageId: data.imageId,
        order: data.order ?? 0,
      },
    })
  }

  /**
   * Remove an image from a collection
   */
  async removeImageFromCollection(
    collectionId: string,
    imageId: string
  ): Promise<void> {
    await prisma.libraryCollectionImage.delete({
      where: {
        collectionId_imageId: {
          collectionId,
          imageId,
        },
      },
    })
  }

  /**
   * Update image order in collection
   */
  async updateImageOrder(
    collectionId: string,
    imageId: string,
    order: number
  ): Promise<LibraryCollectionImage> {
    return prisma.libraryCollectionImage.update({
      where: {
        collectionId_imageId: {
          collectionId,
          imageId,
        },
      },
      data: { order },
    })
  }
}

