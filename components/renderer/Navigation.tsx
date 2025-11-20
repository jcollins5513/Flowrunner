// Navigation component renderer
// Renders navigation affordances from DSL (internal/external navigation with visual cues)
'use client'

import React from 'react'
import { type Navigation as NavigationType, type Vibe } from '@/lib/dsl/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, ArrowLeft, ExternalLink, ChevronRight } from 'lucide-react'

export interface NavigationProps {
  navigation: NavigationType
  vibe?: Vibe
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  label?: string
}

export const Navigation: React.FC<NavigationProps> = ({
  navigation,
  vibe = 'modern',
  className = '',
  style,
  onClick,
  label,
}) => {
  const isInternal = navigation.type === 'internal'
  const isExternal = navigation.type === 'external'

  // Get visual affordance based on vibe
  const getNavigationIndicator = () => {
    switch (vibe) {
      case 'playful':
      case 'energetic':
        return <ChevronRight className="h-4 w-4 ml-1" />
      case 'bold':
        return <ArrowRight className="h-4 w-4 ml-1" />
      case 'minimal':
      case 'calm':
        return <ArrowRight className="h-3 w-3 ml-1 opacity-60" />
      case 'elegant':
        return <ArrowRight className="h-4 w-4 ml-1" />
      default:
        return <ArrowRight className="h-4 w-4 ml-1" />
    }
  }

  const getNavigationLabel = () => {
    if (label) return label
    if (navigation.target) return navigation.target
    if (isInternal && navigation.screenId) return 'Continue'
    if (isExternal && navigation.url) return 'Learn more'
    return 'Next'
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    } else if (isExternal && navigation.url) {
      // External links open in new tab
      window.open(navigation.url, '_blank', 'noopener,noreferrer')
    }
  }

  const baseClasses = cn(
    'inline-flex items-center justify-center',
    {
      'cursor-pointer hover:opacity-80 transition-opacity': onClick || isExternal,
      'cursor-default': !onClick && !isExternal,
    },
    className
  )

  if (isInternal) {
    return (
      <div className={baseClasses} style={style}>
        <Button
          variant="default"
          onClick={handleClick}
          className="inline-flex items-center"
        >
          {getNavigationLabel()}
          {getNavigationIndicator()}
        </Button>
      </div>
    )
  }

  if (isExternal) {
    return (
      <a
        href={navigation.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClasses, 'no-underline')}
        style={style}
        onClick={handleClick}
      >
        <Button variant="outline" className="inline-flex items-center">
          {getNavigationLabel()}
          <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </a>
    )
  }

  // Fallback for navigation without type
  return (
    <div className={baseClasses} style={style}>
      <Button
        variant="default"
        onClick={onClick}
        className="inline-flex items-center"
      >
        {getNavigationLabel()}
        {getNavigationIndicator()}
      </Button>
    </div>
  )
}

// Navigation link component for inline use
export interface NavigationLinkProps {
  navigation: NavigationType
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  navigation,
  children,
  className = '',
  style,
  onClick,
}) => {
  const isExternal = navigation.type === 'external'

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    } else if (isExternal && navigation.url) {
      window.open(navigation.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (isExternal) {
    return (
      <a
        href={navigation.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('inline-flex items-center gap-1 hover:underline', className)}
        style={style}
        onClick={handleClick}
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('inline-flex items-center hover:underline', className)}
      style={style}
    >
      {children}
    </button>
  )
}

