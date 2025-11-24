import { promises as fs } from 'fs'
import path from 'path'

const HTTP_REGEX = /^https?:\/\//i

const PUBLIC_DIR = path.join(process.cwd(), 'public')

const normalizeLocalPath = (input: string) => {
  if (!input) {
    throw new Error('Image path is required')
  }
  if (path.isAbsolute(input)) {
    return input
  }
  const trimmed = input.replace(/^\/+/, '')
  return path.join(PUBLIC_DIR, trimmed)
}

const ensureProtocol = (input: string) => {
  if (input.startsWith('//')) {
    return `https:${input}`
  }
  return input
}

const decodeDataUrl = (dataUrl: string): Buffer => {
  const [, payload] = dataUrl.split(',')
  if (!payload) {
    throw new Error('Invalid data URL')
  }
  return Buffer.from(payload, dataUrl.includes(';base64,') ? 'base64' : 'utf-8')
}

export type ImageSource = string | Buffer

export const getImageSource = async (url: string): Promise<ImageSource> => {
  if (!url) {
    throw new Error('Image URL is required')
  }

  if (url.startsWith('data:')) {
    return decodeDataUrl(url)
  }

  if (HTTP_REGEX.test(url) || url.startsWith('//')) {
    return ensureProtocol(url)
  }

  return normalizeLocalPath(url)
}

export const loadImageBuffer = async (url: string): Promise<Buffer> => {
  if (!url) {
    throw new Error('Image URL is required')
  }

  if (url.startsWith('data:')) {
    return decodeDataUrl(url)
  }

  const withProtocol = ensureProtocol(url)

  if (HTTP_REGEX.test(withProtocol)) {
    try {
      const response = await fetch(withProtocol)
      const ok = 'ok' in response ? (response as Response).ok : true
      if (!ok) {
        const status = 'status' in response ? (response as Response).status : 'unknown'
        throw new Error(`Failed to fetch image: ${status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      throw new Error(`Failed to fetch image: ${message}`)
    }
  }

  const filePath = normalizeLocalPath(url)
  return fs.readFile(filePath)
}

