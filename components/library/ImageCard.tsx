'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface ImageCardProps {
  image: ImageData
  viewMode: 'grid' | 'list'
  onImageClick: (image: ImageData) => void
  onFavoriteToggle: (imageId: string, currentFavorite: boolean) => void
}

export function ImageCard({
  image,
  viewMode,
  onImageClick,
  onFavoriteToggle,
}: ImageCardProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFavoriteToggle(image.id, image.isFavorite)
  }

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
        onClick={() => onImageClick(image)}
      >
        <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.prompt || 'Image'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {image.prompt || 'Untitled Image'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {image.vibe && (
              <Badge variant="secondary" className="text-xs">
                {image.vibe}
              </Badge>
            )}
            {image.style && (
              <Badge variant="outline" className="text-xs">
                {image.style}
              </Badge>
            )}
            {image.usageCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Used {image.usageCount} time{image.usageCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFavoriteClick}
          className={cn(
            'flex-shrink-0',
            image.isFavorite && 'text-red-500'
          )}
          aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'h-5 w-5',
              image.isFavorite && 'fill-current'
            )}
          />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="relative group aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all"
      onClick={() => onImageClick(image)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.prompt || 'Image'}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs">
          {image.prompt && (
            <p className="truncate mb-1">{image.prompt}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {image.vibe && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                  {image.vibe}
                </Badge>
              )}
            </div>
            {image.usageCount > 0 && (
              <span className="text-xs opacity-75">
                {image.usageCount} use{image.usageCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteClick}
        className={cn(
          'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white',
          image.isFavorite && 'opacity-100 text-red-500'
        )}
        aria-label={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={cn(
            'h-4 w-4',
            image.isFavorite && 'fill-current'
          )}
        />
      </Button>
      {image.isFavorite && (
        <div className="absolute top-2 left-2">
          <Badge variant="default" className="text-xs">
            Favorite
          </Badge>
        </div>
      )}
    </div>
  )
}

