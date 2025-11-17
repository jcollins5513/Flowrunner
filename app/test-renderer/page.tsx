// Test page for the renderer
// Tests that components and images are placed correctly in frames according to pattern definitions

'use client'

import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { type ScreenDSL, type PatternFamily, type PatternVariant } from '@/lib/dsl/types'
import { useState } from 'react'

// Test multiple patterns to verify layout positioning
const TEST_PATTERNS: Array<{ family: PatternFamily; variant: PatternVariant; description: string }> = [
  { family: 'ONB_HERO_TOP', variant: 1, description: 'Hero at top, content below' },
  { family: 'FEAT_IMAGE_TEXT_RIGHT', variant: 1, description: 'Image left, text right' },
  { family: 'FEAT_IMAGE_TEXT_LEFT', variant: 1, description: 'Text left, image right' },
  { family: 'CTA_SPLIT_SCREEN', variant: 1, description: 'Split screen CTA' },
  { family: 'NEWSLETTER_SIGNUP', variant: 1, description: 'Newsletter signup form' },
  { family: 'PRICING_TABLE', variant: 1, description: 'Pricing table layout' },
]

function createTestDSL(family: PatternFamily, variant: PatternVariant): ScreenDSL {
  return {
    hero_image: {
      id: `${family}-hero-${variant}`,
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop',
    },
    palette: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#3b82f6',
      background: '#ffffff',
    },
    vibe: 'modern',
    pattern_family: family,
    pattern_variant: variant,
    components: [
      { type: 'title', content: `Testing ${family.replace(/_/g, ' ')}` },
      { type: 'subtitle', content: 'Verify components are placed correctly' },
      { type: 'text', content: 'This is body text to test text component rendering.' },
      { type: 'button', content: 'Test Button' },
    ],
  }
}

export default function TestRendererPage() {
  const [selectedPattern, setSelectedPattern] = useState(0)
  const testPattern = TEST_PATTERNS[selectedPattern]
  const testDSL = createTestDSL(testPattern.family, testPattern.variant)

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">Renderer Layout Test</h1>
          <p className="mb-4 text-slate-600">
            Testing that components and images are placed in correct positions according to pattern definitions.
          </p>
          
          <div className="flex flex-wrap gap-3">
            {TEST_PATTERNS.map((pattern, index) => (
              <button
                key={`${pattern.family}-${pattern.variant}`}
                type="button"
                onClick={() => setSelectedPattern(index)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedPattern === index
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pattern.family.replace(/_/g, ' ')}
                <span className="ml-2 text-xs opacity-75">v{pattern.variant}</span>
              </button>
            ))}
          </div>
          
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Current Test:</p>
            <p className="text-sm text-slate-600">{testPattern.description}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
            <p className="text-sm font-medium text-slate-600">
              Pattern: {testPattern.family} · Variant {testPattern.variant}
            </p>
          </div>
          <ScreenRenderer
            dsl={testDSL}
            onComponentClick={(type, component) => {
              console.log('Component clicked:', type, component)
            }}
          />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Verification Checklist</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Hero image should be positioned according to pattern definition</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Title component should be in the correct grid position</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Subtitle should follow title position</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Text and button components should be in their defined slots</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Spacing (padding/gap) should match pattern definition</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Palette colors should be applied correctly</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

