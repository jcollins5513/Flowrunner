import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ImageRepository } from '../../../../lib/images/repository'
import type { SaveImageData } from '../../../../lib/images/persistence/types'

// Mock Prisma client
vi.mock('../../../../lib/db/client', () => {
  const mockCreate = vi.fn()
  const mockFindUnique = vi.fn()
  const mockFindMany = vi.fn()

  return {
    prisma: {
      image: {
        create: mockCreate,
        findUnique: mockFindUnique,
        findMany: mockFindMany,
      },
    },
    // Export mocks for use in tests
    __mocks: {
      mockCreate,
      mockFindUnique,
      mockFindMany,
    },
  }
})

describe('ImageRepository', () => {
  let mockCreate: ReturnType<typeof vi.fn>
  let mockFindUnique: ReturnType<typeof vi.fn>
  let mockFindMany: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    const prismaModule = await import('../../../../lib/db/client')
    // Access the mocked prisma instance
    const prisma = (prismaModule as any).prisma
    mockCreate = prisma.image.create
    mockFindUnique = prisma.image.findUnique
    mockFindMany = prisma.image.findMany
  })

  describe('saveImage', () => {
    it('saves image with all metadata', async () => {
      const repository = new ImageRepository()
      const imageData: SaveImageData = {
        url: 'https://example.com/image.jpg',
        prompt: 'A beautiful sunset',
        seed: 12345,
        aspectRatio: '16:9',
        style: 'photographic',
        palette: {
          primary: '#FF5733',
          secondary: '#8B4513',
          accent: '#FFB347',
          background: '#FFFFFF',
          text: '#1F2937',
        },
        vibe: 'modern',
        domain: 'ecommerce',
        userId: 'user-123',
      }

      const mockImage = {
        id: 'img-123',
        ...imageData,
        extractedPalette: JSON.stringify(imageData.palette),
        patternCompatibilityTags: null,
        isPublic: false,
        isFavorite: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreate.mockResolvedValue(mockImage)

      const result = await repository.saveImage(imageData)

      expect(result).toBeDefined()
      expect(result.id).toBe('img-123')
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          url: imageData.url,
          prompt: imageData.prompt,
          seed: imageData.seed,
          aspectRatio: imageData.aspectRatio,
          style: imageData.style,
          extractedPalette: JSON.stringify(imageData.palette),
          vibe: imageData.vibe,
          domain: imageData.domain,
          userId: imageData.userId,
          patternCompatibilityTags: null,
          isPublic: false,
          isFavorite: false,
          usageCount: 0,
        },
      })
    })

    it('handles minimal image data', async () => {
      const repository = new ImageRepository()
      const imageData: SaveImageData = {
        url: 'https://example.com/image.jpg',
      }

      const mockImage = {
        id: 'img-456',
        url: imageData.url,
        prompt: null,
        seed: null,
        aspectRatio: null,
        style: null,
        extractedPalette: null,
        vibe: null,
        domain: null,
        userId: null,
        patternCompatibilityTags: null,
        isPublic: false,
        isFavorite: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCreate.mockResolvedValue(mockImage)

      const result = await repository.saveImage(imageData)

      expect(result).toBeDefined()
      expect(mockCreate).toHaveBeenCalled()
    })

    it('serializes palette as JSON', async () => {
      const repository = new ImageRepository()
      const palette = {
        primary: '#FF0000',
        secondary: '#00FF00',
      }

      const imageData: SaveImageData = {
        url: 'https://example.com/image.jpg',
        palette,
      }

      mockCreate.mockResolvedValue({
        id: 'img-789',
        extractedPalette: JSON.stringify(palette),
      })

      await repository.saveImage(imageData)

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          extractedPalette: JSON.stringify(palette),
        }),
      })
    })
  })

  describe('getImageById', () => {
    it('retrieves image by ID', async () => {
      const repository = new ImageRepository()
      const mockImage = {
        id: 'img-123',
        url: 'https://example.com/image.jpg',
        prompt: 'Test prompt',
      }

      mockFindUnique.mockResolvedValue(mockImage)

      const result = await repository.getImageById('img-123')

      expect(result).toEqual(mockImage)
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'img-123' },
      })
    })

    it('returns null when image not found', async () => {
      const repository = new ImageRepository()
      mockFindUnique.mockResolvedValue(null)

      const result = await repository.getImageById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getImagesByUser', () => {
    it('retrieves images for a user with pagination', async () => {
      const repository = new ImageRepository()
      const mockImages = [
        { id: 'img-1', userId: 'user-123' },
        { id: 'img-2', userId: 'user-123' },
      ]

      mockFindMany.mockResolvedValue(mockImages)

      const result = await repository.getImagesByUser('user-123', {
        limit: 10,
        offset: 0,
      })

      expect(result).toEqual(mockImages)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('uses default pagination when not provided', async () => {
      const repository = new ImageRepository()
      mockFindMany.mockResolvedValue([])

      await repository.getImagesByUser('user-123')

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('queryImages', () => {
    it('queries images with filters', async () => {
      const repository = new ImageRepository()
      const mockImages = [{ id: 'img-1', vibe: 'modern' }]

      mockFindMany.mockResolvedValue(mockImages)

      const result = await repository.queryImages(
        { vibe: 'modern', domain: 'ecommerce' },
        { limit: 20, offset: 0 }
      )

      expect(result).toEqual(mockImages)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          vibe: 'modern',
          domain: 'ecommerce',
        },
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('handles empty filters', async () => {
      const repository = new ImageRepository()
      mockFindMany.mockResolvedValue([])

      await repository.queryImages()

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
    })
  })

  describe('deserializePalette', () => {
    it('deserializes valid JSON palette', () => {
      const palette = { primary: '#FF0000', secondary: '#00FF00' }
      const json = JSON.stringify(palette)

      const result = ImageRepository.deserializePalette(json)

      expect(result).toEqual(palette)
    })

    it('returns null for null input', () => {
      const result = ImageRepository.deserializePalette(null)
      expect(result).toBeNull()
    })

    it('handles invalid JSON gracefully', () => {
      const result = ImageRepository.deserializePalette('invalid json')
      expect(result).toBeNull()
    })
  })

  describe('deserializePatternTags', () => {
    it('deserializes valid JSON array', () => {
      const tags = ['tag1', 'tag2']
      const json = JSON.stringify(tags)

      const result = ImageRepository.deserializePatternTags(json)

      expect(result).toEqual(tags)
    })

    it('returns null for null input', () => {
      const result = ImageRepository.deserializePatternTags(null)
      expect(result).toBeNull()
    })
  })
})

