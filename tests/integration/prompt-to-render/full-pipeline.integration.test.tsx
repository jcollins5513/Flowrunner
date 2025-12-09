import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { assembleScreenFromPrompt } from '@/lib/flow/prompt-to-render'
import { ScreenRenderer } from '@/components/renderer/ScreenRenderer'
import { prisma } from '@/lib/db/client'
import * as dslValidator from '@/lib/dsl/validator'
import * as patternValidator from '@/lib/patterns/validator'
import * as heroPersistence from '@/lib/db/hero-image-persistence'
import * as dslPersistence from '@/lib/db/dsl-persistence'
import {
  createDeterministicInterpreter,
  createDeterministicOrchestrator,
  deterministicPalette,
  deterministicVibe,
  mockImageAnalysis,
  pipelinePrompt,
} from '../../fixtures/prompt-pipeline'

const createFlowFixture = async () =>
  prisma.flow.create({
    data: {
      name: 'Integration Flow',
      description: 'Covers prompt intake through render',
      domain: 'saas',
      theme: 'minimal',
      style: 'illustrated',
      userId: 'integration-user',
      isPublic: false,
    },
  })

const mockObservers = () => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  })) as unknown as typeof ResizeObserver

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  })) as unknown as typeof IntersectionObserver
}

describe('Prompt → pattern → DSL → persistence → render', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockObservers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockObservers()
  })

  it('runs the deterministic pipeline end-to-end with persisted assets', async () => {
    const { paletteSpy, vibeSpy } = mockImageAnalysis()
    const flow = await createFlowFixture()

    const result = await assembleScreenFromPrompt(pipelinePrompt, {
      interpreterOptions: { interpreter: createDeterministicInterpreter() },
      imageOrchestrator: createDeterministicOrchestrator(),
      flowId: flow.id,
      persist: true,
    })

    expect(paletteSpy).toHaveBeenCalled()
    expect(vibeSpy).toHaveBeenCalled()

    expect(result.intent.domain).toBe('saas')
    expect(result.template.id).toBe('saas-onboarding-v1')
    expect(result.plan.pattern.family).toBe('ONB_HERO_TOP')

    expect(result.heroImage.image.url).toContain('integration-hero.png')
    expect(result.heroImage.palette).toEqual(deterministicPalette)
    expect(result.heroImage.vibe).toBe(deterministicVibe.vibe)

    expect(result.screenDSL.hero_image.id).toBeTruthy()
    expect(result.screenDSL.palette.primary).toBe(deterministicPalette.primary)
    expect(result.screenDSL.vibe).toBe(deterministicVibe.vibe)

    const storedScreen = await prisma.screen.findUnique({ where: { id: result.screenId! } })
    const storedImage = await prisma.image.findUnique({ where: { id: result.heroImage.imageId! } })

    expect(storedScreen?.flowId).toBe(flow.id)
    expect(storedScreen?.heroImageId).toBe(result.heroImage.imageId)
    expect(storedScreen?.patternFamily).toBe(result.screenDSL.pattern_family)
    expect(storedImage?.url).toContain('integration-hero.png')

    render(<ScreenRenderer dsl={result.screenDSL} />)

    await waitFor(() => {
      expect(screen.queryByText(/DSL Validation Failed/i)).toBeNull()
      expect(screen.getByText(result.plan.name)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  it('validates DSL + pattern selection before persistence and render', async () => {
    const { paletteSpy, vibeSpy } = mockImageAnalysis()
    const schemaSpy = vi.spyOn(dslValidator, 'validateScreenDSL')
    const patternSpy = vi.spyOn(patternValidator, 'validateDSLAgainstPattern')
    const imagePersistSpy = vi.spyOn(heroPersistence, 'persistHeroImageMetadata')
    const screenPersistSpy = vi.spyOn(dslPersistence, 'createScreenWithValidation')

    const flow = await createFlowFixture()

    const result = await assembleScreenFromPrompt(pipelinePrompt, {
      interpreterOptions: { interpreter: createDeterministicInterpreter() },
      imageOrchestrator: createDeterministicOrchestrator(),
      flowId: flow.id,
      persist: true,
    })

    expect(paletteSpy).toHaveBeenCalled()
    expect(vibeSpy).toHaveBeenCalled()
    expect(schemaSpy).toHaveBeenCalledWith(result.screenDSL)
    expect(patternSpy).toHaveBeenCalledWith(result.screenDSL, result.pattern)
    expect(imagePersistSpy).toHaveBeenCalled()
    expect(screenPersistSpy).toHaveBeenCalled()

    render(<ScreenRenderer dsl={result.screenDSL} />)

    await waitFor(() => {
      expect(screen.queryByText(/DSL Validation Failed/i)).toBeNull()
      expect(screen.getByText(result.plan.name)).toBeInTheDocument()
    })
  })
})
