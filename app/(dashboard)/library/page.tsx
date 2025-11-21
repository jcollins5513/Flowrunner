'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LibrarySearch } from '@/components/library/LibrarySearch'
import { LibraryFilters } from '@/components/library/LibraryFilters'
import { LibraryGrid } from '@/components/library/LibraryGrid'
import { ImageDetailModal } from '@/components/library/ImageDetailModal'
import type { ImageSearchFilters, ImageSortOption } from '@/lib/images/search-service'

const ITEMS_PER_PAGE = 24

interface ImageData {
  id: string
  url: string
  prompt?: string
  vibe?: string
  style?: string
  domain?: string
  palette?: any
  tags?: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
}

export default function LibraryPage() {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [filters, setFilters] = useState<Partial<ImageSearchFilters>>({
    // sortBy: 'newest', // TODO: Add sortBy to ImageSearchFilters type
  })

  const [searchQuery, setSearchQuery] = useState('')

  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()

      // Add search query
      if (searchQuery) queryParams.append('search', searchQuery)

      // Add filters
      if (filters.userId) queryParams.append('userId', filters.userId)
      if (filters.domain) queryParams.append('domain', filters.domain)
      if (filters.vibe) queryParams.append('vibe', filters.vibe)
      if (filters.style) queryParams.append('style', filters.style)
      if (filters.isFavorite !== undefined) {
        queryParams.append('favorite', String(filters.isFavorite))
      }
      if (filters.tags && filters.tags.length > 0) {
        queryParams.append('tags', filters.tags.join(','))
      }
      if (filters.patternCompatibility && filters.patternCompatibility.length > 0) {
        queryParams.append('patternCompatibility', filters.patternCompatibility.join(','))
      }
      if (filters.dateFrom) {
        queryParams.append('dateFrom', filters.dateFrom.toISOString())
      }
      if (filters.dateTo) {
        queryParams.append('dateTo', filters.dateTo.toISOString())
      }

      // Add sorting
      // TODO: Add sortBy to ImageSearchFilters type
      // if (filters.sortBy) {
      //   queryParams.append('sortBy', filters.sortBy as string)
      // }

      // Add pagination
      queryParams.append('limit', String(ITEMS_PER_PAGE))
      queryParams.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE))

      const response = await fetch(`/api/images?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }

      const data = await response.json()
      setImages(data.images || [])
      setTotalCount(data.pagination?.total || data.images?.length || 0)
    } catch (err) {
      console.error('Error fetching images:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }, [filters, searchQuery, currentPage])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleFiltersChange = (newFilters: Partial<ImageSearchFilters>) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1)
  }

  const handleFavoriteToggle = async (imageId: string, currentFavorite: boolean) => {
    try {
      const response = await fetch(`/api/images/${imageId}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentFavorite }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite status')
      }

      // Update local state
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, isFavorite: !currentFavorite } : img
        )
      )

      if (selectedImage?.id === imageId) {
        setSelectedImage((prev) =>
          prev ? { ...prev, isFavorite: !currentFavorite } : null
        )
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="container space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Image Library</h1>
        <p className="text-muted-foreground">
          Browse and manage your image collection
        </p>
      </div>

      {/* Search */}
      <LibrarySearch
        value={searchQuery}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Filters */}
      <LibraryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Error State */}
      {error && (
        <div className="container">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Library Grid */}
      <LibraryGrid
        images={images}
        loading={loading}
        viewMode={viewMode}
        onImageClick={setSelectedImage}
        onFavoriteToggle={handleFavoriteToggle}
      />

      {/* Pagination */}
      {!loading && images.length > 0 && totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground flex items-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}
    </div>
  )
}

