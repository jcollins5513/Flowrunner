'use client'

// Flow State Management Context
// Provides React context for managing flow state on the client side

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react'
import type {
  FlowMetadata,
  ScreenSequenceEntry,
  FlowNavigationGraph,
  FlowThemeConfig,
  CreateFlowOptions,
  UpdateFlowOptions,
  InsertScreenOptions,
  ReorderScreenOptions,
} from './types'
import type { ScreenDSL } from '../dsl/types'

// State interface
interface FlowState {
  currentFlow: FlowMetadata | null
  screens: any[]
  sequence: ScreenSequenceEntry[]
  navigationGraph: FlowNavigationGraph | null
  themeConfig: FlowThemeConfig | null
  loading: boolean
  error: string | null
}

// Action types
type FlowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FLOW'; payload: FlowMetadata }
  | { type: 'UPDATE_FLOW'; payload: Partial<FlowMetadata> }
  | { type: 'SET_SCREENS'; payload: any[] }
  | { type: 'ADD_SCREEN'; payload: any }
  | { type: 'REMOVE_SCREEN'; payload: string }
  | { type: 'SET_SEQUENCE'; payload: ScreenSequenceEntry[] }
  | { type: 'SET_NAVIGATION_GRAPH'; payload: FlowNavigationGraph }
  | { type: 'SET_THEME_CONFIG'; payload: FlowThemeConfig | null }
  | { type: 'RESET' }

// Initial state
const initialState: FlowState = {
  currentFlow: null,
  screens: [],
  sequence: [],
  navigationGraph: null,
  themeConfig: null,
  loading: false,
  error: null,
}

