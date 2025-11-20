// Image placeholder component with skeleton UI and blur-up technique
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { type Palette } from '@/lib/dsl/types'

export interface ImagePlaceholderProps {
  palette?: Palette
  aspectRatio?: string
  className?: string
  style?: React.CSSProperties
  blur?: boolean
  skeleton?: boolean
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  palette,
  aspectRatio = '16/9',
  className = '',
  style,
  blur = false,
  skeleton = true,
}) => {
  const [ratioWidth, ratioHeight] = aspectRatio.split('/').map(Number)
  const aspectRatioValue = ratioHeight / ratioWidth

  const backgroundColor = palette?.background || '#f3f4f6'
  const accentColor = palette?.accent || '#e5e7eb'

  if (skeleton) {
    return (
      <div
        className={cn('relative w-full overflow-hidden', className)}
        style={{
          aspectRatio: aspectRatio,
          backgroundColor: backgroundColor,
          ...style,
        }}
      >
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(90deg, ${backgroundColor} 0%, ${accentColor} 50%, ${backgroundColor} 100%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        {blur && (
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{
        aspectRatio: aspectRatio,
        backgroundColor: backgroundColor,
        ...style,
      }}
    >
      {blur && (
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
      )}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: 0.5,
        }}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke={accentColor}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
      </div>
    </div>
  )
}

// CSS for shimmer animation (add to globals.css)
export const placeholderStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`

