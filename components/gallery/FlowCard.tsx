'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FlowMetadata, FlowStats } from '@/lib/flows/types'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

interface FlowCardProps {
  flow: FlowMetadata
  stats?: FlowStats
  thumbnailUrl?: string
}

export function FlowCard({ flow, stats, thumbnailUrl }: FlowCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <Link href={`/gallery/${flow.id}`} className="block flex-1">
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-muted rounded-t-lg overflow-hidden">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={flow.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <div className="text-sm">No preview</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-1">{flow.name}</CardTitle>
          {flow.description && (
            <CardDescription className="line-clamp-2">
              {flow.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          <div className="flex flex-wrap gap-2">
            {flow.domain && (
              <Badge variant="secondary">{flow.domain}</Badge>
            )}
            {flow.style && (
              <Badge variant="outline">{flow.style}</Badge>
            )}
            {flow.theme && (
              <Badge variant="outline">{flow.theme}</Badge>
            )}
          </div>
        </CardContent>
      </Link>

      <CardFooter className="text-sm text-muted-foreground pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          {stats && (
            <span>{stats.screenCount} screen{stats.screenCount !== 1 ? 's' : ''}</span>
          )}
          <span>{formatDate(new Date(flow.updatedAt))}</span>
        </div>
        <Link href={`/flows/${flow.id}/edit`} onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Edit flow"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

