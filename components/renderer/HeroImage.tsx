// Hero image component renderer with lazy loading, error handling, and aspect ratio support
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { type HeroImage as HeroImageType, type Palette } from '@/lib/dsl/types'
import { ImagePlaceholder } from './ImagePlaceholder'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { telemetry } from '@/lib/renderer/telemetry'

export interface HeroImageProps {
  image: HeroImageType
  className?: string
  style?: React.CSSProperties
  position?: string
  size?: string
  priority?: boolean
  lazy?: boolean
  palette?: Palette
}

export const HeroImage: React.FC<HeroImageProps> = ({
  image,
  className = '',
  style,
  position = 'top',
  size = 'full',
  priority = false,
  lazy = false,
  palette,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!lazy || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || shouldLoad) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [lazy, priority, shouldLoad])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    telemetry.reportError(
      new Error('Failed to load image'),
      undefined,
      {
        component: {
          type: 'HeroImage',
        },
        dsl: {
          patternFamily: image.id,
          patternVariant: 1,
        },
      }
    )
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
    setShouldLoad(true)
  }

  const getImageClasses = () => {
    let classes = 'w-full h-full object-cover transition-opacity duration-300'
    
    if (isLoading) {
      classes += ' opacity-0'
    } else {
      classes += ' opacity-100'
    }
    
    if (position === 'full-bleed') {
      classes += ' absolute inset-0 z-0'
    }
    
    if (size === 'contain') {
      classes = classes.replace('object-cover', 'object-contain')
    }
    
    return cn(classes, className)
  }

  // Calculate aspect ratio
  const aspectRatio = image.aspectRatio || '16/9'
  const [ratioWidth, ratioHeight] = aspectRatio.split('/').map(Number)
  const aspectRatioStyle: React.CSSProperties = {
    aspectRatio: aspectRatio,
    ...style,
  }

  // Error state
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className="relative w-full flex items-center justify-center"
        style={aspectRatioStyle}
      >
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Failed to load image</p>
            <p className="text-xs text-muted-foreground">{image.prompt || 'Hero image'}</p>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={imgRef} className="relative w-full" style={aspectRatioStyle}>
      {/* Placeholder while loading */}
      {isLoading && shouldLoad && (
        <div className="absolute inset-0 z-10">
          <ImagePlaceholder
            palette={palette}
            aspectRatio={aspectRatio}
            skeleton={true}
            blur={false}
          />
        </div>
      )}

      {/* Image */}
      {shouldLoad && (
        <div className="relative w-full h-full">
          <Image
            src={image.url}
            alt={image.prompt || 'Hero image'}
            fill
            className={getImageClasses()}
            style={{
              objectFit: size === 'contain' ? 'contain' : 'cover',
            }}
            priority={priority}
            loading={lazy && !priority ? 'lazy' : undefined}
            onLoad={handleLoad}
            onError={handleError}
            sizes="100vw"
          />
        </div>
      )}

      {/* Placeholder before loading starts */}
      {!shouldLoad && (
        <ImagePlaceholder
          palette={palette}
          aspectRatio={aspectRatio}
          skeleton={true}
          blur={false}
        />
      )}
    </div>
  )
}

