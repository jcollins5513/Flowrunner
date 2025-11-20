import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundaryBase, ScreenRendererErrorBoundary, ComponentRendererErrorBoundary } from '@/components/renderer/ErrorBoundary'

// Component that throws error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('Error boundaries', () => {
  // Suppress console.error for these tests
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('catches errors and displays error UI', () => {
    render(
      <ErrorBoundaryBase>
        <ThrowError shouldThrow />
      </ErrorBoundaryBase>
    )

    expect(screen.getByText(/Rendering Error/i)).toBeVisible()
    expect(screen.getByText(/Test error/)).toBeVisible()
  })

  it('shows retry button by default', () => {
    render(
      <ErrorBoundaryBase>
        <ThrowError shouldThrow />
      </ErrorBoundaryBase>
    )

    expect(screen.getByText(/Retry/i)).toBeVisible()
  })

  it('allows custom fallback', () => {
    render(
      <ErrorBoundaryBase fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow />
      </ErrorBoundaryBase>
    )

    expect(screen.getByText('Custom fallback')).toBeVisible()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundaryBase>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryBase>
    )

    expect(screen.getByText('No error')).toBeVisible()
    expect(screen.queryByText(/Rendering Error/i)).not.toBeInTheDocument()
  })

  it('ScreenRendererErrorBoundary includes pattern context', () => {
    const onError = vi.fn()

    render(
      <ScreenRendererErrorBoundary
        onError={onError}
        patternFamily="ONB_HERO_TOP"
        patternVariant={1}
      >
        <ThrowError shouldThrow />
      </ScreenRendererErrorBoundary>
    )

    expect(screen.getByText(/ONB_HERO_TOP/i)).toBeVisible()
  })

  it('ComponentRendererErrorBoundary includes component context', () => {
    render(
      <ComponentRendererErrorBoundary componentType="button" slotName="cta">
        <ThrowError shouldThrow />
      </ComponentRendererErrorBoundary>
    )

    expect(screen.getByText(/button/i)).toBeVisible()
    expect(screen.getByText(/cta/i)).toBeVisible()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundaryBase onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundaryBase>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
      undefined
    )
  })
})

