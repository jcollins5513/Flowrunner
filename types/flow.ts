// Flow types
export interface Flow {
  id: string
  userId?: string
  name: string
  description?: string
  domain?: string
  theme?: string
  style?: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Screen {
  id: string
  flowId: string
  revisionId?: string
  heroImageId?: string
  palette?: Record<string, string>
  vibe?: string
  patternFamily?: string
  patternVariant?: number
  components?: unknown[]
  navigation?: Record<string, unknown>
  animations?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

