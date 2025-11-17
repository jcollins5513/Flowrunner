// Text component renderer
import React from 'react'

export interface TextProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Text: React.FC<TextProps> = ({ content, className = '', style }) => {
  return (
    <p
      className={`text-base leading-relaxed ${className}`}
      style={style}
    >
      {content}
    </p>
  )
}

