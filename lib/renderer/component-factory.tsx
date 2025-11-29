// Component factory - maps DSL component types to React components
import React from 'react'
import { type Component, type Palette, type Vibe } from '../dsl/types'
import { type PatternFamily } from '../patterns/families'
import { Title } from '@/components/renderer/Title'
import { Subtitle } from '@/components/renderer/Subtitle'
import { Button } from '@/components/renderer/Button'
import { Text } from '@/components/renderer/Text'
import { Form, type FormFieldType } from '@/components/renderer/Form'
import { HeroImage } from '@/components/renderer/HeroImage'
import { EditableTitle } from '@/components/editing/EditableTitle'
import { EditableSubtitle } from '@/components/editing/EditableSubtitle'
import { EditableButton } from '@/components/editing/EditableButton'
import { EditableText } from '@/components/editing/EditableText'
import { EditableForm } from '@/components/editing/EditableForm'
import { LibraryComponentRenderer } from '@/lib/library/wrappers/library-component-renderer'
import type { ComponentCategory } from '@/lib/library/component-types'

export const SUPPORTED_COMPONENT_TYPES: Component['type'][] = ['title', 'subtitle', 'button', 'form', 'text', 'image']

export interface LibraryContext {
  vibe: Vibe
  palette: Palette
  pattern: PatternFamily
  slot?: string
  hasAccess: boolean
  screenType?: string
  formFactor?: 'mobile' | 'web' | 'both'
  categoryPreference?: ComponentCategory
}

export interface ComponentRendererProps {
  component: Component
  style?: React.CSSProperties
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  // Editing props (optional)
  editMode?: boolean
  editingComponentId?: string | null
  componentIndex?: number
  onStartEdit?: (componentIndex: number) => void
  onSaveEdit?: (componentIndex: number, updatedComponent: Component) => void
  screenId?: string
  // Library component context (optional)
  libraryContext?: LibraryContext
}

