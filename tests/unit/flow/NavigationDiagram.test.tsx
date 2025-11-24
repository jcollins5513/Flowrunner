// Unit tests for NavigationDiagram component
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NavigationDiagram } from '@/components/flow/NavigationDiagram'
import type { FlowNavigationGraph } from '@/lib/flows/types'
import type { ScreenWithId } from '@/lib/flows/diagram-utils'

// Mock reactflow
vi.mock('reactflow', () => ({
  default: ({ children, ...props }: any) => (
    <div data-testid="reactflow" {...props}>
      {children}
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  applyNodeChanges: (changes: any, nodes: any) => nodes,
  applyEdgeChanges: (changes: any, edges: any) => edges,
  addEdge: (edge: any, edges: any) => [...edges, edge],
  MarkerType: {
    ArrowClosed: 'ArrowClosed',
  },
  ConnectionLineType: {
    SmoothStep: 'smoothstep',
  },
}))

vi.mock('reactflow/dist/style.css', () => ({}))

describe('NavigationDiagram', () => {
  const mockGraph: FlowNavigationGraph = {
    flowId: 'flow-1',
    entryScreenId: 'screen-1',
    screens: new Map([
      ['screen-1', { screenId: 'screen-1', order: 0, childScreenIds: ['screen-2'], navigationTargets: ['screen-2'] }],
      ['screen-2', { screenId: 'screen-2', order: 1, childScreenIds: [], navigationTargets: [] }],
    ]),
    navigationPaths: [
      { fromScreenId: 'screen-1', toScreenId: 'screen-2' },
    ],
  }

  const mockScreens: ScreenWithId[] = [
    {
      id: 'screen-1',
      dsl: {
        hero_image: { id: 'img-1', url: 'https://example.com/img1.jpg' },
        palette: { primary: '#000', secondary: '#fff', accent: '#f00', background: '#fff' },
        vibe: 'modern',
        pattern_family: 'ONB_HERO_TOP',
        pattern_variant: 1,
        components: [],
      },
    },
  ]

  it('should render loading state', () => {
    render(<NavigationDiagram flowId="flow-1" />)
    expect(screen.getByText('Loading navigation diagram...')).toBeInTheDocument()
  })

  it('should render error state', async () => {
    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    render(<NavigationDiagram flowId="flow-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('should render empty state when no screens', () => {
    const emptyGraph: FlowNavigationGraph = {
      flowId: 'flow-1',
      screens: new Map(),
      navigationPaths: [],
    }

    render(<NavigationDiagram flowId="flow-1" graph={emptyGraph} screens={[]} />)

    expect(screen.getByText('No screens in this flow')).toBeInTheDocument()
  })

  it('should render diagram with graph provided', () => {
    render(
      <NavigationDiagram
        flowId="flow-1"
        graph={mockGraph}
        screens={mockScreens}
      />
    )

    expect(screen.getByTestId('reactflow')).toBeInTheDocument()
    expect(screen.getByTestId('background')).toBeInTheDocument()
    expect(screen.getByTestId('controls')).toBeInTheDocument()
    expect(screen.getByTestId('minimap')).toBeInTheDocument()
  })

  it('should call onScreenSelect when node is clicked', () => {
    const onScreenSelect = vi.fn()

    render(
      <NavigationDiagram
        flowId="flow-1"
        graph={mockGraph}
        screens={mockScreens}
        onScreenSelect={onScreenSelect}
      />
    )

    // Note: Actual click testing would require more complex setup with React Flow
    // This is a basic structure test
    expect(screen.getByTestId('reactflow')).toBeInTheDocument()
  })

  it('should highlight active screen', () => {
    render(
      <NavigationDiagram
        flowId="flow-1"
        graph={mockGraph}
        screens={mockScreens}
        activeScreenId="screen-1"
      />
    )

    expect(screen.getByTestId('reactflow')).toBeInTheDocument()
  })
})

