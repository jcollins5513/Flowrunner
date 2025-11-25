import fs from 'fs/promises'
import path from 'path'

const HTTP_REGEX = /^https?:\/\//i

const PUBLIC_DIR = path.join(process.cwd(), 'public')

const normalizeLocalPath = (input: string) => {
  if (!input) {
    throw new Error('Image path is required')
  }
  const isAbsolute = path.isAbsolute(input)
  const trimmed = input.replace(/^\/+/, '')
  const resolved = path.join(PUBLIC_DIR, trimmed)
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H1',
      location: 'lib/images/source.ts:16',
      message: 'normalizeLocalPath resolution',
      data: { input, isAbsolute, trimmed, resolved },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  if (isAbsolute) {
    return input
  }
  return resolved
}

const ensureProtocol = (input: string) => {
  if (input.startsWith('//')) {
    return `https:${input}`
  }
  return input
}

const getSelfHosts = (): string[] => {
  const hosts: string[] = []
  if (process.env.VERCEL_URL) {
    hosts.push(process.env.VERCEL_URL)
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    try {
      hosts.push(new URL(siteUrl).hostname)
    } catch {
      // ignore invalid host strings
    }
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      hosts.push(new URL(appUrl).hostname)
    } catch {
      // ignore invalid host strings
    }
  }
  return hosts.filter(Boolean)
}

const maybeResolveSelfHostedPath = (input: string): string | undefined => {
  const withProtocol = ensureProtocol(input)
  try {
    const parsed = new URL(withProtocol)
    const selfHosts = getSelfHosts()
    const isSelfHost = selfHosts.includes(parsed.hostname)
    const isPublicAsset = parsed.pathname.startsWith('/images/')
    const isPrivateHost = ['127.0.0.1', 'localhost'].includes(parsed.hostname)
    if (isPrivateHost) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H4',
          location: 'lib/images/source.ts:60',
          message: 'Detected private host image URL',
          data: { input, hostname: parsed.hostname, isSelfHost, isPublicAsset },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    }
    if (isSelfHost && isPublicAsset) {
      const resolved = normalizeLocalPath(parsed.pathname)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H2',
          location: 'lib/images/source.ts:58',
          message: 'Resolved self-hosted image path',
          data: { input, resolved, host: parsed.hostname },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      return resolved
    }
  } catch {
    // not a valid URL, fall through to other resolution paths
  }
  return undefined
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

  const localSelfHosted = maybeResolveSelfHostedPath(url)
  if (localSelfHosted) {
    return localSelfHosted
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

  const localSelfHosted = maybeResolveSelfHostedPath(url)
  if (localSelfHosted) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H3',
        location: 'lib/images/source.ts:105',
        message: 'Loading local self-hosted image',
        data: { url, localSelfHosted },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return fs.readFile(localSelfHosted)
  }

  if (url.startsWith('data:')) {
    return decodeDataUrl(url)
  }

  const withProtocol = ensureProtocol(url)

  if (HTTP_REGEX.test(withProtocol)) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/72637a11-5b8b-46bb-adcb-77d24d2ba474', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H5',
          location: 'lib/images/source.ts:118',
          message: 'Fetching remote image over HTTP',
          data: { url: withProtocol },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
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
