// Component factory - maps DSL component types to React components
import React from 'react'
import { type Component } from '../dsl/types'
import { Title } from '@/components/renderer/Title'
import { Subtitle } from '@/components/renderer/Subtitle'
import { Button } from '@/components/renderer/Button'
import { Text } from '@/components/renderer/Text'

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
    case 'text':
      return <Text key={component.content} content={component.content} {...commonProps} />
    case 'form':
      // Form component will be implemented later
      return (
        <div key="form" className={className} style={style}>
          Form: {component.content}
        </div>
      )
    case 'image':
      // Image component will be handled separately
      return (
        <div key="image" className={className} style={style}>
          Image: {component.content}
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

