// Navigation Editor Component
// Allows setting and managing navigation links for screens

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ExternalLink, Link as LinkIcon } from 'lucide-react'
import type { ScreenDSL, Navigation } from '@/lib/dsl/types'
import {
  setNavigationTarget,
  setExternalNavigation,
  removeNavigation,
  hasNavigation,
  getNavigationTarget,
  getNavigationUrl,
} from '@/lib/editing/navigation-ops'
import { useEditing } from '@/lib/editing/editing-context'
import { useFlow } from '@/lib/flows/flow-context'
import { NavigationConfigModal } from './NavigationConfigModal'

export interface NavigationEditorProps {
  dsl: ScreenDSL
  screenId: string
  availableScreens?: Array<{ id: string; name: string }>
  onNavigationChange?: (navigation: Navigation | null) => void
}

export function NavigationEditor({
  dsl,
  screenId,
  availableScreens = [],
  onNavigationChange,
}: NavigationEditorProps) {
  const [navigationType, setNavigationType] = useState<'internal' | 'external' | 'none'>(
    dsl.navigation?.type || 'none'
  )
  const [targetScreenId, setTargetScreenId] = useState<string>(
    getNavigationTarget(dsl) || ''
  )
  const [externalUrl, setExternalUrl] = useState<string>(
    getNavigationUrl(dsl) || ''
  )
  const [showModal, setShowModal] = useState(false)
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null)
  const { updateScreen } = useFlow()
  const { addHistory } = useEditing()

  // Sync state with DSL changes
  useEffect(() => {
    if (dsl.navigation) {
      setNavigationType(dsl.navigation.type)
      setTargetScreenId(dsl.navigation.screenId || '')
      setExternalUrl(dsl.navigation.url || '')
    } else {
      setNavigationType('none')
      setTargetScreenId('')
      setExternalUrl('')
    }
  }, [dsl.navigation])

  const handleNavigationTypeChange = useCallback(
    async (type: 'internal' | 'external' | 'none') => {
      setNavigationType(type)

      if (type === 'none') {
        // Remove navigation
        const updatedDSL = removeNavigation(dsl)

        // Add to history
        addHistory({
          screenId,
          type: 'navigation_remove',
          before: dsl,
          after: updatedDSL,
        })

        // Update screen via FlowProvider
        await updateScreen(screenId, {
          navigation: undefined,
        })

        if (onNavigationChange) {
          onNavigationChange(null)
        }
      }
    },
    [dsl, screenId, updateScreen, addHistory, onNavigationChange]
  )

  const handleTargetScreenChange = useCallback(
    async (newTargetScreenId: string) => {
      if (!newTargetScreenId) return

      setTargetScreenId(newTargetScreenId)

      const result = setNavigationTarget(dsl, newTargetScreenId)

      // Add to history
      addHistory({
        screenId,
        type: 'navigation_set',
        before: dsl,
        after: result.dsl,
      })

      // Update screen via FlowProvider
      await updateScreen(screenId, {
        navigation: result.navigation,
      })

      // Update flow navigation graph via FlowProvider
      // The FlowProvider will handle updating the navigation graph automatically

      if (onNavigationChange) {
        onNavigationChange(result.navigation)
      }
    },
    [dsl, screenId, updateScreen, addHistory, onNavigationChange]
  )

  const handleExternalUrlChange = useCallback(
    async (url: string) => {
      setExternalUrl(url)

      if (url) {
        const result = setExternalNavigation(dsl, url)

        // Add to history
        addHistory({
          screenId,
          type: 'navigation_set_external',
          before: dsl,
          after: result.dsl,
        })

        // Update screen via FlowProvider
        await updateScreen(screenId, {
          navigation: result.navigation,
        })

        if (onNavigationChange) {
          onNavigationChange(result.navigation)
        }
      }
    },
    [dsl, screenId, updateScreen, addHistory, onNavigationChange]
  )

  const handleComponentClick = useCallback((componentIndex: number) => {
    setSelectedComponentIndex(componentIndex)
    setShowModal(true)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Navigation</h3>
        {hasNavigation(dsl) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigationTypeChange('none')}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <Label className="text-xs text-muted-foreground">Navigation Type</Label>
          <Select
            value={navigationType}
            onValueChange={(value) => handleNavigationTypeChange(value as 'internal' | 'external' | 'none')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Navigation</SelectItem>
              <SelectItem value="internal">
                <LinkIcon className="h-4 w-4 inline mr-2" />
                Internal (to another screen)
              </SelectItem>
              <SelectItem value="external">
                <ExternalLink className="h-4 w-4 inline mr-2" />
                External (URL)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {navigationType === 'internal' && (
          <div>
            <Label className="text-xs text-muted-foreground">Target Screen</Label>
            <Select
              value={targetScreenId}
              onValueChange={handleTargetScreenChange}
            >
              <SelectTrigger className="w-full">
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
              </SelectContent>
            </Select>
          </div>
        )}

        {navigationType === 'external' && (
          <div>
            <Label className="text-xs text-muted-foreground">External URL</Label>
            <Input
              type="url"
              value={externalUrl}
              onChange={(e) => handleExternalUrlChange(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        )}
      </div>

      {showModal && selectedComponentIndex !== null && (
        <NavigationConfigModal
          open={showModal}
          onOpenChange={setShowModal}
          dsl={dsl}
          screenId={screenId}
          componentIndex={selectedComponentIndex}
          availableScreens={availableScreens}
          onNavigationSet={handleTargetScreenChange}
        />
      )}
    </div>
  )
}
