import crypto from 'crypto'

export const stableHash = (value: string): string =>
  crypto.createHash('sha256').update(value).digest('hex')

export const deterministicId = (prefix: string, value: string): string => {
  const hash = stableHash(value)
  return `${prefix}-${hash.slice(0, 12)}`
}

export const deterministicSeed = (value: string): number => {
  const hash = stableHash(value).slice(0, 8)
  return Number.parseInt(hash, 16)
}
