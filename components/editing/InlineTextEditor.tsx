// Inline Text Editor
// Reusable component for inline text editing with keyboard shortcuts

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface InlineTextEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: (value: string) => void
  onCancel: () => void
  multiline?: boolean
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  minLength?: number
  maxLength?: number
  autoFocus?: boolean
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  multiline = false,
  placeholder = 'Enter text...',
  className = '',
  style,
  minLength = 0,
  maxLength,
  autoFocus = true,
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isComposing, setIsComposing] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      // Select all text for easy replacement
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [autoFocus])

  // Auto-resize textarea
  useEffect(() => {
    if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [localValue, multiline])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      onChange(newValue)
    },
    [onChange]
  )

  const handleSave = useCallback(() => {
    const trimmedValue = localValue.trim()

    // Validate length
    if (trimmedValue.length < minLength) {
      onCancel() // Cancel if too short
      return
    }

    if (maxLength && trimmedValue.length > maxLength) {
      onCancel() // Cancel if too long
      return
    }

    // Only save if value changed
    if (trimmedValue !== value.trim()) {
      onSave(trimmedValue)
    } else {
      onCancel() // No change, just cancel
    }
  }, [localValue, value, minLength, maxLength, onSave, onCancel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Don't handle shortcuts during composition (IME input)
      if (isComposing) return

      // Escape cancels editing
      if (e.key === 'Escape') {
        e.preventDefault()
        setLocalValue(value) // Reset to original value
        onCancel()
        return
      }

      // Enter saves (for single-line) or adds new line (for multi-line)
      if (e.key === 'Enter') {
        if (!multiline) {
          e.preventDefault()
          handleSave()
        }
        // For multiline, allow Enter to create new line
      }

      // Cmd/Ctrl + Enter saves for multiline
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSave()
      }
    },
    [value, multiline, isComposing, onCancel, handleSave]
  )

  const handleBlur = useCallback(() => {
    // Save on blur (when clicking outside)
    handleSave()
  }, [handleSave])

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false)
  }, [])

  const baseClasses = cn(
    'w-full rounded border-2 border-transparent bg-transparent px-2 py-1 text-inherit',
    'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
    'hover:border-gray-300 transition-colors',
    className
  )

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder={placeholder}
        className={baseClasses}
        style={style}
        rows={1}
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder={placeholder}
      className={baseClasses}
      style={style}
    />
  )
}
