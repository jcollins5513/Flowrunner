// Branch Management Utilities Tests
// Tests for branch creation, deletion, merging, and querying

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db/client'
import { patternDefinitionSchema } from '@/lib/patterns/schema'
import type { PatternDefinition } from '@/lib/patterns/schema'
import {
  createBranch,
  deleteBranch,
  updateBranch,
  mergeBranches,
  getBranchesFromScreen,
  hasBranches,
  getBranchCount,
  findBranchPoints,
} from '@/lib/flows/branching'
import { FlowEngine } from '@/lib/flows/engine'
import { insertScreen } from '@/lib/flows/screen-sequence'
import { createPatternFixtureDSL } from '@/lib/patterns/fixtures'
import type { ScreenDSL } from '@/lib/dsl/types'

describe('Branch Management Utilities', () => {
  let flowId: string
  let screen1Id: string
  let screen2Id: string
  let screen3Id: string

  // Preload patterns before tests
  beforeAll(async () => {
    // Load pattern directly from filesystem and cache it
    // We'll use vi.mock or directly import the loader to cache the pattern
    // For now, patterns will be cached on first validation in insertScreen
    // This is a workaround - in a real scenario, we'd preload via API or direct cache manipulation
  })

  beforeEach(async () => {
    // Create a test flow with screens (no userId to avoid foreign key constraint)
    const flow = await FlowEngine.createFlow({
      name: 'Test Flow for Branching',
      description: 'Test flow for branch management tests',
    })

    flowId = flow.id

    // Create test screens using fixture helper
    const screen1DSL: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1, {
      paletteIndex: 0,
      vibe: 'modern',
    })

    const screen2DSL: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1, {
      paletteIndex: 1,
      vibe: 'modern',
    })

    const screen3DSL: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1, {
      paletteIndex: 2,
      vibe: 'modern',
    })

    // Insert screens
    const { screen: screen1 } = await insertScreen(flowId, {
      screenDSL: screen1DSL,
      position: 'start',
    })

    const { screen: screen2 } = await insertScreen(flowId, {
      screenDSL: screen2DSL,
      position: 'end',
    })

    const { screen: screen3 } = await insertScreen(flowId, {
      screenDSL: screen3DSL,
      position: 'end',
    })

    screen1Id = screen1.id
    screen2Id = screen2.id
    screen3Id = screen3.id
  })

  afterEach(async () => {
    // Clean up test flow and screens
    if (flowId) {
      await FlowEngine.deleteFlow(flowId)
    }
  })

  describe('createBranch', () => {
    it('should create a new branch from a screen', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        label: 'Premium Users',
        condition: 'user.isPremium === true',
        trigger: 'button-click',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(1)
      expect(branches[0].toScreenId).toBe(screen2Id)
      expect(branches[0].label).toBe('Premium Users')
      expect(branches[0].condition).toBe('user.isPremium === true')
      expect(branches[0].trigger).toBe('button-click')
    })

    it('should create multiple branches from a screen', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        label: 'Premium Users',
        condition: 'user.isPremium === true',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
        label: 'Free Users',
        condition: 'user.isPremium === false',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(2)
    })

    it('should throw error if branch already exists', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.isPremium === true',
      })

      await expect(
        createBranch(flowId, screen1Id, {
          toScreenId: screen2Id,
          condition: 'user.isPremium === true',
        })
      ).rejects.toThrow('Branch already exists')
    })

    it('should allow different conditions to same screen', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.isPremium === true',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.isPremium === false',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(2)
    })
  })

  describe('deleteBranch', () => {
    it('should delete a specific branch by toScreenId', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        label: 'Branch 1',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
        label: 'Branch 2',
      })

      await deleteBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(1)
      expect(branches[0].toScreenId).toBe(screen3Id)
    })

    it('should delete a branch by condition', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.isPremium === true',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
        condition: 'user.isPremium === false',
      })

      await deleteBranch(flowId, screen1Id, {
        condition: 'user.isPremium === true',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(1)
      expect(branches[0].condition).toBe('user.isPremium === false')
    })

    it('should clear navigation when all branches are deleted', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      await deleteBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      const screen = await prisma.screen.findUnique({
        where: { id: screen1Id },
      })

      expect(screen?.navigation).toBeNull()
    })
  })

  describe('updateBranch', () => {
    it('should update branch label', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        label: 'Old Label',
      })

      await updateBranch(flowId, screen1Id, screen2Id, {
        label: 'New Label',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches[0].label).toBe('New Label')
    })

    it('should update branch condition', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'old condition',
      })

      await updateBranch(flowId, screen1Id, screen2Id, {
        condition: 'new condition',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches[0].condition).toBe('new condition')
    })

    it('should update branch trigger', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        trigger: 'button-click',
      })

      await updateBranch(flowId, screen1Id, screen2Id, {
        trigger: 'form-submit',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches[0].trigger).toBe('form-submit')
    })
  })

  describe('mergeBranches', () => {
    it('should merge multiple branches into one', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.type === "premium"',
        label: 'Keep This',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.type === "pro"',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'user.type === "enterprise"',
      })

      await mergeBranches(
        flowId,
        screen1Id,
        {
          toScreenId: screen2Id,
          condition: 'user.type === "premium"',
          label: 'Premium Users',
        },
        [
          {
            toScreenId: screen2Id,
            condition: 'user.type === "pro"',
          },
          {
            toScreenId: screen2Id,
            condition: 'user.type === "enterprise"',
          },
        ]
      )

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(1)
      expect(branches[0].label).toBe('Premium Users')
      expect(branches[0].condition).toContain('user.type === "premium"')
      expect(branches[0].condition).toContain('user.type === "pro"')
      expect(branches[0].condition).toContain('user.type === "enterprise"')
    })

    it('should throw error if trying to merge branches to different screens', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        condition: 'condition1',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
        condition: 'condition2',
      })

      await expect(
        mergeBranches(
          flowId,
          screen1Id,
          {
            toScreenId: screen2Id,
            condition: 'condition1',
          },
          [
            {
              toScreenId: screen3Id,
              condition: 'condition2',
            },
          ]
        )
      ).rejects.toThrow('Cannot merge branches that target different screens')
    })
  })

  describe('getBranchesFromScreen', () => {
    it('should return all branches from a screen', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
        label: 'Branch 1',
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
        label: 'Branch 2',
      })

      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(2)
    })

    it('should return empty array if no branches exist', async () => {
      const branches = await getBranchesFromScreen(flowId, screen1Id)
      expect(branches).toHaveLength(0)
    })
  })

  describe('hasBranches', () => {
    it('should return true if screen has multiple branches', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
      })

      const hasBranching = await hasBranches(flowId, screen1Id)
      expect(hasBranching).toBe(true)
    })

    it('should return false if screen has single or no branches', async () => {
      expect(await hasBranches(flowId, screen1Id)).toBe(false)

      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      expect(await hasBranches(flowId, screen1Id)).toBe(false)
    })
  })

  describe('getBranchCount', () => {
    it('should return correct branch count', async () => {
      expect(await getBranchCount(flowId, screen1Id)).toBe(0)

      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      expect(await getBranchCount(flowId, screen1Id)).toBe(1)

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
      })

      expect(await getBranchCount(flowId, screen1Id)).toBe(2)
    })
  })

  describe('findBranchPoints', () => {
    it('should find all screens with multiple branches', async () => {
      await createBranch(flowId, screen1Id, {
        toScreenId: screen2Id,
      })

      await createBranch(flowId, screen1Id, {
        toScreenId: screen3Id,
      })

      const branchPoints = await findBranchPoints(flowId)
      expect(branchPoints).toHaveLength(1)
      expect(branchPoints[0].screenId).toBe(screen1Id)
      expect(branchPoints[0].branchCount).toBe(2)
    })

    it('should return empty array if no branch points exist', async () => {
      const branchPoints = await findBranchPoints(flowId)
      expect(branchPoints).toHaveLength(0)
    })
  })
})

