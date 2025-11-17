import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { renderComponent } from '@/lib/renderer/component-factory'

describe('renderer component factory', () => {
  it('renders a title component', () => {
    render(
      renderComponent({
        component: { type: 'title', content: 'FlowRunner' },
      }),
    )

    expect(screen.getByRole('heading', { level: 1, name: 'FlowRunner' })).toBeVisible()
  })

  it('handles button clicks', () => {
    const handleClick = vi.fn()
    render(
      renderComponent({
        component: { type: 'button', content: 'Generate' },
        onClick: handleClick,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders form fields with submit label', () => {
    render(
      renderComponent({
        component: {
          type: 'form',
          content: 'Join beta',
          props: {
            fields: [
              { id: 'name', label: 'Name', placeholder: 'Jane' },
              { id: 'email', label: 'Email', placeholder: 'jane@example.com' },
            ],
            submitLabel: 'Request access',
          },
        },
      }),
    )

    expect(screen.getByText('Join beta')).toBeVisible()
    expect(screen.getByLabelText('Name')).toHaveAttribute('placeholder', 'Jane')
    expect(screen.getByRole('button', { name: 'Request access' })).toBeVisible()
  })

  it('falls back for image components without URL', () => {
    render(
      renderComponent({
        component: { type: 'image', content: 'Placeholder image' },
      }),
    )

    expect(screen.getByText('Placeholder image')).toBeVisible()
  })
})