export function renderComponent({
  component,
  style,
  className,
  onClick,
  editMode = false,
  editingComponentId = null,
  componentIndex = -1,
  onStartEdit,
  onSaveEdit,
  screenId,
  libraryContext,
}: ComponentRendererProps): React.ReactElement {
  const commonProps = { style, className }
  const isEditing = editMode && editingComponentId === `${screenId}-${componentIndex}`

  // Check if component explicitly specifies a library component
  const explicitLibraryComponent = component.props?.libraryComponent as string | false | undefined

  // Try to use library component if context is provided and component doesn't explicitly opt out
  const useLibraryComponent =
    libraryContext &&
    libraryContext.hasAccess &&
    (explicitLibraryComponent !== false) // Allow explicit opt-out via libraryComponent: false

  // Helper to get component ID
  const getComponentId = () => {
    if (screenId && componentIndex >= 0) {
      return `${screenId}-${componentIndex}`
    }
    return null
  }

  const handleStartEdit = () => {
    if (onStartEdit && componentIndex >= 0) {
      onStartEdit(componentIndex)
    }
  }

  const handleSave = (newContent: string) => {
    if (onSaveEdit && componentIndex >= 0) {
      onSaveEdit(componentIndex, { ...component, content: newContent })
    }
  }

  const handleSaveComponent = (updatedComponent: Component) => {
    if (onSaveEdit && componentIndex >= 0) {
      onSaveEdit(componentIndex, updatedComponent)
    }
  }

  switch (component.type) {
    case 'title': {
      if (editMode) {
        return (
          <EditableTitle
            key={component.content}
            content={component.content}
            onSave={handleSave}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            {...commonProps}
          />
        )
      }
      // Try library component, fallback to default
      if (useLibraryComponent && libraryContext) {
        return (
          <LibraryComponentRenderer
            component={component}
            vibe={libraryContext.vibe}
          palette={libraryContext.palette}
          pattern={libraryContext.pattern}
          slot={libraryContext.slot}
          hasAccess={libraryContext.hasAccess}
          screenType={libraryContext.screenType}
          categoryPreference={libraryContext.categoryPreference}
          formFactor={libraryContext.formFactor}
          style={style}
          className={className}
          defaultRender={() => (
            <Title key={component.content} content={component.content} {...commonProps} />
          )}
          />
        )
      }
      return <Title key={component.content} content={component.content} {...commonProps} />
    }
    case 'subtitle': {
      if (editMode) {
        return (
          <EditableSubtitle
            key={component.content}
            content={component.content}
            onSave={handleSave}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            {...commonProps}
          />
        )
      }
      // Try library component
      if (useLibraryComponent && libraryContext) {
        return (
          <LibraryComponentRenderer
            component={component}
            vibe={libraryContext.vibe}
            palette={libraryContext.palette}
            pattern={libraryContext.pattern}
            slot={libraryContext.slot}
            hasAccess={libraryContext.hasAccess}
            screenType={libraryContext.screenType}
            categoryPreference={libraryContext.categoryPreference}
            formFactor={libraryContext.formFactor}
            style={style}
            className={className}
            defaultRender={() => (
              <Subtitle key={component.content} content={component.content} {...commonProps} />
            )}
          />
        )
      }
      return <Subtitle key={component.content} content={component.content} {...commonProps} />
    }
    case 'button': {
      const buttonVariant = component.props?.variant as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | undefined
      const buttonSize = component.props?.size as 'default' | 'sm' | 'lg' | 'icon' | undefined
      
      if (editMode) {
        return (
          <EditableButton
            key={component.content}
            content={component.content}
            onSave={handleSave}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            onClick={onClick}
            variant={buttonVariant}
            size={buttonSize}
            {...commonProps}
          />
        )
      }
      
      // Try library component
      if (useLibraryComponent && libraryContext) {
        return (
          <LibraryComponentRenderer
            component={component}
            vibe={libraryContext.vibe}
          palette={libraryContext.palette}
          pattern={libraryContext.pattern}
          slot={libraryContext.slot}
          hasAccess={libraryContext.hasAccess}
          screenType={libraryContext.screenType}
          categoryPreference={libraryContext.categoryPreference}
          formFactor={libraryContext.formFactor}
          style={style}
          className={className}
          onClick={onClick}
          defaultRender={() => (
            <Button
                key={component.content}
                content={component.content}
                onClick={onClick}
                variant={buttonVariant}
                size={buttonSize}
                {...commonProps}
              />
            )}
          />
        )
      }
      
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
            id: (field.id as string | undefined) ?? `field-${index}`,
            label: (field.label as string | undefined) ?? `Field ${index + 1}`,
            placeholder: field.placeholder as string | undefined,
            type: field.type as FormFieldType | undefined,
            options: field.options as Array<{ value: string; label: string }> | undefined,
            required: field.required as boolean | undefined,
            validation: field.validation as { error?: string; success?: boolean } | undefined,
          }))
        : []

      if (editMode) {
        return (
          <EditableForm
            key={component.content}
            component={component}
            onSave={handleSaveComponent}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            {...commonProps}
          />
        )
      }

      if (useLibraryComponent && libraryContext) {
        return (
          <LibraryComponentRenderer
            component={component}
            vibe={libraryContext.vibe}
            palette={libraryContext.palette}
            pattern={libraryContext.pattern}
            slot={libraryContext.slot}
            hasAccess={libraryContext.hasAccess}
            screenType={libraryContext.screenType}
            categoryPreference={libraryContext.categoryPreference}
            formFactor={libraryContext.formFactor}
            style={style}
            className={className}
            defaultRender={() => (
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
            )}
          />
        )
      }

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
    case 'text': {
      if (editMode) {
        return (
          <EditableText
            key={component.content}
            content={component.content}
            onSave={handleSave}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
            {...commonProps}
          />
        )
      }
      // Try library component
      if (useLibraryComponent && libraryContext) {
        return (
          <LibraryComponentRenderer
            component={component}
            vibe={libraryContext.vibe}
            palette={libraryContext.palette}
            pattern={libraryContext.pattern}
            slot={libraryContext.slot}
            hasAccess={libraryContext.hasAccess}
            screenType={libraryContext.screenType}
            categoryPreference={libraryContext.categoryPreference}
            formFactor={libraryContext.formFactor}
            style={style}
            className={className}
            defaultRender={() => (
              <Text key={component.content} content={component.content} {...commonProps} />
            )}
          />
        )
      }
      return <Text key={component.content} content={component.content} {...commonProps} />
    }
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

