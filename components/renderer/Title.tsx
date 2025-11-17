// Title component renderer
import React from 'react'

export interface TitleProps {
  content: string
  className?: string
  style?: React.CSSProperties
}

export const Title: React.FC<TitleProps> = ({ content, className = '', style }) => {
  return (
    <h1
      className={`text-4xl font-bold ${className}`}
      style={style}
    >
      {content}
    </h1>
  )
}

