import { test, expect } from '@playwright/test'

const SNAPSHOT_CASES = [
  { family: 'ONB_HERO_TOP', variant: '1', palette: '0', vibe: 'modern' },
  { family: 'FEAT_IMAGE_TEXT_RIGHT', variant: '1', palette: '1', vibe: 'bold' },
]

test.describe('Renderer preview snapshots for exports', () => {
  test.skip(!process.env.SNAPSHOTS, 'Only run when SNAPSHOTS=1 for export baselines')

  SNAPSHOT_CASES.forEach((scenario) => {
    test(`captures ${scenario.family} v${scenario.variant} palette ${scenario.palette}`, async ({ page }) => {
      await page.goto(
        `/renderer-preview?family=${scenario.family}&variant=${scenario.variant}&palette=${scenario.palette}&vibe=${scenario.vibe}`
      )
      await page.waitForSelector('[data-testid="renderer-preview-root"]')

      const preview = page.locator('[data-testid="renderer-preview-root"]')
      await expect(preview).toHaveScreenshot(
        `${scenario.family.toLowerCase()}-v${scenario.variant}-palette-${scenario.palette}.png`,
        {
          animations: 'disabled',
          caret: 'hide',
        }
      )
    })
  })
})
