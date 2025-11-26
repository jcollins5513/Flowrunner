'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppHeader } from '@/components/navigation/AppHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface FollowUpQuestion {
  id: string
  field: 'domain' | 'styleCues' | 'visualTheme' | 'tone' | 'colorMood'
  question: string
  type: 'select' | 'multi-select' | 'text'
  options?: Array<{ value: string; label: string }>
  required: boolean
}

export default function NewFlowPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
  })
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string | string[]>>({})
  const [showQuestions, setShowQuestions] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const analyzePrompt = async (prompt: string): Promise<{ sufficient: boolean; questions?: FollowUpQuestion[] }> => {
    const response = await fetch('/api/flows/analyze-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze prompt')
    }

    return await response.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.prompt.trim()) {
      setError('Prompt is required to generate the first screen')
      return
    }

    // If we're showing questions, user is answering them - proceed with generation
    if (showQuestions && followUpQuestions.length > 0) {
      await proceedWithGeneration()
      return
    }

    // First, analyze the prompt
    setAnalyzing(true)
    setProgress('Analyzing your prompt...')

    try {
      const analysis = await analyzePrompt(formData.prompt)

      if (!analysis.sufficient && analysis.questions && analysis.questions.length > 0) {
        // Show follow-up questions
        setFollowUpQuestions(analysis.questions)
        setShowQuestions(true)
        setAnalyzing(false)
        setProgress(null)
        return
      }

      // Prompt is sufficient, proceed with generation
      await proceedWithGeneration()
    } catch (err) {
      console.error('Error analyzing prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze prompt')
      setAnalyzing(false)
      setProgress(null)
    }
  }

  const proceedWithGeneration = async () => {
    setLoading(true)
    setError(null)
    setProgress('Creating flow...')

    try {
      // Build enhanced prompt with question answers if available
      let enhancedPrompt = formData.prompt
      if (showQuestions && Object.keys(questionAnswers).length > 0) {
        const answerText = Object.entries(questionAnswers)
          .map(([field, value]) => {
            const question = followUpQuestions.find(q => q.id === field)
            if (!question) return ''
            const answer = Array.isArray(value) ? value.join(', ') : value
            return `${question.question}: ${answer}`
          })
          .filter(Boolean)
          .join('. ')
        enhancedPrompt = `${formData.prompt}. ${answerText}`
      }

      // Step 1: Create the flow (or use existing if redirected from editor)
      const existingFlowId = searchParams.get('flowId')
      let flowId: string

      if (existingFlowId) {
        // Flow already exists, use it
        flowId = existingFlowId
        setProgress('Using existing flow...')
      } else {
        // Create new flow
        setProgress('Creating flow...')
        const flowResponse = await fetch('/api/flows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim() || undefined,
            prompt: enhancedPrompt,
          }),
        })

        if (!flowResponse.ok) {
          const errorData = await flowResponse.json()
          throw new Error(errorData.error || 'Failed to create flow')
        }

        const flow = await flowResponse.json()
        flowId = flow.id || flow.flow?.id

        if (!flowId) {
          throw new Error('Flow created but no ID returned')
        }
      }

      // Step 2: Generate first screen
      setProgress('Generating your first screen...')
      const screenResponse = await fetch(`/api/flows/${flowId}/generate-first-screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
        }),
      })

      if (!screenResponse.ok) {
        const errorData = await screenResponse.json()
        console.error('Screen generation failed:', errorData.error, errorData.details)
        router.push(`/flows/${flowId}/edit?error=${encodeURIComponent(errorData.error || 'Screen generation failed')}`)
        return
      }

      setProgress('Complete!')
      router.push(`/flows/${flowId}/edit?created=true`)
    } catch (err) {
      console.error('Error creating flow:', err)
      setError(err instanceof Error ? err.message : 'Failed to create flow')
      setLoading(false)
      setProgress(null)
    }
  }

  const handleQuestionAnswer = (questionId: string, value: string | string[]) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  // Check if we have a flowId from query params (redirected from editor)
  useEffect(() => {
    const flowId = searchParams.get('flowId')
    if (flowId) {
      // Pre-fill flow ID if redirected from editor
      // The flow already exists, so we'll use it when generating the screen
      console.log('Pre-filling flow ID:', flowId)
    }
  }, [searchParams])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      [field]: value 
    }))
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
            <h1 className="text-3xl font-bold tracking-tight">Generate Your First Screen</h1>
            <p className="text-muted-foreground">
              Describe what you&apos;re building and FlowRunner will analyze your prompt, generate a structured specification, and create your first screen with AI images and layout.
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>What are you building?</CardTitle>
              <CardDescription>
                Enter a prompt describing your screen. FlowRunner will analyze it and ask follow-up questions if needed to generate the perfect screen.
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

                {/* Follow-Up Questions */}
                {showQuestions && followUpQuestions.length > 0 && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">A few quick questions to help us generate the perfect screen:</h3>
                      {followUpQuestions.map((question) => (
                        <div key={question.id} className="space-y-2">
                          <Label htmlFor={question.id}>{question.question}</Label>
                          {question.type === 'select' && question.options && (
                            <Select
                              value={questionAnswers[question.id] as string || ''}
                              onValueChange={(value) => handleQuestionAnswer(question.id, value)}
                              disabled={loading || analyzing}
                            >
                              <SelectTrigger id={question.id}>
                                <SelectValue placeholder={`Select ${question.field}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {question.type === 'multi-select' && question.options && (
                            <div className="flex flex-wrap gap-2">
                              {question.options.map((option) => {
                                const selected = Array.isArray(questionAnswers[question.id])
                                  ? (questionAnswers[question.id] as string[]).includes(option.value)
                                  : false
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      const current = Array.isArray(questionAnswers[question.id])
                                        ? (questionAnswers[question.id] as string[])
                                        : []
                                      const newValue = selected
                                        ? current.filter(v => v !== option.value)
                                        : [...current, option.value].slice(0, 3)
                                      handleQuestionAnswer(question.id, newValue)
                                    }}
                                    disabled={loading || analyzing}
                                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                                      selected
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted border-muted-foreground/20'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          {question.type === 'text' && (
                            <Input
                              id={question.id}
                              value={questionAnswers[question.id] as string || ''}
                              onChange={(e) => handleQuestionAnswer(question.id, e.target.value)}
                              placeholder="Enter your answer..."
                              disabled={loading || analyzing}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow Name (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="name">Flow Name (Optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Onboarding Flow (auto-generated if empty)"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    A name will be auto-generated from your prompt if left empty.
                  </p>
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
                    rows={6}
                    required
                    disabled={loading}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    FlowRunner will analyze your prompt and generate a structured specification. If more information is needed, you&apos;ll be asked specific follow-up questions.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <Link href="/">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={(loading || analyzing) || !formData.prompt.trim()}>
                    {loading || analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {analyzing ? 'Analyzing...' : 'Generating...'}
                      </>
                    ) : showQuestions ? (
                      'Continue to Generate'
                    ) : (
                      'Generate First Screen'
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

