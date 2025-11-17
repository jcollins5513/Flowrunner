// Subtitle component renderer
import React from 'react'

export interface SubtitleProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Subtitle: React.FC<SubtitleProps> = ({ content, className = '', style }) => {
  return (
    <h2
      className={`text-2xl font-semibold ${className}`}
      style={style}
    >
      {content}
    </h2>
  )
}

