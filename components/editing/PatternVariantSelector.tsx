// Pattern Variant Selector Component
// Allows switching between variants (1-5) of the same pattern family

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PatternVariant, ScreenDSL } from '@/lib/dsl/types'
import { previewPatternMigration, switchPatternVariant } from '@/lib/editing/pattern-migration'
import { useEditing } from '@/lib/editing/editing-context'
import { useFlow } from '@/lib/flows/flow-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export interface PatternVariantSelectorProps {
  dsl: ScreenDSL
  screenId: string
  onVariantChange?: (newDSL: ScreenDSL) => void
}

export function PatternVariantSelector({
  dsl,
  screenId,
  onVariantChange,
}: PatternVariantSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<{
    warnings: string[]
    lostComponents: string[]
  } | null>(null)
  const { updateScreen } = useFlow()
  const { addHistory } = useEditing()

  const handleVariantChange = useCallback(
    async (newVariant: PatternVariant) => {
      if (newVariant === dsl.pattern_variant) return

      // Show preview of migration
      const previewResult = previewPatternMigration(dsl, dsl.pattern_family, newVariant)
      setPreview({
        warnings: previewResult.warnings,
        lostComponents: previewResult.lostComponents,
      })

      // If there are lost components, ask for confirmation
      if (previewResult.lostComponents.length > 0) {
        const confirmed = window.confirm(
          `Switching to variant ${newVariant} will remove ${previewResult.lostComponents.length} component(s): ${previewResult.lostComponents.join(', ')}. Continue?`
        )
        if (!confirmed) {
          setPreview(null)
          return
        }
      }

      setLoading(true)
      try {
        // Perform migration
        const migrationResult = switchPatternVariant(dsl, newVariant)

        // Add to history
        addHistory({
          screenId,
          type: 'pattern_variant_change',
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
        if (onVariantChange) {
          onVariantChange(migrationResult.dsl)
        }

        setPreview(null)
      } catch (error) {
        console.error('Failed to switch pattern variant:', error)
        alert(`Failed to switch pattern variant: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    },
    [dsl, screenId, updateScreen, addHistory, onVariantChange]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Variant:</label>
        <Select
          value={dsl.pattern_variant.toString()}
          onValueChange={(value) => handleVariantChange(parseInt(value) as PatternVariant)}
          disabled={loading}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((variant) => (
              <SelectItem key={variant} value={variant.toString()}>
                Variant {variant}
              </SelectItem>
            ))}
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
