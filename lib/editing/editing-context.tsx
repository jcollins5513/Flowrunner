// Editing Context Provider
// Provides editing state and methods to child components

'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react'
import type { ScreenDSL, Component } from '../dsl/types'
import { createEditState, type EditState, type EditHistoryEntry, addHistoryEntry } from './edit-state'
import { saveHistoryToLocalStorage, loadHistoryFromLocalStorage, clearHistoryFromLocalStorage, getUndoState, getRedoState, getHistoryForScreen } from './history'
import { validateComponentEdit, validateDSLUpdate, type ValidationResult } from './validation'

// Action types
type EditingAction =
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_EDITING_SCREEN_ID'; payload: string | null }
  | { type: 'SET_EDITING_COMPONENT_ID'; payload: string | null }
  | { type: 'ADD_HISTORY_ENTRY'; payload: Omit<EditHistoryEntry, 'timestamp'> }
  | { type: 'SET_PENDING_CHANGES'; payload: { screenId: string; changes: Partial<unknown> } }
  | { type: 'CLEAR_PENDING_CHANGES'; payload: string }
  | { type: 'UNDO'; payload: string }
  | { type: 'REDO'; payload: string }
  | { type: 'RESET' }

// Initial state
const initialState: EditState = createEditState()

// Reducer
function editingReducer(state: EditState, action: EditingAction): EditState {
  switch (action.type) {
    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload }
    case 'SET_EDITING_SCREEN_ID':
      return { ...state, editingScreenId: action.payload }
    case 'SET_EDITING_COMPONENT_ID':
      return { ...state, editingComponentId: action.payload }
    case 'ADD_HISTORY_ENTRY':
      const newState = addHistoryEntry(state, action.payload)
      // Save to localStorage
      if (action.payload.screenId) {
        saveHistoryToLocalStorage(action.payload.screenId, newState)
      }
      return newState
    case 'SET_PENDING_CHANGES':
      return {
        ...state,
        pendingChanges: {
          ...state.pendingChanges,
          [action.payload.screenId]: action.payload.changes,
        },
      }
    case 'CLEAR_PENDING_CHANGES':
      const newPendingChanges = { ...state.pendingChanges }
      delete newPendingChanges[action.payload]
      return { ...state, pendingChanges: newPendingChanges }
    case 'UNDO': {
      const undoState = getUndoState(state, action.payload)
      if (undoState.canUndo && undoState.previousEntry) {
        const previousIndex = state.editHistory.findIndex((e) => e === undoState.previousEntry)
        return {
          ...state,
          currentHistoryIndex: previousIndex,
        }
      }
      return state
    }
    case 'REDO': {
      const redoState = getRedoState(state, action.payload)
      if (redoState.canRedo && redoState.nextEntry) {
        const nextIndex = state.editHistory.findIndex((e) => e === redoState.nextEntry)
        return {
          ...state,
          currentHistoryIndex: nextIndex,
        }
      }
      return state
    }
    case 'RESET':
      return createEditState()
    default:
      return state
  }
}

// Context value interface
interface EditingContextValue extends EditState {
  // Edit mode control
  setEditMode: (enabled: boolean) => void
  setEditingScreenId: (screenId: string | null) => void
  setEditingComponentId: (componentId: string | null) => void

  // History operations
  addHistory: (entry: Omit<EditHistoryEntry, 'timestamp'>) => void
  undo: (screenId: string) => ScreenDSL | null
  redo: (screenId: string) => ScreenDSL | null
  canUndo: (screenId: string) => boolean
  canRedo: (screenId: string) => boolean

  // Validation
  validateComponentEdit: (
    dsl: ScreenDSL,
    componentIndex: number,
    updatedComponent: Partial<Component>
  ) => ValidationResult
  validateDSLUpdate: (currentDSL: ScreenDSL, updatedDSL: Partial<ScreenDSL>) => ValidationResult

  // Pending changes
  setPendingChanges: (screenId: string, changes: Partial<unknown>) => void
  getPendingChanges: (screenId: string) => Partial<unknown> | undefined
  clearPendingChanges: (screenId: string) => void

