import { PrismaClient } from '@prisma/client'

type MockRecord = Record<string, any>

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`

let prisma: PrismaClient

if (process.env.NODE_ENV === 'test') {
  const flows: MockRecord[] = []
  const screens: MockRecord[] = []
  const revisions: MockRecord[] = []
  const images: MockRecord[] = []

  const mockPrisma = {
    flow: {
      create: async ({ data }: { data: MockRecord }) => {
        const record = {
          id: data.id ?? createId('flow'),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }
        flows.push(record)
        return record
      },
      findUnique: async ({ where, include }: { where: MockRecord; include?: MockRecord }) => {
        const flow = flows.find((f) => f.id === where.id)
        if (!flow) return null
        if (include?.screens) {
          const flowScreens = screens
            .filter((s) => s.flowId === flow.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((screen) => {
              if (include.screens.include?.heroImage && screen.heroImageId) {
                return {
                  ...screen,
                  heroImage: images.find((img) => img.id === screen.heroImageId) ?? null,
                }
              }
              return screen
            })
          return { ...flow, screens: flowScreens }
        }
        return flow
      },
      findMany: async () => flows,
      update: async ({ where, data }: { where: MockRecord; data: MockRecord }) => {
        const index = flows.findIndex((f) => f.id === where.id)
        if (index === -1) throw new Error('Flow not found')
        flows[index] = { ...flows[index], ...data, updatedAt: new Date() }
        return flows[index]
      },
      delete: async ({ where }: { where: MockRecord }) => {
        const index = flows.findIndex((f) => f.id === where.id)
        if (index !== -1) {
          const [removed] = flows.splice(index, 1)
          return removed
        }
        throw new Error('Flow not found')
      },
    },
    screen: {
      create: async ({ data }: { data: MockRecord }) => {
        const record = {
          id: data.id ?? createId('screen'),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }
        screens.push(record)
        return record
      },
      findMany: async ({ where, orderBy }: { where?: MockRecord; orderBy?: MockRecord } = {}) => {
        const filtered = where?.flowId ? screens.filter((s) => s.flowId === where.flowId) : [...screens]
        if (orderBy?.createdAt === 'asc') {
          filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        }
        if (orderBy?.createdAt === 'desc') {
          filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        }
        return filtered
      },
      findUnique: async ({ where }: { where: MockRecord }) => screens.find((s) => s.id === where.id) ?? null,
      update: async ({ where, data }: { where: MockRecord; data: MockRecord }) => {
        const index = screens.findIndex((s) => s.id === where.id)
        if (index === -1) throw new Error('Screen not found')
        screens[index] = { ...screens[index], ...data, updatedAt: new Date() }
        return screens[index]
      },
    },
    revision: {
      findFirst: async ({ where, orderBy }: { where: MockRecord; orderBy?: MockRecord }) => {
        const filtered = revisions.filter((r) => r.flowId === where.flowId)
        if (!filtered.length) return null
        if (orderBy?.version === 'desc') {
          filtered.sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
        }
        return filtered[0]
      },
      create: async ({ data }: { data: MockRecord }) => {
        const record = {
          id: data.id ?? createId('rev'),
          createdAt: new Date(),
          ...data,
        }
        revisions.push(record)
        return record
      },
    },
    image: {
      create: async ({ data }: { data: MockRecord }) => {
        const record = {
          id: data.id ?? createId('img'),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }
        images.push(record)
        return record
      },
      upsert: async ({ where, create, update }: { where: MockRecord; create: MockRecord; update: MockRecord }) => {
        const existing = images.find((img) => img.id === where.id)
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() })
          return existing
        }
        const record = { id: where.id ?? createId('img'), createdAt: new Date(), updatedAt: new Date(), ...create }
        images.push(record)
        return record
      },
      findUnique: async ({ where }: { where: MockRecord }) => images.find((img) => img.id === where.id) ?? null,
      findMany: async () => images,
      update: async ({ where, data }: { where: MockRecord; data: MockRecord }) => {
        const index = images.findIndex((img) => img.id === where.id)
        if (index === -1) throw new Error('Image not found')
        images[index] = { ...images[index], ...data, updatedAt: new Date() }
        return images[index]
      },
    },
  }

  prisma = mockPrisma as unknown as PrismaClient
} else {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
}

export { prisma }
export default prisma

