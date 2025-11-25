// Flow Engine Service
// Core service for managing flows, screen sequences, and navigation graphs

import { createScreenWithValidation, createRevisionWithValidation } from '../db/dsl-persistence'
import { flowRepository, screenRepository, withDbTransaction } from '../db/repositories'
import type {
  FlowMetadata,
  ScreenSequenceEntry,
  FlowNavigationGraph,
  NavigationPath,
  FlowThemeConfig,
  CreateFlowOptions,
  UpdateFlowOptions,
  InsertScreenOptions,
  ReorderScreenOptions,
  CloneFlowOptions,
  FlowQueryOptions,
  FlowStats,
} from './types'
import type { ScreenDSL, Palette, Vibe } from '../dsl/types'
import { validateScreenDSL } from '../dsl/validator'

const mapFlowMetadata = (flow: {
  id: string
  name: string
  description: string | null
  domain: string | null
  theme: string | null
  style: string | null
  isPublic: boolean
  userId: string | null
  createdAt: Date
  updatedAt: Date
}): FlowMetadata => ({
  id: flow.id,
  name: flow.name,
  description: flow.description ?? undefined,
  domain: flow.domain ?? undefined,
  theme: flow.theme ?? undefined,
  style: flow.style ?? undefined,
  isPublic: flow.isPublic,
  userId: flow.userId ?? undefined,
  createdAt: flow.createdAt,
  updatedAt: flow.updatedAt,
})

/**
 * Flow Engine Service
 * Handles all flow-level operations including creation, management, and navigation
 */
