'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/navigation/AppHeader'
import { InteractiveScreen } from '@/components/flow/InteractiveScreen'
import { NavigationDiagram } from '@/components/flow/NavigationDiagram'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  LayoutGrid,
  List,
  Settings,
  Loader2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react'
import type { Component, HeroImage as HeroImageType, ScreenDSL } from '@/lib/dsl/types'
import type { FlowNavigationGraph, NextScreenTriggerContext } from '@/lib/flows/types'
import type { ScreenWithId } from '@/lib/flows/diagram-utils'
import { generateNextScreen } from '@/lib/flows/next-screen-generator'
import type { ScreenOption } from '@/components/flow/ScreenPickerModal'
import { cn } from '@/lib/utils'
import { FlowProvider, useFlow } from '@/lib/flows/flow-context'
import { EditingProvider, useEditing } from '@/lib/editing/editing-context'
import {
  EditModeToggle,
  ImageReplacer,
  PaletteEditor,
  PatternFamilySelector,
  PatternVariantSelector,
  VibeSelector,
} from '@/components/editing'
import { extractPalette } from '@/lib/images/palette'
import { inferVibe } from '@/lib/images/vibe/infer'

const parseMaybeJson = <T,>(value: unknown, fallback?: T): T | undefined => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch (error) {
      console.warn('Failed to parse JSON field', error)
      return fallback
    }
  }
  return value as T
}

const convertScreenRecordToDSL = (screen: any): ScreenDSL | null => {
  try {
    const palette =
      parseMaybeJson<ScreenDSL['palette']>(screen.palette) ?? {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      }

    const heroImage: ScreenDSL['hero_image'] | undefined = screen.heroImage
      ? {
          id: screen.heroImageId || screen.heroImage.id || 'hero',
          url: screen.heroImage.url || '',
          prompt: screen.heroImage.prompt || undefined,
          seed: screen.heroImage.seed || undefined,
          aspectRatio: screen.heroImage.aspectRatio || undefined,
          style: screen.heroImage.style || undefined,
          extractedPalette: parseMaybeJson(screen.heroImage.extractedPalette),
          vibe: screen.heroImage.vibe || undefined,
        }
      : undefined

    if (!heroImage) {
      console.warn('Screen missing hero image metadata, skipping conversion', screen.id)
      return null
    }

    return {
      hero_image: heroImage,
      palette,
      vibe: (screen.vibe as ScreenDSL['vibe']) ?? 'modern',
      pattern_family: (screen.patternFamily as ScreenDSL['pattern_family']) ?? 'HERO_CENTER_TEXT',
      pattern_variant: (screen.patternVariant as ScreenDSL['pattern_variant']) ?? 1,
      components: parseMaybeJson<ScreenDSL['components']>(screen.components) ?? [],
      navigation: parseMaybeJson(screen.navigation),
      animations: parseMaybeJson(screen.animations),
      metadata: parseMaybeJson(screen.metadata),
    }
  } catch (error) {
    console.error('Error converting screen record to DSL', error)
    return null
  }
}