// Reducer
function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_FLOW':
      return { ...state, currentFlow: action.payload, error: null }
    case 'UPDATE_FLOW':
      return {
        ...state,
        currentFlow: state.currentFlow ? { ...state.currentFlow, ...action.payload } : null,
      }
    case 'SET_SCREENS':
      return { ...state, screens: action.payload }
    case 'ADD_SCREEN':
      return { ...state, screens: [...state.screens, action.payload] }
    case 'REMOVE_SCREEN':
      return {
        ...state,
        screens: state.screens.filter((s) => s.id !== action.payload),
        sequence: state.sequence.filter((s) => s.screenId !== action.payload),
      }
    case 'SET_SEQUENCE':
      return { ...state, sequence: action.payload }
    case 'SET_NAVIGATION_GRAPH':
      return { ...state, navigationGraph: action.payload }
    case 'SET_THEME_CONFIG':
      return { ...state, themeConfig: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Context
interface FlowContextValue extends FlowState {
  // Flow operations
  loadFlow: (flowId: string) => Promise<void>
  updateScreen: (screenId: string, dslUpdates: Partial<ScreenDSL>) => Promise<void>
  createFlow: (options: CreateFlowOptions) => Promise<FlowMetadata>
  updateFlow: (flowId: string, options: UpdateFlowOptions) => Promise<void>
  deleteFlow: (flowId: string) => Promise<void>
  cloneFlow: (flowId: string, newName: string) => Promise<FlowMetadata>

  // Screen operations
  loadScreens: (flowId: string) => Promise<void>
  insertScreen: (flowId: string, options: InsertScreenOptions) => Promise<void>
  removeScreen: (flowId: string, screenId: string) => Promise<void>
  reorderScreen: (flowId: string, options: ReorderScreenOptions) => Promise<void>

  // Navigation operations
  loadNavigationGraph: (flowId: string) => Promise<void>
  addNavigationPath: (flowId: string, fromScreenId: string, toScreenId: string) => Promise<void>
  removeNavigationPath: (flowId: string, fromScreenId: string) => Promise<void>

  // Theme operations
  loadThemeConfig: (flowId: string) => Promise<void>
  updateThemeConfig: (flowId: string, config: FlowThemeConfig) => Promise<void>

  // Utility
  reset: () => void
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined)

// Provider component
interface FlowProviderProps {
  children: ReactNode
}

export function FlowProvider({ children }: FlowProviderProps) {
  const [state, dispatch] = useReducer(flowReducer, initialState)

  // Flow operations
  const loadFlow = useCallback(async (flowId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch(`/api/flows/${flowId}?includeScreens=true`)
      if (!response.ok) {
        throw new Error('Failed to load flow')
      }
      const flow = await response.json()
      dispatch({ type: 'SET_FLOW', payload: flow })
      if (flow.screens) {
        dispatch({ type: 'SET_SCREENS', payload: flow.screens })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const createFlow = useCallback(async (options: CreateFlowOptions): Promise<FlowMetadata> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create flow')
      }

      const flow = await response.json()
      dispatch({ type: 'SET_FLOW', payload: flow })
      if (flow.screens) {
        dispatch({ type: 'SET_SCREENS', payload: flow.screens })
      }
      return flow
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const updateFlow = useCallback(async (flowId: string, options: UpdateFlowOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update flow')
      }

      const flow = await response.json()
      dispatch({ type: 'UPDATE_FLOW', payload: flow })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const deleteFlow = useCallback(async (flowId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete flow')
      }

      dispatch({ type: 'RESET' })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const cloneFlow = useCallback(async (flowId: string, newName: string): Promise<FlowMetadata> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await fetch(`/api/flows/${flowId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to clone flow')
      }

      const flow = await response.json()
      return flow
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Screen operations
  const loadScreens = useCallback(async (flowId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await fetch(`/api/flows/${flowId}/screens`)
      if (!response.ok) {
        throw new Error('Failed to load screens')
      }
      const screens = await response.json()
      dispatch({ type: 'SET_SCREENS', payload: screens })

      // Also load sequence
      const sequenceResponse = await fetch(`/api/flows/${flowId}/screens?format=sequence`)
      if (sequenceResponse.ok) {
        const sequence = await sequenceResponse.json()
        dispatch({ type: 'SET_SEQUENCE', payload: sequence })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const insertScreen = useCallback(async (flowId: string, options: InsertScreenOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await fetch(`/api/flows/${flowId}/screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to insert screen')
      }

      const result = await response.json()
      dispatch({ type: 'ADD_SCREEN', payload: result.screen })
      await loadScreens(flowId) // Reload to get updated sequence
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [loadScreens])

  const updateScreen = useCallback(
    async (screenId: string, dslUpdates: Partial<ScreenDSL>) => {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Optimistically update local state
      const currentScreens = state.screens
      const screenIndex = currentScreens.findIndex((s: any) => s.id === screenId)
      
      if (screenIndex >= 0) {
        // Optimistically update screen in local state
        const updatedScreens = [...currentScreens]
        updatedScreens[screenIndex] = { ...updatedScreens[screenIndex], ...dslUpdates }
        dispatch({ type: 'SET_SCREENS', payload: updatedScreens })
      }

      try {
        // Find the flowId from the screen
        const screen = currentScreens.find((s: any) => s.id === screenId)
        if (!screen) {
          throw new Error('Screen not found in local state')
        }

        const flowId = state.currentFlow?.id || screen.flowId
        if (!flowId) {
          throw new Error('Flow ID not found')
        }

        const response = await fetch(`/api/flows/${flowId}/screens/${screenId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dsl: dslUpdates }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update screen')
        }

        const result = await response.json()

        // Update local state with server response
        if (result.screen) {
          const updatedScreens = currentScreens.map((s: any) =>
            s.id === screenId ? result.screen : s
          )
          dispatch({ type: 'SET_SCREENS', payload: updatedScreens })
        }

        // Reload screens to ensure consistency
        await loadScreens(flowId)
      } catch (error) {
        // Rollback optimistic update
        dispatch({ type: 'SET_SCREENS', payload: currentScreens })
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [state.screens, state.currentFlow, loadScreens]
  )

  const removeScreen = useCallback(
    async (flowId: string, screenId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const response = await fetch(`/api/flows/${flowId}/screens/${screenId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to remove screen')
        }

        dispatch({ type: 'REMOVE_SCREEN', payload: screenId })
        await loadScreens(flowId) // Reload to get updated sequence
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [loadScreens]
  )

  const reorderScreen = useCallback(
    async (flowId: string, options: ReorderScreenOptions) => {
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        // This would need a dedicated endpoint or we can use the screen update endpoint
        // For now, reload screens after reordering
        await loadScreens(flowId)
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [loadScreens]
  )

  // Navigation operations
  const loadNavigationGraph = useCallback(async (flowId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      const response = await fetch(`/api/flows/${flowId}/navigation`)
      if (!response.ok) {
        throw new Error('Failed to load navigation graph')
      }
      const graph = await response.json()
      dispatch({ type: 'SET_NAVIGATION_GRAPH', payload: graph })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const addNavigationPath = useCallback(
    async (flowId: string, fromScreenId: string, toScreenId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const response = await fetch(`/api/flows/${flowId}/navigation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromScreenId, toScreenId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to add navigation path')
        }

        await loadNavigationGraph(flowId)
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [loadNavigationGraph]
  )

  const removeNavigationPath = useCallback(
    async (flowId: string, fromScreenId: string) => {
      dispatch({ type: 'SET_LOADING', payload: true })

      try {
        const response = await fetch(`/api/flows/${flowId}/navigation?fromScreenId=${fromScreenId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to remove navigation path')
        }

        await loadNavigationGraph(flowId)
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [loadNavigationGraph]
  )

  // Theme operations
  const loadThemeConfig = useCallback(async (flowId: string) => {
    // Theme config is loaded as part of flow metadata
    // This is a placeholder for future implementation
  }, [])

  const updateThemeConfig = useCallback(async (flowId: string, config: FlowThemeConfig) => {
    dispatch({ type: 'SET_LOADING', payload: true })

    try {
      await updateFlow(flowId, { themeConfig: config })
      dispatch({ type: 'SET_THEME_CONFIG', payload: config })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [updateFlow])

  // Utility
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const value: FlowContextValue = {
    ...state,
    loadFlow,
    createFlow,
    updateFlow,
    deleteFlow,
    cloneFlow,
    loadScreens,
    insertScreen,
    updateScreen,
    removeScreen,
    reorderScreen,
    loadNavigationGraph,
    addNavigationPath,
    removeNavigationPath,
    loadThemeConfig,
    updateThemeConfig,
    reset,
  }

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

// Hook to use flow context
export function useFlow(): FlowContextValue {
  const context = useContext(FlowContext)
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider')
  }
  return context
}

