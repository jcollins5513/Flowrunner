// Supporting images component renderer
// Renders supporting images based on pattern-defined positioning and layout configuration
'use client'

import React from 'react'
import { type HeroImage, type Palette } from '@/lib/dsl/types'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { HeroImage as HeroImageComponent } from './HeroImage'
import { cn } from '@/lib/utils'

export type SupportingImagesLayout = 'grid' | 'carousel' | 'list'

export interface SupportingImagesProps {
  images: HeroImage[]
  pattern?: PatternDefinition
  layout?: SupportingImagesLayout
  className?: string
  style?: React.CSSProperties
  lazy?: boolean
  palette?: Palette
}

export const SupportingImages: React.FC<SupportingImagesProps> = ({
  images,
  pattern,
  layout = 'grid',
  className = '',
  style,
  lazy = true,
  palette,
}) => {
  if (!images || images.length === 0) {
    return null
  }

  // Get supporting image placements from pattern
  const supportingPlacements = pattern?.imagePlacement?.supporting ?? []
  
  // If pattern defines placements, use them; otherwise use default grid
  const effectiveLayout = supportingPlacements.length > 0 
    ? (pattern?.layout.structure === 'flex' ? 'list' : 'grid') 
    : layout

  const getGridCols = () => {
    if (images.length === 1) return 'grid-cols-1'
    if (images.length === 2) return 'grid-cols-1 md:grid-cols-2'
    if (images.length === 3) return 'grid-cols-1 md:grid-cols-3'
    if (images.length === 4) return 'grid-cols-2 md:grid-cols-4'
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  }

  const renderGridLayout = () => {
    return (
      <div className={cn('grid gap-4 w-full', getGridCols(), className)} style={style}>
        {images.map((image, index) => {
          const placement = supportingPlacements[index]
          return (
            <div
              key={image.id}
              className="relative w-full aspect-video overflow-hidden rounded-lg"
            >
            <HeroImageComponent
              image={image}
              position={placement?.position ?? 'center'}
              size={placement?.size ?? 'contain'}
              lazy={lazy}
              priority={false}
              palette={palette}
            />
            </div>
          )
        })}
      </div>
    )
  }

  const renderListLayout = () => {
    return (
      <div className={cn('flex flex-col gap-4 w-full', className)} style={style}>
        {images.map((image, index) => {
          const placement = supportingPlacements[index]
          return (
            <div
              key={image.id}
              className="relative w-full aspect-video overflow-hidden rounded-lg"
            >
            <HeroImageComponent
              image={image}
              position={placement?.position ?? 'center'}
              size={placement?.size ?? 'contain'}
              lazy={lazy}
              priority={false}
              palette={palette}
            />
            </div>
          )
        })}
      </div>
    )
  }

  const renderCarouselLayout = () => {
    return (
      <div className={cn('flex gap-4 overflow-x-auto w-full snap-x snap-mandatory', className)} style={style}>
        {images.map((image, index) => {
          const placement = supportingPlacements[index]
          return (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-full md:w-1/2 lg:w-1/3 aspect-video overflow-hidden rounded-lg snap-center"
            >
            <HeroImageComponent
              image={image}
              position={placement?.position ?? 'center'}
              size={placement?.size ?? 'contain'}
              lazy={lazy}
              priority={false}
              palette={palette}
            />
            </div>
          )
        })}
      </div>
    )
  }

  switch (effectiveLayout) {
    case 'list':
      return renderListLayout()
    case 'carousel':
      return renderCarouselLayout()
    case 'grid':
    default:
      return renderGridLayout()
  }
}

