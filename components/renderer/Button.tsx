// Button component renderer
// Uses shadcn/ui Button component from component library
import React from 'react'
import { Button as UIButton, type ButtonProps as UIButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ButtonProps {
  content: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
  variant?: UIButtonProps['variant']
  size?: UIButtonProps['size']
}

export const Button: React.FC<ButtonProps> = ({
  content,
  onClick,
  className = '',
  style,
  type = 'button',
  variant,
  size,
}) => {
  return (
    <UIButton
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(className)}
      style={style}
    >
      {content}
    </UIButton>
  )
}

