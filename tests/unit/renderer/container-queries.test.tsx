import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContainerProvider, useContainerBreakpoint, CONTAINER_BREAKPOINTS } from '@/lib/renderer/container-queries'

// Component to test hook
function TestComponent() {
  const breakpoint = useContainerBreakpoint()
  return <div data-testid="breakpoint">{breakpoint}</div>
}

describe('Container queries', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation((callback) => {
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('provides container breakpoint context', () => {
    render(
      <ContainerProvider>
        <TestComponent />
      </ContainerProvider>
    )

    expect(screen.getByTestId('breakpoint')).toBeInTheDocument()
  })

  it('throws error when used outside ContainerProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useContainerQuery must be used within ContainerProvider')

    consoleSpy.mockRestore()
  })

  it('has correct breakpoint thresholds', () => {
    expect(CONTAINER_BREAKPOINTS.mobile).toBe(640)
    expect(CONTAINER_BREAKPOINTS.tablet).toBe(1024)
    expect(CONTAINER_BREAKPOINTS.desktop).toBe(Number.POSITIVE_INFINITY)
  })
})

