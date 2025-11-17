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
    case 'button':
      return (
        <Button
          key={component.content}
          content={component.content}
          onClick={onClick}
          {...commonProps}
        />
      )
    case 'form': {
      const fields = Array.isArray(component.props?.fields)
        ? (component.props?.fields as Array<Record<string, string>>).map((field, index) => ({
            id: field.id ?? `field-${index}`,
            label: field.label ?? `Field ${index + 1}`,
            placeholder: field.placeholder,
            type: field.type,
          }))
        : []

      return (
        <Form
          key={component.content}
          content={component.content}
          fields={fields}
          submitLabel={
            typeof component.props?.submitLabel === 'string'
              ? (component.props?.submitLabel as string)
              : 'Submit'
          }
          {...commonProps}
        />
      )
    }
    case 'text':
      return <Text key={component.content} content={component.content} {...commonProps} />
    case 'image':
      if (typeof component.props?.url === 'string') {
        return (
          <div key={component.content} className={className} style={{ ...style, minHeight: 200 }}>
            <HeroImage
              image={{
                id: component.props?.id ?? component.content,
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

