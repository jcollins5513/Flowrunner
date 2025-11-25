import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { HeroImage } from '@/components/renderer/HeroImage'
import { type HeroImage as HeroImageType } from '@/lib/dsl/types'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt} />
  },
}))

describe('HeroImage component', () => {
  const mockImage: HeroImageType = {
    id: 'test-hero',
    url: 'https://example.com/image.jpg',
    prompt: 'Test hero image',
    aspectRatio: '16/9',
  }

  beforeEach(() => {
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
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

  it('renders hero image with correct src', () => {
    render(<HeroImage image={mockImage} priority />)

    const img = screen.getByAltText('Test hero image')
    expect(img).toBeVisible()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('renders placeholder while loading when lazy', async () => {
    const { container } = render(<HeroImage image={mockImage} lazy />)

    // Placeholder should be visible initially (not an img role, it's a div)
    const placeholder = container.querySelector('.relative.w-full')
    expect(placeholder).toBeInTheDocument()
  })

  it('renders image immediately when priority is true', () => {
    render(<HeroImage image={mockImage} priority />)

    const img = screen.getByAltText('Test hero image')
    expect(img).toBeVisible()
  })

  it('applies aspect ratio from image metadata', () => {
    const { container } = render(
      <HeroImage image={{ ...mockImage, aspectRatio: '4/3' }} />
    )

    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle({ aspectRatio: '4/3' })
  })

  it('renders error state when image fails to load', async () => {
    render(<HeroImage image={mockImage} />)

    const img = screen.getByAltText('Test hero image')
    fireEvent(img, new Event('error'))

    await waitFor(() => {
      expect(screen.getByText('Failed to load image')).toBeVisible()
    })
  })

  it('allows retry when image fails', async () => {
    render(<HeroImage image={mockImage} />)

    const img = screen.getByAltText('Test hero image')
    fireEvent(img, new Event('error'))

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeVisible()
    })

    const retryButton = screen.getByText('Retry')
    fireEvent.click(retryButton)

    // Should attempt to reload image
    await waitFor(() => {
      expect(screen.getByAltText('Test hero image')).toBeVisible()
    })
  })
})

