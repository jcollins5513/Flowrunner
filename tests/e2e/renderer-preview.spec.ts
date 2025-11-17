import { test, expect } from '@playwright/test'

test.describe('Renderer preview', () => {
  test('renders ONB hero top variant deterministically', async ({ page }) => {
    await page.goto('/renderer-preview')
    await page.waitForSelector('[data-testid="renderer-preview-root"]')

    await page.selectOption('[data-testid="family-select"]', 'ONB_HERO_TOP')
    await page.selectOption('[data-testid="variant-select"]', '1')

    const preview = page.locator('[data-testid="renderer-preview-root"]')
    await expect(preview).toHaveScreenshot('onb-hero-top.png', {
      animations: 'disabled',
      caret: 'hide',
    })
  })
})

