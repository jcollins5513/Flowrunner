'use client'

import { useCallback, useMemo, useState } from 'react'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import {
  type Component,
  type HeroImage,
  type PatternFamily,
  type PatternVariant,
  type ScreenDSL,
  type Vibe,
  type Palette,
} from '@/lib/dsl/types'

const PATTERN_SEQUENCE: PatternFamily[] = [
  'ONB_HERO_TOP',
  'FEAT_IMAGE_TEXT_RIGHT',
  'ACT_FORM_MINIMAL',
  'PRODUCT_DETAIL',
  'DASHBOARD_OVERVIEW',
  'DEMO_DEVICE_FULLBLEED',
]

const VARIANTS: PatternVariant[] = [1, 2, 3, 4, 5]

const PALETTE_POOL: Palette[] = [
  { primary: '#0f172a', secondary: '#475569', accent: '#6366f1', background: '#f8fafc' },
  { primary: '#111827', secondary: '#6b7280', accent: '#0ea5e9', background: '#fdf4ff' },
  { primary: '#1c1917', secondary: '#57534e', accent: '#f97316', background: '#fff7ed' },
  { primary: '#0b1a2a', secondary: '#64748b', accent: '#22d3ee', background: '#0f172a' },
]

const HERO_IMAGES: Partial<Record<PatternFamily, string>> = {
  ONB_HERO_TOP: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
  FEAT_IMAGE_TEXT_RIGHT: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
  ACT_FORM_MINIMAL: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80',
  PRODUCT_DETAIL: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
  DASHBOARD_OVERVIEW: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  DEMO_DEVICE_FULLBLEED: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
}

const PROMPT_SUGGESTIONS = [
  'Onboard creators to a new AI design assistant.',
  'Help teams plan a product launch timeline.',
  'Showcase analytics insights for a SaaS dashboard.',
  'Promote a mobile fintech experience with a clean UI.',
]

const VIBES: Vibe[] = ['modern', 'professional', 'bold', 'minimal', 'creative']

type TemplateContext = {
  prompt: string
  step: number
  cta?: string
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function buildHeroImage(family: PatternFamily, step: number): HeroImage {
  return {
    id: `${family}-${step}-${Date.now()}`,
    url:
      HERO_IMAGES[family] ??
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    prompt: `${family} showcase`,
  }
}

function buildSupportingImages(family: PatternFamily): HeroImage[] | undefined {
  if (family !== 'PRODUCT_DETAIL' && family !== 'DEMO_DEVICE_FULLBLEED') return undefined
  return [
    {
      id: `${family}-support-1`,
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: `${family}-support-2`,
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    },
  ]
}

function buildComponents(family: PatternFamily, ctx: TemplateContext): Component[] {
  const baseTitle = ctx.prompt || `Step ${ctx.step + 1}`
  const copy = `Help users make progress toward their goal with clear messaging and action.`

  switch (family) {
    case 'ACT_FORM_MINIMAL':
      return [
        { type: 'title', content: baseTitle },
        { type: 'subtitle', content: 'Complete this quick form to continue.' },
        {
          type: 'form',
          content: 'Join the beta',
          props: {
            fields: [
              { id: 'name', label: 'Full name', placeholder: 'Jane Doe' },
              { id: 'email', label: 'Work email', placeholder: 'you@company.com' },
            ],
            submit: 'Create account',
          },
        },
        { type: 'text', content: copy },
        { type: 'button', content: ctx.cta ?? 'Continue' },
      ]
    case 'PRODUCT_DETAIL':
      return [
        { type: 'title', content: baseTitle },
        { type: 'subtitle', content: 'Pro plan · $49/mo' },
        { type: 'text', content: 'Everything you need to launch and scale your experience.' },
        {
          type: 'image',
          content: 'Feature highlight',
          props: { url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80' },
        },
        { type: 'button', content: ctx.cta ?? 'Start free trial' },
      ]
    case 'DASHBOARD_OVERVIEW':
      return [
        { type: 'title', content: baseTitle },
        { type: 'subtitle', content: 'Today’s snapshot' },
        { type: 'text', content: copy },
        {
          type: 'image',
          content: 'Analytics chart',
          props: { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80' },
        },
        { type: 'button', content: ctx.cta ?? 'View details' },
      ]
    case 'DEMO_DEVICE_FULLBLEED':
      return [
        { type: 'title', content: baseTitle },
        { type: 'subtitle', content: 'See the product in action.' },
        { type: 'text', content: copy },
        { type: 'button', content: ctx.cta ?? 'Book demo' },
      ]
    default:
      return [
        { type: 'title', content: baseTitle },
        { type: 'subtitle', content: 'Explain what this step unlocks.' },
        { type: 'text', content: copy },
        { type: 'button', content: ctx.cta ?? 'Next step' },
      ]
  }
}

function createScreen(step: number, prompt: string): ScreenDSL {
  const family = PATTERN_SEQUENCE[step % PATTERN_SEQUENCE.length]
  const variant = VARIANTS[step % VARIANTS.length]
  const palette = PALETTE_POOL[step % PALETTE_POOL.length]
  const vibe = VIBES[step % VIBES.length]

  return {
    hero_image: buildHeroImage(family, step),
    supporting_images: buildSupportingImages(family),
    palette,
    vibe,
    pattern_family: family,
    pattern_variant: variant,
    components: buildComponents(family, { prompt, step, cta: step === 0 ? 'Get started' : 'Continue' }),
    navigation: {
      type: 'internal',
      target: `screen-${step + 1}`,
    },
    metadata: {
      step,
      prompt,
    },
  }
}

export default function FlowPlaygroundPage() {
  const [prompt, setPrompt] = useState(PROMPT_SUGGESTIONS[0])
  const [screens, setScreens] = useState<ScreenDSL[]>(() => [createScreen(0, PROMPT_SUGGESTIONS[0])])

  const handleGenerate = useCallback(() => {
    setScreens((current) => [...current, createScreen(current.length, prompt)])
  }, [prompt])

  const handleButtonNext = useCallback(
    (screenIndex: number) => {
      setScreens((current) => {
        const nextPrompt = `${prompt} · Step ${current.length + 1}`
        const next = createScreen(current.length, nextPrompt)
        return [...current.slice(0, screenIndex + 1), next]
      })
    },
    [prompt]
  )

  const canGenerate = useMemo(() => prompt.trim().length > 0, [prompt])

  return (
    <div className="px-6 py-10 space-y-10">
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
              onClick={() => {
                setPrompt(suggestion)
                setScreens([createScreen(0, suggestion)])
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Add screen
          </button>
          <button
            type="button"
            onClick={() => {
              const nextPrompt = pick(PROMPT_SUGGESTIONS)
              setPrompt(nextPrompt)
              setScreens([createScreen(0, nextPrompt)])
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:border-slate-500"
          >
            Reset with suggestion
          </button>
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
            <div className="overflow-hidden rounded-[32px] border border-slate-200 shadow-md">
              <ScreenRenderer
                dsl={screen}
                onComponentClick={(type) => {
                  if (type === 'button') {
                    handleButtonNext(index)
                  }
                }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
