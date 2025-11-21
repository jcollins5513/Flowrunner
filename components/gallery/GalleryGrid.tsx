'use client'

import React from 'react'
import { FlowCard } from './FlowCard'
import { FlowMetadata, FlowStats } from '@/lib/flows/types'
import { cn } from '@/lib/utils'

interface GalleryGridProps {
  flows: (FlowMetadata & { stats?: FlowStats; thumbnailUrl?: string })[]
  loading?: boolean
  className?: string
}

export function GalleryGrid({ flows, loading = false, className }: GalleryGridProps) {
  if (loading) {
    return (
      <div className={cn('container', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  if (flows.length === 0) {
    return (
      <div className={cn('container', className)}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No flows found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('container', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {flows.map((flow) => (
          <FlowCard
            key={flow.id}
            flow={flow}
            stats={flow.stats}
            thumbnailUrl={flow.thumbnailUrl}
          />
        ))}
      </div>
    </div>
  )
}

