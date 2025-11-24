'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/navigation/AppHeader'
import { InteractiveScreen } from '@/components/flow/InteractiveScreen'
import { NavigationDiagram } from '@/components/flow/NavigationDiagram'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, LayoutGrid, List, Settings, Loader2 } from 'lucide-react'
import type { ScreenDSL } from '@/lib/dsl/types'
import type { FlowMetadata, FlowNavigationGraph, NextScreenTriggerContext } from '@/lib/flows/types'
import type { ScreenWithId } from '@/lib/flows/diagram-utils'
import { generateNextScreen } from '@/lib/flows/next-screen-generator'
import type { ScreenOption } from '@/components/flow/ScreenPickerModal'
import { cn } from '@/lib/utils'

export default function FlowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const flowId = params?.flowId as string

  const [flow, setFlow] = useState<FlowMetadata | null>(null)
  const [screens, setScreens] = useState<ScreenDSL[]>([])
  const [screensWithIds, setScreensWithIds] = useState<ScreenWithId[]>([])
  const [graph, setGraph] = useState<FlowNavigationGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0)
  const [activeScreenId, setActiveScreenId] = useState<string | undefined>(undefined)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('screens')
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generationProgress, setGenerationProgress] = useState<string | null>(null)

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Load flow and screens
  useEffect(() => {
    if (!flowId) return

    const fetchFlow = async () => {
      setLoading(true)
      setError(null)
      
      // Check for error in URL params
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get('error')
      if (errorParam) {
        setError(decodeURIComponent(errorParam))
        // Clear the error param from URL
        window.history.replaceState({}, '', window.location.pathname)
      }

      try {
        // Fetch flow metadata
        const flowResponse = await fetch(`/api/flows/${flowId}?includeScreens=true`)
        if (!flowResponse.ok) {
          throw new Error('Flow not found')
        }
        const flowData = await flowResponse.json()
        const flowMetadata = flowData.flow || flowData
        setFlow(flowMetadata)
        setSettingsForm({
          name: flowMetadata.name,
          description: flowMetadata.description || '',
        })

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
                  prompt: screen.heroImage?.prompt || '',
                } : undefined,
                palette: screen.palette ? JSON.parse(screen.palette) : undefined,
                vibe: screen.vibe as any,
                pattern_family: screen.patternFamily as any,
                pattern_variant: (screen.patternVariant || 1) as any,
                components: screen.components ? JSON.parse(screen.components) : [],
                navigation: screen.navigation ? JSON.parse(screen.navigation) : undefined,
                animations: screen.animations ? JSON.parse(screen.animations) : undefined,
                metadata: screen.metadata ? JSON.parse(screen.metadata) : undefined,
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
      } catch (err) {
        console.error('Error fetching flow:', err)
        setError(err instanceof Error ? err.message : 'Failed to load flow')
      } finally {
        setLoading(false)
      }
    }

    fetchFlow()
  }, [flowId])

  // Available screens for linking
  const availableScreens: ScreenOption[] = useMemo(() => {
    return screensWithIds.map((screen, index) => {
      const title = screen.dsl.components.find((c: any) => c.type === 'title')?.content || `Screen ${index + 1}`
      return {
        id: screen.id,
        name: title,
        description: `Pattern: ${screen.dsl.pattern_family}`,
      }
    })
  }, [screensWithIds])

  // Handle first screen generation
  const handleGenerateFirstScreen = useCallback(async () => {
    if (!flowId || !generationPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationProgress('Analyzing your prompt...')
    setError(null)

    try {
      const response = await fetch(`/api/flows/${flowId}/generate-first-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generationPrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate screen')
      }

      setGenerationProgress('Selecting layout pattern...')
      const result = await response.json()

      setGenerationProgress('Generating images...')
      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 500))

      setGenerationProgress('Assembling screen...')
      // Refresh screens and navigation
      const screensResponse = await fetch(`/api/flows/${flowId}/screens`)
      if (screensResponse.ok) {
        const screensData = await screensResponse.json()
        
        const screenDSLs: ScreenDSL[] = screensData.map((screen: any) => {
          try {
            return {
              hero_image: screen.heroImage ? {
                id: screen.heroImageId || '',
                url: screen.heroImage?.url || '',
                prompt: screen.heroImage?.prompt || '',
              } : undefined,
              palette: screen.palette ? JSON.parse(screen.palette) : undefined,
              vibe: screen.vibe as any,
              pattern_family: screen.patternFamily as any,
              pattern_variant: (screen.patternVariant || 1) as any,
              components: screen.components ? JSON.parse(screen.components) : [],
              navigation: screen.navigation ? JSON.parse(screen.navigation) : undefined,
              animations: screen.animations ? JSON.parse(screen.animations) : undefined,
              metadata: screen.metadata ? JSON.parse(screen.metadata) : undefined,
            } as ScreenDSL
          } catch (err) {
            console.error('Error parsing screen:', err)
            return null
          }
        }).filter(Boolean) as ScreenDSL[]

        const screensWithIdsData: ScreenWithId[] = screensData
          .filter((screen: any, idx: number) => screenDSLs[idx] !== null)
          .map((screen: any, idx: number) => ({
            id: screen.id,
            dsl: screenDSLs[idx],
          }))

        setScreens(screenDSLs)
        setScreensWithIds(screensWithIdsData)
        
        if (screensWithIdsData.length > 0) {
          setSelectedScreenIndex(0)
          setActiveScreenId(screensWithIdsData[0]?.id)
        }
      }

      // Refresh navigation graph
      const navResponse = await fetch(`/api/flows/${flowId}/navigation`)
      if (navResponse.ok) {
        const navData = await navResponse.json()
        const screensMap = new Map(
          (navData.screens || []).map((s: any) => [s.id, { ...s, screenId: s.id }])
        )

        setGraph({
          flowId: navData.flowId,
          entryScreenId: navData.entryScreenId,
          screens: screensMap,
          navigationPaths: navData.navigationPaths || [],
        })
      }

      setGenerationPrompt('')
      setGenerationProgress(null)
    } catch (error) {
      console.error('Failed to generate first screen:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate screen')
      setGenerationProgress(null)
    } finally {
      setIsGenerating(false)
    }
  }, [flowId, generationPrompt, isGenerating])

  // Handle screen generation
  const handleGenerateNext = useCallback(async (context: NextScreenTriggerContext) => {
    if (!flowId || isGenerating) return
    
    setIsGenerating(true)
    try {
      // Generate next screen using the generator
      const sourceScreenId = context.sourceScreenId || screensWithIds[selectedScreenIndex]?.id
      if (!sourceScreenId) {
        throw new Error('Source screen ID is required')
      }

      const result = await generateNextScreen(
        {
          ...context,
          sourceScreenId,
        },
        {
          flowId,
          onProgress: (stage, progress) => {
            console.log(`Generation: ${stage} (${progress}%)`)
          },
        }
      )

      // The generator should have saved the screen via insertScreen
      // Refresh screens and navigation
      const screensResponse = await fetch(`/api/flows/${flowId}/screens`)
      if (screensResponse.ok) {
        const screensData = await screensResponse.json()
        
        const screenDSLs: ScreenDSL[] = screensData.map((screen: any) => {
          try {
            return {
              hero_image: screen.heroImage ? {
                id: screen.heroImageId || '',
                url: screen.heroImage?.url || '',
                prompt: screen.heroImage?.prompt || '',
              } : undefined,
              palette: screen.palette ? JSON.parse(screen.palette) : undefined,
              vibe: screen.vibe as any,
              pattern_family: screen.patternFamily as any,
              pattern_variant: (screen.patternVariant || 1) as any,
              components: screen.components ? JSON.parse(screen.components) : [],
              navigation: screen.navigation ? JSON.parse(screen.navigation) : undefined,
              animations: screen.animations ? JSON.parse(screen.animations) : undefined,
              metadata: screen.metadata ? JSON.parse(screen.metadata) : undefined,
            } as ScreenDSL
          } catch (err) {
            console.error('Error parsing screen:', err)
            return null
          }
        }).filter(Boolean) as ScreenDSL[]

        const screensWithIdsData: ScreenWithId[] = screensData
          .filter((screen: any, idx: number) => screenDSLs[idx] !== null)
          .map((screen: any, idx: number) => ({
            id: screen.id,
            dsl: screenDSLs[idx],
          }))

        setScreens(screenDSLs)
        setScreensWithIds(screensWithIdsData)
        
        // Select the newly created screen
        const newIndex = screensWithIdsData.length - 1
        setSelectedScreenIndex(newIndex)
        setActiveScreenId(screensWithIdsData[newIndex]?.id)
      }

      // Refresh navigation graph
      const navResponse = await fetch(`/api/flows/${flowId}/navigation`)
      if (navResponse.ok) {
        const navData = await navResponse.json()
        const screensMap = new Map(
          (navData.screens || []).map((s: any) => [s.id, { ...s, screenId: s.id }])
        )

        setGraph({
          flowId: navData.flowId,
          entryScreenId: navData.entryScreenId,
          screens: screensMap,
          navigationPaths: navData.navigationPaths || [],
        })
      }
    } catch (error) {
      console.error('Failed to generate next screen:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate screen')
    } finally {
      setIsGenerating(false)
    }
  }, [flowId, isGenerating, screensWithIds, selectedScreenIndex])

  // Handle linking to existing screen
  const handleLinkExisting = useCallback(async (context: NextScreenTriggerContext) => {
    if (!flowId || !context.targetScreenId) return

    try {
      // Update the source screen's navigation to point to target
      const sourceScreen = screensWithIds.find((s) => s.id === context.sourceScreenId)
      if (!sourceScreen) return

      const updatedNavigation = {
        type: 'internal' as const,
        target: context.targetScreenId,
        screenId: context.targetScreenId,
      }

      const sourceScreenIndex = screens.findIndex((s) => {
        const sourceDSL = screensWithIds.find((sw) => sw.id === context.sourceScreenId)?.dsl
        return sourceDSL === s
      })

      if (sourceScreenIndex < 0) return

      // Update screen via API
      const screenId = context.sourceScreenId || screensWithIds[sourceScreenIndex]?.id
      const response = await fetch(`/api/flows/${flowId}/screens/${screenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dsl: {
            navigation: updatedNavigation,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update navigation')
      }

      // Refresh navigation graph
      const navResponse = await fetch(`/api/flows/${flowId}/navigation`)
      if (navResponse.ok) {
        const navData = await navResponse.json()
        const screensMap = new Map(
          (navData.screens || []).map((s: any) => [s.id, { ...s, screenId: s.id }])
        )

        setGraph({
          flowId: navData.flowId,
          entryScreenId: navData.entryScreenId,
          screens: screensMap,
          navigationPaths: navData.navigationPaths || [],
        })
      }
    } catch (error) {
      console.error('Failed to link existing screen:', error)
      setError(error instanceof Error ? error.message : 'Failed to link screen')
    }
  }, [flowId, screens, screensWithIds])

  // Handle settings save
  const handleSaveSettings = useCallback(async () => {
    if (!flowId || savingSettings) return

    setSavingSettings(true)
    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settingsForm.name,
          description: settingsForm.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update flow')
      }

      const updatedFlow = await response.json()
      setFlow(updatedFlow.flow || updatedFlow)
      
      // Show success (could use toast here)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }, [flowId, settingsForm, savingSettings])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !flow) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
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
        </main>
      </div>
    )
  }

  const selectedScreen = screens[selectedScreenIndex]
  const selectedScreenWithId = screensWithIds[selectedScreenIndex]

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
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
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="screens">
              <List className="mr-2 h-4 w-4" />
              Screens
            </TabsTrigger>
            <TabsTrigger value="diagram">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Navigation Diagram
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Screens Tab */}
          <TabsContent value="screens" className="space-y-6">
            {screens.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create Your First Screen</CardTitle>
                  <CardDescription>
                    Describe what you're building and FlowRunner will generate a screen with AI images and layout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="generation-prompt">What are you building?</Label>
                    <Textarea
                      id="generation-prompt"
                      placeholder="e.g., A landing page for a SaaS product that helps teams collaborate, with a hero section showcasing the main value proposition..."
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      rows={4}
                      disabled={isGenerating}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      FlowRunner will analyze your prompt, select an appropriate layout pattern, generate AI images based on that layout, and create your first screen.
                    </p>
                  </div>
                  
                  {generationProgress && (
                    <Alert>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <AlertDescription>{generationProgress}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleGenerateFirstScreen}
                      disabled={!generationPrompt.trim() || isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate First Screen'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Screen Display */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Screen {selectedScreenIndex + 1} of {screens.length}
                    </CardTitle>
                    {selectedScreen && selectedScreen.vibe && (
                      <CardDescription>Vibe: {selectedScreen.vibe}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden bg-background">
                      {selectedScreen && selectedScreenWithId && (
                        <InteractiveScreen
                          screen={selectedScreen}
                          screenId={selectedScreenWithId.id}
                          screenIndex={selectedScreenIndex}
                          availableScreens={availableScreens}
                          onGenerateNext={handleGenerateNext}
                          onLinkExisting={handleLinkExisting}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Screen Navigation */}
                {screens.length > 1 && (
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
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
                    </CardContent>
                  </Card>
                )}

                {isGenerating && (
                  <Alert>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <AlertDescription>Generating next screen...</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>

          {/* Diagram Tab */}
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
                      const index = screensWithIds.findIndex((s) => s.id === screenId)
                      if (index >= 0) {
                        setSelectedScreenIndex(index)
                        setActiveScreenId(screenId)
                        setActiveTab('screens')
                      }
                    }}
                    editable={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flow Settings</CardTitle>
                <CardDescription>Update flow name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="flow-name">Flow Name</Label>
                  <Input
                    id="flow-name"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={savingSettings}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flow-description">Description</Label>
                  <Textarea
                    id="flow-description"
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    disabled={savingSettings}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={savingSettings || !settingsForm.name.trim()}
                  >
                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

