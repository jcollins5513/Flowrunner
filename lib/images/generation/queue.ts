import { ImageGenerationRequest, ImageGenerationResult } from './types'
import { ImageGenerationService } from './service'

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ImageGenerationJob {
  id: string
  request: ImageGenerationRequest
  status: JobStatus
  result?: ImageGenerationResult
  error?: Error
  createdAt: Date
  updatedAt: Date
}

export interface QueueOptions {
  maxConcurrent?: number
  dedupeWindowMs?: number
}

const generateJobId = (request: ImageGenerationRequest): string => {
  const key = `${request.prompt}|${request.aspectRatio}|${request.style ?? ''}|${request.seed ?? ''}`
  return Buffer.from(key).toString('base64').slice(0, 16)
}

export class ImageGenerationQueue {
  private jobs: Map<string, ImageGenerationJob> = new Map()
  private processing: Set<string> = new Set()
  private isProcessingQueue: boolean = false
  private maxConcurrent: number
  private dedupeWindowMs: number

  constructor(
    private service: ImageGenerationService,
    private options: QueueOptions = {}
  ) {
    this.maxConcurrent = options.maxConcurrent ?? 3
    this.dedupeWindowMs = options.dedupeWindowMs ?? 60000
  }

  async requestHeroImage(
    request: ImageGenerationRequest,
    options?: { forceNew?: boolean }
  ): Promise<string> {
    let jobId = generateJobId(request)
    const existing = this.jobs.get(jobId)

    if (!options?.forceNew && existing) {
      const age = Date.now() - existing.createdAt.getTime()
      if (age < this.dedupeWindowMs && existing.status === 'completed') {
        return jobId
      }
      if (existing.status === 'processing' || existing.status === 'pending') {
        return jobId
      }
    }

    if (options?.forceNew && existing) {
      jobId = `${jobId}-${Date.now()}`
    }

    const job: ImageGenerationJob = {
      id: jobId,
      request,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.jobs.set(jobId, job)
    this.processQueue()

    return jobId
  }

  getJob(jobId: string): ImageGenerationJob | undefined {
    return this.jobs.get(jobId)
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return
    }

    this.isProcessingQueue = true

    try {
      while (this.processing.size < this.maxConcurrent) {
        const pending = Array.from(this.jobs.values()).filter(
          (job) => job.status === 'pending' && !this.processing.has(job.id)
        )

        if (pending.length === 0) {
          break
        }

        const next = pending[0]
        this.processing.add(next.id)
        next.status = 'processing'
        next.updatedAt = new Date()

        this.service
          .generateHeroImage(next.request)
          .then((result) => {
            next.status = 'completed'
            next.result = result
            next.updatedAt = new Date()
            this.processing.delete(next.id)
            this.processQueue()
          })
          .catch((error) => {
            next.status = 'failed'
            next.error = error instanceof Error ? error : new Error(String(error))
            next.updatedAt = new Date()
            this.processing.delete(next.id)
            this.processQueue()
          })
      }
    } finally {
      this.isProcessingQueue = false
    }
  }

  pollJob(jobId: string, maxWaitMs: number = 30000, intervalMs: number = 500): Promise<ImageGenerationJob> {
    return new Promise((resolve, reject) => {
      const start = Date.now()
      const check = () => {
        const job = this.jobs.get(jobId)
        if (!job) {
          reject(new Error(`Job ${jobId} not found`))
          return
        }

        if (job.status === 'completed') {
          resolve(job)
          return
        }

        if (job.status === 'failed') {
          reject(job.error ?? new Error('Job failed'))
          return
        }

        if (Date.now() - start > maxWaitMs) {
          reject(new Error('Polling timeout'))
          return
        }

        setTimeout(check, intervalMs)
      }

      check()
    })
  }
}

