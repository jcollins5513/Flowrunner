// Custom React Flow node for screen visualization
'use client'

import React from 'react'
import Image from 'next/image'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { DiagramNode } from '@/lib/flows/diagram-utils'
import type { ScreenDSL } from '@/lib/dsl/types'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { cn } from '@/lib/utils'
import { Play, GitBranch } from 'lucide-react'

export function ScreenNode({ data, selected }: NodeProps<DiagramNode['data']>) {
  const { screenId, screenDSL, label, isEntry, isActive } = data

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg shadow-md border-2 transition-all',
        selected || isActive
          ? 'border-blue-500 shadow-lg scale-105'
          : 'border-gray-200 hover:border-gray-300',
        isEntry && 'ring-2 ring-green-400 ring-offset-2'
      )}
      style={{ width: 200, height: 150 }}
    >
      {/* Entry indicator */}
      {isEntry && (
        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Play className="h-3 w-3" />
          Start
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          Active
        </div>
      )}

      {/* Screen thumbnail */}
      <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50 relative">
        {screenDSL?.hero_image?.url ? (
          <div className="w-full h-full relative">
            <Image
              src={screenDSL.hero_image.url}
              alt={label || 'Screen thumbnail'}
              fill
              sizes="200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : screenDSL ? (
          <div className="w-full h-full scale-[0.25] origin-top-left pointer-events-none overflow-hidden">
            <ScreenRenderer dsl={screenDSL} skipValidation />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            {label || `Screen ${screenId.slice(0, 8)}`}
          </div>
        )}
      </div>

      {/* Label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg truncate">
        {label || screenId.slice(0, 16)}
      </div>

      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  )
}

