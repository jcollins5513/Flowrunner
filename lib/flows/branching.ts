// Branch Management Utilities
// Utilities for managing flow branching, conditional navigation, and branch operations

import { prisma } from '../db/client'
import type { FlowNavigationGraph, NavigationPath } from './types'
import { buildNavigationGraph } from './navigation-graph'

/**
 * Branch configuration for a navigation path
 */
export interface BranchConfig {
  toScreenId: string
  trigger?: string
  condition?: string
  label?: string
}

/**
 * Branch metadata for display and management
 */
export interface BranchMetadata {
  fromScreenId: string
  toScreenId: string
  trigger: string
  condition?: string
  label?: string
  order: number // Order within branches from same screen
}

/**
 * Normalize navigation JSON to multi-path format
 * (Re-exported from navigation-graph for convenience)
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
 * Get all branches from a screen
 */
export async function getBranchesFromScreen(
  flowId: string,
  fromScreenId: string
): Promise<BranchMetadata[]> {
  const screen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${fromScreenId}`)
  }

  const nav = normalizeNavigation(screen.navigation)
  const paths = nav.paths || []

  return paths.map((path, index) => ({
    fromScreenId: screen.id,
    toScreenId: path.screenId,
    trigger: path.trigger || 'button-click',
    condition: path.condition,
    label: path.label,
    order: index,
  }))
}

/**
 * Get all branches to a screen
 */
export async function getBranchesToScreen(
  flowId: string,
  toScreenId: string
): Promise<BranchMetadata[]> {
  const graph = await buildNavigationGraph(flowId)
  
  return graph.navigationPaths
    .filter((path) => path.toScreenId === toScreenId)
    .map((path, index) => ({
      fromScreenId: path.fromScreenId,
      toScreenId: path.toScreenId,
      trigger: path.trigger || 'button-click',
      condition: path.condition,
      label: path.label,
      order: index,
    }))
}

/**
 * Create a new branch from a screen
 */
export async function createBranch(
  flowId: string,
  fromScreenId: string,
  config: BranchConfig
): Promise<void> {
  // Verify both screens exist in the flow
  const fromScreen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  const toScreen = await prisma.screen.findUnique({
    where: { id: config.toScreenId },
  })

  if (!fromScreen || fromScreen.flowId !== flowId) {
    throw new Error(`Source screen not found in flow: ${fromScreenId}`)
  }

  if (!toScreen || toScreen.flowId !== flowId) {
    throw new Error(`Target screen not found in flow: ${config.toScreenId}`)
  }

  // Normalize navigation and add new branch
  const nav = normalizeNavigation(fromScreen.navigation)
  nav.paths = nav.paths || []

  // Check if branch already exists (same toScreenId and condition)
  const exists = nav.paths.some(
    (p) =>
      p.screenId === config.toScreenId &&
      (p.condition || '') === (config.condition || '') &&
      (p.trigger || 'button-click') === (config.trigger || 'button-click')
  )

  if (exists) {
    throw new Error('Branch already exists with same target and condition')
  }

  // Add new branch
  nav.paths.push({
    screenId: config.toScreenId,
    trigger: config.trigger || 'button-click',
    condition: config.condition,
    label: config.label,
  })

  await prisma.screen.update({
    where: { id: fromScreenId },
    data: {
      navigation: JSON.stringify(nav),
    },
  })
}

/**
 * Delete a specific branch
 */
export async function deleteBranch(
  flowId: string,
  fromScreenId: string,
  options: {
    toScreenId?: string
    condition?: string
    label?: string
  }
): Promise<void> {
  const screen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${fromScreenId}`)
  }

  const nav = normalizeNavigation(screen.navigation)
  const paths = nav.paths || []

  // Filter out the branch to delete
  const filteredPaths = paths.filter((path) => {
    // If toScreenId is specified, must match
    if (options.toScreenId && path.screenId !== options.toScreenId) {
      return true
    }

    // If condition is specified, must match
    if (options.condition !== undefined) {
      if ((path.condition || '') !== (options.condition || '')) {
        return true
      }
    }

    // If label is specified, must match
    if (options.label !== undefined) {
      if ((path.label || '') !== (options.label || '')) {
        return true
      }
    }

    // If no filters, this shouldn't happen - require at least one filter
    if (!options.toScreenId && options.condition === undefined && options.label === undefined) {
      return true
    }

    // All specified filters matched - delete this branch
    return false
  })

  if (filteredPaths.length === paths.length) {
    throw new Error('Branch not found with specified criteria')
  }

  // Update navigation
  nav.paths = filteredPaths.length > 0 ? filteredPaths : undefined

  // If no paths left, set navigation to null
  if (!nav.paths || nav.paths.length === 0) {
    await prisma.screen.update({
      where: { id: fromScreenId },
      data: {
        navigation: null,
      },
    })
  } else {
    await prisma.screen.update({
      where: { id: fromScreenId },
      data: {
        navigation: JSON.stringify(nav),
      },
    })
  }
}

/**
 * Update branch metadata (label, condition, trigger)
 */
