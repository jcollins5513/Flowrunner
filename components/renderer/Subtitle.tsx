// Subtitle component renderer
// Custom component with shadcn/ui styling system
import React from 'react'
import { cn } from '@/lib/utils'

export interface SubtitleProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Subtitle: React.FC<SubtitleProps> = ({ content, className = '', style }) => {
  return (
    <h2
      className={cn(
        'text-2xl font-semibold leading-snug text-foreground',
        className
      )}
      style={style}
    >
      {content}
    </h2>
  )
}

