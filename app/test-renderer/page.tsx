// Test page for the renderer
'use client'

import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { type ScreenDSL } from '@/lib/dsl/types'

export default function TestRendererPage() {
  // Create a test DSL
  const testDSL: ScreenDSL = {
    hero_image: {
      id: 'test-img-1',
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop',
    },
    palette: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      accent: '#3b82f6',
      background: '#ffffff',
    },
    vibe: 'modern',
    pattern_family: 'ONB_HERO_TOP',
    pattern_variant: 1,
    components: [
      { type: 'title', content: 'Welcome to FlowRunner' },
      { type: 'subtitle', content: 'Build beautiful UI flows with AI' },
      { type: 'button', content: 'Get Started' },
    ],
  }

  return (
    <div className="w-full">
      <ScreenRenderer
        dsl={testDSL}
        onComponentClick={(type, component) => {
          console.log('Component clicked:', type, component)
        }}
      />
    </div>
  )
}

