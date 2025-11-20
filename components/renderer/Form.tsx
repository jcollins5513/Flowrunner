// Form component renderer
// Uses shadcn/ui Input, Label, Button, Textarea, Select, Checkbox, RadioGroup components
'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio'

export interface FormFieldOption {
  value: string
  label: string
}

export interface FormField {
  id: string
  label: string
  type?: FormFieldType
  placeholder?: string
  options?: FormFieldOption[] // For select and radio
  required?: boolean
  validation?: {
    error?: string
    success?: boolean
  }
}

export interface FormProps {
  content: string
  description?: string
  fields?: FormField[]
  submitLabel?: string
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>
  className?: string
  style?: React.CSSProperties
}

export const Form: React.FC<FormProps> = ({
  content,
  description,
  fields = [],
  submitLabel = 'Submit',
  onSubmit,
  className = '',
  style,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (onSubmit) {
      setIsSubmitting(true)
      try {
        await onSubmit(formData)
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleFieldChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const renderField = (field: FormField) => {
    const fieldType = field.type ?? 'text'
    const hasError = field.validation?.error
    const hasSuccess = field.validation?.success

    const fieldContainerClasses = cn('flex flex-col gap-2', {
      'text-destructive': hasError,
      'text-green-600': hasSuccess && !hasError,
    })

    switch (fieldType) {
      case 'textarea': {
        return (
          <div key={field.id} className={fieldContainerClasses}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={(formData[field.id] as string) ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className={cn({
                'border-destructive focus-visible:ring-destructive': hasError,
                'border-green-500 focus-visible:ring-green-500': hasSuccess && !hasError,
              })}
            />
            {hasError && (
              <p className="text-sm text-destructive mt-1">{field.validation.error}</p>
            )}
          </div>
        )
      }

      case 'select': {
        return (
          <div key={field.id} className={fieldContainerClasses}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={(formData[field.id] as string) ?? ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
              required={field.required}
            >
              <SelectTrigger
                id={field.id}
                className={cn({
                  'border-destructive focus:ring-destructive': hasError,
                  'border-green-500 focus:ring-green-500': hasSuccess && !hasError,
                })}
              >
                <SelectValue placeholder={field.placeholder ?? 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-sm text-destructive mt-1">{field.validation.error}</p>
            )}
          </div>
        )
      }

      case 'checkbox': {
        return (
          <div key={field.id} className={cn('flex items-center gap-2', fieldContainerClasses)}>
            <Checkbox
              id={field.id}
              checked={(formData[field.id] as boolean) ?? false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              required={field.required}
            />
            <Label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {hasError && (
              <p className="text-sm text-destructive mt-1 w-full">{field.validation.error}</p>
            )}
          </div>
        )
      }

      case 'radio': {
        return (
          <div key={field.id} className={fieldContainerClasses}>
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={(formData[field.id] as string) ?? ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label
                    htmlFor={`${field.id}-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && (
              <p className="text-sm text-destructive mt-1">{field.validation.error}</p>
            )}
          </div>
        )
      }

      default: {
        return (
          <div key={field.id} className={fieldContainerClasses}>
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={fieldType}
              placeholder={field.placeholder}
              value={(formData[field.id] as string) ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className={cn({
                'border-destructive focus-visible:ring-destructive': hasError,
                'border-green-500 focus-visible:ring-green-500': hasSuccess && !hasError,
              })}
            />
            {hasError && (
              <p className="text-sm text-destructive mt-1">{field.validation.error}</p>
            )}
          </div>
        )
      }
    }
  }

  return (
    <Card className={cn('w-full', className)} style={style}>
      <CardHeader>
        <CardTitle>{content}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {fields.map((field) => renderField(field))}
          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

