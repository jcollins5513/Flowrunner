import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Form, type FormField } from '@/components/renderer/Form'

describe('Form component', () => {
  it('renders form with title and fields', () => {
    const fields: FormField[] = [
      { id: 'name', label: 'Name', type: 'text' },
      { id: 'email', label: 'Email', type: 'email' },
    ]

    render(<Form content="Test Form" fields={fields} />)

    expect(screen.getByText('Test Form')).toBeVisible()
    expect(screen.getByLabelText('Name')).toBeVisible()
    expect(screen.getByLabelText('Email')).toBeVisible()
  })

  it('renders textarea field type', () => {
    const fields: FormField[] = [
      { id: 'message', label: 'Message', type: 'textarea' },
    ]

    render(<Form content="Contact Form" fields={fields} />)

    const textarea = screen.getByLabelText('Message')
    expect(textarea).toBeVisible()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('renders select field type with options', () => {
    const fields: FormField[] = [
      {
        id: 'country',
        label: 'Country',
        type: 'select',
        options: [
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
        ],
      },
    ]

    render(<Form content="Registration" fields={fields} />)

    expect(screen.getByLabelText('Country')).toBeVisible()
    expect(screen.getByText('United States')).toBeVisible()
    expect(screen.getByText('United Kingdom')).toBeVisible()
  })

  it('renders checkbox field type', () => {
    const fields: FormField[] = [
      { id: 'agree', label: 'I agree to terms', type: 'checkbox' },
    ]

    render(<Form content="Terms" fields={fields} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeVisible()
    expect(screen.getByLabelText(/I agree to terms/)).toBeVisible()
  })

  it('renders radio field type with options', () => {
    const fields: FormField[] = [
      {
        id: 'plan',
        label: 'Plan',
        type: 'radio',
        options: [
          { value: 'basic', label: 'Basic' },
          { value: 'premium', label: 'Premium' },
        ],
      },
    ]

    render(<Form content="Choose Plan" fields={fields} />)

    expect(screen.getByLabelText('Basic')).toBeVisible()
    expect(screen.getByLabelText('Premium')).toBeVisible()
  })

  it('displays validation errors', () => {
    const fields: FormField[] = [
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        validation: { error: 'Invalid email format' },
      },
    ]

    render(<Form content="Sign Up" fields={fields} />)

    expect(screen.getByText('Invalid email format')).toBeVisible()
  })

  it('displays success state', () => {
    const fields: FormField[] = [
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        validation: { success: true },
      },
    ]

    render(<Form content="Sign Up" fields={fields} />)

    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('border-green-500')
  })

  it('calls onSubmit handler on form submit', async () => {
    const onSubmit = vi.fn()
    const fields: FormField[] = [
      { id: 'name', label: 'Name', type: 'text' },
    ]

    render(<Form content="Test" fields={fields} onSubmit={onSubmit} />)

    const input = screen.getByLabelText('Name')
    fireEvent.change(input, { target: { value: 'John Doe' } })

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
    })
  })

  it('shows loading state during submission', async () => {
    const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    const fields: FormField[] = [
      { id: 'name', label: 'Name', type: 'text' },
    ]

    render(<Form content="Test" fields={fields} onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button', { name: 'Submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeVisible()
    })
  })
})

