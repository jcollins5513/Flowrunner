'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { type PatternFamily, type Vibe } from '@/lib/dsl/types'
import { ALL_PATTERN_FAMILIES } from '@/lib/patterns/families'
import { createPatternFixtureDSL, PREVIEW_PALETTES, PREVIEW_VIBES } from '@/lib/patterns/fixtures'

const VARIANTS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

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
  return Math.min(Math.max(num, 0), PREVIEW_PALETTES.length - 1)
}

function parseVibe(value: string | null): Vibe {
  return (value && PREVIEW_VIBES.includes(value as Vibe) ? value : PREVIEW_VIBES[0]) as Vibe
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
      createPatternFixtureDSL(family, variant, {
        paletteOverride: PREVIEW_PALETTES[paletteIndex] ?? PREVIEW_PALETTES[0],
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
            {PREVIEW_PALETTES.map((palette, index) => (
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
            {PREVIEW_VIBES.map((option) => (
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

