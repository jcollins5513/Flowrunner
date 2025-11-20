// Screen Sequence Management
// Utilities for managing screen ordering, insertion, removal, and reordering

import { prisma } from '../db/client'
import { createScreenWithValidation } from '../db/dsl-persistence'
import type { ScreenSequenceEntry, InsertScreenOptions, ReorderScreenOptions, NavigationPath } from './types'
import type { ScreenDSL } from '../dsl/types'

/**
 * Get screen sequence for a flow
 * Returns screens in their current order with relationship information
 */
export async function getScreenSequence(flowId: string): Promise<ScreenSequenceEntry[]> {
  const screens = await prisma.screen.findMany({
    where: { flowId },
    orderBy: { createdAt: 'asc' }, // Default ordering
    include: {
      heroImage: true,
    },
  })

  // Build navigation graph from screen navigation data
  const navigationMap = new Map<string, string[]>() // screenId -> target screen IDs

  for (const screen of screens) {
    if (screen.navigation) {
      const nav = JSON.parse(screen.navigation as string)
      if (nav.screenId) {
        const targets = navigationMap.get(screen.id) || []
        targets.push(nav.screenId)
        navigationMap.set(screen.id, targets)
      }
    }
  }

  // Build parent-child relationships
  const parentMap = new Map<string, string>() // childId -> parentId
  const childMap = new Map<string, string[]>() // parentId -> childIds

  for (const [screenId, targets] of navigationMap.entries()) {
    for (const targetId of targets) {
      parentMap.set(targetId, screenId)
      const children = childMap.get(screenId) || []
      children.push(targetId)
      childMap.set(screenId, children)
    }
  }

  // Create sequence entries
  return screens.map((screen, index) => ({
    screenId: screen.id,
    order: index,
    parentScreenId: parentMap.get(screen.id),
    childScreenIds: childMap.get(screen.id) || [],
    navigationTargets: navigationMap.get(screen.id) || [],
  }))
}

/**
 * Insert a screen into a flow
 */
export async function insertScreen(flowId: string, options: InsertScreenOptions): Promise<{ screen: any; dsl: ScreenDSL }> {
  const sequence = await getScreenSequence(flowId)

  // Determine insertion position
  let insertOrder: number

  if (options.position === 'start') {
    insertOrder = 0
  } else if (options.position === 'end' || options.position === undefined) {
    insertOrder = sequence.length
  } else if (typeof options.position === 'number') {
    insertOrder = Math.max(0, Math.min(options.position, sequence.length))
  } else if (options.afterScreenId) {
    const afterIndex = sequence.findIndex((entry) => entry.screenId === options.afterScreenId)
    if (afterIndex === -1) {
      throw new Error(`Screen not found: ${options.afterScreenId}`)
    }
    insertOrder = afterIndex + 1
  } else if (options.beforeScreenId) {
    const beforeIndex = sequence.findIndex((entry) => entry.screenId === options.beforeScreenId)
    if (beforeIndex === -1) {
      throw new Error(`Screen not found: ${options.beforeScreenId}`)
    }
    insertOrder = beforeIndex
  } else {
    insertOrder = sequence.length
  }

  // Create screen
  const { screen, dsl } = await createScreenWithValidation(flowId, options.screenDSL, {
    heroImageId: options.heroImageId,
  })

  // Update navigation if specified
  if (options.navigationFrom) {
    const fromScreen = await prisma.screen.findUnique({
      where: { id: options.navigationFrom },
    })

    if (fromScreen) {
      const navigation = fromScreen.navigation ? JSON.parse(fromScreen.navigation as string) : { type: 'internal' }
      navigation.screenId = screen.id

      await prisma.screen.update({
        where: { id: options.navigationFrom },
        data: {
          navigation: JSON.stringify(navigation),
        },
      })
    }
  }

  // Update DSL navigation to point to next screen if applicable
  if (insertOrder < sequence.length) {
    const nextScreen = sequence[insertOrder]
    if (nextScreen && dsl.navigation?.type === 'internal') {
      const updatedDSL: ScreenDSL = {
        ...dsl,
        navigation: {
          ...dsl.navigation,
          screenId: nextScreen.screenId,
        },
      }

      await prisma.screen.update({
        where: { id: screen.id },
        data: {
          navigation: JSON.stringify(updatedDSL.navigation),
        },
      })
    }
  }

  return { screen, dsl }
}

