import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SupportingImages } from '@/components/renderer/SupportingImages'
import { type HeroImage } from '@/lib/dsl/types'

describe('SupportingImages component', () => {
  const mockImages: HeroImage[] = [
    {
      id: 'support-1',
      url: 'https://example.com/image1.jpg',
      prompt: 'Support image 1',
    },
    {
      id: 'support-2',
      url: 'https://example.com/image2.jpg',
      prompt: 'Support image 2',
    },
  ]

  it('renders nothing when images array is empty', () => {
    const { container } = render(<SupportingImages images={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders supporting images in grid layout by default', () => {
    const { container } = render(<SupportingImages images={mockImages} lazy={false} />)

    // Images should be rendered in a grid
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('gap-4', 'w-full')
  })

  it('renders in list layout when specified', () => {
    const { container } = render(<SupportingImages images={mockImages} layout="list" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'flex-col')
  })

  it('renders in carousel layout when specified', () => {
    const { container } = render(<SupportingImages images={mockImages} layout="carousel" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'overflow-x-auto')
  })

  it('respects pattern-defined placements when provided', () => {
    const mockPattern = {
      imagePlacement: {
        hero: { position: 'top', size: 'full' },
        supporting: [
          { position: 'left', size: 'third' },
          { position: 'right', size: 'third' },
        ],
      },
      layout: { structure: 'grid' as const },
    }

    const { container } = render(<SupportingImages images={mockImages} pattern={mockPattern as any} lazy={false} />)

    // Should render images with pattern-defined positions in grid layout
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    
    // Should have image containers
    const imageContainers = container.querySelectorAll('.relative.w-full.aspect-video')
    expect(imageContainers.length).toBe(2)
  })
})

