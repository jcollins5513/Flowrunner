// Pattern Family Selector Component
// Allows switching between different pattern families

'use client'

import React, { useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { PatternFamily, PatternVariant, ScreenDSL } from '@/lib/dsl/types'
import { ALL_PATTERN_FAMILIES } from '@/lib/patterns/families'
import { getPatternFamilyMetadata } from '@/lib/patterns/metadata'
import { previewPatternMigration, switchPatternFamily } from '@/lib/editing/pattern-migration'
import { useEditing } from '@/lib/editing/editing-context'
import { useFlow } from '@/lib/flows/flow-context'

export interface PatternFamilySelectorProps {
  dsl: ScreenDSL
  screenId: string
  onFamilyChange?: (newDSL: ScreenDSL) => void
}

export function PatternFamilySelector({
  dsl,
  screenId,
  onFamilyChange,
}: PatternFamilySelectorProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{
    warnings: string[]
    lostComponents: string[]
  } | null>(null)
  const { updateScreen } = useFlow()
  const { addHistory } = useEditing()

  const handleFamilyChange = useCallback(
    async (newFamily: PatternFamily) => {
      if (newFamily === dsl.pattern_family) return

      // Show preview of migration (default to variant 1)
      const previewResult = previewPatternMigration(dsl, newFamily, 1)
      setPreview({
        warnings: previewResult.warnings,
        lostComponents: previewResult.lostComponents,
      })

      // If there are lost components, ask for confirmation
      if (previewResult.lostComponents.length > 0) {
        const confirmed = window.confirm(
          `Switching to "${getPatternFamilyMetadata(newFamily).displayName}" will remove ${previewResult.lostComponents.length} component(s): ${previewResult.lostComponents.join(', ')}. Continue?`
        )
        if (!confirmed) {
          setPreview(null)
          return
        }
      }

      setLoading(true)
      try {
        // Perform migration (default to variant 1)
        const migrationResult = switchPatternFamily(dsl, newFamily, 1)

        // Add to history
        addHistory({
          screenId,
          type: 'pattern_family_change',
          before: dsl,
          after: migrationResult.dsl,
        })

        // Update screen via FlowProvider
        await updateScreen(screenId, {
          pattern_family: migrationResult.dsl.pattern_family,
          pattern_variant: migrationResult.dsl.pattern_variant,
          components: migrationResult.dsl.components,
        })

        // Call callback if provided
        if (onFamilyChange) {
          onFamilyChange(migrationResult.dsl)
        }

        setPreview(null)
      } catch (error) {
        console.error('Failed to switch pattern family:', error)
        alert(`Failed to switch pattern family: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    },
    [dsl, screenId, updateScreen, addHistory, onFamilyChange]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Pattern:</label>
        <Select
          value={dsl.pattern_family}
          onValueChange={(value) => handleFamilyChange(value as PatternFamily)}
          disabled={loading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_PATTERN_FAMILIES.map((family) => {
              const metadata = getPatternFamilyMetadata(family)
              return (
                <SelectItem key={family} value={family}>
                  {metadata.displayName}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {loading && <span className="text-xs text-muted-foreground">Updating...</span>}
      </div>

      {preview && (preview.warnings.length > 0 || preview.lostComponents.length > 0) && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {preview.lostComponents.length > 0 && (
              <div className="mb-1">
                <strong>Lost components:</strong> {preview.lostComponents.join(', ')}
              </div>
            )}
            {preview.warnings.length > 0 && (
              <div>
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside mt-1">
                  {preview.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
