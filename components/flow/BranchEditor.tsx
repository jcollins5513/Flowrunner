// Branch Editor Component
// UI for managing branches, conditions, and labels

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Edit2, GitBranch } from 'lucide-react'
import type { BranchMetadata } from '@/lib/flows/branching'

export interface BranchEditorProps {
  flowId: string
  screenId: string
  branches: BranchMetadata[]
  availableScreens: Array<{ id: string; name: string }>
  onBranchChange?: () => void
  onClose?: () => void
}

export function BranchEditor({
  flowId,
  screenId,
  branches: initialBranches,
  availableScreens,
  onBranchChange,
  onClose,
}: BranchEditorProps) {
  const [branches, setBranches] = useState<BranchMetadata[]>(initialBranches)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingBranch, setEditingBranch] = useState<BranchMetadata | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Form state
  const [formToScreenId, setFormToScreenId] = useState<string>('')
  const [formLabel, setFormLabel] = useState<string>('')
  const [formCondition, setFormCondition] = useState<string>('')
  const [formTrigger, setFormTrigger] = useState<string>('button-click')

  useEffect(() => {
    setBranches(initialBranches)
  }, [initialBranches])

  const refreshBranches = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/flows/${flowId}/branches?screenId=${screenId}&direction=from`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }
      const data = await response.json()
      setBranches(data.branches || [])
      if (onBranchChange) {
        onBranchChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [flowId, screenId, onBranchChange])

  const handleAddBranch = useCallback(async () => {
    if (!formToScreenId) {
      setError('Target screen is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/flows/${flowId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromScreenId: screenId,
          toScreenId: formToScreenId,
          label: formLabel || undefined,
          condition: formCondition || undefined,
          trigger: formTrigger || 'button-click',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create branch')
      }

      await refreshBranches()
      setShowAddDialog(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch')
    } finally {
      setLoading(false)
    }
  }, [flowId, screenId, formToScreenId, formLabel, formCondition, formTrigger, refreshBranches])

  const handleUpdateBranch = useCallback(async () => {
    if (!editingBranch) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/flows/${flowId}/branches`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromScreenId: screenId,
          toScreenId: editingBranch.toScreenId,
          label: formLabel || undefined,
          condition: formCondition || undefined,
          trigger: formTrigger || 'button-click',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update branch')
      }

      await refreshBranches()
      setShowEditDialog(false)
      setEditingBranch(null)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch')
    } finally {
      setLoading(false)
    }
  }, [flowId, screenId, editingBranch, formLabel, formCondition, formTrigger, refreshBranches])

  const handleDeleteBranch = useCallback(
    async (branch: BranchMetadata) => {
      if (!confirm(`Delete branch to "${branch.label || 'Screen'}"?`)) {
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/flows/${flowId}/branches?fromScreenId=${screenId}&toScreenId=${branch.toScreenId}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete branch')
        }

        await refreshBranches()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete branch')
      } finally {
        setLoading(false)
      }
    },
    [flowId, screenId, refreshBranches]
  )

  const handleEditBranch = useCallback((branch: BranchMetadata) => {
    setEditingBranch(branch)
    setFormToScreenId(branch.toScreenId)
    setFormLabel(branch.label || '')
    setFormCondition(branch.condition || '')
    setFormTrigger(branch.trigger || 'button-click')
    setShowEditDialog(true)
  }, [])

  const resetForm = useCallback(() => {
    setFormToScreenId('')
    setFormLabel('')
    setFormCondition('')
    setFormTrigger('button-click')
  }, [])

  const handleOpenAddDialog = useCallback(() => {
    resetForm()
    setShowAddDialog(true)
  }, [resetForm])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Branches</h3>
          {branches.length > 0 && (
            <span className="text-xs text-muted-foreground">({branches.length})</span>
          )}
        </div>
        <Button onClick={handleOpenAddDialog} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Branch
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {loading && !branches.length ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No branches yet. Add a branch to create conditional navigation.
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((branch, index) => {
            const targetScreen = availableScreens.find((s) => s.id === branch.toScreenId)
            return (
              <div
                key={`${branch.toScreenId}-${index}`}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {branch.label || targetScreen?.name || `Branch ${index + 1}`}
                    </span>
                    {branch.condition && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Condition: {branch.condition}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    → {targetScreen?.name || branch.toScreenId}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEditBranch(branch)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteBranch(branch)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Branch Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription>
              Create a new navigation branch from this screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-target-screen">Target Screen</Label>
              <Select value={formToScreenId} onValueChange={setFormToScreenId}>
                <SelectTrigger id="add-target-screen">
                  <SelectValue placeholder="Select target screen" />
                </SelectTrigger>
                <SelectContent>
                  {availableScreens
                    .filter((screen) => screen.id !== screenId)
                    .map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-label">Label (optional)</Label>
              <Input
                id="add-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g., Premium Users, Free Users"
              />
              <p className="text-xs text-muted-foreground">
                Human-readable label for this branch
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-condition">Condition (optional)</Label>
              <Textarea
                id="add-condition"
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
                placeholder="e.g., user.isPremium === true"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                JavaScript condition expression for conditional navigation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-trigger">Trigger</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger id="add-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="button-click">Button Click</SelectItem>
                  <SelectItem value="form-submit">Form Submit</SelectItem>
                  <SelectItem value="auto-advance">Auto Advance</SelectItem>
                  <SelectItem value="user-action">User Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBranch} disabled={loading || !formToScreenId}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch configuration, condition, and label.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Screen</Label>
              <div className="text-sm text-muted-foreground">
                {availableScreens.find((s) => s.id === editingBranch?.toScreenId)?.name ||
                  editingBranch?.toScreenId}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g., Premium Users, Free Users"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-condition">Condition</Label>
              <Textarea
                id="edit-condition"
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value)}
                placeholder="e.g., user.isPremium === true"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-trigger">Trigger</Label>
              <Select value={formTrigger} onValueChange={setFormTrigger}>
                <SelectTrigger id="edit-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="button-click">Button Click</SelectItem>
                  <SelectItem value="form-submit">Form Submit</SelectItem>
                  <SelectItem value="auto-advance">Auto Advance</SelectItem>
                  <SelectItem value="user-action">User Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBranch} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

