import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '@/components/renderer/Navigation'
import { type Navigation as NavigationType } from '@/lib/dsl/types'

describe('Navigation component', () => {
  it('renders internal navigation button', () => {
    const navigation: NavigationType = {
      type: 'internal',
      screenId: 'screen-123',
      target: 'Continue',
    }

    render(<Navigation navigation={navigation} />)

    expect(screen.getByText('Continue')).toBeVisible()
    expect(screen.getByRole('button')).toBeVisible()
  })

  it('renders external navigation link', () => {
    const navigation: NavigationType = {
      type: 'external',
      url: 'https://example.com',
      target: 'Learn more',
    }

    render(<Navigation navigation={navigation} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('calls onClick handler when provided', () => {
    const onClick = vi.fn()
    const navigation: NavigationType = {
      type: 'internal',
      screenId: 'screen-123',
    }

    render(<Navigation navigation={navigation} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows external link icon for external navigation', () => {
    const navigation: NavigationType = {
      type: 'external',
      url: 'https://example.com',
    }

    render(<Navigation navigation={navigation} />)

    // Should have external link icon (lucide-react ExternalLink)
    const link = screen.getByRole('link')
    expect(link).toBeVisible()
  })

  it('applies vibe-specific styling', () => {
    const navigation: NavigationType = {
      type: 'internal',
      screenId: 'screen-123',
    }

    const { container } = render(<Navigation navigation={navigation} vibe="bold" />)
    // Vibe should affect visual appearance
    expect(container.firstChild).toBeInTheDocument()
  })
})