export async function updateBranch(
  flowId: string,
  fromScreenId: string,
  toScreenId: string,
  updates: {
    label?: string
    condition?: string
    trigger?: string
  }
): Promise<void> {
  const screen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${fromScreenId}`)
  }

  const nav = normalizeNavigation(screen.navigation)
  const paths = nav.paths || []

  // Find and update the branch
  const branchIndex = paths.findIndex((p) => p.screenId === toScreenId)

  if (branchIndex === -1) {
    throw new Error(`Branch from ${fromScreenId} to ${toScreenId} not found`)
  }

  // Update branch properties
  if (updates.label !== undefined) {
    paths[branchIndex].label = updates.label
  }
  if (updates.condition !== undefined) {
    paths[branchIndex].condition = updates.condition
  }
  if (updates.trigger !== undefined) {
    paths[branchIndex].trigger = updates.trigger
  }

  await prisma.screen.update({
    where: { id: fromScreenId },
    data: {
      navigation: JSON.stringify(nav),
    },
  })
}

/**
 * Merge branches (combine multiple paths into one)
 * This is useful when you want to consolidate multiple conditional paths
 */
export async function mergeBranches(
  flowId: string,
  fromScreenId: string,
  branchToKeep: {
    toScreenId: string
    condition?: string
    label?: string
  },
  branchesToMerge: Array<{
    toScreenId: string
    condition?: string
  }>
): Promise<void> {
  const screen = await prisma.screen.findUnique({
    where: { id: fromScreenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${fromScreenId}`)
  }

  // Verify target screens exist and are the same
  const targetScreenIds = new Set([
    branchToKeep.toScreenId,
    ...branchesToMerge.map((b) => b.toScreenId),
  ])

  if (targetScreenIds.size > 1) {
    throw new Error('Cannot merge branches that target different screens')
  }

  const nav = normalizeNavigation(screen.navigation)
  const paths = nav.paths || []

  // Find the branch to keep
  const keepIndex = paths.findIndex(
    (p) =>
      p.screenId === branchToKeep.toScreenId &&
      (p.condition || '') === (branchToKeep.condition || '')
  )

  if (keepIndex === -1) {
    throw new Error('Branch to keep not found')
  }

  // Build merged condition (combine conditions with OR logic)
  const conditionsToMerge = branchesToMerge
    .map((b) => b.condition)
    .filter((c): c is string => !!c)

  if (conditionsToMerge.length > 0) {
    const existingCondition = paths[keepIndex].condition
    const mergedCondition = existingCondition
      ? `(${existingCondition}) OR (${conditionsToMerge.join(') OR (')})`
      : conditionsToMerge.join(' OR ')
    paths[keepIndex].condition = mergedCondition
  }

  // Update label if provided
  if (branchToKeep.label) {
    paths[keepIndex].label = branchToKeep.label
  }

  // Remove merged branches
  const mergedIndices = new Set(
    branchesToMerge.map((b) =>
      paths.findIndex(
        (p) =>
          p.screenId === b.toScreenId &&
          (p.condition || '') === (b.condition || '')
      )
    )
  )

  const filteredPaths = paths.filter((_, index) => !mergedIndices.has(index))

  nav.paths = filteredPaths

  await prisma.screen.update({
    where: { id: fromScreenId },
    data: {
      navigation: JSON.stringify(nav),
    },
  })
}

/**
 * Check if a screen has multiple branches
 */
export async function hasBranches(flowId: string, screenId: string): Promise<boolean> {
  const branches = await getBranchesFromScreen(flowId, screenId)
  return branches.length > 1
}

/**
 * Get branch count from a screen
 */
export async function getBranchCount(flowId: string, screenId: string): Promise<number> {
  const branches = await getBranchesFromScreen(flowId, screenId)
  return branches.length
}

/**
 * Find all branch points in a flow (screens with multiple outgoing paths)
 */
export async function findBranchPoints(flowId: string): Promise<Array<{
  screenId: string
  branchCount: number
  branches: BranchMetadata[]
}>> {
  const graph = await buildNavigationGraph(flowId)
  
  // Group paths by fromScreenId
  const pathsByScreen = new Map<string, NavigationPath[]>()
  
  for (const path of graph.navigationPaths) {
    const existing = pathsByScreen.get(path.fromScreenId) || []
    existing.push(path)
    pathsByScreen.set(path.fromScreenId, existing)
  }

  // Find screens with multiple paths
  const branchPoints: Array<{
    screenId: string
    branchCount: number
    branches: BranchMetadata[]
  }> = []

  for (const [screenId, paths] of pathsByScreen.entries()) {
    if (paths.length > 1) {
      branchPoints.push({
        screenId,
        branchCount: paths.length,
        branches: paths.map((path, index) => ({
          fromScreenId: path.fromScreenId,
          toScreenId: path.toScreenId,
          trigger: path.trigger || 'button-click',
          condition: path.condition,
          label: path.label,
          order: index,
        })),
      })
    }
  }

  return branchPoints
}
