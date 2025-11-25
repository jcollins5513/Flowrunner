import type { Prisma, PrismaClient, Flow, Screen, Revision, Image } from '@prisma/client'
import { prisma } from './client'

export type DbTransactionClient = PrismaClient | Prisma.TransactionClient

export interface RepositoryLogger {
  info?: (message: string, meta?: Record<string, unknown>) => void
  error?: (message: string, meta?: Record<string, unknown>) => void
}

interface RepositoryContext {
  tx?: DbTransactionClient
  logger?: RepositoryLogger
}

const resolveClient = (context?: RepositoryContext) => context?.tx ?? prisma

const logInfo = (logger: RepositoryLogger | undefined, message: string, meta?: Record<string, unknown>) => {
  if (logger?.info) {
    logger.info(message, meta)
  }
}

export const flowRepository = {
  async create(data: Prisma.FlowUncheckedCreateInput, context?: RepositoryContext): Promise<Flow> {
    const client = resolveClient(context)
    const flow = await client.flow.create({ data })
    logInfo(context?.logger, 'flow.create', { flowId: flow.id })
    return flow
  },

  async findById(flowId: string, options?: { includeScreens?: boolean; includeRevisions?: boolean } & RepositoryContext) {
    const client = resolveClient(options)
    return client.flow.findUnique({
      where: { id: flowId },
      include: {
        screens: options?.includeScreens
          ? {
              orderBy: { createdAt: 'asc' },
              include: { heroImage: true },
            }
          : false,
        revisions: options?.includeRevisions ?? false,
      },
    })
  },

  async list(where: Prisma.FlowWhereInput, params: { take?: number; skip?: number; orderBy?: Prisma.FlowOrderByWithRelationInput } & RepositoryContext) {
    const client = resolveClient(params)
    return client.flow.findMany({ where, take: params.take, skip: params.skip, orderBy: params.orderBy })
  },

  async update(flowId: string, data: Prisma.FlowUpdateInput, context?: RepositoryContext): Promise<Flow> {
    const client = resolveClient(context)
    const flow = await client.flow.update({ where: { id: flowId }, data })
    logInfo(context?.logger, 'flow.update', { flowId })
    return flow
  },

  async delete(flowId: string, context?: RepositoryContext): Promise<void> {
    const client = resolveClient(context)
    await client.flow.delete({ where: { id: flowId } })
    logInfo(context?.logger, 'flow.delete', { flowId })
  },
}

export const screenRepository = {
  async create(data: Prisma.ScreenUncheckedCreateInput, context?: RepositoryContext): Promise<Screen> {
    const client = resolveClient(context)
    const screen = await client.screen.create({ data })
    logInfo(context?.logger, 'screen.create', { screenId: screen.id, flowId: screen.flowId })
    return screen
  },

  async findById(screenId: string, options?: { includeHero?: boolean } & RepositoryContext) {
    const client = resolveClient(options)
    return client.screen.findUnique({ where: { id: screenId }, include: { heroImage: Boolean(options?.includeHero) } })
  },

  async findByFlow(flowId: string, options?: { orderByCreated?: 'asc' | 'desc'; includeHero?: boolean } & RepositoryContext) {
    const client = resolveClient(options)
    return client.screen.findMany({
      where: { flowId },
      orderBy: options?.orderByCreated ? { createdAt: options.orderByCreated } : undefined,
      include: { heroImage: Boolean(options?.includeHero) },
    })
  },

  async update(
    screenId: string,
    data: Prisma.ScreenUpdateInput,
    context?: RepositoryContext & { includeHero?: boolean }
  ): Promise<Screen> {
    const client = resolveClient(context)
    const screen = await client.screen.update({
      where: { id: screenId },
      data,
      include: { heroImage: Boolean(context?.includeHero) },
    })
    logInfo(context?.logger, 'screen.update', { screenId })
    return screen
  },

  async delete(screenId: string, context?: RepositoryContext): Promise<void> {
    const client = resolveClient(context)
    await client.screen.delete({ where: { id: screenId } })
    logInfo(context?.logger, 'screen.delete', { screenId })
  },
}

export const revisionRepository = {
  async getLatestVersion(flowId: string, context?: RepositoryContext): Promise<Revision | null> {
    const client = resolveClient(context)
    return client.revision.findFirst({ where: { flowId }, orderBy: { version: 'desc' } })
  },

  async create(data: Prisma.RevisionUncheckedCreateInput, context?: RepositoryContext): Promise<Revision> {
    const client = resolveClient(context)
    const revision = await client.revision.create({ data })
    logInfo(context?.logger, 'revision.create', { revisionId: revision.id, flowId: revision.flowId })
    return revision
  },

  async findByFlow(flowId: string, context?: RepositoryContext) {
    const client = resolveClient(context)
    return client.revision.findMany({ where: { flowId }, orderBy: { version: 'desc' } })
  },

  async count(where: Prisma.RevisionWhereInput, context?: RepositoryContext): Promise<number> {
    const client = resolveClient(context)
    return client.revision.count({ where })
  },
}

export const imageRepository = {
  async create(data: Prisma.ImageUncheckedCreateInput, context?: RepositoryContext): Promise<Image> {
    const client = resolveClient(context)
    const image = await client.image.create({ data })
    logInfo(context?.logger, 'image.create', { imageId: image.id, userId: image.userId })
    return image
  },

  async upsert(
    where: Prisma.ImageWhereUniqueInput,
    createData: Prisma.ImageUncheckedCreateInput,
    updateData: Prisma.ImageUpdateInput,
    context?: RepositoryContext
  ): Promise<Image> {
    const client = resolveClient(context)
    const image = await client.image.upsert({ where, create: createData, update: updateData })
    logInfo(context?.logger, 'image.upsert', { imageId: image.id })
    return image
  },

  async findById(imageId: string, context?: RepositoryContext) {
    const client = resolveClient(context)
    return client.image.findUnique({ where: { id: imageId } })
  },
}

export const withDbTransaction = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => {
  return prisma.$transaction(async (tx) => fn(tx))
}

