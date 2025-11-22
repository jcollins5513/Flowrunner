// Diagram Utilities
// Convert navigation graph to React Flow format

import type { FlowNavigationGraph, ScreenSequenceEntry } from './types'
import type { ScreenDSL } from '../dsl/types'
import type { Node, Edge } from 'reactflow'

export interface DiagramNode extends Node {
  data: {
    screenId: string
    screenDSL?: ScreenDSL
    label?: string
    isEntry?: boolean
    isActive?: boolean
  }
}

export interface DiagramEdge extends Edge {
  label?: string
  data?: {
    trigger?: string
    condition?: string
    label?: string
  }
}

const NODE_WIDTH = 200
const NODE_HEIGHT = 150
const HORIZONTAL_SPACING = 300
const VERTICAL_SPACING = 200

/**
 * Calculate hierarchical layout positions for nodes
 * For linear flows, arrange horizontally
 * For branching flows, arrange with vertical offsets for branches
 */
function calculateHierarchicalLayout(
  graph: FlowNavigationGraph,
  screenMap: Map<string, ScreenDSL>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  
  if (!graph.entryScreenId) {
    // No entry point, arrange by order
    const orderedScreens = Array.from(graph.screens.entries())
      .sort((a, b) => a[1].order - b[1].order)
    
    orderedScreens.forEach(([screenId], index) => {
      positions.set(screenId, {
        x: index * HORIZONTAL_SPACING + 100,
        y: 200,
      })
    })
    return positions
  }

  // Build adjacency list for BFS traversal
  const adj = new Map<string, string[]>()
  for (const path of graph.navigationPaths) {
    const targets = adj.get(path.fromScreenId) || []
    targets.push(path.toScreenId)
    adj.set(path.fromScreenId, targets)
  }

  // BFS to assign levels
  const levels = new Map<string, number>()
  const queue: { screenId: string; level: number }[] = [
    { screenId: graph.entryScreenId, level: 0 }
  ]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { screenId, level } = queue.shift()!
    
    if (visited.has(screenId)) continue
    visited.add(screenId)
    levels.set(screenId, level)

    const neighbors = adj.get(screenId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push({ screenId: neighbor, level: level + 1 })
      }
    }
  }

  // Assign positions by level
  const levelGroups = new Map<number, string[]>()
  for (const [screenId, level] of levels.entries()) {
    const group = levelGroups.get(level) || []
    group.push(screenId)
    levelGroups.set(level, group)
  }

  // Calculate positions
  for (const [level, screenIds] of levelGroups.entries()) {
    const x = level * HORIZONTAL_SPACING + 100
    const count = screenIds.length
    
    screenIds.forEach((screenId, index) => {
      // Center vertically if multiple screens at same level
      const yOffset = count > 1 
        ? (index - (count - 1) / 2) * VERTICAL_SPACING
        : 0
      
      positions.set(screenId, {
        x,
        y: 200 + yOffset,
      })
    })
  }

  // Handle screens not in navigation paths (orphans)
  for (const screenId of graph.screens.keys()) {
    if (!positions.has(screenId)) {
      const entry = graph.screens.get(screenId)
      positions.set(screenId, {
        x: (entry?.order || 0) * HORIZONTAL_SPACING + 100,
        y: 200,
      })
    }
  }

  return positions
}

/**
 * Screen data with ID for matching
 */
export interface ScreenWithId {
  id: string
  dsl: ScreenDSL
}

/**
 * Convert navigation graph to React Flow nodes and edges
 */
export function convertGraphToReactFlow(
  graph: FlowNavigationGraph,
  screens: ScreenWithId[] = []
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  // Create screen map by ID
  const screenMap = new Map<string, ScreenDSL>()
  for (const screen of screens) {
    screenMap.set(screen.id, screen.dsl)
  }

  // Calculate node positions
  const positions = calculateHierarchicalLayout(graph, screenMap)

  // Create nodes
  const nodes: DiagramNode[] = []
  for (const [screenId, entry] of graph.screens.entries()) {
    const position = positions.get(screenId) || { x: 0, y: 0 }
    const screenDSL = screenMap.get(screenId)

    nodes.push({
      id: screenId,
      type: 'screenNode',
      position,
      data: {
        screenId,
        screenDSL,
        label: `Screen ${entry.order + 1}`,
        isEntry: screenId === graph.entryScreenId,
        isActive: false,
      },
    })
  }

  // Create edges with labels for branches
  const edges: DiagramEdge[] = []
  for (const path of graph.navigationPaths) {
    // Generate label from path metadata
    const labelParts: string[] = []
    if (path.label) {
      labelParts.push(path.label)
    } else if (path.condition) {
      labelParts.push(path.condition.length > 20 ? `${path.condition.substring(0, 20)}...` : path.condition)
    }
    
    edges.push({
      id: `edge-${path.fromScreenId}-${path.toScreenId}`,
      source: path.fromScreenId,
      target: path.toScreenId,
      type: 'smoothstep',
      animated: false,
      label: labelParts.length > 0 ? labelParts.join(' • ') : undefined,
      labelStyle: {
        fill: '#64748b',
        fontWeight: 500,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.9,
      },
      data: {
        trigger: path.trigger,
        condition: path.condition,
        label: path.label,
      },
      style: {
        stroke: '#64748b',
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#64748b',
      },
    })
  }

  return { nodes, edges }
}

/**
 * Generate node position for a screen
 * Used for adding new nodes dynamically
 */
export function generateNodePosition(
  screenId: string,
  graph: FlowNavigationGraph,
  index: number
): { x: number; y: number } {
  const maxLevel = Math.max(
    ...Array.from(graph.screens.values()).map(e => e.order),
    0
  )
  
  return {
    x: (maxLevel + 1) * HORIZONTAL_SPACING + 100,
    y: 200 + (index * VERTICAL_SPACING),
  }
}

/**
 * Check if flow has branching (multiple paths from a single screen)
 */
export function hasBranching(graph: FlowNavigationGraph): boolean {
  const outgoingCount = new Map<string, number>()
  
  for (const path of graph.navigationPaths) {
    const count = outgoingCount.get(path.fromScreenId) || 0
    outgoingCount.set(path.fromScreenId, count + 1)
  }

  return Array.from(outgoingCount.values()).some(count => count > 1)
}

/**
 * Get all screens that branch from a given screen
 */
export function getBranchTargets(
  graph: FlowNavigationGraph,
  screenId: string
): string[] {
  return graph.navigationPaths
    .filter(path => path.fromScreenId === screenId)
    .map(path => path.toScreenId)
}

