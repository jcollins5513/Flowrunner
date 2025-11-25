import { describe, expect, it, vi } from 'vitest'
import { ImageGenerationQueue } from '../../../lib/images/generation/queue'
import { ImageGenerationService } from '../../../lib/images/generation/service'
import { MockImageProvider } from '../../../lib/images/generation/providers/mock'
import { imageGenerationRequestSchema } from '../../../lib/images/generation/types'

describe('ImageGenerationQueue', () => {
  it('creates job and returns job ID', async () => {
    const service = new ImageGenerationService({ provider: new MockImageProvider() })
    const queue = new ImageGenerationQueue(service)

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Test image',
      aspectRatio: '16:9',
    })

    const jobId = await queue.requestHeroImage(request)
    expect(jobId).toBeTruthy()

    const job = queue.getJob(jobId)
    expect(job).toBeDefined()
    expect(job?.request.prompt).toBe('Test image')
  })

  it('deduplicates identical requests within window', async () => {
    const service = new ImageGenerationService({ provider: new MockImageProvider() })
    const queue = new ImageGenerationQueue(service, { dedupeWindowMs: 5000 })

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Duplicate test',
      aspectRatio: '1:1',
    })

    const id1 = await queue.requestHeroImage(request)
    const id2 = await queue.requestHeroImage(request)

    expect(id1).toBe(id2)
  })

  it('creates new job when forceNew is true', async () => {
    const service = new ImageGenerationService({ provider: new MockImageProvider() })
    const queue = new ImageGenerationQueue(service)

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Force new test',
      aspectRatio: '4:3',
    })

    const id1 = await queue.requestHeroImage(request)
    const id2 = await queue.requestHeroImage(request, { forceNew: true })

    expect(id1).not.toBe(id2)
  })

  it('polls job until completion', async () => {
    const service = new ImageGenerationService({
      provider: new MockImageProvider({ latencyMs: 100 }),
    })
    const queue = new ImageGenerationQueue(service)

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Poll test',
      aspectRatio: '16:9',
    })

    const jobId = await queue.requestHeroImage(request)
    const completed = await queue.pollJob(jobId, 5000, 50)

    expect(completed.status).toBe('completed')
    expect(completed.result).toBeDefined()
    expect(completed.result?.url).toBeTruthy()
  })

  it('handles job failures', async () => {
    const service = new ImageGenerationService({
      provider: new MockImageProvider({ shouldFail: true }),
    })
    const queue = new ImageGenerationQueue(service)

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Failure test',
      aspectRatio: '16:9',
    })

    const jobId = await queue.requestHeroImage(request)

    await expect(queue.pollJob(jobId, 5000, 50)).rejects.toThrow()

    const job = queue.getJob(jobId)
    expect(job?.status).toBe('failed')
    expect(job?.error).toBeDefined()
  })

  it('processes multiple jobs with concurrency limit', async () => {
    const service = new ImageGenerationService({
      provider: new MockImageProvider({ latencyMs: 100 }),
    })
    const queue = new ImageGenerationQueue(service, { maxConcurrent: 2 })

    const requests = Array.from({ length: 3 }, (_, i) =>
      imageGenerationRequestSchema.parse({
        prompt: `Concurrent test ${i}-${Date.now()}`,
        aspectRatio: '16:9',
      })
    )

    const jobIds = await Promise.all(requests.map((req) => queue.requestHeroImage(req)))

    const completed = await Promise.all(
      jobIds.map((id) => queue.pollJob(id, 5000, 100))
    )

    expect(completed).toHaveLength(3)
    expect(completed.every((job) => job.status === 'completed')).toBe(true)
  })

  it('reports health snapshot counts', async () => {
    const service = new ImageGenerationService({ provider: new MockImageProvider() })
    const queue = new ImageGenerationQueue(service, { name: 'test-health' })

    const request = imageGenerationRequestSchema.parse({
      prompt: 'Health check job',
      aspectRatio: '16:9',
    })

    const jobId = await queue.requestHeroImage(request)
    await queue.pollJob(jobId, 5000, 50)

    const snapshot = queue.getHealthSnapshot()
    expect(snapshot.name).toBe('test-health')
    expect(snapshot.completed).toBe(1)
    expect(snapshot.pending).toBe(0)
    expect(snapshot.failed).toBe(0)
  })
})

