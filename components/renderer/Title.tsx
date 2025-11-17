// Title component renderer
// Custom component with shadcn/ui styling system
import React from 'react'
import { cn } from '@/lib/utils'

export interface TitleProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Title: React.FC<TitleProps> = ({ content, className = '', style }) => {
  return (
    <h1
      className={cn(
        'text-4xl font-bold leading-tight tracking-tight text-foreground',
        className
      )}
      style={style}
    >
      {content}
    </h1>
  )
}

