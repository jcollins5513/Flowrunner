// Navigation Diagram Component
// Visualizes flow navigation graph with interactive diagram

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { ScreenNode } from './ScreenNode'
import { BranchEditor } from './BranchEditor'
import {
  convertGraphToReactFlow,
  type DiagramNode,
  type DiagramEdge,
  type ScreenWithId,
  hasBranching,
  getBranchTargets,
} from '@/lib/flows/diagram-utils'
import type { FlowNavigationGraph } from '@/lib/flows/types'
import type { ScreenDSL } from '@/lib/dsl/types'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, GitBranch, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BranchMetadata } from '@/lib/flows/branching'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const nodeTypes = {
  screenNode: ScreenNode,
}

export interface NavigationDiagramProps {
  flowId: string
  graph?: FlowNavigationGraph
  screens?: ScreenWithId[]
  activeScreenId?: string
  onScreenSelect?: (screenId: string) => void
  onNavigationEdit?: (fromScreenId: string, toScreenId?: string) => void
  editable?: boolean
  className?: string
}

export function NavigationDiagram({
  flowId,
  graph: initialGraph,
  screens = [],
  activeScreenId,
  onScreenSelect,
  onNavigationEdit,
  editable = false,
  className,
}: NavigationDiagramProps) {
  const [graph, setGraph] = useState<FlowNavigationGraph | undefined>(initialGraph)
  const [loading, setLoading] = useState(!initialGraph)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes] = useState<DiagramNode[]>([])
  const [edges, setEdges] = useState<DiagramEdge[]>([])
  const [editingEdge, setEditingEdge] = useState<{ from: string; to: string } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [targetScreenId, setTargetScreenId] = useState<string>('')
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [showBranchEditor, setShowBranchEditor] = useState(false)
  const [branches, setBranches] = useState<BranchMetadata[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Fetch navigation graph if not provided
  useEffect(() => {
    if (initialGraph) {
      setGraph(initialGraph)
      setLoading(false)
      return
    }

    const fetchGraph = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/flows/${flowId}/navigation`)
        if (!response.ok) {
          throw new Error('Failed to fetch navigation graph')
        }

        const data = await response.json()
        // Convert array back to Map
        const screensMap = new Map(
          (data.screens || []).map((s: any) => [
            s.id || s.screenId,
            {
              screenId: s.id || s.screenId,
              order: s.order || 0,
              parentScreenId: s.parentScreenId,
              childScreenIds: s.childScreenIds || [],
              navigationTargets: s.navigationTargets || [],
            },
          ])
        )

        const navigationGraph: FlowNavigationGraph = {
          flowId: data.flowId,
          entryScreenId: data.entryScreenId,
          screens: screensMap,
          navigationPaths: data.navigationPaths || [],
        }

        setGraph(navigationGraph)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load navigation graph')
      } finally {
        setLoading(false)
      }
    }

    fetchGraph()
  }, [flowId, initialGraph])

  // Convert graph to React Flow format
  useEffect(() => {
    if (!graph) return

    const { nodes: flowNodes, edges: flowEdges } = convertGraphToReactFlow(graph, screens)

    // Update active screen state
    const updatedNodes = flowNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isActive: node.id === activeScreenId,
      },
    }))

    setNodes(updatedNodes)
    setEdges(flowEdges)
  }, [graph, screens, activeScreenId])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return

      if (onNavigationEdit) {
        onNavigationEdit(connection.source, connection.target)
      }

      // Add edge to diagram
      const newEdge: DiagramEdge = {
        id: `edge-${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#64748b',
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))
    },
    [onNavigationEdit]
  )

  const loadBranchesForScreen = useCallback(async (screenId: string) => {
    setLoadingBranches(true)
    try {
      const response = await fetch(
        `/api/flows/${flowId}/branches?screenId=${screenId}&direction=from`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }
      const data = await response.json()
      setBranches(data.branches || [])
    } catch (err) {
      console.error('Failed to load branches:', err)
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }, [flowId])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onScreenSelect) {
        onScreenSelect(node.id)
      }
      
      // Open branch editor for selected screen in editable mode
      if (editable) {
        setSelectedScreenId(node.id)
        setShowBranchEditor(true)
        loadBranchesForScreen(node.id)
      }
    },
    [onScreenSelect, editable, loadBranchesForScreen]
  )

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (editable) {
        setEditingEdge({ from: edge.source, to: edge.target })
        setShowEditModal(true)
      } else if (onNavigationEdit) {
        onNavigationEdit(edge.source, edge.target)
      }
    },
    [onNavigationEdit, editable]
  )

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setError(null)
    // Trigger re-fetch
    setGraph(undefined)
  }, [])

  const handleAddNavigation = useCallback(async () => {
    if (!editingEdge || !targetScreenId) return

    try {
      const response = await fetch(`/api/flows/${flowId}/navigation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromScreenId: editingEdge.from,
          toScreenId: targetScreenId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add navigation path')
      }

      // Refresh graph
      handleRefresh()
      setShowEditModal(false)
      setEditingEdge(null)
      setTargetScreenId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add navigation')
    }
  }, [editingEdge, targetScreenId, flowId, handleRefresh])

  const handleRemoveNavigation = useCallback(async (fromScreenId: string) => {
    try {
      const response = await fetch(`/api/flows/${flowId}/navigation?fromScreenId=${fromScreenId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove navigation path')
      }

      // Refresh graph
      handleRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove navigation')
    }
  }, [flowId, handleRefresh])

  const availableScreens = useMemo(() => {
    if (!graph) return []
    return Array.from(graph.screens.entries()).map(([id, entry]) => ({
      id,
      name: `Screen ${entry.order + 1}`,
    }))
  }, [graph])

  const handleBranchChange = useCallback(() => {
    // Refresh graph and branches when branches change
    handleRefresh()
    if (selectedScreenId) {
      loadBranchesForScreen(selectedScreenId)
    }
  }, [selectedScreenId, loadBranchesForScreen, handleRefresh])

  const hasBranches = useMemo(() => graph && hasBranching(graph), [graph])

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading navigation diagram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!graph || nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No screens in this flow</p>
          <p className="text-xs mt-1">Add screens to see the navigation diagram</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full min-h-[400px] relative', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={editable ? onConnect : undefined}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        connectionLineType="smoothstep"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.isActive) return '#3b82f6'
            if (node.data?.isEntry) return '#10b981'
            return '#e5e7eb'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Panel position="top-right" className="bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            {hasBranches && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>Branching flow</span>
              </div>
            )}
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="h-6 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Navigation Edit Modal */}
      {editable && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Navigation</DialogTitle>
              <DialogDescription>
                {editingEdge
                  ? `Configure navigation from Screen ${graph?.screens.get(editingEdge.from)?.order || 0} to another screen.`
                  : 'Add a new navigation path.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editingEdge && (
                <div className="space-y-2">
                  <Label>From Screen</Label>
                  <div className="text-sm text-muted-foreground">
                    Screen {graph?.screens.get(editingEdge.from)?.order || 0}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="target-screen">Target Screen</Label>
                <Select value={targetScreenId} onValueChange={setTargetScreenId}>
                  <SelectTrigger id="target-screen">
                    <SelectValue placeholder="Select target screen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableScreens
                      .filter((screen) => !editingEdge || screen.id !== editingEdge.from)
                      .map((screen) => (
                        <SelectItem key={screen.id} value={screen.id}>
                          {screen.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {editingEdge && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleRemoveNavigation(editingEdge.from)
                    setShowEditModal(false)
                    setEditingEdge(null)
                  }}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Navigation
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditModal(false)
                setEditingEdge(null)
                setTargetScreenId('')
              }}>
                Cancel
              </Button>
              <Button onClick={handleAddNavigation} disabled={!targetScreenId}>
                {editingEdge ? 'Update' : 'Add'} Navigation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Branch Editor Sidebar */}
      {editable && showBranchEditor && selectedScreenId && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-white border-l shadow-lg z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
            <h3 className="text-lg font-semibold">Branch Management</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBranchEditor(false)
                setSelectedScreenId(null)
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <div className="mb-4 text-sm text-muted-foreground">
              Screen {graph?.screens.get(selectedScreenId)?.order !== undefined 
                ? (graph.screens.get(selectedScreenId)!.order + 1) 
                : 'Unknown'}
            </div>
            {loadingBranches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <BranchEditor
                flowId={flowId}
                screenId={selectedScreenId}
                branches={branches}
                availableScreens={availableScreens}
                onBranchChange={handleBranchChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