  // Utility
  reset: () => void
}

// Context
const EditingContext = createContext<EditingContextValue | undefined>(undefined)

// Provider component
interface EditingProviderProps {
  children: ReactNode
}

export function EditingProvider({ children }: EditingProviderProps) {
  const [state, dispatch] = useReducer(editingReducer, initialState)

  // Load history from localStorage on mount for each screen
  useEffect(() => {
    // History loading will happen per-screen when needed
  }, [])

  // Edit mode control
  const setEditMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: enabled })
  }, [])

  const setEditingScreenId = useCallback((screenId: string | null) => {
    dispatch({ type: 'SET_EDITING_SCREEN_ID', payload: screenId })
  }, [])

  const setEditingComponentId = useCallback((componentId: string | null) => {
    dispatch({ type: 'SET_EDITING_COMPONENT_ID', payload: componentId })
  }, [])

  // History operations
  const addHistory = useCallback((entry: Omit<EditHistoryEntry, 'timestamp'>) => {
    dispatch({ type: 'ADD_HISTORY_ENTRY', payload: entry })
  }, [])

  const undo = useCallback((screenId: string): ScreenDSL | null => {
    const undoState = getUndoState(state, screenId)
    if (undoState.canUndo && undoState.previousEntry) {
      dispatch({ type: 'UNDO', payload: screenId })
      // Return the previous DSL state
      return undoState.previousEntry.before as ScreenDSL
    }
    return null
  }, [state])

  const redo = useCallback((screenId: string): ScreenDSL | null => {
    const redoState = getRedoState(state, screenId)
    if (redoState.canRedo && redoState.nextEntry) {
      dispatch({ type: 'REDO', payload: screenId })
      // Return the next DSL state
      return redoState.nextEntry.after as ScreenDSL
    }
    return null
  }, [state])

  const canUndoCheck = useCallback((screenId: string): boolean => {
    return getUndoState(state, screenId).canUndo
  }, [state])

  const canRedoCheck = useCallback((screenId: string): boolean => {
    return getRedoState(state, screenId).canRedo
  }, [state])

  // Validation
  const validateComponentEditCallback = useCallback(
    (dsl: ScreenDSL, componentIndex: number, updatedComponent: Partial<Component>): ValidationResult => {
      return validateComponentEdit(dsl, componentIndex, updatedComponent)
    },
    []
  )

  const validateDSLUpdateCallback = useCallback(
    (currentDSL: ScreenDSL, updatedDSL: Partial<ScreenDSL>): ValidationResult => {
      return validateDSLUpdate(currentDSL, updatedDSL)
    },
    []
  )

  // Pending changes
  const setPendingChangesCallback = useCallback((screenId: string, changes: Partial<unknown>) => {
    dispatch({ type: 'SET_PENDING_CHANGES', payload: { screenId, changes } })
  }, [])

  const getPendingChangesCallback = useCallback(
    (screenId: string): Partial<unknown> | undefined => {
      return state.pendingChanges[screenId]
    },
    [state.pendingChanges]
  )

  const clearPendingChangesCallback = useCallback((screenId: string) => {
    dispatch({ type: 'CLEAR_PENDING_CHANGES', payload: screenId })
  }, [])

  // Utility
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value: EditingContextValue = {
    ...state,
    setEditMode,
    setEditingScreenId,
    setEditingComponentId,
    addHistory,
    undo,
    redo,
    canUndo: canUndoCheck,
    canRedo: canRedoCheck,
    validateComponentEdit: validateComponentEditCallback,
    validateDSLUpdate: validateDSLUpdateCallback,
    setPendingChanges: setPendingChangesCallback,
    getPendingChanges: getPendingChangesCallback,
    clearPendingChanges: clearPendingChangesCallback,
    reset,
  }

  return <EditingContext.Provider value={value}>{children}</EditingContext.Provider>
}

// Hook to use editing context
export function useEditing(): EditingContextValue {
  const context = useContext(EditingContext)
  if (context === undefined) {
    throw new Error('useEditing must be used within an EditingProvider')
  }
  return context
}
