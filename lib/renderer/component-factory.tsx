// Component factory - maps DSL component types to React components
import React from 'react'
import { type Component } from '../dsl/types'
import { Title } from '@/components/renderer/Title'
import { Subtitle } from '@/components/renderer/Subtitle'
import { Button } from '@/components/renderer/Button'
import { Text } from '@/components/renderer/Text'
import { Form } from '@/components/renderer/Form'
import { HeroImage } from '@/components/renderer/HeroImage'

export interface ComponentRendererProps {
  component: Component
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

export function renderComponent({
  component,
  style,
  className,
  onClick,
}: ComponentRendererProps): React.ReactElement {
  const commonProps = { style, className }

  switch (component.type) {
    case 'title':
      return <Title key={component.content} content={component.content} {...commonProps} />
    case 'subtitle':
      return <Subtitle key={component.content} content={component.content} {...commonProps} />
    case 'button': {
      const buttonVariant = component.props?.variant as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | undefined
      const buttonSize = component.props?.size as 'default' | 'sm' | 'lg' | 'icon' | undefined
      
      return (
        <Button
          key={component.content}
          content={component.content}
          onClick={onClick}
          variant={buttonVariant}
          size={buttonSize}
          {...commonProps}
        />
      )
    }
    case 'form': {
      const fields = Array.isArray(component.props?.fields)
        ? (component.props?.fields as Array<Record<string, unknown>>).map((field, index) => ({
            id: field.id ?? `field-${index}`,
            label: field.label ?? `Field ${index + 1}`,
            placeholder: field.placeholder as string | undefined,
            type: field.type as string | undefined,
            options: field.options as Array<{ value: string; label: string }> | undefined,
            required: field.required as boolean | undefined,
            validation: field.validation as { error?: string; success?: boolean } | undefined,
          }))
        : []

      return (
        <Form
          key={component.content}
          content={component.content}
          description={component.props?.description as string | undefined}
          fields={fields}
          submitLabel={
            typeof component.props?.submitLabel === 'string'
              ? (component.props?.submitLabel as string)
              : 'Submit'
          }
          onSubmit={component.props?.onSubmit as ((data: Record<string, unknown>) => void | Promise<void>) | undefined}
          {...commonProps}
        />
      )
    }
    case 'text':
      return <Text key={component.content} content={component.content} {...commonProps} />
    case 'image':
      if (typeof component.props?.url === 'string') {
        const imageId = typeof component.props?.id === 'string' 
          ? component.props.id 
          : component.content
        return (
          <div key={component.content} className={className} style={{ ...style, minHeight: 200 }}>
            <HeroImage
              image={{
                id: imageId,
                url: component.props.url,
              }}
            />
          </div>
        )
      }
      return (
        <div key={component.content} className={className} style={style}>
          {component.content}
        </div>
      )
    default:
      return (
        <div key="unknown" className={className} style={style}>
          Unknown component type: {component.type}
        </div>
      )
  }
}

