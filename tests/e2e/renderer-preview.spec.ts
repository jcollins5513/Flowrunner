import { test, expect } from '@playwright/test'
import { ALL_PATTERN_FAMILIES } from '../../lib/patterns/families'

const VARIANTS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5]

test.describe('Renderer preview smoke screenshots', () => {
  for (const family of ALL_PATTERN_FAMILIES) {
    for (const variant of VARIANTS) {
      test(`${family} variant ${variant} renders consistently`, async ({ page }) => {
        await page.goto(`/renderer-preview?family=${family}&variant=${variant}&palette=0&vibe=modern`)
        const preview = page.locator('[data-testid="renderer-preview-root"]')
        await preview.waitFor()
        await expect(preview).toHaveScreenshot(`${family.toLowerCase()}-variant-${variant}.png`, {
          animations: 'disabled',
          caret: 'hide',
        })
      })
    }
  }
})

