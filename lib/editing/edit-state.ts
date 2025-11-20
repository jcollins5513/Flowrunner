// Edit State Management
// Manages editing state for screens and components

export interface EditHistoryEntry {
  type: 'component_update' | 'image_replace' | 'palette_change' | 'vibe_change' | 'pattern_change'
  screenId: string
  before: unknown // ScreenDSL or partial DSL
  after: unknown // ScreenDSL or partial DSL
  timestamp: Date
  componentIndex?: number // For component updates
}

export interface EditState {
  isEditMode: boolean
  editingScreenId: string | null
  editingComponentId: string | null
  editHistory: EditHistoryEntry[]
  currentHistoryIndex: number
  pendingChanges: Record<string, Partial<unknown>> // screenId -> partial DSL
}

const MAX_HISTORY_ENTRIES = 50

export function createEditState(): EditState {
  return {
    isEditMode: false,
    editingScreenId: null,
    editingComponentId: null,
    editHistory: [],
    currentHistoryIndex: -1,
    pendingChanges: {},
  }
}

export function canUndo(state: EditState, screenId: string): boolean {
  const screenHistory = state.editHistory.filter((entry) => entry.screenId === screenId)
  if (screenHistory.length === 0) return false
  
  // Check if we have entries before the current index
  const screenHistoryIndex = state.editHistory.findIndex((entry) => 
    entry === screenHistory[screenHistory.length - 1]
  )
  return screenHistoryIndex > 0
}

export function canRedo(state: EditState, screenId: string): boolean {
  const screenHistory = state.editHistory.filter((entry) => entry.screenId === screenId)
  if (screenHistory.length === 0) return false
  
  // Check if we have entries after the current index
  const screenHistoryIndex = state.editHistory.findIndex((entry) => 
    entry === screenHistory[screenHistory.length - 1]
  )
  return screenHistoryIndex < state.editHistory.length - 1
}

export function addHistoryEntry(
  state: EditState,
  entry: Omit<EditHistoryEntry, 'timestamp'>
): EditState {
  const newEntry: EditHistoryEntry = {
    ...entry,
    timestamp: new Date(),
  }

  // If we're in the middle of history (not at the end), remove future entries
  let newHistory = state.editHistory.slice(0, state.currentHistoryIndex + 1)
  
  // Add new entry
  newHistory.push(newEntry)

  // Limit history size
  if (newHistory.length > MAX_HISTORY_ENTRIES) {
    newHistory = newHistory.slice(-MAX_HISTORY_ENTRIES)
  }

  return {
    ...state,
    editHistory: newHistory,
    currentHistoryIndex: newHistory.length - 1,
  }
}

// getHistoryForScreen is exported from history.ts
