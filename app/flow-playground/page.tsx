'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { InteractiveScreen } from '@/components/flow/InteractiveScreen'
import type { ScreenOption } from '@/components/flow/ScreenPickerModal'
import {
  type PatternFamily,
  type PatternVariant,
  type ScreenDSL,
  type Vibe,
} from '@/lib/dsl/types'
import { type NextScreenTriggerContext, type ScreenContext } from '@/lib/flows/types'
import {
  buildScreenDSLFromPlan,
  generateNextScreen,
} from '@/lib/flows/next-screen-generator'
import { runPromptToTemplatePipeline } from '@/lib/ai/intent/pipeline'
import { ImageOrchestrator } from '@/lib/images/orchestrator'
import { ImageGenerationService } from '@/lib/images/generation/service'
import { MockImageProvider } from '@/lib/images/generation/providers/mock'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-provider'

const PROMPT_SUGGESTIONS = [
  'Onboard creators to a new AI design assistant.',
  'Help teams plan a product launch timeline.',
  'Showcase analytics insights for a SaaS dashboard.',
  'Promote a mobile fintech experience with a clean UI.',
]

const VIBES: Vibe[] = ['modern', 'professional', 'bold', 'minimal', 'creative']

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export default function FlowPlaygroundPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [prompt, setPrompt] = useState(PROMPT_SUGGESTIONS[0])
  const [screens, setScreens] = useState<ScreenDSL[]>([])
  const [flowNameTouched, setFlowNameTouched] = useState(false)
  const [flowName, setFlowName] = useState(() => deriveFlowName(PROMPT_SUGGESTIONS[0]))
  const [flowDescription, setFlowDescription] = useState('Draft created in Flow Playground.')
  const [isSavingFlow, setIsSavingFlow] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const flowMetadata = useMemo(
    () => ({
      theme: flowName.trim() || undefined,
      style: undefined as string | undefined,
      domain: undefined as string | undefined,
    }),
    [flowName],
  )

  const imageOrchestrator = useMemo(
    () =>
      new ImageOrchestrator({
        service: new ImageGenerationService({ provider: new MockImageProvider() }),
        autoExtractPalette: true,
        autoInferVibe: true,
        autoPersist: true,
      }),
    [],
  )

  const createScreen = useCallback(
    async (step: number, promptValue: string): Promise<ScreenDSL> => {
      const pipelineResult = await runPromptToTemplatePipeline(promptValue)
      const plan =
        pipelineResult.sequence[step] ??
        pipelineResult.sequence[pipelineResult.sequence.length - 1]

      if (!plan) {
        throw new Error('No screen plan generated from template')
      }

      const heroImage = await imageOrchestrator.generateHeroImageWithPalette({
        prompt: plan.heroPlan.imagePrompt,
        aspectRatio: plan.heroPlan.aspectRatio,
        visualTheme: flowMetadata.theme,
      })

      const vibe: Vibe = (heroImage.vibe as Vibe | undefined) ?? VIBES[0]
      const context: ScreenContext = {
        palette: heroImage.palette,
        vibe,
        patternFamily: plan.pattern.family as PatternFamily,
        patternVariant: (plan.pattern.variant as PatternVariant) ?? 1,
        components: [],
        flowMetadata,
      }

      const screenDSL = buildScreenDSLFromPlan(plan, context, heroImage)

      return {
        ...screenDSL,
        navigation:
          screenDSL.navigation ??
          ({
            type: 'internal',
            target: `screen-${step + 1}`,
          } satisfies ScreenDSL['navigation']),
        metadata: {
          ...screenDSL.metadata,
          step,
          prompt: promptValue,
          templateId: plan.templateId,
          templateScreenId: plan.screenId,
          heroImageId: screenDSL.hero_image.id,
          planName: plan.name,
          generatedAt: new Date().toISOString(),
        },
      }
    },
    [flowMetadata, imageOrchestrator],
  )

  useEffect(() => {
    if (!flowNameTouched) {
      setFlowName(deriveFlowName(prompt))
    }
  }, [flowNameTouched, prompt])

  useEffect(() => {
    if (screens.length > 0) return

    let isMounted = true
    setIsGenerating(true)

    createScreen(0, prompt)
      .then((screen) => {
        if (isMounted) {
          setScreens([screen])
        }
      })
      .catch((error) => {
        console.error('Failed to generate initial screen', error)
        showToast({
          title: 'Unable to generate initial screen',
          description: error instanceof Error ? error.message : 'Unexpected error occurred',
          variant: 'error',
        })
      })
      .finally(() => {
        if (isMounted) {
          setIsGenerating(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [createScreen, prompt, screens.length, showToast])

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const nextScreen = await createScreen(screens.length, prompt)
      setScreens((current) => [...current, nextScreen])
    } catch (error) {
      console.error('Failed to add screen from prompt', error)
      showToast({
        title: 'Unable to add screen',
        description: error instanceof Error ? error.message : 'Unexpected error occurred',
        variant: 'error',
      })
    } finally {
      setIsGenerating(false)
    }
  }, [createScreen, isGenerating, prompt, screens.length, showToast])

  const handleButtonNext = useCallback(
    async (screenIndex: number) => {
      if (isGenerating) return
      setIsGenerating(true)

      try {
        const nextPrompt = `${prompt} · Step ${screenIndex + 2}`
        const next = await createScreen(screenIndex + 1, nextPrompt)
        setScreens((current) => [...current.slice(0, screenIndex + 1), next])
      } catch (error) {
        console.error('Failed to branch flow', error)
        showToast({
          title: 'Unable to continue from here',
          description: error instanceof Error ? error.message : 'Unexpected error occurred',
          variant: 'error',
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [createScreen, isGenerating, prompt, showToast]
  )

  const handleResetWithPrompt = useCallback(
    async (nextPrompt: string) => {
      if (isGenerating) return
      setPrompt(nextPrompt)
      setIsGenerating(true)
      try {
        const firstScreen = await createScreen(0, nextPrompt)
        setScreens([firstScreen])
      } catch (error) {
        console.error('Failed to reset flow', error)
        showToast({
          title: 'Unable to reset flow',
          description: error instanceof Error ? error.message : 'Unexpected error occurred',
          variant: 'error',
        })
      } finally {
        setIsGenerating(false)
      }
    },
    [createScreen, isGenerating, showToast]
  )

  const handleGenerateNext = useCallback(
    async (context: NextScreenTriggerContext) => {
      try {
        setIsGenerating(true)
        const result = await generateNextScreen(context, {
          onProgress: (stage, progress) => {
            console.log(`Generation: ${stage} (${progress}%)`)
          },
        })
        // Add generated screen to local state
        setScreens((current) => {
          const screenIndex = current.findIndex(
            (s) => s.metadata?.step === (context.screen.metadata as { step?: number })?.step,
          )
          if (screenIndex < 0) return [...current, result.screenDSL]
          return [...current.slice(0, screenIndex + 1), result.screenDSL]
        })
      } catch (error) {
        console.error('Failed to generate next screen:', error)
        // Fallback to simple generation
        setIsGenerating(false)
        await handleButtonNext(
          screens.findIndex(
            (s) => s.metadata?.step === (context.screen.metadata as { step?: number })?.step,
          ),
        )
        return
      } finally {
        setIsGenerating(false)
      }
    },
    [handleButtonNext, screens],
  )

  const handleLinkExisting = useCallback(
    async (context: NextScreenTriggerContext) => {
      if (!context.targetScreenId) return

      // Update the source screen's navigation to point to the target
      setScreens((current) => {
        const sourceIndex = current.findIndex(
          (s) => s.metadata?.step === (context.screen.metadata as { step?: number })?.step,
        )
        if (sourceIndex < 0) return current

        const updated = [...current]
        const targetIndex = parseInt(context.targetScreenId?.split('-').pop() || '0', 10) - 1
        updated[sourceIndex] = {
          ...updated[sourceIndex],
          navigation: {
            type: 'internal',
            target: context.targetScreenId,
            screenId: context.targetScreenId,
          },
        }
        return updated
      })
    },
    [],
  )

  const availableScreens: ScreenOption[] = useMemo(() => {
    return screens.map((screen, index) => ({
      id: `screen-${index + 1}`,
      name: screen.components[0]?.content || `Screen ${index + 1}`,
      description: `Pattern: ${screen.pattern_family}`,
    }))
  }, [screens])

  const canGenerate = useMemo(() => prompt.trim().length > 0, [prompt])
  const canSaveFlow = useMemo(
    () => flowName.trim().length > 0 && screens.length > 0 && !isSavingFlow,
    [flowName, screens.length, isSavingFlow],
  )

  const handleSaveFlow = useCallback(async () => {
    if (!canSaveFlow) return
    setIsSavingFlow(true)
    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: flowName.trim(),
          description: flowDescription.trim() || undefined,
          initialScreens: screens,
          isPublic: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save flow')
      }

      const flow = await response.json()
      showToast({
        title: 'Flow saved',
        description: 'Redirecting you to the editor…',
        variant: 'success',
      })
      router.push(`/flows/${flow.id}/edit`)
    } catch (error) {
      console.error('Failed to save flow from playground', error)
      showToast({
        title: 'Unable to save flow',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'error',
      })
    } finally {
      setIsSavingFlow(false)
    }
  }, [canSaveFlow, flowDescription, flowName, router, screens, showToast])

  return (
    <div className="container mx-auto px-6 py-10 space-y-10">
      <section className="max-w-4xl mx-auto space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Experiment</p>
          <h1 className="text-3xl font-semibold text-slate-900">Flow Playground</h1>
          <p className="text-slate-600">
            Prototype the MagicPath/Banani experience: describe a moment in your product and keep generating the next screen by clicking the
            primary CTAs.
          </p>
        </header>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">What should this flow accomplish?</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="e.g., Onboard users to a new AI copilot..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-slate-400"
                disabled={isGenerating}
                onClick={() => handleResetWithPrompt(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canGenerate || isGenerating}
              onClick={handleGenerate}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Add screen
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleResetWithPrompt(pick(PROMPT_SUGGESTIONS))}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:border-slate-500"
            >
              Reset with suggestion
            </button>
          </div>
      </section>

      <section className="max-w-4xl mx-auto space-y-6 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Continue in editor</p>
          <h2 className="text-2xl font-semibold text-slate-900">Save this playground flow</h2>
          <p className="text-sm text-slate-600">
            Capture everything you&apos;ve generated so far and jump straight into the full editor with inline edits, palette controls, and hero
            replacements.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Flow name</label>
            <input
              value={flowName}
              onChange={(event) => {
                setFlowNameTouched(true)
                setFlowName(event.target.value)
              }}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="e.g., AI launch assistant onboarding"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description (optional)</label>
            <input
              value={flowDescription}
              onChange={(event) => setFlowDescription(event.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="Short summary for the gallery/editor"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
          <p>
            {screens.length === 1
              ? '1 generated screen will be added to your new flow.'
              : `${screens.length} generated screens will be added to your new flow.`}
          </p>
          <Button onClick={handleSaveFlow} disabled={!canSaveFlow} className="min-w-[160px] justify-center">
            {isSavingFlow ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save as Flow'
            )}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-12">
        {screens.map((screen, index) => (
          <article key={`${screen.pattern_family}-${index}`} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Screen {index + 1}</p>
                <h3 className="text-lg font-semibold text-slate-900">{screen.components[0]?.content}</h3>
              </div>
              <button
                type="button"
                onClick={() => handleButtonNext(index)}
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                Continue from here
              </button>
            </div>
            <InteractiveScreen
              screen={screen}
              screenId={`screen-${index + 1}`}
              screenIndex={index}
              availableScreens={availableScreens}
              onGenerateNext={handleGenerateNext}
              onLinkExisting={handleLinkExisting}
            />
          </article>
        ))}
      </section>
    </div>
  )
}

function deriveFlowName(value: string) {
  const fallback = 'Flow Playground Draft'
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed
}
