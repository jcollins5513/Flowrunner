// Screen Picker Modal Component
// Modal for selecting an existing screen to link to

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
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FileText } from 'lucide-react'

export interface ScreenOption {
  id: string
  name?: string
  description?: string
}

export interface ScreenPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  screens: ScreenOption[]
  sourceScreenId?: string
  onSelect: (screenId: string) => void
}

export function ScreenPickerModal({
  open,
  onOpenChange,
  screens,
  sourceScreenId,
  onSelect,
}: ScreenPickerModalProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<string>('')

  const availableScreens = screens.filter((screen) => screen.id !== sourceScreenId)

  const handleSelect = useCallback(() => {
    if (selectedScreenId) {
      onSelect(selectedScreenId)
      onOpenChange(false)
      setSelectedScreenId('')
    }
  }, [selectedScreenId, onSelect, onOpenChange])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
    setSelectedScreenId('')
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link to Existing Screen</DialogTitle>
          <DialogDescription>
            Select a screen to link this navigation action to. The selected screen will be the destination when this component is clicked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableScreens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-muted-foreground">No other screens available</p>
              <p className="text-xs text-muted-foreground mt-2">
                Create more screens in this flow to link to them.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Target Screen</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
                {availableScreens.map((screen) => (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setSelectedScreenId(screen.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      'hover:bg-accent hover:border-accent-foreground/20',
                      selectedScreenId === screen.id
                        ? 'bg-accent border-accent-foreground/20 ring-2 ring-ring'
                        : 'border-border',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {screen.name || `Screen ${screen.id.slice(0, 8)}`}
                        </p>
                        {screen.description && (
                          <p className="text-xs text-muted-foreground mt-1">{screen.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {screen.id}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedScreenId || availableScreens.length === 0}>
            Link Screen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