export class FlowEngine {
  /**
   * Create a new flow
   */
  static async createFlow(options: CreateFlowOptions): Promise<FlowMetadata & { screens: any[] }> {
    try {
      const result = await withDbTransaction(async (tx) => {
        const flow = await flowRepository.create(
          {
            name: options.name,
            description: options.description,
            domain: options.domain,
            theme: options.theme,
            style: options.style,
            userId: options.userId ?? null,
            isPublic: options.isPublic ?? false,
          },
          { tx, logger: options.logger }
        )

        const screens: any[] = []

        if (options.initialScreens && options.initialScreens.length > 0) {
          for (let i = 0; i < options.initialScreens.length; i++) {
            const screenDSL = options.initialScreens[i]
            const { screen } = await createScreenWithValidation(flow.id, screenDSL, {
              heroImageId: screenDSL.hero_image.id,
              client: tx,
              logger: options.logger,
            })
            screens.push(screen)
          }

          for (let i = 0; i < screens.length - 1; i++) {
            const currentScreen = screens[i]
            const nextScreen = screens[i + 1]
            const currentDSL = options.initialScreens[i]

            if (currentDSL.navigation?.type === 'internal') {
              const updatedDSL: ScreenDSL = {
                ...currentDSL,
                navigation: {
                  ...currentDSL.navigation,
                  screenId: nextScreen.id,
                },
              }

              await screenRepository.update(
                currentScreen.id,
                {
                  navigation: JSON.stringify(updatedDSL.navigation),
                },
                { tx, logger: options.logger }
              )
            }
          }
        }

        if (options.themeConfig && screens.length > 0) {
          const firstScreen = screens[0]
          const existingMetadata = firstScreen.metadata ? JSON.parse(firstScreen.metadata as string) : {}
          await screenRepository.update(
            firstScreen.id,
            {
              metadata: JSON.stringify({
                ...existingMetadata,
                flowThemeConfig: options.themeConfig,
              }),
            },
            { tx, logger: options.logger }
          )
        }

        return { ...mapFlowMetadata(flow), screens }
      })

      return result
    } catch (error) {
      options.logger?.error?.('flow.create.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Get flow by ID with screens
   */
  static async getFlow(flowId: string, includeScreens: boolean = true): Promise<FlowMetadata & { screens?: any[] }> {
    const flow = await flowRepository.findById(flowId, {
      includeScreens,
    })

    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`)
    }

    return {
      ...mapFlowMetadata(flow),
      screens: includeScreens ? flow.screens : undefined,
    }
  }

  /**
   * Update flow metadata
   */
  static async updateFlow(flowId: string, options: UpdateFlowOptions): Promise<FlowMetadata> {
    const updateData: any = {}

    if (options.name !== undefined) updateData.name = options.name
    if (options.description !== undefined) updateData.description = options.description
    if (options.domain !== undefined) updateData.domain = options.domain
    if (options.theme !== undefined) updateData.theme = options.theme
    if (options.style !== undefined) updateData.style = options.style
    if (options.isPublic !== undefined) updateData.isPublic = options.isPublic

    // Update theme config - store in first screen's metadata as workaround
    if (options.themeConfig) {
      const screens = await screenRepository.findByFlow(flowId, { orderByCreated: 'asc', logger: options.logger })

      if (screens.length > 0) {
        const firstScreen = screens[0]
        const existingMetadata = firstScreen.metadata ? JSON.parse(firstScreen.metadata as string) : {}
        await screenRepository.update(
          firstScreen.id,
          {
            metadata: JSON.stringify({
              ...existingMetadata,
              flowThemeConfig: options.themeConfig,
            }),
          },
          { logger: options.logger }
        )
      }
    }

    const flow = await flowRepository.update(flowId, updateData, { logger: options.logger })

    return mapFlowMetadata(flow)
  }

  /**
   * Delete flow and all associated screens
   */
  static async deleteFlow(flowId: string): Promise<void> {
    // Screens are cascade deleted via Prisma schema
    await flowRepository.delete(flowId)
  }

  /**
   * Clone a flow
   */
  static async cloneFlow(flowId: string, options: CloneFlowOptions): Promise<FlowMetadata & { screens: any[] }> {
    const sourceFlow = await this.getFlow(flowId, true)
    if (!sourceFlow.screens) {
      throw new Error('Source flow has no screens to clone')
    }

    return withDbTransaction(async (tx) => {
      const newFlow = await flowRepository.create(
        {
          name: options.newName,
          description: options.newDescription ?? sourceFlow.description,
          domain: sourceFlow.domain,
          theme: sourceFlow.theme,
          style: sourceFlow.style,
          userId: options.userId ?? null,
          isPublic: false,
        },
        { tx, logger: options.logger }
      )

      if (!options.includeScreens) {
        return { ...mapFlowMetadata(newFlow), screens: [] }
      }

      const clonedScreens = []
      const screenIdMap = new Map<string, string>()

      for (const screen of sourceFlow.screens) {
        const screenDSL: ScreenDSL = {
          hero_image: screen.heroImage
            ? {
                id: screen.heroImage.id,
                url: screen.heroImage.url,
                prompt: screen.heroImage.prompt ?? undefined,
                seed: screen.heroImage.seed ?? undefined,
                aspectRatio: screen.heroImage.aspectRatio ?? undefined,
                style: screen.heroImage.style ?? undefined,
                extractedPalette: screen.heroImage.extractedPalette
                  ? JSON.parse(screen.heroImage.extractedPalette)
                  : undefined,
                vibe: screen.heroImage.vibe as Vibe | undefined,
              }
            : {
                id: 'placeholder',
                url: '',
              },
          palette: screen.palette
            ? JSON.parse(screen.palette)
            : { primary: '#000', secondary: '#666', accent: '#999', background: '#fff' },
          vibe: (screen.vibe as Vibe) ?? 'modern',
          pattern_family: (screen.patternFamily as any) ?? 'HERO_CENTER_TEXT',
          pattern_variant: (screen.patternVariant as 1 | 2 | 3 | 4 | 5) ?? 1,
          components: screen.components ? JSON.parse(screen.components as string) : [],
          navigation: screen.navigation ? JSON.parse(screen.navigation as string) : undefined,
          animations: screen.animations ? JSON.parse(screen.animations as string) : undefined,
          metadata: screen.metadata ? JSON.parse(screen.metadata as string) : undefined,
        }

        const { screen: newScreen } = await createScreenWithValidation(newFlow.id, screenDSL, {
          heroImageId: screen.heroImageId ?? undefined,
          client: tx,
          logger: options.logger,
        })

        screenIdMap.set(screen.id, newScreen.id)
        clonedScreens.push(newScreen)
      }

      for (let i = 0; i < clonedScreens.length; i++) {
        const clonedScreen = clonedScreens[i]
        const originalScreen = sourceFlow.screens[i]

        if (originalScreen.navigation) {
          const navigation = JSON.parse(originalScreen.navigation as string)
          if (navigation.screenId && screenIdMap.has(navigation.screenId)) {
            navigation.screenId = screenIdMap.get(navigation.screenId)
          }

          await screenRepository.update(
            clonedScreen.id,
            {
              navigation: JSON.stringify(navigation),
            },
            { tx, logger: options.logger }
          )
        }
      }

      return { ...mapFlowMetadata(newFlow), screens: clonedScreens }
    })
  }

  /**
   * Query flows with filters
   */
  static async queryFlows(options: FlowQueryOptions = {}): Promise<FlowMetadata[]> {
    const where: any = {}

    if (options.userId) where.userId = options.userId
    if (options.domain) where.domain = options.domain
    if (options.theme) where.theme = options.theme
    if (options.isPublic !== undefined) where.isPublic = options.isPublic

    if (options.search) {
      // SQLite doesn't support case-insensitive mode, use contains with case handling
      const searchLower = options.search.toLowerCase()
      where.OR = [
        { name: { contains: options.search } },
        { description: { contains: options.search } },
      ]
    }

    const orderBy: any = {}
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder ?? 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    const flows = await flowRepository.list(where, {
      orderBy,
      take: options.limit ?? 100,
      skip: options.offset ?? 0,
    })

    return flows.map((flow) => mapFlowMetadata(flow))
  }

  /**
   * Get flow statistics
   */
  static async getFlowStats(flowId: string): Promise<FlowStats> {
    const flow = await flowRepository.findById(flowId, { includeScreens: true, includeRevisions: true })

    if (!flow) {
      throw new Error(`Flow not found: ${flowId}`)
    }

    // Calculate palette and vibe consistency
    const palettes = flow.screens
      .map((s) => (s.palette ? JSON.parse(s.palette as string) : null))
      .filter(Boolean) as Palette[]
    const vibes = flow.screens.map((s) => s.vibe).filter(Boolean) as string[]

    let averagePaletteConsistency: number | undefined
    let averageVibeConsistency: number | undefined

    if (palettes.length > 1) {
      // Simple consistency calculation: compare primary colors
      const primaryColors = palettes.map((p) => p.primary)
      const uniquePrimaries = new Set(primaryColors)
      averagePaletteConsistency = 1 - (uniquePrimaries.size - 1) / palettes.length
    }

    if (vibes.length > 1) {
      const uniqueVibes = new Set(vibes)
      averageVibeConsistency = 1 - (uniqueVibes.size - 1) / vibes.length
    }

    return {
      flowId: flow.id,
      screenCount: flow.screens.length,
      totalRevisions: flow.revisions.length,
      lastUpdated: flow.updatedAt,
      averagePaletteConsistency,
      averageVibeConsistency,
    }
  }
}

