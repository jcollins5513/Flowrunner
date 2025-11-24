// Unit tests for navigation options (Phase 12.1)

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScreenPickerModal } from '@/components/flow/ScreenPickerModal'
import { NavigationConfigModal } from '@/components/editing/NavigationConfigModal'
import type { ScreenDSL } from '@/lib/dsl/types'
import { createPatternFixtureDSL } from '@/lib/patterns/fixtures'
import React from 'react'

beforeAll(() => {
  ;(Element.prototype as any).hasPointerCapture = () => false
  ;(Element.prototype as any).setPointerCapture = () => {}
  ;(Element.prototype as any).releasePointerCapture = () => {}
  ;(Element.prototype as any).scrollIntoView = () => {}
})

describe('ScreenPickerModal', () => {
  const mockScreens = [
    { id: 'screen-1', name: 'Welcome Screen', description: 'Onboarding start' },
    { id: 'screen-2', name: 'Dashboard', description: 'Main dashboard' },
    { id: 'screen-3', name: 'Settings', description: 'User settings' },
  ]

  it('renders and lists available screens', () => {
    const onSelect = vi.fn()
    render(
      <ScreenPickerModal
        open={true}
        onOpenChange={vi.fn()}
        screens={mockScreens}
        sourceScreenId="source-screen"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('Welcome Screen')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('excludes source screen from list', () => {
    const onSelect = vi.fn()
    render(
      <ScreenPickerModal
        open={true}
        onOpenChange={vi.fn()}
        screens={mockScreens}
        sourceScreenId="screen-1"
        onSelect={onSelect}
      />,
    )

    expect(screen.queryByText('Welcome Screen')).not.toBeInTheDocument()
  })

  it('shows empty state when no screens available', () => {
    render(
      <ScreenPickerModal
        open={true}
        onOpenChange={vi.fn()}
        screens={[{ id: 'screen-1', name: 'Only Screen' }]}
        sourceScreenId="screen-1"
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByText('No other screens available')).toBeInTheDocument()
  })

  it('calls onSelect when screen is selected', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <ScreenPickerModal
        open={true}
        onOpenChange={onOpenChange}
        screens={mockScreens}
        sourceScreenId="screen-1"
        onSelect={onSelect}
      />,
    )

    // Find and click a screen option
    const dashboardButton = screen.getByText('Dashboard').closest('button')
    if (dashboardButton) {
      await user.click(dashboardButton)
    }

    // Click Link Screen button
    const linkButton = screen.getByRole('button', { name: /link screen/i })
    await user.click(linkButton)

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith('screen-2')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})

describe('NavigationConfigModal', () => {
  const mockDSL: ScreenDSL = createPatternFixtureDSL('ONB_HERO_TOP', 1)
  const mockScreens = [
    { id: 'screen-1', name: 'Welcome' },
    { id: 'screen-2', name: 'Dashboard' },
  ]

  it('opens and displays component information', () => {
    render(
      <NavigationConfigModal
        open={true}
        onOpenChange={vi.fn()}
        dsl={mockDSL}
        screenId="screen-0"
        componentIndex={0}
        availableScreens={mockScreens}
        onNavigationSet={vi.fn()}
      />,
    )

    expect(screen.getByText('Set Navigation Target')).toBeInTheDocument()
  })

  it('sets target screen correctly', async () => {
    const user = userEvent.setup()
    const onNavigationSet = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <NavigationConfigModal
        open={true}
        onOpenChange={onOpenChange}
        dsl={mockDSL}
        screenId="screen-0"
        componentIndex={0}
        availableScreens={mockScreens}
        onNavigationSet={onNavigationSet}
      />,
    )

    // Select target screen
    const select = screen.getByRole('combobox')
    await user.click(select)
    const option = await screen.findByText('Dashboard')
    await user.click(option)

    // Click Set Navigation
    const setButton = screen.getByRole('button', { name: /set navigation/i })
    await user.click(setButton)

    await waitFor(() => {
      expect(onNavigationSet).toHaveBeenCalledWith('screen-2')
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})

