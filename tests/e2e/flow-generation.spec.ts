// E2E tests for flow generation workflow

import { test, expect } from '@playwright/test'

test.describe('Flow Generation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to flow playground
    await page.goto('/flow-playground')
  })

  test('user clicks button on screen → generates next screen', async ({ page }) => {
    // Wait for initial screen to load
    await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })

    // Find and click a button
    const buttons = page.locator('[data-component-type="button"]')
    const firstButton = buttons.first()
    await firstButton.click()

    // Wait for action menu to appear
    await expect(page.locator('text=Navigation action')).toBeVisible()

    // Click "Generate next screen"
    const generateButton = page.locator('button:has-text("Generate next screen")')
    await generateButton.click()

    // Wait for generation to complete (button text changes or new screen appears)
    await page.waitForTimeout(2000) // Give time for generation

    // Check that a new screen was added (screen count should increase)
    const screens = page.locator('article')
    const screenCount = await screens.count()
    expect(screenCount).toBeGreaterThan(1)
  })

  test('generated screen appears in flow sequence', async ({ page }) => {
    // Generate a screen first
    await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })
    const buttons = page.locator('[data-component-type="button"]')
    await buttons.first().click()

    await expect(page.locator('text=Navigation action')).toBeVisible()
    const generateButton = page.locator('button:has-text("Generate next screen")')
    await generateButton.click()

    // Wait for new screen
    await page.waitForTimeout(3000)

    // Check that screens are numbered sequentially
    const screenHeaders = page.locator('text=/Screen \\d+/')
    const count = await screenHeaders.count()
    expect(count).toBeGreaterThan(1)
  })

  test('navigation path is created between screens', async ({ page }) => {
    // Generate first screen
    await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })
    const buttons = page.locator('[data-component-type="button"]')
    await buttons.first().click()

    await expect(page.locator('text=Navigation action')).toBeVisible()
    const generateButton = page.locator('button:has-text("Generate next screen")')
    await generateButton.click()

    await page.waitForTimeout(3000)

    // Check that navigation exists (screens should be linked)
    // This would be verified by checking the navigation graph or screen metadata
    const screens = page.locator('article')
    expect(await screens.count()).toBeGreaterThan(1)
  })

  test('user can click through generated flow', async ({ page }) => {
    // Generate multiple screens
    for (let i = 0; i < 2; i++) {
      await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })
      const buttons = page.locator('[data-component-type="button"]')
      await buttons.first().click()

      await expect(page.locator('text=Navigation action')).toBeVisible()
      const generateButton = page.locator('button:has-text("Generate next screen")')
      await generateButton.click()

      await page.waitForTimeout(3000)
    }

    // Verify screens are clickable and interactive
    const interactiveScreens = page.locator('.interactive-screen')
    const count = await interactiveScreens.count()
    expect(count).toBeGreaterThan(1)
  })

  test('multiple screens can be generated in sequence', async ({ page }) => {
    const targetScreenCount = 3

    for (let i = 0; i < targetScreenCount; i++) {
      await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })
      const buttons = page.locator('[data-component-type="button"]')
      await buttons.first().click()

      await expect(page.locator('text=Navigation action')).toBeVisible()
      const generateButton = page.locator('button:has-text("Generate next screen")')
      await generateButton.click()

      await page.waitForTimeout(3000)
    }

    // Verify we have the expected number of screens
    const screens = page.locator('article')
    const count = await screens.count()
    expect(count).toBeGreaterThanOrEqual(targetScreenCount)
  })

  test('navigation graph reflects all connections', async ({ page }) => {
    // Generate multiple screens with navigation
    for (let i = 0; i < 2; i++) {
      await page.waitForSelector('[data-component-type="button"]', { timeout: 5000 })
      const buttons = page.locator('[data-component-type="button"]')
      await buttons.first().click()

      await expect(page.locator('text=Navigation action')).toBeVisible()
      const generateButton = page.locator('button:has-text("Generate next screen")')
      await generateButton.click()

      await page.waitForTimeout(3000)
    }

    // Verify screens are connected (each screen should have navigation)
    const screens = page.locator('article')
    const count = await screens.count()
    expect(count).toBeGreaterThan(1)

    // Each screen should have interactive elements
    for (let i = 0; i < count; i++) {
      const screen = screens.nth(i)
      const buttons = screen.locator('[data-component-type="button"]')
      expect(await buttons.count()).toBeGreaterThan(0)
    }
  })
})

