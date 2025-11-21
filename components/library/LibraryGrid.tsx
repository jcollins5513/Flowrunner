'use client'

import React from 'react'
import { ImageCard } from './ImageCard'
import { cn } from '@/lib/utils'

interface ImageData {
  id: string
  url: string
  prompt?: string
  vibe?: string
  style?: string
  domain?: string
  tags?: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
}

interface LibraryGridProps {
  images: ImageData[]
  loading: boolean
  viewMode: 'grid' | 'list'
  onImageClick: (image: ImageData) => void
  onFavoriteToggle: (imageId: string, currentFavorite: boolean) => void
}

export function LibraryGrid({
  images,
  loading,
  viewMode,
  onImageClick,
  onFavoriteToggle,
}: LibraryGridProps) {
  if (loading) {
    return (
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images found</p>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="container space-y-2">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            viewMode="list"
            onImageClick={onImageClick}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            viewMode="grid"
            onImageClick={onImageClick}
            onFavoriteToggle={onFavoriteToggle}
          />
        ))}
      </div>
    </div>
  )
}
