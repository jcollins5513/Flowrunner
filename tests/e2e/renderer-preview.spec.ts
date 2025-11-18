import { test, expect } from '@playwright/test'

test.describe('Renderer preview', () => {
  test('renders ONB hero top variant deterministically', async ({ page }) => {
    await page.goto('/renderer-preview?family=ONB_HERO_TOP&variant=1&palette=0&vibe=modern')
    await page.waitForSelector('[data-testid="renderer-preview-root"]')

    const preview = page.locator('[data-testid="renderer-preview-root"]')
    await expect(preview).toHaveScreenshot('onb-hero-top.png', {
      animations: 'disabled',
      caret: 'hide',
    })
  })
})

