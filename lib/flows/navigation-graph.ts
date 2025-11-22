// Navigation Graph Management
// Utilities for managing flow navigation graphs and screen connections

import { prisma } from '../db/client'
import type { FlowNavigationGraph, NavigationPath, ScreenSequenceEntry } from './types'
import { getScreenSequence } from './screen-sequence'

/**
 * Normalize navigation JSON to multi-path format
 * Handles backward compatibility with old single-path format
 */
function normalizeNavigation(navJson: string | null): {
  type: 'internal' | 'external'
  screenId?: string
  paths?: Array<{
    screenId: string
    trigger?: string
    condition?: string
    label?: string
  }>
  trigger?: string
  condition?: string
  label?: string
} {
  if (!navJson) {
    return { type: 'internal', paths: [] }
  }

  const nav = JSON.parse(navJson)

  // If it's already in the new format with paths array
  if (nav.paths && Array.isArray(nav.paths)) {
    return {
      type: nav.type || 'internal',
      paths: nav.paths,
    }
  }

  // Legacy format: single screenId path
  if (nav.screenId) {
    return {
      type: nav.type || 'internal',
      paths: [
        {
          screenId: nav.screenId,
          trigger: nav.trigger || 'button-click',
          condition: nav.condition,
          label: nav.label,
        },
      ],
    }
  }

  // Empty navigation
  return { type: nav.type || 'internal', paths: [] }
}

/**
 * Build navigation graph for a flow
 * Supports both old single-path and new multi-path navigation formats
 */
export async function buildNavigationGraph(flowId: string): Promise<FlowNavigationGraph> {
  const sequence = await getScreenSequence(flowId)
  const screens = await prisma.screen.findMany({
    where: { flowId },
  })

  // Build screen map
  const screenMap = new Map<string, ScreenSequenceEntry>()
  for (const entry of sequence) {
    screenMap.set(entry.screenId, entry)
  }

  // Extract navigation paths (supports multiple paths per screen)
  const navigationPaths: NavigationPath[] = []

  for (const screen of screens) {
    if (screen.navigation) {
      const nav = normalizeNavigation(screen.navigation)
      const paths = nav.paths || []

      // Extract all paths from this screen
      for (const path of paths) {
        navigationPaths.push({
          fromScreenId: screen.id,
          toScreenId: path.screenId,
          trigger: path.trigger || 'button-click',
          condition: path.condition,
          label: path.label,
        })
      }
    }
  }

  // Find entry screen (screen with no parent)
  const entryScreenId = sequence.find((entry) => !entry.parentScreenId)?.screenId

  return {
    flowId,
    entryScreenId,
    screens: screenMap,
    navigationPaths,
  }
}

/**
 * Add navigation path between two screens
 * If paths already exist, adds a new path (does not overwrite)
 * For replacing, use removeNavigationPath first or use branching utilities
 */
export async function addNavigationPath(
  flowId: string,
  fromScreenId: string,
  toScreenId: string,
  options?: {
    trigger?: string
    condition?: string
    label?: string
  }
): Promise<void> {
  // Verify both screens exist in the flow
  const fromScreen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  const toScreen = await prisma.screen.findUnique({
    where: { id: toScreenId },
  })

  if (!fromScreen || fromScreen.flowId !== flowId) {
    throw new Error(`Source screen not found in flow: ${fromScreenId}`)
  }

  if (!toScreen || toScreen.flowId !== flowId) {
    throw new Error(`Target screen not found in flow: ${toScreenId}`)
  }

  // Normalize navigation and add new path
  const nav = normalizeNavigation(fromScreen.navigation)
  nav.paths = nav.paths || []

  // Check if path already exists
  const exists = nav.paths.some(
    (p) =>
      p.screenId === toScreenId &&
      (p.trigger || 'button-click') === (options?.trigger || 'button-click') &&
      p.condition === options?.condition
  )

  if (exists) {
    throw new Error('Navigation path already exists')
  }

  // Add new path
  nav.paths.push({
    screenId: toScreenId,
    trigger: options?.trigger || 'button-click',
    condition: options?.condition,
    label: options?.label,
  })

  await prisma.screen.update({
    where: { id: fromScreenId },
    data: {
      navigation: JSON.stringify(nav),
    },
  })
}

/**
 * Remove navigation path from a screen
 */
export async function removeNavigationPath(flowId: string, fromScreenId: string): Promise<void> {
  const screen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${fromScreenId}`)
  }

  await prisma.screen.update({
    where: { id: fromScreenId },
    data: {
      navigation: null,
    },
  })
}

/**
 * Get all screens that can navigate to a target screen
 */
export async function getIncomingNavigation(flowId: string, targetScreenId: string): Promise<string[]> {
  const graph = await buildNavigationGraph(flowId)
  return graph.navigationPaths.filter((path) => path.toScreenId === targetScreenId).map((path) => path.fromScreenId)
}

/**
 * Get all screens that a source screen can navigate to
 */
export async function getOutgoingNavigation(flowId: string, sourceScreenId: string): Promise<string[]> {
  const graph = await buildNavigationGraph(flowId)
  return graph.navigationPaths.filter((path) => path.fromScreenId === sourceScreenId).map((path) => path.toScreenId)
}

/**
 * Validate navigation graph for cycles
 * Returns true if graph is acyclic, false if cycles are detected
 */
export async function validateNavigationGraph(flowId: string): Promise<{ valid: boolean; cycles?: string[][] }> {
  const graph = await buildNavigationGraph(flowId)

  // Build adjacency list
  const adj = new Map<string, string[]>()
  for (const path of graph.navigationPaths) {
    const targets = adj.get(path.fromScreenId) || []
    targets.push(path.toScreenId)
    adj.set(path.fromScreenId, targets)
  }

  // DFS to detect cycles
  const visited = new Set<string>()
  const recStack = new Set<string>()
  const cycles: string[][] = []

  const dfs = (node: string, path: string[]): boolean => {
    visited.add(node)
    recStack.add(node)
    path.push(node)

    const neighbors = adj.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) {
          return true
        }
      } else if (recStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor)
        cycles.push([...path.slice(cycleStart), neighbor])
        return true
      }
    }

    recStack.delete(node)
    return false
  }

  // Check all nodes
  for (const screenId of graph.screens.keys()) {
    if (!visited.has(screenId)) {
      dfs(screenId, [])
    }
  }

  return {
    valid: cycles.length === 0,
    cycles: cycles.length > 0 ? cycles : undefined,
  }
}

/**
 * Get navigation path from one screen to another
 * Returns the shortest path if one exists
 */
export async function getNavigationPath(flowId: string, fromScreenId: string, toScreenId: string): Promise<string[] | null> {
  const graph = await buildNavigationGraph(flowId)

  // BFS to find shortest path
  const queue: { screenId: string; path: string[] }[] = [{ screenId: fromScreenId, path: [fromScreenId] }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { screenId, path } = queue.shift()!

    if (screenId === toScreenId) {
      return path
    }

    if (visited.has(screenId)) {
      continue
    }

    visited.add(screenId)

    const outgoing = graph.navigationPaths.filter((p) => p.fromScreenId === screenId)
    for (const nav of outgoing) {
      if (!visited.has(nav.toScreenId)) {
        queue.push({ screenId: nav.toScreenId, path: [...path, nav.toScreenId] })
      }
    }
  }

  return null // No path found
}

