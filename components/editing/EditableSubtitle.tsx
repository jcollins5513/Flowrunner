// Editable Subtitle Component
// Wrapper around Subtitle component with inline editing

'use client'

import React, { useState, useCallback } from 'react'
import { Subtitle } from '@/components/renderer/Subtitle'
import { InlineTextEditor } from './InlineTextEditor'
import { cn } from '@/lib/utils'

export interface EditableSubtitleProps {
  content: string
  onSave: (newContent: string) => void
  isEditing: boolean
  onStartEdit: () => void
  className?: string
  style?: React.CSSProperties
}

export const EditableSubtitle: React.FC<EditableSubtitleProps> = ({
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
    // Cancel editing
  }, [])

  if (isEditing) {
    return (
      <div className={cn('relative', className)} style={style}>
        <InlineTextEditor
          value={content}
          onChange={() => {}}
          onSave={handleSave}
          onCancel={handleCancel}
          multiline={true}
          className={cn('text-xl font-medium leading-relaxed')}
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
      <Subtitle content={content} className={className} style={style} />
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
