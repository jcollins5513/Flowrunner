// Editable Title Component
// Wrapper around Title component with inline editing

'use client'

import React, { useState, useCallback } from 'react'
import { Title } from '@/components/renderer/Title'
import { InlineTextEditor } from './InlineTextEditor'
import { cn } from '@/lib/utils'

export interface EditableTitleProps {
  content: string
  onSave: (newContent: string) => void
  isEditing: boolean
  onStartEdit: () => void
  className?: string
  style?: React.CSSProperties
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  content,
  onSave,
  isEditing,
  onStartEdit,
  className = '',
  style,
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
    // Cancel editing - just trigger stop edit
  }, [])

  if (isEditing) {
    return (
      <div className={cn('relative', className)} style={style}>
        <InlineTextEditor
          value={content}
          onChange={() => {}} // Controlled by InlineTextEditor
          onSave={handleSave}
          onCancel={handleCancel}
          multiline={false}
          className={cn('text-4xl font-bold leading-tight tracking-tight')}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      className={cn('relative group', className)}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onStartEdit()
        }
      }}
    >
      <Title content={content} className={className} style={style} />
      {isHovered && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded opacity-50 pointer-events-none" />
      )}
      {isHovered && (
        <div className="absolute -top-8 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded pointer-events-none">
          Click to edit
        </div>
      )}
    </div>
  )
}
