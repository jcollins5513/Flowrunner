// Vibe Selector Component
// Allows selection of vibe from available options

'use client'

import React, { useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { Vibe, ScreenDSL } from '@/lib/dsl/types'
import { inferVibe } from '@/lib/images/vibe/infer'
import { useEditing } from '@/lib/editing/editing-context'
import { useFlow } from '@/lib/flows/flow-context'

export interface VibeSelectorProps {
  dsl: ScreenDSL
  screenId: string
  onVibeChange?: (newVibe: Vibe) => void
}

const AVAILABLE_VIBES: Vibe[] = [
  'playful',
  'professional',
  'bold',
  'minimal',
  'modern',
  'retro',
  'elegant',
  'energetic',
  'calm',
  'tech',
  'creative',
  'corporate',
]

const VIBE_DISPLAY_NAMES: Record<Vibe, string> = {
  playful: 'Playful',
  professional: 'Professional',
  bold: 'Bold',
  minimal: 'Minimal',
  modern: 'Modern',
  retro: 'Retro',
  elegant: 'Elegant',
  energetic: 'Energetic',
  calm: 'Calm',
  tech: 'Tech',
  creative: 'Creative',
  corporate: 'Corporate',
}

export function VibeSelector({
  dsl,
  screenId,
  onVibeChange,
}: VibeSelectorProps) {
  const [loading, setLoading] = useState(false)
  const { updateScreen } = useFlow()
  const { addHistory } = useEditing()

  const handleVibeChange = useCallback(
    async (newVibe: Vibe) => {
      if (newVibe === dsl.vibe) return

      // Add to history
      addHistory({
        screenId,
        type: 'vibe_change',
        before: dsl,
        after: { ...dsl, vibe: newVibe },
      })

      // Update screen via FlowProvider
      await updateScreen(screenId, {
        vibe: newVibe,
      })

      // Call callback if provided
      if (onVibeChange) {
        onVibeChange(newVibe)
      }
    },
    [dsl, screenId, updateScreen, addHistory, onVibeChange]
  )

  const handleRegenerateFromImage = useCallback(async () => {
    setLoading(true)
    try {
      const vibeAnalysis = await inferVibe({
        url: dsl.hero_image.url,
        palette: dsl.palette,
        includeReasoning: false,
      })

      const inferredVibe = vibeAnalysis.vibe

      // Add to history
      addHistory({
        screenId,
        type: 'vibe_regenerate',
        before: dsl,
        after: { ...dsl, vibe: inferredVibe },
      })

      // Update screen via FlowProvider
      await updateScreen(screenId, {
        vibe: inferredVibe,
      })

      // Call callback if provided
      if (onVibeChange) {
        onVibeChange(inferredVibe)
      }
    } catch (error) {
      console.error('Failed to regenerate vibe:', error)
      alert(`Failed to regenerate vibe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [dsl, screenId, updateScreen, addHistory, onVibeChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Vibe:</label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerateFromImage}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </Button>
      </div>

      <Select
        value={dsl.vibe}
        onValueChange={(value) => handleVibeChange(value as Vibe)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_VIBES.map((vibe) => (
            <SelectItem key={vibe} value={vibe}>
              {VIBE_DISPLAY_NAMES[vibe]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
