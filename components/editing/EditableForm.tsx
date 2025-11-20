// Editable Form Component
// Wrapper around Form component with editing capabilities

'use client'

import React, { useState, useCallback } from 'react'
import { Form, type FormFieldType } from '@/components/renderer/Form'
import { cn } from '@/lib/utils'
import type { Component } from '@/lib/dsl/types'

export interface EditableFormProps {
  component: Component
  onSave: (updatedComponent: Component) => void
  isEditing: boolean
  onStartEdit: () => void
  className?: string
  style?: React.CSSProperties
}

export const EditableForm: React.FC<EditableFormProps> = ({
  component,
  onSave,
  isEditing,
  onStartEdit,
  className = '',
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleSave = useCallback(
    (updatedComponent: Component) => {
      onSave(updatedComponent)
    },
    [onSave]
  )

  // For now, Form editing is read-only in the UI
  // Full form editing would require a more complex UI
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
      <Form
        content={component.content}
        description={component.props?.description as string | undefined}
        fields={
          Array.isArray(component.props?.fields)
            ? (component.props?.fields as Array<Record<string, unknown>>).map((field, index) => ({
                id: (field.id as string | undefined) ?? `field-${index}`,
                label: (field.label as string | undefined) ?? `Field ${index + 1}`,
                placeholder: field.placeholder as string | undefined,
                type: field.type as FormFieldType | undefined,
                options: field.options as Array<{ value: string; label: string }> | undefined,
                required: field.required as boolean | undefined,
                validation: field.validation as { error?: string; success?: boolean } | undefined,
              }))
            : []
        }
        submitLabel={
          typeof component.props?.submitLabel === 'string'
            ? (component.props?.submitLabel as string)
            : 'Submit'
        }
        className={className}
        style={style}
      />
      {isHovered && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded opacity-50 pointer-events-none" />
      )}
      {isHovered && (
        <div className="absolute -top-8 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded pointer-events-none">
          Form editing (coming soon)
        </div>
      )}
    </div>
  )
}
