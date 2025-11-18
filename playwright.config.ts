import { defineConfig } from '@playwright/test'

const snapshotProjects = process.env.SNAPSHOTS
  ? [
      {
        name: 'snapshots',
        testMatch: /export-snapshots\.spec\.ts/,
      },
    ]
  : []

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'default',
      testIgnore: /export-snapshots\.spec\.ts/,
    },
    ...snapshotProjects,
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

