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
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const DOMAINS = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
] as const

export default function NewFlowPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    domain: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name.trim()) {
        setError('Flow name is required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          domain: formData.domain || undefined,
          // Store prompt in description or metadata for now
          // In future, this could be used to generate initial screens
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create flow')
      }

      const flow = await response.json()
      
      // Redirect to editor
      router.push(`/flows/${flow.id}/edit`)
    } catch (err) {
      console.error('Error creating flow:', err)
      setError(err instanceof Error ? err.message : 'Failed to create flow')
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back Link */}
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create New Flow</h1>
            <p className="text-muted-foreground">
              Start a new UI flow by providing a name and optional description
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Flow Details</CardTitle>
              <CardDescription>
                Give your flow a name and describe what it should accomplish
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
                    rows={4}
                    disabled={loading}
                  />
                </div>

                {/* Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Initial Prompt (Optional)</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    placeholder="e.g., Onboard new users to a SaaS product..."
                    rows={3}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt will help generate relevant screens when you start building
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
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((domain) => (
                        <SelectItem key={domain.value} value={domain.value}>
                          {domain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <Link href="/">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Flow
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

