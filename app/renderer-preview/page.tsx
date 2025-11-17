'use client'

import { useMemo, useState } from 'react'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { type ScreenDSL } from '@/lib/dsl/types'
import { ALL_PATTERN_FAMILIES } from '@/lib/patterns/families'

const VARIANTS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

function createMockDSL(family: string, variant: 1 | 2 | 3 | 4 | 5): ScreenDSL {
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
    palette: {
      primary: '#0f172a',
      secondary: '#475569',
      accent: '#2563eb',
      background: '#f8fafc',
    },
    vibe: 'modern',
    pattern_family: family as any,
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

export default function RendererPreviewPage() {
  const [family, setFamily] = useState<string>(ALL_PATTERN_FAMILIES[0])
  const [variant, setVariant] = useState<1 | 2 | 3 | 4 | 5>(1)

  const dsl = useMemo(() => createMockDSL(family, variant), [family, variant])

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-slate-100 p-8">
      <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs font-semibold uppercase text-slate-500">Pattern family</label>
          <select
            data-testid="family-select"
            className="rounded-lg border border-slate-200 px-3 py-2"
            value={family}
            onChange={(event) => setFamily(event.target.value)}
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

