// Edit History System
// Manages undo/redo functionality for edits

import type { EditHistoryEntry, EditState } from './edit-state'
import type { ScreenDSL } from '../dsl/types'

const HISTORY_STORAGE_KEY_PREFIX = 'flowrunner_edit_history_'
const HISTORY_STORAGE_VERSION = 1

export interface StoredHistory {
  version: number
  entries: EditHistoryEntry[]
  currentIndex: number
}

export function saveHistoryToLocalStorage(screenId: string, state: EditState): void {
  if (typeof window === 'undefined') return

  try {
    const screenHistory = state.editHistory.filter((entry) => entry.screenId === screenId)
    const storedHistory: StoredHistory = {
      version: HISTORY_STORAGE_VERSION,
      entries: screenHistory,
      currentIndex: state.currentHistoryIndex,
    }
    localStorage.setItem(`${HISTORY_STORAGE_KEY_PREFIX}${screenId}`, JSON.stringify(storedHistory))
  } catch (error) {
    console.warn('Failed to save edit history to localStorage:', error)
  }
}

export function loadHistoryFromLocalStorage(screenId: string): EditHistoryEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(`${HISTORY_STORAGE_KEY_PREFIX}${screenId}`)
    if (!stored) return []

    const parsed: StoredHistory = JSON.parse(stored)
    if (parsed.version !== HISTORY_STORAGE_VERSION) {
      // Version mismatch, clear old history
      return []
    }

    // Parse timestamps back to Date objects
    return parsed.entries.map((entry) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }))
  } catch (error) {
    console.warn('Failed to load edit history from localStorage:', error)
    return []
  }
}

export function clearHistoryFromLocalStorage(screenId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(`${HISTORY_STORAGE_KEY_PREFIX}${screenId}`)
  } catch (error) {
    console.warn('Failed to clear edit history from localStorage:', error)
  }
}

export function getUndoState(
  state: EditState,
  screenId: string
): { canUndo: boolean; previousEntry: EditHistoryEntry | null } {
  const screenHistory = getHistoryForScreen(state, screenId)
  if (screenHistory.length === 0 || state.currentHistoryIndex < 0) {
    return { canUndo: false, previousEntry: null }
  }

  const currentIndex = state.currentHistoryIndex
  if (currentIndex > 0) {
    const previousEntry = state.editHistory[currentIndex - 1]
    if (previousEntry && previousEntry.screenId === screenId) {
      return { canUndo: true, previousEntry }
    }
  }

  return { canUndo: false, previousEntry: null }
}

export function getRedoState(
  state: EditState,
  screenId: string
): { canRedo: boolean; nextEntry: EditHistoryEntry | null } {
  if (state.editHistory.length === 0) {
    return { canRedo: false, nextEntry: null }
  }

  const currentIndex = state.currentHistoryIndex
  if (currentIndex < state.editHistory.length - 1) {
    const nextEntry = state.editHistory[currentIndex + 1]
    if (nextEntry && nextEntry.screenId === screenId) {
      return { canRedo: true, nextEntry }
    }
  }

  return { canRedo: false, nextEntry: null }
}

export function getHistoryForScreen(state: EditState, screenId: string): EditHistoryEntry[] {
  return state.editHistory.filter((entry) => entry.screenId === screenId)
}
