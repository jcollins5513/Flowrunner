// Editable Button Component
// Wrapper around Button component with inline editing

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/renderer/Button'
import { InlineTextEditor } from './InlineTextEditor'
import { cn } from '@/lib/utils'
import type { ButtonProps } from '@/components/renderer/Button'

export interface EditableButtonProps extends Omit<ButtonProps, 'onClick'> {
  onSave: (newContent: string) => void
  isEditing: boolean
  onStartEdit: () => void
  onClick?: () => void
}

export const EditableButton: React.FC<EditableButtonProps> = ({
  content,
  onSave,
  isEditing,
  onStartEdit,
  onClick,
  className = '',
  style,
  variant,
  size,
  type,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = useCallback(
    (newContent: string) => {
      if (newContent !== content) {
        onSave(newContent)
      }
    },
    [content, onSave]
  )

  const handleCancel = useCallback(() => {
    // Cancel editing
  }, [])

  const handleClick = useCallback(() => {
    if (isEditing) {
      return // Don't trigger onClick when editing
    }
    if (onClick) {
      onClick()
    } else {
      onStartEdit()
    }
  }, [isEditing, onClick, onStartEdit])

  if (isEditing) {
    return (
      <div className={cn('relative inline-block', className)} style={style}>
        <InlineTextEditor
          value={content}
          onChange={() => {}}
          onSave={handleSave}
          onCancel={handleCancel}
          multiline={false}
          className={cn('inline-block px-4 py-2 rounded-lg border-2')}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      className={cn('relative group inline-block', className)}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        content={content}
        onClick={handleClick}
        variant={variant}
        size={size}
        type={type}
        className={className}
        style={style}
      />
      {isHovered && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded opacity-50 pointer-events-none" />
      )}
      {isHovered && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded pointer-events-none whitespace-nowrap">
          Click to edit label
        </div>
      )}
    </div>
  )
}