function FlowEditorPageInner() {
  const params = useParams()
  const flowId = params?.flowId as string

  const {
    currentFlow,
    screens: flowScreens,
    navigationGraph: flowNavigationGraph,
    loadFlow,
    loadScreens: loadFlowScreens,
    loadNavigationGraph,
    updateFlow: updateFlowMetadata,
    updateScreen,
    removeScreen: removeFlowScreen,
    error: flowError,
  } = useFlow()

  const {
    isEditMode,
    setEditMode,
    editingComponentId,
    setEditingComponentId,
    setEditingScreenId,
    addHistory,
  } = useEditing()

  const [initializing, setInitializing] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [pendingSelectScreenId, setPendingSelectScreenId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPrompt, setGenerationPrompt] = useState('')
  const [generationProgress, setGenerationProgress] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('screens')
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [heroUpdateLoading, setHeroUpdateLoading] = useState(false)

  const combinedError = pageError || flowError || null

  useEffect(() => {
    if (!flowId) return

    let cancelled = false
    const initialize = async () => {
      setPageError(null)
      setInitializing(true)
      await Promise.all([loadFlow(flowId), loadFlowScreens(flowId), loadNavigationGraph(flowId)])
      if (!cancelled) {
        setInitializing(false)
      }
    }
    initialize()

    return () => {
      cancelled = true
    }
  }, [flowId, loadFlow, loadFlowScreens, loadNavigationGraph])

  useEffect(() => {
    if (currentFlow) {
      setSettingsForm({
        name: currentFlow.name,
        description: currentFlow.description || '',
      })
    }
  }, [currentFlow])

  const screensWithIds = useMemo(() => {
    if (!Array.isArray(flowScreens)) return []
    return flowScreens
      .map((screen: any) => {
        const dsl = convertScreenRecordToDSL(screen)
        if (!dsl) return null
        return { id: screen.id, dsl }
      })
      .filter(Boolean) as ScreenWithId[]
  }, [flowScreens])

  useEffect(() => {
    if (screensWithIds.length === 0) {
      setSelectedScreenId(null)
      return
    }

    if (pendingSelectScreenId) {
      const pendingMatch = screensWithIds.find((screen) => screen.id === pendingSelectScreenId)
      if (pendingMatch) {
        setSelectedScreenId(pendingMatch.id)
        setPendingSelectScreenId(null)
        return
      }
    }

    if (!selectedScreenId || !screensWithIds.some((screen) => screen.id === selectedScreenId)) {
      setSelectedScreenId(screensWithIds[0].id)
    }
  }, [screensWithIds, pendingSelectScreenId, selectedScreenId])

  const screens = useMemo(() => screensWithIds.map((entry) => entry.dsl), [screensWithIds])
  const selectedScreenIndex = useMemo(() => {
    if (!selectedScreenId) return 0
    const idx = screensWithIds.findIndex((screen) => screen.id === selectedScreenId)
    return idx >= 0 ? idx : 0
  }, [selectedScreenId, screensWithIds])
  const selectedScreenWithId = screensWithIds[selectedScreenIndex]
  const selectedScreen = selectedScreenWithId?.dsl
  const activeScreenId = selectedScreenWithId?.id ?? screensWithIds[0]?.id

  const normalizedGraph = useMemo(() => {
    if (!flowNavigationGraph) return null
    if (flowNavigationGraph.screens instanceof Map) {
      return flowNavigationGraph
    }
    const legacyScreens = (flowNavigationGraph.screens as unknown as any[]) || []
    const screensMap = new Map(
      legacyScreens.map((screen: any) => [screen.id, { ...screen, screenId: screen.id }])
    )
    return {
      ...flowNavigationGraph,
      screens: screensMap,
    } as FlowNavigationGraph
  }, [flowNavigationGraph])

  const availableScreens: ScreenOption[] = useMemo(() => {
    return screensWithIds.map((screen, index) => {
      const title = screen.dsl.components.find((component) => component.type === 'title')?.content || `Screen ${index + 1}`
      return {
        id: screen.id,
        name: title,
        description: `Pattern: ${screen.dsl.pattern_family}`,
      }
    })
  }, [screensWithIds])

  const refreshScreensAndGraph = useCallback(async () => {
    if (!flowId) return
    await Promise.all([loadFlowScreens(flowId), loadNavigationGraph(flowId)])
  }, [flowId, loadFlowScreens, loadNavigationGraph])

  const handleGenerateFirstScreen = useCallback(async () => {
    if (!flowId || !generationPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationProgress('Analyzing your prompt...')
    setPageError(null)

    try {
      const response = await fetch(`/api/flows/${flowId}/generate-first-screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generationPrompt }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate screen')
      }

      setGenerationProgress('Selecting layout pattern...')
      const result = await response.json()

      setGenerationProgress('Generating images...')
      await new Promise((resolve) => setTimeout(resolve, 500))
      setGenerationProgress('Assembling screen...')

      await refreshScreensAndGraph()
      setPendingSelectScreenId(result.screenId)
      setGenerationPrompt('')
      setGenerationProgress(null)
    } catch (error) {
      console.error('Failed to generate first screen:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to generate screen')
      setGenerationProgress(null)
    } finally {
      setIsGenerating(false)
    }
  }, [flowId, generationPrompt, isGenerating, refreshScreensAndGraph])

  const handleGenerateNext = useCallback(
    async (context: NextScreenTriggerContext) => {
      if (!flowId || isGenerating) return

      setIsGenerating(true)
      try {
        const sourceScreenId = context.sourceScreenId || selectedScreenWithId?.id
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

        await refreshScreensAndGraph()
        setPendingSelectScreenId(result.screenId)
      } catch (error) {
        console.error('Failed to generate next screen:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to generate screen')
      } finally {
        setIsGenerating(false)
      }
    },
    [flowId, isGenerating, refreshScreensAndGraph, selectedScreenWithId?.id]
  )

  const handleLinkExisting = useCallback(
    async (context: NextScreenTriggerContext) => {
      if (!flowId || !context.targetScreenId) return

      try {
        const sourceScreenId = context.sourceScreenId || selectedScreenWithId?.id
        if (!sourceScreenId) return

        const updatedNavigation = {
          type: 'internal' as const,
          target: context.targetScreenId,
          screenId: context.targetScreenId,
        }

        const response = await fetch(`/api/flows/${flowId}/screens/${sourceScreenId}`, {
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

        await refreshScreensAndGraph()
      } catch (error) {
        console.error('Failed to link existing screen:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to link screen')
      }
    },
    [flowId, refreshScreensAndGraph, selectedScreenWithId?.id]
  )

  const handleSaveSettings = useCallback(async () => {
    if (!flowId || savingSettings) return

    setSavingSettings(true)
    try {
      await updateFlowMetadata(flowId, {
        name: settingsForm.name,
        description: settingsForm.description,
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      setPageError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }, [flowId, settingsForm, savingSettings, updateFlowMetadata])

  const handleComponentSave = useCallback(
    async (componentIndex: number, updatedComponent: Component) => {
      if (!selectedScreenId || !selectedScreen) return

      const updatedComponents = [...selectedScreen.components]
      updatedComponents[componentIndex] = updatedComponent

      addHistory({
        screenId: selectedScreenId,
        type: 'component_update',
        before: selectedScreen,
        after: { ...selectedScreen, components: updatedComponents },
        componentIndex,
      })

      try {
        await updateScreen(selectedScreenId, {
          components: updatedComponents,
        })
        setEditingComponentId(null)
      } catch (error) {
        console.error('Failed to update component:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to update component')
      }
    },
    [addHistory, selectedScreen, selectedScreenId, setEditingComponentId, updateScreen]
  )

  const handleStartEditComponent = useCallback(
    (componentIndex: number) => {
      if (!selectedScreenId) return
      setEditingScreenId(selectedScreenId)
      setEditingComponentId(`${selectedScreenId}-${componentIndex}`)
    },
    [selectedScreenId, setEditingComponentId, setEditingScreenId]
  )

  const handleHeroReplace = useCallback(
    async (newImage: HeroImageType) => {
      if (!selectedScreenId || !selectedScreen) return

      setHeroUpdateLoading(true)
      try {
        const rawPalette =
          newImage.extractedPalette ??
          (await extractPalette({
            url: newImage.url,
            fallback: selectedScreen.palette,
          }))
        const palette: ScreenDSL['palette'] = {
          primary: rawPalette.primary ?? selectedScreen.palette.primary ?? '#3B82F6',
          secondary: rawPalette.secondary ?? selectedScreen.palette.secondary ?? '#8B5CF6',
          accent: rawPalette.accent ?? selectedScreen.palette.accent ?? '#F59E0B',
          background: rawPalette.background ?? selectedScreen.palette.background ?? '#FFFFFF',
        }
        const vibeAnalysis = await inferVibe({
          url: newImage.url,
          palette,
          includeReasoning: false,
        })

        addHistory({
          screenId: selectedScreenId,
          type: 'image_replace',
          before: selectedScreen,
          after: { ...selectedScreen, hero_image: newImage, palette, vibe: vibeAnalysis.vibe },
        })

        await updateScreen(selectedScreenId, {
          hero_image: newImage,
          palette,
          vibe: vibeAnalysis.vibe,
        })
      } catch (error) {
        console.error('Failed to replace hero image:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to replace hero image')
      } finally {
        setHeroUpdateLoading(false)
      }
    },
    [addHistory, selectedScreen, selectedScreenId, updateScreen]
  )

  const handleDeleteScreen = useCallback(
    async (screenId: string) => {
      if (!flowId) return
      const confirmed = window.confirm('Delete this screen? This action cannot be undone.')
      if (!confirmed) return

      try {
        await removeFlowScreen(flowId, screenId)
        await refreshScreensAndGraph()
        if (selectedScreenId === screenId) {
          setSelectedScreenId(null)
        }
      } catch (error) {
        console.error('Failed to delete screen:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to delete screen')
      }
    },
    [flowId, refreshScreensAndGraph, removeFlowScreen, selectedScreenId]
  )

  const handleDuplicateScreen = useCallback(
    async (screenId: string) => {
      if (!flowId) return
      const source = screensWithIds.find((screen) => screen.id === screenId)
      if (!source) return

      try {
        const response = await fetch(`/api/flows/${flowId}/screens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenDSL: source.dsl,
            afterScreenId: screenId,
            heroImageId: source.dsl.hero_image?.id,
          }),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to duplicate screen')
        }
        const result = await response.json()
        await loadFlowScreens(flowId)
        setPendingSelectScreenId(result.screen?.id || result.screenId || null)
      } catch (error) {
        console.error('Failed to duplicate screen:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to duplicate screen')
      }
    },
    [flowId, loadFlowScreens, screensWithIds]
  )

  const handleReorderScreen = useCallback(
    async (screenId: string, direction: 'up' | 'down') => {
      if (!flowId) return
      const currentIndex = screensWithIds.findIndex((screen) => screen.id === screenId)
      if (currentIndex === -1) return

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      if (targetIndex < 0 || targetIndex >= screensWithIds.length) {
        return
      }

      try {
        const response = await fetch(`/api/flows/${flowId}/screens/${screenId}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newOrder: targetIndex }),
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to reorder screen')
        }
        await loadFlowScreens(flowId)
      } catch (error) {
        console.error('Failed to reorder screen:', error)
        setPageError(error instanceof Error ? error.message : 'Failed to reorder screen')
      }
    },
    [flowId, loadFlowScreens, screensWithIds]
  )

  if (initializing) {
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

  if (!currentFlow) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{combinedError || 'Flow not found'}</CardDescription>
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

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Link href="/gallery">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gallery
              </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{currentFlow.name}</h1>
              {currentFlow.description && (
                <p className="text-muted-foreground text-lg">{currentFlow.description}</p>
              )}
            </div>
          </div>
          <EditModeToggle editMode={isEditMode} onToggle={setEditMode} />
        </div>

        {combinedError && (
          <Alert variant="destructive">
            <AlertDescription>{combinedError}</AlertDescription>
          </Alert>
        )}

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

          <TabsContent value="screens" className="space-y-6">
            {screens.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create Your First Screen</CardTitle>
                  <CardDescription>
                    Describe what you&apos;re building and FlowRunner will generate a screen with AI images and layout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="generation-prompt">What are you building?</Label>
                    <Textarea
                      id="generation-prompt"
                      placeholder="e.g., A landing page for a SaaS product..."
                      value={generationPrompt}
                      onChange={(e) => setGenerationPrompt(e.target.value)}
                      rows={4}
                      disabled={isGenerating}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      FlowRunner will analyze your prompt, select an appropriate layout pattern, generate AI images, and create your first screen.
                    </p>
                  </div>

                  {generationProgress && (
                    <Alert>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <AlertDescription>{generationProgress}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleGenerateFirstScreen} disabled={!generationPrompt.trim() || isGenerating}>
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
              <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px] lg:grid-cols-[260px_minmax(0,1fr)]">
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle>Screens</CardTitle>
                    <CardDescription>Manage, reorder, and duplicate screens</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {screensWithIds.map((screen, index) => {
                      const isActive = screen.id === selectedScreenId
                      return (
                        <div
                          key={screen.id}
                          className={cn(
                            'rounded-lg border p-3 transition hover:border-primary/50',
                            isActive && 'border-primary bg-primary/5'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex flex-1 flex-col text-left"
                              onClick={() => setSelectedScreenId(screen.id)}
                            >
                              <span className="text-sm font-medium">Screen {index + 1}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {screen.dsl.components.find((component) => component.type === 'title')?.content || 'Untitled'}
                              </span>
                            </button>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleReorderScreen(screen.id, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleReorderScreen(screen.id, 'down')}
                                disabled={index === screensWithIds.length - 1}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDuplicateScreen(screen.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteScreen(screen.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>
                          Screen {selectedScreenIndex + 1} of {screens.length}
                        </CardTitle>
                        {selectedScreen?.vibe && (
                          <CardDescription>Vibe: {selectedScreen.vibe}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        {selectedScreen?.pattern_family}
                      </div>
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
                            editMode={isEditMode}
                            editingComponentId={editingComponentId}
                            onStartEdit={handleStartEditComponent}
                            onSaveEdit={handleComponentSave}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {screens.length > 1 && (
                    <Card>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const newIndex = Math.max(0, selectedScreenIndex - 1)
                              setSelectedScreenId(screensWithIds[newIndex]?.id ?? null)
                            }}
                            disabled={selectedScreenIndex === 0}
                          >
                            Previous Screen
                          </Button>

                          <div className="flex gap-2">
                            {screens.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedScreenId(screensWithIds[index]?.id ?? null)}
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
                              setSelectedScreenId(screensWithIds[newIndex]?.id ?? null)
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
                </div>

                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle>Editing Panel</CardTitle>
                    <CardDescription>Update hero image, palette, vibe, and pattern</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!selectedScreen && (
                      <p className="text-sm text-muted-foreground">Select a screen to edit its details.</p>
                    )}

                    {selectedScreen && selectedScreenWithId && (
                      <>
                        {selectedScreen.hero_image && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium">Hero Image</h3>
                              {heroUpdateLoading && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Updating...
                                </span>
                              )}
                            </div>
                            <div className="overflow-hidden rounded-lg border">
                              <ImageReplacer
                                image={selectedScreen.hero_image}
                                onReplace={handleHeroReplace}
                                editMode={isEditMode}
                                size="large"
                                palette={selectedScreen.palette}
                              />
                            </div>
                          </div>
                        )}

                        <PaletteEditor dsl={selectedScreen} screenId={selectedScreenWithId.id} />
                        <VibeSelector dsl={selectedScreen} screenId={selectedScreenWithId.id} />

                        <div className="flex flex-col gap-4">
                          <PatternFamilySelector dsl={selectedScreen} screenId={selectedScreenWithId.id} />
                          <PatternVariantSelector dsl={selectedScreen} screenId={selectedScreenWithId.id} />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                    graph={normalizedGraph || undefined}
                    screens={screensWithIds}
                    activeScreenId={activeScreenId}
                    onScreenSelect={(screenId) => {
                      if (screenId) {
                        setSelectedScreenId(screenId)
                        setActiveTab('screens')
                      }
                    }}
                    editable={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                  <Button onClick={handleSaveSettings} disabled={savingSettings || !settingsForm.name.trim()}>
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

export default function FlowEditorPage() {
  return (
    <FlowProvider>
      <EditingProvider>
        <FlowEditorPageInner />
      </EditingProvider>
    </FlowProvider>
  )
}
