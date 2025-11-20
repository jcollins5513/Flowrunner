import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { usePatternConfig, useResponsiveBreakpoint } from '@/lib/renderer/hooks'
import { ContainerProvider } from '@/lib/renderer/container-queries'
import { type PatternDefinition } from '@/lib/patterns/schema'

// Mock window.innerWidth
const mockWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

// Test component for usePatternConfig
function TestPatternConfig({ pattern }: { pattern: PatternDefinition | null }) {
  const config = usePatternConfig(pattern, 'desktop')
  return (
    <div>
      <div data-testid="padding">{config.padding}</div>
      <div data-testid="gap">{config.gap}</div>
      <div data-testid="gridTemplate">{config.gridTemplate}</div>
    </div>
  )
}

// Test component for useResponsiveBreakpoint
function TestBreakpoint() {
  const breakpoint = useResponsiveBreakpoint()
  return <div data-testid="breakpoint">{breakpoint}</div>
}

describe('Renderer hooks', () => {
  describe('usePatternConfig', () => {
    const mockPattern: PatternDefinition = {
      family: 'ONB_HERO_TOP',
      variant: 1,
      name: 'Test Pattern',
      description: 'Test description',
      layout: {
        structure: 'grid',
        gridTemplate: '1fr 1fr',
        positions: {
          hero_image: { x: 0, y: 0, width: 2, height: 1 },
        },
      },
      componentSlots: {
        required: ['title'],
        optional: ['subtitle'],
      },
      spacing: {
        padding: 24,
        gap: 16,
      },
      responsive: {
        breakpoints: {
          mobile: { padding: 16, gap: 12 },
          tablet: { padding: 20, gap: 14 },
          desktop: { padding: 24, gap: 16 },
        },
      },
      imagePlacement: {
        hero: { position: 'top', size: 'full' },
      },
    }

    it('returns pattern config for desktop breakpoint', () => {
      render(<TestPatternConfig pattern={mockPattern} />)

      expect(screen.getByTestId('padding')).toHaveTextContent('24')
      expect(screen.getByTestId('gap')).toHaveTextContent('16')
      expect(screen.getByTestId('gridTemplate')).toHaveTextContent('1fr 1fr')
    })

    it('returns fallback config when pattern is null', () => {
      render(<TestPatternConfig pattern={null} />)

      expect(screen.getByTestId('padding')).toHaveTextContent('24')
      expect(screen.getByTestId('gap')).toHaveTextContent('24')
      expect(screen.getByTestId('gridTemplate')).toHaveTextContent('1fr')
    })
  })

  describe('useResponsiveBreakpoint', () => {
    beforeEach(() => {
      mockWindowWidth(1920)
    })

    it('returns desktop for large screens', () => {
      mockWindowWidth(1920)
      render(<TestBreakpoint />)

      expect(screen.getByTestId('breakpoint')).toHaveTextContent('desktop')
    })

    it('returns tablet for medium screens', async () => {
      mockWindowWidth(768)
      render(<TestBreakpoint />)

      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('tablet')
      })
    })

    it('returns mobile for small screens', async () => {
      mockWindowWidth(500)
      render(<TestBreakpoint />)

      await waitFor(() => {
        expect(screen.getByTestId('breakpoint')).toHaveTextContent('mobile')
      })
    })
  })
})

