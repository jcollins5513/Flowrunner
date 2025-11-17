// Hero image component renderer
import React from 'react'
import Image from 'next/image'
import { type HeroImage as HeroImageType } from '@/lib/dsl/types'

export interface HeroImageProps {
  image: HeroImageType
  className?: string
  style?: React.CSSProperties
  position?: string
  size?: string
}

export const HeroImage: React.FC<HeroImageProps> = ({
  image,
  className = '',
  style,
  position = 'top',
  size = 'full',
}) => {
  const getImageClasses = () => {
    let classes = 'w-full h-full object-cover'
    
    if (position === 'full-bleed') {
      classes += ' absolute inset-0 z-0'
    }
    
    if (size === 'contain') {
      classes = classes.replace('object-cover', 'object-contain')
    }
    
    return `${classes} ${className}`
  }

  return (
    <div className="relative w-full h-full" style={style}>
      <Image
        src={image.url}
        alt={image.prompt || 'Hero image'}
        fill
        className={getImageClasses()}
        style={{
          objectFit: size === 'contain' ? 'contain' : 'cover',
        }}
        priority
      />
    </div>
  )
}

