'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/navigation/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { INTENT_CONSTANTS } from '@/lib/ai/intent/intent.schema'

const DOMAINS = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
] as const

const STYLES = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'modern', label: 'Modern' },
  { value: 'playful', label: 'Playful' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'retro', label: 'Retro' },
  { value: 'futuristic', label: 'Futuristic' },
] as const

const VISUAL_THEMES = [
  { value: 'illustrated', label: 'Illustrated' },
  { value: 'photographic', label: 'Photographic' },
  { value: '3d', label: '3D' },
  { value: 'collage', label: 'Collage' },
  { value: 'line_art', label: 'Line Art' },
] as const

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'bold', label: 'Bold' },
  { value: 'calm', label: 'Calm' },
  { value: 'energetic', label: 'Energetic' },
] as const

const COLOR_MOODS = [
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'muted', label: 'Muted' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neon', label: 'Neon' },
  { value: 'monochrome', label: 'Monochrome' },
] as const

export default function NewFlowPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    domain: undefined as string | undefined,
    style: [] as string[],
    visualTheme: undefined as string | undefined,
    tone: undefined as string | undefined,
    colorMood: undefined as string | undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setProgress('Creating flow...')

    try {
      if (!formData.name.trim()) {
        setError('Flow name is required')
        setLoading(false)
        setProgress(null)
        return
      }

      if (!formData.prompt.trim()) {
        setError('Prompt is required to generate the first screen')
        setLoading(false)
        setProgress(null)
        return
      }

      // Step 1: Create the flow
      setProgress('Creating flow...')
      const flowResponse = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          domain: formData.domain || undefined,
          theme: formData.visualTheme || undefined,
          style: formData.style.length > 0 ? formData.style[0] : undefined,
        }),
      })

      if (!flowResponse.ok) {
        const errorData = await flowResponse.json()
        throw new Error(errorData.error || 'Failed to create flow')
      }

      const flow = await flowResponse.json()
      const flowId = flow.id || flow.flow?.id

      if (!flowId) {
        throw new Error('Flow created but no ID returned')
      }

      // Step 2: Generate first screen
      setProgress('Analyzing your prompt...')
      const screenResponse = await fetch(`/api/flows/${flowId}/generate-first-screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.prompt,
          guidance: {
            ...(formData.domain && { domain: formData.domain }),
            ...(formData.style.length > 0 && { styleCues: formData.style }),
            ...(formData.visualTheme && { visualTheme: formData.visualTheme }),
            ...(formData.tone && { tone: formData.tone }),
            ...(formData.colorMood && { colorMood: formData.colorMood }),
          },
        }),
      })

      if (!screenResponse.ok) {
        const errorData = await screenResponse.json()
        // Flow was created, so redirect to edit page even if screen generation failed
        // User can retry screen generation there
        console.error('Screen generation failed:', errorData.error, errorData.details)
        router.push(`/flows/${flowId}/edit?error=${encodeURIComponent(errorData.error || 'Screen generation failed')}`)
        return
      }

      setProgress('Complete!')
      // Redirect to editor with success flag
      router.push(`/flows/${flowId}/edit?created=true`)
    } catch (err) {
      console.error('Error creating flow:', err)
      setError(err instanceof Error ? err.message : 'Failed to create flow')
      setLoading(false)
      setProgress(null)
    }
  }

  const handleChange = (field: string, value: string | string[] | undefined) => {
    setFormData((prev) => ({ 
      ...prev, 
      [field]: value === '' ? undefined : value 
    }))
  }

  const toggleStyle = (styleValue: string) => {
    setFormData((prev) => {
      const currentStyles = prev.style
      const newStyles = currentStyles.includes(styleValue)
        ? currentStyles.filter((s) => s !== styleValue)
        : [...currentStyles, styleValue].slice(0, 3) // Max 3 styles
      return { ...prev, style: newStyles }
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create Your First Screen</h1>
            <p className="text-muted-foreground">
              Describe what you&apos;re building and FlowRunner will generate a screen with AI images and layout.
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Flow Details</CardTitle>
              <CardDescription>
                Give your flow a name and describe what you&apos;re building. The optional fields help guide the AI to create better images and layouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Progress Alert */}
                {progress && (
                  <Alert>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <AlertDescription>{progress}</AlertDescription>
                  </Alert>
                )}

                {/* Flow Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Flow Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Onboarding Flow"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe what this flow should accomplish..."
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">
                    What are you building? <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    placeholder="e.g., A landing page for a SaaS product that helps teams collaborate, with a hero section showcasing the main value proposition..."
                    rows={4}
                    required
                    disabled={loading}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    FlowRunner will analyze your prompt, select an appropriate layout pattern, generate AI images based on that layout, and create your first screen.
                  </p>
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (Optional)</Label>
                  <Select
                    value={formData.domain}
                    onValueChange={(value) => handleChange('domain', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="domain">
                      <SelectValue placeholder="Select a domain (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((domain) => (
                        <SelectItem key={domain.value} value={domain.value}>
                          {domain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Helps select appropriate flow template and pattern families
                  </p>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <Label>Style (Optional - Select up to 3)</Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => toggleStyle(style.value)}
                        disabled={loading}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                          formData.style.includes(style.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-muted-foreground/20'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Influences pattern selection and component styling
                  </p>
                </div>

                {/* Visual Theme */}
                <div className="space-y-2">
                  <Label htmlFor="visualTheme">Visual Theme (Optional)</Label>
                  <Select
                    value={formData.visualTheme}
                    onValueChange={(value) => handleChange('visualTheme', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="visualTheme">
                      <SelectValue placeholder="Select visual theme (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_THEMES.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Directly affects image generation style (3D, illustrated, etc.)
                  </p>
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone (Optional)</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => handleChange('tone', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Influences text generation and component messaging
                  </p>
                </div>

                {/* Color Mood */}
                <div className="space-y-2">
                  <Label htmlFor="colorMood">Color Mood (Optional)</Label>
                  <Select
                    value={formData.colorMood}
                    onValueChange={(value) => handleChange('colorMood', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="colorMood">
                      <SelectValue placeholder="Select color mood (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_MOODS.map((mood) => (
                        <SelectItem key={mood.value} value={mood.value}>
                          {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Affects palette extraction and color scheme
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <Link href="/">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading || !formData.name.trim() || !formData.prompt.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Flow & Generate First Screen'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

