// Navigation Config Modal Component
// Modal for configuring navigation when clicking on a component in edit mode

'use client'

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { ScreenDSL } from '@/lib/dsl/types'

export interface NavigationConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dsl: ScreenDSL
  screenId: string
  componentIndex: number
  availableScreens?: Array<{ id: string; name: string }>
  onNavigationSet: (targetScreenId: string) => void
}

export function NavigationConfigModal({
  open,
  onOpenChange,
  dsl,
  screenId,
  componentIndex,
  availableScreens = [],
  onNavigationSet,
}: NavigationConfigModalProps) {
  const [targetScreenId, setTargetScreenId] = useState<string>('')
  const component = dsl.components[componentIndex]

  const handleSetNavigation = useCallback(() => {
    if (targetScreenId) {
      onNavigationSet(targetScreenId)
      onOpenChange(false)
      setTargetScreenId('')
    }
  }, [targetScreenId, onNavigationSet, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Navigation Target</DialogTitle>
          <DialogDescription>
            Configure navigation for the &quot;{component?.type}&quot; component. When clicked, this component will navigate to the selected screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Component</Label>
            <div className="text-sm text-muted-foreground">
              {component?.type}: {component?.content?.substring(0, 50)}
              {component?.content && component.content.length > 50 ? '...' : ''}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-screen">Target Screen</Label>
            <Select value={targetScreenId} onValueChange={setTargetScreenId}>
              <SelectTrigger id="target-screen">
                <SelectValue placeholder="Select target screen" />
              </SelectTrigger>
              <SelectContent>
                {availableScreens
                  .filter((screen) => screen.id !== screenId)
                  .map((screen) => (
                    <SelectItem key={screen.id} value={screen.id}>
                      {screen.name || screen.id}
                    </SelectItem>
                  ))}
                {availableScreens.filter((screen) => screen.id !== screenId).length === 0 && (
                  <SelectItem value="" disabled>
                    No other screens available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSetNavigation} disabled={!targetScreenId}>
            Set Navigation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
