// Palette Editor Component
// Allows manual color selection for palette (primary, secondary, accent, background)

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'
import type { Palette, ScreenDSL } from '@/lib/dsl/types'
import { useEditing } from '@/lib/editing/editing-context'
import { useFlow } from '@/lib/flows/flow-context'

export interface PaletteEditorProps {
  dsl: ScreenDSL
  screenId: string
  onPaletteChange?: (newPalette: Palette) => void
}

export function PaletteEditor({
  dsl,
  screenId,
  onPaletteChange,
}: PaletteEditorProps) {
  const [loading, setLoading] = useState(false)
  const [localPalette, setLocalPalette] = useState<Palette>(dsl.palette)
  const { updateScreen } = useFlow()
  const { addHistory } = useEditing()

  // Sync local palette with DSL changes
  useEffect(() => {
    setLocalPalette(dsl.palette)
  }, [dsl.palette])

  const handleColorChange = useCallback(
    async (colorKey: keyof Palette, value: string) => {
      const updatedPalette: Palette = {
        ...localPalette,
        [colorKey]: value,
      }
      setLocalPalette(updatedPalette)

      // Add to history
      addHistory({
        screenId,
        type: 'palette_change',
        before: dsl,
        after: { ...dsl, palette: updatedPalette },
      })

      // Update screen via FlowProvider
      await updateScreen(screenId, {
        palette: updatedPalette,
      })

      // Call callback if provided
      if (onPaletteChange) {
        onPaletteChange(updatedPalette)
      }
    },
    [localPalette, dsl, screenId, updateScreen, addHistory, onPaletteChange]
  )

  const handleRegenerateFromImage = useCallback(async () => {
    setLoading(true)
    try {
      // Extract palette via API route
      const response = await fetch('/api/images/extract-palette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: dsl.hero_image.url,
          fallback: dsl.palette,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract palette')
      }

      const extractedPalette = await response.json()

      // Ensure all required fields are present
      const completePalette: Palette = {
        primary: extractedPalette.primary,
        secondary: extractedPalette.secondary ?? extractedPalette.primary,
        accent: extractedPalette.accent ?? extractedPalette.primary,
        background: extractedPalette.background ?? '#FFFFFF',
      }
      
      setLocalPalette(completePalette)

      // Add to history
      addHistory({
        screenId,
        type: 'palette_regenerate',
        before: dsl,
        after: { ...dsl, palette: completePalette },
      })

      // Update screen via FlowProvider
      await updateScreen(screenId, {
        palette: completePalette,
      })

      // Call callback if provided
      if (onPaletteChange) {
        onPaletteChange(completePalette)
      }
    } catch (error) {
      console.error('Failed to regenerate palette:', error)
      alert(`Failed to regenerate palette: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [dsl, screenId, updateScreen, addHistory, onPaletteChange])

  const colorFields: Array<{ key: keyof Palette; label: string }> = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Palette</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateFromImage}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Regenerate from Image
        </Button>
      </div>

      <div className="space-y-3">
        {colorFields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Label htmlFor={`palette-${key}`} className="w-24 text-sm">
              {label}
            </Label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                id={`palette-${key}`}
                value={localPalette[key] || '#000000'}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-12 h-10 rounded border border-input cursor-pointer"
              />
              <Input
                type="text"
                value={localPalette[key] || ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                    handleColorChange(key, value)
                  }
                }}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
