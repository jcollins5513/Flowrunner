// E2E coverage for branching flows with DSL persistence

import { test, expect } from '@playwright/test'

test.describe('Navigation flow generation', () => {
  test('click component → generate next screen with persisted DSL and render', async ({ page }) => {
    await page.goto('/flow-playground')

    const firstScreen = page.locator('[data-screen-id="screen-1"]')
    await expect(firstScreen).toBeVisible()

    const firstButton = firstScreen.locator('[data-component-type="button"]')
    await firstButton.first().click()

    await expect(page.getByText('Navigation action')).toBeVisible()

    const generateButton = page.locator('[data-flow-interactive-menu] button:has-text("Generate next screen")')
    await generateButton.click()

    const secondScreen = page.locator('[data-screen-id="screen-2"]')
    await expect(secondScreen).toBeVisible({ timeout: 10000 })

    await expect(secondScreen).toHaveAttribute('data-pattern-family', /.+/)
    const heroId = await secondScreen.getAttribute('data-hero-image-id')
    expect(heroId).toBeTruthy()

    const heroImageCount = await secondScreen.locator('img').count()
    expect(heroImageCount).toBeGreaterThan(0)

    const titleText = await secondScreen.locator('[data-component-type="title"]').first().textContent()
    expect(titleText?.trim().length).toBeGreaterThan(0)

    await expect(page.locator('[data-screen-id="screen-1"]')).toBeVisible()
  })
})
