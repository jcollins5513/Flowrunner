import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RendererThemeProvider, useRendererTheme } from '@/lib/renderer/theme-provider'
import { type Palette, type Vibe } from '@/lib/dsl/types'

// Component to test hook
function TestComponent() {
  const { palette, vibe } = useRendererTheme()
  return (
    <div>
      <div data-testid="primary">{palette.primary}</div>
      <div data-testid="vibe">{vibe}</div>
    </div>
  )
}

describe('Theme provider', () => {
  const testPalette: Palette = {
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
    background: '#ffffff',
  }
  const testVibe: Vibe = 'bold'

  it('provides palette and vibe through context', () => {
    render(
      <RendererThemeProvider palette={testPalette} vibe={testVibe}>
        <TestComponent />
      </RendererThemeProvider>
    )

    expect(screen.getByTestId('primary')).toHaveTextContent('#ff0000')
    expect(screen.getByTestId('vibe')).toHaveTextContent('bold')
  })

  it('injects CSS variables for palette', () => {
    render(
      <RendererThemeProvider palette={testPalette} vibe={testVibe}>
        <div />
      </RendererThemeProvider>
    )

    const root = document.documentElement
    expect(root.style.getPropertyValue('--flow-primary')).toBe('#ff0000')
    expect(root.style.getPropertyValue('--flow-secondary')).toBe('#00ff00')
    expect(root.style.getPropertyValue('--flow-accent')).toBe('#0000ff')
    expect(root.style.getPropertyValue('--flow-background')).toBe('#ffffff')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useRendererTheme must be used within RendererThemeProvider')

    consoleSpy.mockRestore()
  })
})

