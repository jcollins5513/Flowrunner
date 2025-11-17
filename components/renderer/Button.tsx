// Button component renderer
import React from 'react'

export interface ButtonProps {
  content: string
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
}

export const Button: React.FC<ButtonProps> = ({
  content,
  onClick,
  className = '',
  style,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-medium transition-colors ${className}`}
      style={style}
    >
      {content}
    </button>
  )
}

