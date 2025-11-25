import type { Image, ImageVersion } from '@prisma/client'
import { S3ImageStorage } from '../image/storage'
import { loadImageBuffer } from './source'
import { ImageRepository } from './repository'
import type { SaveImageData } from './persistence/types'

export interface UploadAndPersistOptions extends Omit<SaveImageData, 'storage' | 'url'> {
  source: string | Buffer
  filename?: string
  parentVersionId?: string | null
  storagePrefix?: string
}

export interface RenderableImage {
  image: Image
  version?: ImageVersion | null
  urls: {
    url: string
    optimizedUrl?: string | null
    thumbnailUrl?: string | null
  }
}

export class ImageStorageService {
  constructor(private storage: S3ImageStorage, private repository: ImageRepository = new ImageRepository()) {}

  async uploadAndPersist(options: UploadAndPersistOptions): Promise<RenderableImage> {
    const buffer = typeof options.source === 'string' ? await loadImageBuffer(options.source) : options.source

    const uploadResult = await this.storage.uploadImage(buffer, {
      filename: options.filename,
      prefix: options.storagePrefix,
      generateWebp: true,
      thumbnail: { width: 512, height: 512 },
    })

    const storageMetadata = this.storage.toStorageMetadata(uploadResult, options.parentVersionId)

    const { image, version } = await this.repository.saveImage({
      ...options,
      url: storageMetadata.url,
      storage: storageMetadata,
    })

    const urls = this.repository.getRenderableUrls(image, version ?? null)

    return { image, version, urls }
  }

  async deleteVersionAssets(version: ImageVersion): Promise<void> {
    const keys = this.collectKeys(version)
    if (!keys.length) return
    await this.storage.deleteObjects(keys)
  }

  private collectKeys(version: ImageVersion): string[] {
    const metadata = (version.metadata as Record<string, any> | null) ?? null
    const webpKey = metadata?.webpKey as string | undefined

    return [version.storageKey, version.optimizedStorageKey, version.thumbnailStorageKey, webpKey].filter(
      (key): key is string => Boolean(key)
    )
  }
}
