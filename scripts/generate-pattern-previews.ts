#!/usr/bin/env tsx
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { chromium, type Browser } from 'playwright'
import { ALL_PATTERN_FAMILIES, type PatternFamily } from '../lib/patterns/families'
import { PATTERN_FAMILY_METADATA } from '../lib/patterns/metadata'
import { createPatternFixtureDSL, PREVIEW_PALETTES } from '../lib/patterns/fixtures'
import { type PatternVariant, type Palette, type Vibe } from '../lib/dsl/types'

const VARIANTS: PatternVariant[] = [1, 2, 3, 4, 5]
const PREVIEW_DIR = path.join(process.cwd(), 'public', 'pattern-previews')
const PREVIEW_JSON_PATH = path.join(process.cwd(), 'lib', 'patterns', 'previews.json')
const DEFAULT_PORT = 4311

interface PreviewEntry {
  family: PatternFamily
  variant: PatternVariant
  displayName: string
  description: string
  domain: string
  thumbnail: string
  palette: Palette
  vibe: Vibe
  tags: string[]
  requiredSlots: string[]
  optionalSlots: string[]
}

async function ensurePreviewDirectory() {
  await mkdir(PREVIEW_DIR, { recursive: true })
}

async function startDevServer() {
  const baseUrlFromEnv = process.env.PATTERN_PREVIEW_BASE_URL
  if (baseUrlFromEnv) {
    return { baseUrl: baseUrlFromEnv, close: async () => {} }
  }

  const port = Number(process.env.PATTERN_PREVIEW_PORT ?? DEFAULT_PORT)
  const host = '127.0.0.1'
  const nextBinary = path.join(process.cwd(), 'node_modules', '.bin', 'next')
  const server = spawn(nextBinary, ['dev', '-p', String(port), '--hostname', host], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const readyPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.kill('SIGINT')
      reject(new Error('Timed out waiting for dev server to start'))
    }, 30_000)

    const handleOutput = (data: Buffer) => {
      const text = data.toString()
      if (text.toLowerCase().includes('started server')) {
        server.stdout.off('data', handleOutput)
        clearTimeout(timeout)
        resolve()
      }
    }
    server.stdout.on('data', handleOutput)
    server.stderr.on('data', (data) => {
      const text = data.toString()
      if (text.toLowerCase().includes('error')) {
        clearTimeout(timeout)
        reject(new Error(`Next dev server error: ${text}`))
      }
    })
    server.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })

  await readyPromise

  const baseUrl = `http://${host}:${port}/renderer-preview`
  const close = async () => {
    server.kill('SIGINT')
    await once(server, 'exit').catch(() => {})
  }

  return { baseUrl, close }
}

async function capturePreviews(browser: Browser, baseUrl: string) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const previews: PreviewEntry[] = []

  for (const family of ALL_PATTERN_FAMILIES) {
    for (const variant of VARIANTS) {
      const url = `${baseUrl}?family=${family}&variant=${variant}&palette=0&vibe=modern`
      await page.goto(url, { waitUntil: 'networkidle' })
      const locator = page.locator('[data-testid="renderer-preview-root"]')
      await locator.waitFor({ state: 'visible', timeout: 30_000 })

      const fileName = `${family.toLowerCase()}-variant-${variant}.jpg`
      const absolutePath = path.join(PREVIEW_DIR, fileName)
      await locator.screenshot({
        path: absolutePath,
        animations: 'disabled',
      })

      const metadata = PATTERN_FAMILY_METADATA[family]
      const fixture = createPatternFixtureDSL(family, variant, {
        paletteOverride: PREVIEW_PALETTES[0],
        vibe: 'modern',
      })

      previews.push({
        family,
        variant,
        displayName: metadata.displayName,
        description: metadata.description,
        domain: metadata.domain,
        thumbnail: `/pattern-previews/${fileName}`,
        palette: fixture.palette,
        vibe: fixture.vibe,
        tags: metadata.useCases,
        requiredSlots: metadata.componentSlots.required,
        optionalSlots: metadata.componentSlots.optional,
      })
      console.log(`Captured preview for ${family} variant ${variant}`)
    }
  }

  await page.close()
  return previews
}

async function writePreviewMetadata(entries: PreviewEntry[]) {
  const sortedEntries = entries.sort((a, b) => {
    if (a.family === b.family) {
      return a.variant - b.variant
    }
    return ALL_PATTERN_FAMILIES.indexOf(a.family) - ALL_PATTERN_FAMILIES.indexOf(b.family)
  })

  await writeFile(PREVIEW_JSON_PATH, JSON.stringify(sortedEntries, null, 2))
}

async function main() {
  await ensurePreviewDirectory()
  const server = await startDevServer()
  const browser = await chromium.launch()

  try {
    const entries = await capturePreviews(browser, server.baseUrl)
    await writePreviewMetadata(entries)
    console.log(`✅ Generated ${entries.length} pattern preview entries.`)
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((error) => {
  console.error('Failed to generate pattern previews:', error)
  process.exitCode = 1
})

