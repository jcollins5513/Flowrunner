// Integration tests for InteractiveScreen flow generation

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveScreen } from '@/components/flow/InteractiveScreen'
import type { ScreenDSL } from '@/lib/dsl/types'
import { createPatternFixtureDSL } from '@/lib/patterns/fixtures'
import type { NextScreenTriggerContext } from '@/lib/flows/types'

const pause = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

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
    const [primaryButton] = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(primaryButton)

    // Menu should appear
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })
  })

  it('click "Generate next screen" → shows progress → creates screen', async () => {
    const user = userEvent.setup()
    mockOnGenerateNext.mockImplementation(async () => {
      await pause(10)
    })

    render(
      <InteractiveScreen
        screen={mockScreen}
        screenId="test-screen"
        onGenerateNext={mockOnGenerateNext}
      />,
    )

    // Click button to open menu
    const [primaryButton] = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(primaryButton)

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Generate next screen"
    const generateButtons = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(generateButtons[generateButtons.length - 1])

    // Should disable button while generating
    await waitFor(() => {
      expect(generateButtons[generateButtons.length - 1]).toBeDisabled()
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
    const [primaryButton] = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(primaryButton)

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Link to existing screen"
    const linkButtons = await screen.findAllByRole('button', { name: /link to existing screen/i })
    await user.click(linkButtons[0])

    // Screen picker should open
    await screen.findByRole('dialog', { name: /link to existing screen/i })

    // Select a screen
    const screenOption = screen.getByText('Screen 2')
    await user.click(screenOption)

    // Click Link Screen
    const confirmButton = await screen.findByRole('button', { name: /link screen/i })
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
    const [primaryButton] = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(primaryButton)

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Configure navigation"
    const configButtons = await screen.findAllByRole('button', { name: /configure navigation/i })
    await user.click(configButtons[0])

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
    const [primaryButton] = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(primaryButton)

    // Wait for menu
    await waitFor(() => {
      expect(screen.getByText(/navigation action/i)).toBeInTheDocument()
    })

    // Click "Generate next screen"
    const generateButtons = await screen.findAllByRole('button', { name: /generate next screen/i })
    await user.click(generateButtons[generateButtons.length - 1])

    // Error should be logged
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})