/**
 * Remove a screen from a flow
 */
export async function removeScreen(flowId: string, screenId: string, updateNavigation: boolean = true): Promise<void> {
  const screen = await prisma.screen.findUnique({
    where: { id: screenId },
  })

  if (!screen || screen.flowId !== flowId) {
    throw new Error(`Screen not found in flow: ${screenId}`)
  }

  // Update navigation from parent screens
  if (updateNavigation) {
    const sequence = await getScreenSequence(flowId)
    const screenEntry = sequence.find((entry) => entry.screenId === screenId)

    if (screenEntry?.parentScreenId) {
      // Update parent to navigate to child instead
      const parentScreen = await prisma.screen.findUnique({
        where: { id: screenEntry.parentScreenId },
      })

      if (parentScreen && screenEntry.childScreenIds.length > 0) {
        const navigation = parentScreen.navigation ? JSON.parse(parentScreen.navigation as string) : { type: 'internal' }
        navigation.screenId = screenEntry.childScreenIds[0]

        await prisma.screen.update({
          where: { id: screenEntry.parentScreenId },
          data: {
            navigation: JSON.stringify(navigation),
          },
        })
      }
    }
  }

  // Delete screen (cascade will handle related data)
  await prisma.screen.delete({
    where: { id: screenId },
  })
}

/**
 * Reorder screens in a flow
 */
export async function reorderScreen(flowId: string, options: ReorderScreenOptions): Promise<void> {
  const sequence = await getScreenSequence(flowId)
  const screenIndex = sequence.findIndex((entry) => entry.screenId === options.screenId)

  if (screenIndex === -1) {
    throw new Error(`Screen not found in flow: ${options.screenId}`)
  }

  // Determine new order
  let newOrder: number

  if (options.orAfterScreenId) {
    const afterIndex = sequence.findIndex((entry) => entry.screenId === options.orAfterScreenId)
    if (afterIndex === -1) {
      throw new Error(`Screen not found: ${options.orAfterScreenId}`)
    }
    newOrder = afterIndex + 1
  } else if (options.orBeforeScreenId) {
    const beforeIndex = sequence.findIndex((entry) => entry.screenId === options.orBeforeScreenId)
    if (beforeIndex === -1) {
      throw new Error(`Screen not found: ${options.orBeforeScreenId}`)
    }
    newOrder = beforeIndex
  } else {
    newOrder = Math.max(0, Math.min(options.newOrder, sequence.length - 1))
  }

  // Note: Since we're using createdAt for ordering, we need to update metadata or use a separate order field
  // For now, we'll store order in metadata
  const screen = await prisma.screen.findUnique({
    where: { id: options.screenId },
  })

  if (screen) {
    const metadata = screen.metadata ? JSON.parse(screen.metadata as string) : {}
    metadata.order = newOrder

    await prisma.screen.update({
      where: { id: options.screenId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    })
  }

  // Update navigation connections if needed
  // This is a simplified implementation - in a full system, you'd want to rebuild the navigation graph
}

/**
 * Get ordered screens for a flow
 * Returns screens sorted by their order (from metadata or creation time)
 */
export async function getOrderedScreens(flowId: string): Promise<any[]> {
  const screens = await prisma.screen.findMany({
    where: { flowId },
    include: {
      heroImage: true,
    },
  })

  // Sort by metadata order if available, otherwise by creation time
  return screens.sort((a, b) => {
    const aMetadata = a.metadata ? JSON.parse(a.metadata as string) : {}
    const bMetadata = b.metadata ? JSON.parse(b.metadata as string) : {}

    const aOrder = aMetadata.order ?? a.createdAt.getTime()
    const bOrder = bMetadata.order ?? b.createdAt.getTime()

    return aOrder - bOrder
  })
}

