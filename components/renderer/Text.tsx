// Text component renderer
// Custom component with shadcn/ui styling system
import React from 'react'
import { cn } from '@/lib/utils'

export interface TextProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Text: React.FC<TextProps> = ({ content, className = '', style }) => {
  return (
    <p
      className={cn(
        'text-base leading-relaxed text-muted-foreground',
        className
      )}
      style={style}
    >
      {content}
    </p>
  )
}

