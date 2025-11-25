// Screen Sequence Management
// Utilities for managing screen ordering, insertion, removal, and reordering

import type { Prisma } from '@prisma/client'
import { createScreenWithValidation } from '../db/dsl-persistence'
import { screenRepository, withDbTransaction } from '../db/repositories'
import type { ScreenSequenceEntry, InsertScreenOptions, ReorderScreenOptions, NavigationPath } from './types'
import type { ScreenDSL } from '../dsl/types'

/**
 * Get screen sequence for a flow
 * Returns screens in their current order with relationship information
 */
export async function getScreenSequence(
  flowId: string,
  options: { tx?: Prisma.TransactionClient } = {}
): Promise<ScreenSequenceEntry[]> {
  const screens = await screenRepository.findByFlow(flowId, {
    orderByCreated: 'asc',
    includeHero: true,
    tx: options.tx,
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
  return withDbTransaction(async (tx) => {
    const sequence = await getScreenSequence(flowId, { tx })

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

    const { screen, dsl } = await createScreenWithValidation(flowId, options.screenDSL, {
      heroImageId: options.heroImageId,
      client: tx,
    })

    if (options.navigationFrom) {
      const fromScreen = await screenRepository.findById(options.navigationFrom, { tx })

      if (fromScreen) {
        const navigation = fromScreen.navigation ? JSON.parse(fromScreen.navigation as string) : { type: 'internal' }
        navigation.screenId = screen.id

        await screenRepository.update(
          options.navigationFrom,
          {
            navigation: JSON.stringify(navigation),
          },
          { tx }
        )
      }
    }

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

        await screenRepository.update(
          screen.id,
          {
            navigation: JSON.stringify(updatedDSL.navigation),
          },
          { tx }
        )
      }
    }

    return { screen, dsl }
  })
}

/**
 * Remove a screen from a flow
 */
export async function removeScreen(flowId: string, screenId: string, updateNavigation: boolean = true): Promise<void> {
  await withDbTransaction(async (tx) => {
    const screen = await screenRepository.findById(screenId, { tx })

    if (!screen || screen.flowId !== flowId) {
      throw new Error(`Screen not found in flow: ${screenId}`)
    }

    if (updateNavigation) {
      const sequence = await getScreenSequence(flowId, { tx })
      const screenEntry = sequence.find((entry) => entry.screenId === screenId)

      if (screenEntry?.parentScreenId) {
        const parentScreen = await screenRepository.findById(screenEntry.parentScreenId, { tx })

        if (parentScreen && screenEntry.childScreenIds.length > 0) {
          const navigation = parentScreen.navigation
            ? JSON.parse(parentScreen.navigation as string)
            : { type: 'internal' }
          navigation.screenId = screenEntry.childScreenIds[0]

          await screenRepository.update(
            parentScreen.id,
            {
              navigation: JSON.stringify(navigation),
            },
            { tx }
          )
        }
      }
    }

    await screenRepository.delete(screenId, { tx })
  })
}

/**
 * Reorder screens in a flow
 */
export async function reorderScreen(flowId: string, options: ReorderScreenOptions): Promise<void> {
  await withDbTransaction(async (tx) => {
    const sequence = await getScreenSequence(flowId, { tx })
    const screenIndex = sequence.findIndex((entry) => entry.screenId === options.screenId)

    if (screenIndex === -1) {
      throw new Error(`Screen not found in flow: ${options.screenId}`)
    }

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

    const screen = await screenRepository.findById(options.screenId, { tx })

    if (screen) {
      const metadata = screen.metadata ? JSON.parse(screen.metadata as string) : {}
      metadata.order = newOrder

      await screenRepository.update(
        options.screenId,
        {
          metadata: JSON.stringify(metadata),
        },
        { tx }
      )
    }
  })
}

/**
 * Get ordered screens for a flow
 * Returns screens sorted by their order (from metadata or creation time)
 */
export async function getOrderedScreens(flowId: string): Promise<any[]> {
  const screens = await screenRepository.findByFlow(flowId, { includeHero: true })

  // Sort by metadata order if available, otherwise by creation time
  return screens.sort((a, b) => {
    const aMetadata = a.metadata ? JSON.parse(a.metadata as string) : {}
    const bMetadata = b.metadata ? JSON.parse(b.metadata as string) : {}

    const aOrder = aMetadata.order ?? a.createdAt.getTime()
    const bOrder = bMetadata.order ?? b.createdAt.getTime()

    return aOrder - bOrder
  })
}

