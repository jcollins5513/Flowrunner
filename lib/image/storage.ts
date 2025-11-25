import crypto from 'crypto'
import path from 'path'
import sharp, { type Sharp } from 'sharp'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type DeleteObjectsCommandOutput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageMetadata } from '../images/persistence/types'

export interface S3StorageConfig {
  bucket: string
  region?: string
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
  publicBaseUrl?: string
  signedUrlTtlSeconds?: number
}

export interface UploadImageOptions {
  filename?: string
  key?: string
  contentType?: string
  optimize?: boolean
  quality?: number
  generateWebp?: boolean
  thumbnail?: {
    width: number
    height: number
    fit?: sharp.FitEnum
  }
  prefix?: string
}

export interface UploadedObject {
  key: string
  url: string
  bucket: string
  bytes: number
  contentType?: string
  format?: string
  width?: number
  height?: number
}

export interface UploadImageResult {
  original: UploadedObject
  optimized?: UploadedObject
  webp?: UploadedObject
  thumbnail?: UploadedObject
}

const DEFAULT_THUMBNAIL = { width: 512, height: 512 } as const

const isUnsafeKey = (key: string) => key.includes('..') || key.startsWith('/') || key.includes('\\')

export class S3ImageStorage {
  private client: S3Client

  constructor(private config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region ?? 'us-east-1',
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? true,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    })
  }

  private safeKey(input: string): string {
    const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '')
    if (isUnsafeKey(normalized)) {
      throw new Error('Unsafe storage key detected')
    }
    return normalized
  }

  private buildKey(filename: string, prefix?: string): string {
    const name = filename || 'image'
    const ext = path.extname(name) || '.jpg'
    const base = crypto.randomUUID()
    const segments = [prefix?.replace(/\/$/, ''), `${base}${ext}`].filter(Boolean) as string[]
    return this.safeKey(path.posix.join(...segments))
  }

  private async putObject(key: string, body: Buffer, contentType?: string): Promise<UploadedObject> {
    const normalizedKey = this.safeKey(key)
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: normalizedKey,
      Body: body,
      ContentType: contentType,
    })

    await this.client.send(command)

    const url = await this.buildUrl(normalizedKey, contentType)

    return {
      key: normalizedKey,
      url,
      bucket: this.config.bucket,
      bytes: body.byteLength,
      contentType,
    }
  }

  private async buildUrl(key: string, contentType?: string): Promise<string> {
    if (this.config.publicBaseUrl) {
      return `${this.config.publicBaseUrl.replace(/\/$/, '')}/${key}`
    }

    if (this.config.signedUrlTtlSeconds) {
      const signed = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.config.bucket, Key: key, ResponseContentType: contentType }),
        { expiresIn: this.config.signedUrlTtlSeconds }
      )
      return signed
    }

    const endpoint = this.config.endpoint?.replace(/\/$/, '')
    if (endpoint) {
      return `${endpoint}/${this.config.bucket}/${key}`
    }

    return `https://${this.config.bucket}.s3.${this.config.region ?? 'us-east-1'}.amazonaws.com/${key}`
  }

  private async normalizeImageInstance(buffer: Buffer): Promise<{ instance: Sharp; metadata: sharp.Metadata }> {
    const instance = sharp(buffer)
    const metadata = await instance.metadata()
    return { instance, metadata }
  }

  async uploadImage(buffer: Buffer, options: UploadImageOptions = {}): Promise<UploadImageResult> {
    if (!buffer) {
      throw new Error('No image buffer provided for upload')
    }

    const quality = options.quality ?? 82
    const { instance, metadata } = await this.normalizeImageInstance(buffer)

    const baseKey = this.safeKey(options.key ?? this.buildKey(options.filename ?? 'image', options.prefix))
    const isJpeg = metadata.format === 'jpeg' || metadata.format === 'jpg'
    const primaryContentType = options.contentType ?? (isJpeg ? 'image/jpeg' : `image/${metadata.format ?? 'jpeg'}`)

    const optimizedBuffer = options.optimize === false
      ? await instance.toBuffer()
      : await instance.jpeg({ quality, mozjpeg: true }).toBuffer()

    const original = await this.putObject(baseKey, optimizedBuffer, primaryContentType)
    original.format = metadata.format ?? undefined
    original.width = metadata.width ?? undefined
    original.height = metadata.height ?? undefined

    let webp: UploadedObject | undefined
    if (options.generateWebp !== false) {
      const webpBuffer = await sharp(buffer).webp({ quality }).toBuffer()
      const webpKey = `${baseKey}.webp`
      webp = await this.putObject(webpKey, webpBuffer, 'image/webp')
      webp.format = 'webp'
      const webpMeta = await sharp(webpBuffer).metadata()
      webp.width = webpMeta.width ?? undefined
      webp.height = webpMeta.height ?? undefined
    }

    let thumbnail: UploadedObject | undefined
    const thumbOptions = options.thumbnail ?? DEFAULT_THUMBNAIL
    if (thumbOptions.width && thumbOptions.height) {
      const thumbBuffer = await sharp(buffer)
        .resize({ width: thumbOptions.width, height: thumbOptions.height, fit: thumbOptions.fit ?? 'cover' })
        .jpeg({ quality: Math.min(quality, 78), mozjpeg: true })
        .toBuffer()
      const thumbKey = baseKey.replace(/\.[^.]+$/, '') + '-thumb.jpg'
      thumbnail = await this.putObject(thumbKey, thumbBuffer, 'image/jpeg')
      const thumbMeta = await sharp(thumbBuffer).metadata()
      thumbnail.format = thumbMeta.format ?? 'jpeg'
      thumbnail.width = thumbMeta.width ?? undefined
      thumbnail.height = thumbMeta.height ?? undefined
    }

    return { original, optimized: original, webp, thumbnail }
  }

  async deleteObjects(keys: string[]): Promise<DeleteObjectsCommandOutput> {
    const safeKeys = keys.filter(Boolean).map((key) => this.safeKey(key))
    if (!safeKeys.length) {
      return { $metadata: {} as any } as DeleteObjectsCommandOutput
    }

    return this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: safeKeys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    )
  }

  toStorageMetadata(result: UploadImageResult, parentVersionId?: string | null): StorageMetadata {
    return {
      driver: 's3',
      bucket: result.original.bucket,
      key: result.original.key,
      url: result.original.url,
      optimizedKey: result.optimized?.key ?? result.original.key,
      optimizedUrl: result.optimized?.url ?? result.original.url,
      thumbnailKey: result.thumbnail?.key,
      thumbnailUrl: result.thumbnail?.url,
      format: result.original.format ?? undefined,
      bytes: result.original.bytes,
      width: result.original.width,
      height: result.original.height,
      parentVersionId: parentVersionId ?? undefined,
      metadata: {
        webpKey: result.webp?.key,
        webpUrl: result.webp?.url,
      },
    }
  }
}
