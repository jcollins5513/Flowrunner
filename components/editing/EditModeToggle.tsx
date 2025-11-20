// Edit Mode Toggle Component
// Toggle for enabling/disabling edit mode with keyboard shortcut

'use client'

import React, { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

export interface EditModeToggleProps {
  editMode: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export const EditModeToggle: React.FC<EditModeToggleProps> = ({
  editMode,
  onToggle,
  className = '',
}) => {
  // Keyboard shortcut: Cmd/Ctrl + E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        onToggle(!editMode)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editMode, onToggle])

  // Persist edit mode preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowrunner_edit_mode', editMode.toString())
    }
  }, [editMode])

  // Load edit mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flowrunner_edit_mode')
      if (saved === 'true' && !editMode) {
        onToggle(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = useCallback(() => {
    onToggle(!editMode)
  }, [editMode, onToggle])

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
        editMode
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        className
      )}
      aria-label={editMode ? 'Disable edit mode' : 'Enable edit mode'}
      aria-pressed={editMode}
    >
      <svg
        className={cn('w-5 h-5', editMode ? 'text-white' : 'text-gray-600')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {editMode ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        )}
      </svg>
      <span className="text-sm font-medium">{editMode ? 'Editing' : 'Edit Mode'}</span>
      <span className="text-xs opacity-75">(⌘E)</span>
    </button>
  )
}
