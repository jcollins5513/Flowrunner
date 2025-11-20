// Image Replacer Component
// Shows replace button overlay on hero image in edit mode

'use client'

import React, { useState } from 'react'
import { HeroImage } from '@/components/renderer/HeroImage'
import { ImageLibraryPicker } from './ImageLibraryPicker'
import type { HeroImage as HeroImageType } from '@/lib/dsl/types'
import { cn } from '@/lib/utils'

export interface ImageReplacerProps {
  image: HeroImageType
  onReplace: (newImage: HeroImageType) => void
  editMode: boolean
  className?: string
  style?: React.CSSProperties
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  size?: 'small' | 'medium' | 'large'
  palette?: HeroImageType['extractedPalette']
}

export const ImageReplacer: React.FC<ImageReplacerProps> = ({
  image,
  onReplace,
  editMode,
  className = '',
  style,
  position = 'top',
  size = 'small',
  palette,
}) => {
  const [showPicker, setShowPicker] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleReplace = () => {
    setShowPicker(true)
  }

  const handleImageSelect = (selectedImage: HeroImageType) => {
    onReplace(selectedImage)
    setShowPicker(false)
  }

  const handleClosePicker = () => {
    setShowPicker(false)
  }

  if (!editMode) {
    return (
      <HeroImage
        image={image}
        position={position}
        size={size}
        palette={palette}
        className={className}
        style={style}
      />
    )
  }

  return (
    <>
      <div
        className={cn('relative group', className)}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <HeroImage
          image={image}
          position={position}
          size={size}
          palette={palette}
          className={className}
          style={style}
        />
        {isHovered && (
          <>
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded opacity-50 pointer-events-none" />
            <button
              type="button"
              onClick={handleReplace}
              className={cn(
                'absolute top-2 right-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg',
                'hover:bg-blue-700 transition-colors z-10',
                'text-sm font-medium'
              )}
            >
              Replace Image
            </button>
            <div className="absolute -top-8 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded pointer-events-none">
              Click to replace
            </div>
          </>
        )}
      </div>
      {showPicker && (
        <ImageLibraryPicker
          onSelect={handleImageSelect}
          onClose={handleClosePicker}
          currentImageId={image.id}
        />
      )}
    </>
  )
}
