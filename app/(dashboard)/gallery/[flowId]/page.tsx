'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { FlowMetadata, FlowStats } from '@/lib/flows/types'
import { ScreenDSL } from '@/lib/dsl/types'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FlowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params?.flowId as string

  const [flow, setFlow] = useState<FlowMetadata | null>(null)
  const [screens, setScreens] = useState<ScreenDSL[]>([])
  const [stats, setStats] = useState<FlowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0)

  useEffect(() => {
    if (!flowId) return

    const fetchFlow = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch flow metadata
        const flowResponse = await fetch(`/api/flows/${flowId}?includeScreens=true`)
        if (!flowResponse.ok) {
          throw new Error('Flow not found')
        }
        const flowData = await flowResponse.json()
        setFlow(flowData.flow || flowData)

        // Fetch screens
        const screensResponse = await fetch(`/api/flows/${flowId}/screens`)
        if (screensResponse.ok) {
          const screensData = await screensResponse.json()
          // Convert screen data to DSL format
          const screenDSLs: ScreenDSL[] = screensData.map((screen: any) => {
            try {
              return {
                hero_image: screen.heroImage ? {
                  id: screen.heroImageId || '',
                  url: screen.heroImage?.url || '',
                } : undefined,
                palette: screen.palette ? JSON.parse(screen.palette) : undefined,
                vibe: screen.vibe as any,
                pattern_family: screen.patternFamily as any,
                pattern_variant: (screen.patternVariant || 1) as any,
                components: screen.components ? JSON.parse(screen.components) : [],
                navigation: screen.navigation ? JSON.parse(screen.navigation) : undefined,
                animations: screen.animations ? JSON.parse(screen.animations) : undefined,
              } as ScreenDSL
            } catch (err) {
              console.error('Error parsing screen:', err)
              return null
            }
          }).filter(Boolean) as ScreenDSL[]

          setScreens(screenDSLs)
          if (screenDSLs.length > 0) {
            setSelectedScreenIndex(0)
          }
        }

        // Fetch stats
        const statsResponse = await fetch(`/api/flows/${flowId}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching flow:', err)
        setError(err instanceof Error ? err.message : 'Failed to load flow')
      } finally {
        setLoading(false)
      }
    }

    fetchFlow()
  }, [flowId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !flow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Flow not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/gallery">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gallery
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedScreen = screens[selectedScreenIndex]

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="container space-y-4">
        <Link href="/gallery">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gallery
          </Button>
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{flow.name}</h1>
          {flow.description && (
            <p className="text-muted-foreground text-lg">{flow.description}</p>
          )}
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
            {stats && (
              <Badge variant="outline">{stats.screenCount} screen{stats.screenCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Screen Preview */}
      {screens.length > 0 && selectedScreen ? (
        <div className="container space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Screen {selectedScreenIndex + 1} of {screens.length}</CardTitle>
              {selectedScreen.vibe && (
                <CardDescription>Vibe: {selectedScreen.vibe}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-background">
                <ScreenRenderer
                  dsl={selectedScreen}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Screen Navigation */}
          {screens.length > 1 && (
            <div className="container flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedScreenIndex(Math.max(0, selectedScreenIndex - 1))}
                disabled={selectedScreenIndex === 0}
              >
                Previous Screen
              </Button>

              <div className="flex gap-2">
                {screens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedScreenIndex(index)}
                    className={cn(
                      'h-2 w-2 rounded-full transition-colors',
                      index === selectedScreenIndex
                        ? 'bg-primary'
                        : 'bg-muted hover:bg-muted-foreground/50'
                    )}
                    aria-label={`Go to screen ${index + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedScreenIndex(Math.min(screens.length - 1, selectedScreenIndex + 1))}
                disabled={selectedScreenIndex === screens.length - 1}
              >
                Next Screen
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No screens available for this flow.</p>
          </CardContent>
        </Card>
      )}

      {/* Flow Actions */}
      <div className="container flex gap-4">
        <Link href={`/flows/${flowId}`}>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Editor
          </Button>
        </Link>
        <Link href={`/api/flows/${flowId}/clone`}>
          <Button variant="outline">
            Remix Flow
          </Button>
        </Link>
      </div>
    </div>
  )
}

