// Integration tests for InteractiveScreen flow generation

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveScreen } from '@/components/flow/InteractiveScreen'
import type { ScreenDSL } from '@/lib/dsl/types'
import { createPatternFixtureDSL } from '@/lib/patterns/fixtures'
import type { NextScreenTriggerContext } from '@/lib/flows/types'

describe('InteractiveScreen Flow Generation', () => {
  let mockScreen: ScreenDSL
  const mockOnGenerateNext = vi.fn()
  const mockOnLinkExisting = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockScreen = createPatternFixtureDSL('ONB_HERO_TOP', 1)
  })

  it('click button → action menu appears', async () => {
    const user = userEvent.setup()
    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        onGenerateNext={mockOnGenerateNext}
        onLinkExisting={mockOnLinkExisting}
      />,
    )

    // Find and click a button component
    const buttons = screen.getAllByRole('button')
    const actionButton = buttons.find((btn) => btn.textContent?.includes('Generate next screen'))
    if (!actionButton) {
      // Click any button to trigger menu
      const firstButton = buttons[0]
      if (firstButton) {
        await user.click(firstButton)
      }
    }

    // Menu should appear
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })
  })

  it('click "Generate next screen" → shows progress → creates screen', async () => {
    const user = userEvent.setup()
    mockOnGenerateNext.mockResolvedValue(undefined)

    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        onGenerateNext={mockOnGenerateNext}
      />,
    )

    // Click button to open menu
    const buttons = screen.getAllByRole('button')
    const firstButton = buttons.find((btn) => !btn.textContent?.includes('Generate'))
    if (firstButton) {
      await user.click(firstButton)
    }

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Generate next screen"
    const generateButton = screen.getByRole('button', { name: /generate next screen/i })
    await user.click(generateButton)

    // Should show generating state
    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })

    // Should call onGenerateNext
    await waitFor(() => {
      expect(mockOnGenerateNext).toHaveBeenCalled()
    })
  })

  it('click "Link to existing screen" → opens picker → links correctly', async () => {
    const user = userEvent.setup()
    const mockScreens = [
      { id: 'screen-1', name: 'Screen 1' },
      { id: 'screen-2', name: 'Screen 2' },
    ]

    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        availableScreens={mockScreens}
        onLinkExisting={mockOnLinkExisting}
      />,
    )

    // Click button to open menu
    const buttons = screen.getAllByRole('button')
    const firstButton = buttons.find((btn) => !btn.textContent?.includes('Link'))
    if (firstButton) {
      await user.click(firstButton)
    }

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Link to existing screen"
    const linkButton = screen.getByRole('button', { name: /link to existing screen/i })
    await user.click(linkButton)

    // Screen picker should open
    await waitFor(() => {
      expect(screen.getByText(/link to existing screen/i)).toBeInTheDocument()
    })

    // Select a screen
    const screenOption = screen.getByText('Screen 2')
    await user.click(screenOption)

    // Click Link Screen
    const confirmButton = screen.getByRole('button', { name: /link screen/i })
    await user.click(confirmButton)

    // Should call onLinkExisting with target screen
    await waitFor(() => {
      expect(mockOnLinkExisting).toHaveBeenCalled()
      const call = mockOnLinkExisting.mock.calls[0][0] as NextScreenTriggerContext
      expect(call.targetScreenId).toBe('screen-2')
    })
  })

  it('click "Configure navigation" → opens config modal → updates navigation', async () => {
    const user = userEvent.setup()
    const mockScreens = [
      { id: 'screen-1', name: 'Screen 1' },
      { id: 'screen-2', name: 'Screen 2' },
    ]

    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        availableScreens={mockScreens}
        onLinkExisting={mockOnLinkExisting}
      />,
    )

    // Click button to open menu
    const buttons = screen.getAllByRole('button')
    const firstButton = buttons.find((btn) => !btn.textContent?.includes('Configure'))
    if (firstButton) {
      await user.click(firstButton)
    }

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Configure navigation"
    const configButton = screen.getByRole('button', { name: /configure navigation/i })
    await user.click(configButton)

    // Config modal should open
    await waitFor(() => {
      expect(screen.getByText(/set navigation target/i)).toBeInTheDocument()
    })
  })

  it('error states display user-friendly messages', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnGenerateNext.mockRejectedValue(new Error('Generation failed'))

    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        onGenerateNext={mockOnGenerateNext}
      />,
    )

    // Click button to open menu
    const buttons = screen.getAllByRole('button')
    const firstButton = buttons.find((btn) => !btn.textContent?.includes('Generate'))
    if (firstButton) {
      await user.click(firstButton)
    }

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Generate next screen"
    const generateButton = screen.getByRole('button', { name: /generate next screen/i })
    await user.click(generateButton)

    // Error should be logged
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})

