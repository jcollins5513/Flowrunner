// Unit tests for diagram utilities
import { describe, it, expect } from 'vitest'
import {
  convertGraphToReactFlow,
  generateNodePosition,
  hasBranching,
  getBranchTargets,
  type ScreenWithId,
} from '@/lib/flows/diagram-utils'
import type { FlowNavigationGraph } from '@/lib/flows/types'
import type { ScreenDSL } from '@/lib/dsl/types'

describe('diagram-utils', () => {
  const createMockGraph = (): FlowNavigationGraph => {
    const screens = new Map([
      ['screen-1', { screenId: 'screen-1', order: 0, childScreenIds: ['screen-2'], navigationTargets: ['screen-2'] }],
      ['screen-2', { screenId: 'screen-2', order: 1, childScreenIds: ['screen-3'], navigationTargets: ['screen-3'] }],
      ['screen-3', { screenId: 'screen-3', order: 2, childScreenIds: [], navigationTargets: [] }],
    ])

    return {
      flowId: 'flow-1',
      entryScreenId: 'screen-1',
      screens,
      navigationPaths: [
        { fromScreenId: 'screen-1', toScreenId: 'screen-2' },
        { fromScreenId: 'screen-2', toScreenId: 'screen-3' },
      ],
    }
  }

  const createMockScreenDSL = (id: string): ScreenDSL => ({
    hero_image: { id: `img-${id}`, url: `https://example.com/img-${id}.jpg` },
    palette: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#fff' },
    vibe: 'modern',
    pattern_family: 'ONB_HERO_TOP',
    pattern_variant: 1,
    components: [],
  })

  describe('convertGraphToReactFlow', () => {
    it('should convert a linear graph to nodes and edges', () => {
      const graph = createMockGraph()
      const screens: ScreenWithId[] = [
        { id: 'screen-1', dsl: createMockScreenDSL('1') },
        { id: 'screen-2', dsl: createMockScreenDSL('2') },
        { id: 'screen-3', dsl: createMockScreenDSL('3') },
      ]

      const { nodes, edges } = convertGraphToReactFlow(graph, screens)

      expect(nodes).toHaveLength(3)
      expect(edges).toHaveLength(2)

      // Check nodes
      expect(nodes[0].id).toBe('screen-1')
      expect(nodes[0].data.isEntry).toBe(true)
      expect(nodes[1].id).toBe('screen-2')
      expect(nodes[2].id).toBe('screen-3')

      // Check edges
      expect(edges[0].source).toBe('screen-1')
      expect(edges[0].target).toBe('screen-2')
      expect(edges[1].source).toBe('screen-2')
      expect(edges[1].target).toBe('screen-3')
    })

    it('should handle empty graph', () => {
      const graph: FlowNavigationGraph = {
        flowId: 'flow-1',
        screens: new Map(),
        navigationPaths: [],
      }

      const { nodes, edges } = convertGraphToReactFlow(graph, [])

      expect(nodes).toHaveLength(0)
      expect(edges).toHaveLength(0)
    })

    it('should handle graph without entry screen', () => {
      const graph = createMockGraph()
      graph.entryScreenId = undefined

      const { nodes } = convertGraphToReactFlow(graph, [])

      expect(nodes).toHaveLength(3)
      expect(nodes.every(n => !n.data.isEntry)).toBe(true)
    })
  })

  describe('generateNodePosition', () => {
    it('should generate position for new node', () => {
      const graph = createMockGraph()
      const position = generateNodePosition('screen-4', graph, 0)

      expect(position.x).toBeGreaterThan(0)
      expect(position.y).toBeGreaterThan(0)
    })
  })

  describe('hasBranching', () => {
    it('should detect branching in graph', () => {
      const graph = createMockGraph()
      // Add a branch
      graph.navigationPaths.push({ fromScreenId: 'screen-1', toScreenId: 'screen-3' })

      expect(hasBranching(graph)).toBe(true)
    })

    it('should return false for linear graph', () => {
      const graph = createMockGraph()
      expect(hasBranching(graph)).toBe(false)
    })
  })

  describe('getBranchTargets', () => {
    it('should return all branch targets for a screen', () => {
      const graph = createMockGraph()
      graph.navigationPaths.push({ fromScreenId: 'screen-1', toScreenId: 'screen-3' })

      const targets = getBranchTargets(graph, 'screen-1')

      expect(targets).toHaveLength(2)
      expect(targets).toContain('screen-2')
      expect(targets).toContain('screen-3')
    })

    it('should return empty array for screen with no branches', () => {
      const graph = createMockGraph()
      const targets = getBranchTargets(graph, 'screen-3')

      expect(targets).toHaveLength(0)
    })
  })
})

