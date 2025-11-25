import { createRevisionWithValidation, createScreenWithValidation } from '../lib/db/dsl-persistence'
import { prisma } from '../lib/db/client'
import { flowRepository, imageRepository, screenRepository, withDbTransaction } from '../lib/db/repositories'
import type { RepositoryLogger } from '../lib/db/repositories'
import type { Navigation, Palette, ScreenDSL } from '../lib/dsl/types'

const environment = process.env.APP_ENV || process.env.NODE_ENV || 'local'

const seedLogger: RepositoryLogger = {
  info: (message, meta) => console.log(`[seed:${environment}] ${message}`, meta ?? ''),
  error: (message, meta) => console.error(`[seed:${environment}] ${message}`, meta ?? ''),
}

const basePalette: Palette = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  accent: '#F59E0B',
  background: '#F8FAFC',
}

function buildScreenDSL(heroId: string, heroUrl: string, overrides: Partial<ScreenDSL> = {}): ScreenDSL {
  const defaultComponents: ScreenDSL['components'] = [
    { type: 'title', content: 'Flowrunner seeded screen' },
    { type: 'subtitle', content: 'Deterministic pipeline sample' },
    { type: 'button', content: 'Continue' },
  ]

  return {
    hero_image: {
      id: heroId,
      url: heroUrl,
      extractedPalette: basePalette,
      vibe: 'modern',
    },
    palette: basePalette,
    vibe: 'modern',
    pattern_family: 'HERO_CENTER_TEXT',
    pattern_variant: 1,
    components: defaultComponents,
    ...overrides,
  }
}

async function seedFlow(
  userId: string,
  flowName: string,
  description: string,
  domain: string,
  logger: RepositoryLogger
) {
  const heroA = await imageRepository.create(
    {
      url: 'https://images.unsplash.com/photo-1522199710521-72d69614c702',
      prompt: `${flowName} hero illustration`,
      aspectRatio: '16:9',
      style: 'vector',
      userId,
      extractedPalette: JSON.stringify(basePalette),
      vibe: 'modern',
      domain,
    },
    { logger }
  )

  const heroB = await imageRepository.create(
    {
      url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
      prompt: `${flowName} continuation hero`,
      aspectRatio: '3:4',
      style: 'editorial',
      userId,
      extractedPalette: JSON.stringify(basePalette),
      vibe: 'modern',
      domain,
    },
    { logger }
  )

  return withDbTransaction(async (tx) => {
    const flow = await flowRepository.create(
      {
        name: flowName,
        description,
        domain,
        theme: 'seeded-theme',
        style: 'seeded-style',
        userId,
        isPublic: environment === 'staging',
      },
      { tx, logger }
    )

    const detailDSL = buildScreenDSL(heroB.id, heroB.url, {
      pattern_family: 'FEAT_IMAGE_TEXT_RIGHT',
      pattern_variant: 2,
      components: [
        { type: 'title', content: `${flowName} detail` },
        { type: 'text', content: 'Showcase the second step in the flow.' },
        { type: 'button', content: 'Review' },
      ],
    })

    const { screen: detailScreen, dsl: detailDsl } = await createScreenWithValidation(flow.id, detailDSL, {
      heroImageId: heroB.id,
      client: tx,
      logger,
    })

    const welcomeDSL = buildScreenDSL(heroA.id, heroA.url, {
      components: [
        { type: 'title', content: `${flowName} welcome` },
        { type: 'text', content: description },
        { type: 'button', content: 'Start now' },
      ],
      navigation: { type: 'internal', screenId: detailScreen.id, target: 'Next' } satisfies Navigation,
    })

    const { screen: welcomeScreen } = await createScreenWithValidation(flow.id, welcomeDSL, {
      heroImageId: heroA.id,
      client: tx,
      logger,
    })

    await createRevisionWithValidation(flow.id, { ...detailDsl, vibe: 'bold' }, {
      screenId: detailScreen.id,
      changeType: 'edit',
      description: 'Seeded bold vibe tweak',
      client: tx,
      logger,
    })

    return flow
  })
}

async function main() {
  console.log(`Seeding Flowrunner data for ${environment}`)

  const [alice, bob] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: { name: 'Alice Seed', email: 'alice@example.com' },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: { name: 'Bob Seed', email: 'bob@example.com' },
    }),
  ])

  await seedFlow(alice.id, 'Onboarding Preview', 'Sample onboarding journey to demonstrate screens.', 'SaaS', seedLogger)
  await seedFlow(bob.id, 'Checkout Path', 'Seeded ecommerce checkout steps.', 'E-commerce', seedLogger)

  if (environment === 'staging') {
    await seedFlow(alice.id, 'Staging Showroom', 'Extra staging-only showcase flow.', 'Portfolio', seedLogger)
  }

  console.log('Seed complete')
}

main()
  .catch((error) => {
    seedLogger.error?.('seed.failed', { error })
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
