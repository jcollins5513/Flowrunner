'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { type Palette, type PatternFamily, type ScreenDSL, type Vibe } from '@/lib/dsl/types'
import { ALL_PATTERN_FAMILIES } from '@/lib/patterns/families'

const VARIANTS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

const PALETTE_POOL: Palette[] = [
  { primary: '#0f172a', secondary: '#475569', accent: '#2563eb', background: '#f8fafc' },
  { primary: '#111827', secondary: '#6b7280', accent: '#0ea5e9', background: '#fdf4ff' },
  { primary: '#1c1917', secondary: '#57534e', accent: '#f97316', background: '#fff7ed' },
  { primary: '#0b1a2a', secondary: '#64748b', accent: '#22d3ee', background: '#0f172a' },
]

const VIBES: Vibe[] = ['modern', 'professional', 'bold', 'minimal', 'creative']

function createMockDSL({
  family,
  variant,
  palette,
  vibe,
}: {
  family: PatternFamily
  variant: 1 | 2 | 3 | 4 | 5
  palette: Palette
  vibe: Vibe
}): ScreenDSL {
  return {
    hero_image: {
      id: `${family}-hero`,
      url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1200&h=800&fit=crop',
    },
    supporting_images: [
      {
        id: `${family}-support-1`,
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=400&fit=crop',
      },
      {
        id: `${family}-support-2`,
        url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop',
      },
    ],
    palette,
    vibe,
    pattern_family: family,
    pattern_variant: variant,
    components: [
      { type: 'title', content: 'Welcome to FlowRunner' },
      { type: 'subtitle', content: 'AI-guided, image-first screen design' },
      {
        type: 'text',
        content: 'Generate hero images, layouts, and navigation-aware flows in minutes.',
      },
      {
        type: 'form',
        content: 'Join the beta',
        props: {
          fields: [
            { id: 'name', label: 'Name', placeholder: 'Jane Doe' },
            { id: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
          ],
          submitLabel: 'Request access',
        },
      },
      { type: 'button', content: 'Generate Next Screen' },
    ],
  }
}

function parseFamily(value: string | null): PatternFamily {
  return (value && ALL_PATTERN_FAMILIES.includes(value as PatternFamily)
    ? value
    : ALL_PATTERN_FAMILIES[0]) as PatternFamily
}

function parseVariant(value: string | null): 1 | 2 | 3 | 4 | 5 {
  const num = Number(value)
  return VARIANTS.includes(num as 1 | 2 | 3 | 4 | 5) ? (num as 1 | 2 | 3 | 4 | 5) : 1
}

function parsePaletteIndex(value: string | null): number {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  return Math.min(Math.max(num, 0), PALETTE_POOL.length - 1)
}

function parseVibe(value: string | null): Vibe {
  return (value && VIBES.includes(value as Vibe) ? value : VIBES[0]) as Vibe
}

export default function RendererPreviewPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [family, setFamily] = useState<PatternFamily>(() => parseFamily(searchParams.get('family')))
  const [variant, setVariant] = useState<1 | 2 | 3 | 4 | 5>(() => parseVariant(searchParams.get('variant')))
  const [paletteIndex, setPaletteIndex] = useState<number>(() => parsePaletteIndex(searchParams.get('palette')))
  const [vibe, setVibe] = useState<Vibe>(() => parseVibe(searchParams.get('vibe')))

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('family', family)
    params.set('variant', variant.toString())
    params.set('palette', paletteIndex.toString())
    params.set('vibe', vibe)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [family, variant, paletteIndex, vibe, router, pathname])

  const dsl = useMemo(
    () =>
      createMockDSL({
        family,
        variant,
        palette: PALETTE_POOL[paletteIndex] ?? PALETTE_POOL[0],
        vibe,
      }),
    [family, variant, paletteIndex, vibe]
  )

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-slate-100 p-8">
      <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">Pattern family</label>
          <select
            data-testid="family-select"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={family}
            onChange={(event) => setFamily(event.target.value as PatternFamily)}
          >
            {ALL_PATTERN_FAMILIES.map((familyOption) => (
              <option key={familyOption} value={familyOption}>
                {familyOption.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">Variant</label>
          <select
            data-testid="variant-select"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={variant}
            onChange={(event) => setVariant(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)}
          >
            {VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">Palette</label>
          <select
            data-testid="palette-select"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={paletteIndex}
            onChange={(event) => setPaletteIndex(Number(event.target.value))}
          >
            {PALETTE_POOL.map((palette, index) => (
              <option key={palette.primary} value={index}>
                Palette {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">Vibe</label>
          <select
            data-testid="vibe-select"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={vibe}
            onChange={(event) => setVibe(event.target.value as Vibe)}
          >
            {VIBES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="rounded-[32px] border border-slate-200 bg-white/90 shadow-xl"
        data-testid="renderer-preview-root"
      >
        <ScreenRenderer dsl={dsl} />
      </div>
    </div>
  )
}

