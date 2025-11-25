// Image Library Picker Component
// Modal for selecting images from library

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import type { HeroImage as HeroImageType, Vibe, Palette } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

export interface ImageLibraryPickerProps {
  onSelect: (image: HeroImageType) => void
  onClose: () => void
  currentImageId?: string
  filters?: {
    vibe?: Vibe
    domain?: string
    style?: string
  }
}

interface ImageListItem {
  id: string
  url: string
  prompt?: string
  vibe?: Vibe
  style?: string
  domain?: string
  palette?: Palette
  createdAt: string
}

export const ImageLibraryPicker: React.FC<ImageLibraryPickerProps> = ({
  onSelect,
  onClose,
  currentImageId,
  filters,
}) => {
  const [images, setImages] = useState<ImageListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVibe, setSelectedVibe] = useState<Vibe | ''>(filters?.vibe || '')
  const [selectedStyle, setSelectedStyle] = useState<string>(filters?.style || '')
  const [selectedDomain, setSelectedDomain] = useState<string>(filters?.domain || '')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedVibe) params.append('vibe', selectedVibe)
      if (selectedStyle) params.append('style', selectedStyle)
      if (selectedDomain) params.append('domain', selectedDomain)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '50')

      const response = await fetch(`/api/images?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }

      const data = await response.json()
      // Transform API response to include full image data
      const imageList: ImageListItem[] = (data.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        prompt: img.prompt || undefined,
        vibe: img.vibe || undefined,
        style: img.style || undefined,
        domain: img.domain || undefined,
        palette: (img.palette || img.extractedPalette) as Palette | undefined,
        createdAt: img.createdAt || new Date().toISOString(),
      }))
      setImages(imageList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedVibe, selectedStyle, selectedDomain])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleImageClick = (image: ImageListItem) => {
    const heroImage: HeroImageType = {
      id: image.id,
      url: image.url,
      prompt: image.prompt,
      extractedPalette: image.palette,
      vibe: image.vibe,
      style: image.style,
    }
    onSelect(heroImage)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const vibes: Vibe[] = [
    'playful',
    'professional',
    'bold',
    'minimal',
    'modern',
    'retro',
    'elegant',
    'energetic',
    'calm',
    'tech',
    'creative',
    'corporate',
  ]

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Image Library Picker"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Select Image</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, tags, or vibes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vibe</label>
            <select
              value={selectedVibe}
              onChange={(e) => setSelectedVibe(e.target.value as Vibe | '')}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Vibes</option>
              {vibes.map((vibe) => (
                <option key={vibe} value={vibe}>
                  {vibe.charAt(0).toUpperCase() + vibe.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
            <input
              type="text"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              placeholder="Filter by style"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
            <input
              type="text"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              placeholder="Filter by domain"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading images...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">No images found</div>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    'relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all',
                    currentImageId === image.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-blue-400'
                  )}
                  onClick={() => handleImageClick(image)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.prompt || 'Image'}
                    className="w-full h-full object-cover"
                  />
                  {image.vibe && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                      {image.vibe}
                    </div>
                  )}
                  {currentImageId === image.id && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Current
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
