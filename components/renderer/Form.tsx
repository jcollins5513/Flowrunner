// Form component renderer
// Uses shadcn/ui Input, Label, and Button components from component library
'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormField {
  id: string
  label: string
  placeholder?: string
  type?: string
}

export interface FormProps {
  content: string
  fields?: FormField[]
  submitLabel?: string
  className?: string
  style?: React.CSSProperties
}

export const Form: React.FC<FormProps> = ({
  content,
  fields = [],
  submitLabel = 'Submit',
  className = '',
  style,
}) => {
  return (
    <Card className={cn('w-full', className)} style={style}>
      <CardHeader>
        <CardTitle>{content}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => event.preventDefault()}
        >
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
              />
            </div>
          ))}
          <Button type="submit" className="mt-2">
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

