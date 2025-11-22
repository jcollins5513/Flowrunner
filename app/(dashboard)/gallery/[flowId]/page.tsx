'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { NavigationDiagram } from '@/components/flow/NavigationDiagram'
import { FlowMetadata, FlowStats } from '@/lib/flows/types'
import { ScreenDSL } from '@/lib/dsl/types'
import type { FlowNavigationGraph } from '@/lib/flows/types'
import type { ScreenWithId } from '@/lib/flows/diagram-utils'
import { ArrowLeft, ExternalLink, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FlowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params?.flowId as string

  const [flow, setFlow] = useState<FlowMetadata | null>(null)
  const [screens, setScreens] = useState<ScreenDSL[]>([])
  const [screensWithIds, setScreensWithIds] = useState<ScreenWithId[]>([])
  const [graph, setGraph] = useState<FlowNavigationGraph | null>(null)
  const [stats, setStats] = useState<FlowStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0)
  const [activeScreenId, setActiveScreenId] = useState<string | undefined>(undefined)

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

          // Create screens with IDs
          const screensWithIdsData: ScreenWithId[] = screensData
            .filter((screen: any, idx: number) => screenDSLs[idx] !== null)
            .map((screen: any, idx: number) => ({
              id: screen.id,
              dsl: screenDSLs[idx],
            }))

          setScreens(screenDSLs)
          setScreensWithIds(screensWithIdsData)
          if (screenDSLs.length > 0) {
            setSelectedScreenIndex(0)
            setActiveScreenId(screensWithIdsData[0]?.id)
          }
        }

        // Fetch navigation graph
        const navResponse = await fetch(`/api/flows/${flowId}/navigation`)
        if (navResponse.ok) {
          const navData = await navResponse.json()
          // Convert array back to Map
          const screensMap = new Map(
            (navData.screens || []).map((s: any) => [s.id, { ...s, screenId: s.id }])
          )

          const navigationGraph: FlowNavigationGraph = {
            flowId: navData.flowId,
            entryScreenId: navData.entryScreenId,
            screens: screensMap,
            navigationPaths: navData.navigationPaths || [],
          }

          setGraph(navigationGraph)
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

      {/* Content Tabs */}
      {screens.length > 0 ? (
        <Tabs defaultValue="screens" className="container">
          <TabsList>
            <TabsTrigger value="screens">
              <List className="mr-2 h-4 w-4" />
              Screens
            </TabsTrigger>
            <TabsTrigger value="diagram">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Navigation Diagram
            </TabsTrigger>
          </TabsList>

          <TabsContent value="screens" className="space-y-4">
            {selectedScreen && (
              <>
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
                      onClick={() => {
                        const newIndex = Math.max(0, selectedScreenIndex - 1)
                        setSelectedScreenIndex(newIndex)
                        setActiveScreenId(screensWithIds[newIndex]?.id)
                      }}
                      disabled={selectedScreenIndex === 0}
                    >
                      Previous Screen
                    </Button>

                    <div className="flex gap-2">
                      {screens.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedScreenIndex(index)
                            setActiveScreenId(screensWithIds[index]?.id)
                          }}
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
                      onClick={() => {
                        const newIndex = Math.min(screens.length - 1, selectedScreenIndex + 1)
                        setSelectedScreenIndex(newIndex)
                        setActiveScreenId(screensWithIds[newIndex]?.id)
                      }}
                      disabled={selectedScreenIndex === screens.length - 1}
                    >
                      Next Screen
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="diagram" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flow Navigation</CardTitle>
                <CardDescription>
                  Visual representation of screen connections and navigation paths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] w-full">
                  <NavigationDiagram
                    flowId={flowId}
                    graph={graph || undefined}
                    screens={screensWithIds}
                    activeScreenId={activeScreenId}
                    onScreenSelect={(screenId) => {
                      const index = screensWithIds.findIndex(s => s.id === screenId)
                      if (index >= 0) {
                        setSelectedScreenIndex(index)
                        setActiveScreenId(screenId)
                      }
                    }}
                    editable={false}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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

