// Component Operations
// Handles component-level editing operations with validation

import type { ScreenDSL, Component } from '../dsl/types'
import { validateComponentEdit } from './validation'
import { loadPattern } from '../patterns/loader'
import { canReorderComponents, canDeleteComponent, canAddComponent } from './validation'

export interface ComponentUpdateResult {
  success: boolean
  dsl: ScreenDSL
  error?: string
  validationErrors?: Array<{ field: string; message: string }>
}

/**
 * Update component content
 */
export function updateComponentContent(
  dsl: ScreenDSL,
  componentIndex: number,
  newContent: string
): ComponentUpdateResult {
  // Validate component index
  if (componentIndex < 0 || componentIndex >= dsl.components.length) {
    return {
      success: false,
      dsl,
      error: 'Invalid component index',
      validationErrors: [{ field: 'componentIndex', message: 'Component index out of range' }],
    }
  }

  // Validate edit
  const validation = validateComponentEdit(dsl, componentIndex, { content: newContent })
  if (!validation.valid) {
    return {
      success: false,
      dsl,
      error: 'Validation failed',
      validationErrors: validation.errors,
    }
  }

  // Update component
  const updatedComponents = [...dsl.components]
  updatedComponents[componentIndex] = {
    ...updatedComponents[componentIndex],
    content: newContent,
  }

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}

/**
 * Update component props
 */
export function updateComponentProps(
  dsl: ScreenDSL,
  componentIndex: number,
  newProps: Partial<Record<string, unknown>>
): ComponentUpdateResult {
  // Validate component index
  if (componentIndex < 0 || componentIndex >= dsl.components.length) {
    return {
      success: false,
      dsl,
      error: 'Invalid component index',
      validationErrors: [{ field: 'componentIndex', message: 'Component index out of range' }],
    }
  }

  // Update component props
  const updatedComponents = [...dsl.components]
  updatedComponents[componentIndex] = {
    ...updatedComponents[componentIndex],
    props: {
      ...updatedComponents[componentIndex].props,
      ...newProps,
    },
  }

  // Validate edit
  const validation = validateComponentEdit(dsl, componentIndex, updatedComponents[componentIndex])
  if (!validation.valid) {
    return {
      success: false,
      dsl,
      error: 'Validation failed',
      validationErrors: validation.errors,
    }
  }

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}

/**
 * Reorder components
 */
export function reorderComponents(
  dsl: ScreenDSL,
  fromIndex: number,
  toIndex: number
): ComponentUpdateResult {
  // Validate indices
  if (
    fromIndex < 0 ||
    fromIndex >= dsl.components.length ||
    toIndex < 0 ||
    toIndex >= dsl.components.length
  ) {
    return {
      success: false,
      dsl,
      error: 'Invalid component index',
      validationErrors: [{ field: 'componentIndex', message: 'Component index out of range' }],
    }
  }

  if (fromIndex === toIndex) {
    return {
      success: true,
      dsl, // No change
    }
  }

  // Check if pattern allows reordering
  const pattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
  if (!canReorderComponents(pattern)) {
    return {
      success: false,
      dsl,
      error: 'Pattern does not allow component reordering',
      validationErrors: [{ field: 'reorder', message: 'This pattern does not support reordering' }],
    }
  }

  // Reorder components
  const updatedComponents = [...dsl.components]
  const [movedComponent] = updatedComponents.splice(fromIndex, 1)
  updatedComponents.splice(toIndex, 0, movedComponent)

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}

/**
 * Delete component
 */
export function deleteComponent(
  dsl: ScreenDSL,
  componentIndex: number
): ComponentUpdateResult {
  // Validate component index
  if (componentIndex < 0 || componentIndex >= dsl.components.length) {
    return {
      success: false,
      dsl,
      error: 'Invalid component index',
      validationErrors: [{ field: 'componentIndex', message: 'Component index out of range' }],
    }
  }

  // Check if pattern allows deletion
  const pattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
  if (!canDeleteComponent(pattern, componentIndex, dsl.components)) {
    return {
      success: false,
      dsl,
      error: 'Cannot delete component',
      validationErrors: [
        { field: 'delete', message: 'Cannot delete component - pattern requires this component' },
      ],
    }
  }

  // Delete component
  const updatedComponents = dsl.components.filter((_, index) => index !== componentIndex)

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}

/**
 * Add component
 */
export function addComponent(
  dsl: ScreenDSL,
  componentType: Component['type'],
  slotName?: string
): ComponentUpdateResult {
  // Check if pattern allows adding components
  const pattern = loadPattern(dsl.pattern_family, dsl.pattern_variant)
  if (!canAddComponent(pattern, dsl.components)) {
    return {
      success: false,
      dsl,
      error: 'Cannot add component',
      validationErrors: [
        { field: 'add', message: 'Cannot add component - pattern slots are full' },
      ],
    }
  }

  // Create new component
  const newComponent: Component = {
    type: componentType,
    content: 'New component',
    props: {},
  }

  // Add component at the end (can be enhanced to insert at specific slot)
  const updatedComponents = [...dsl.components, newComponent]

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}

/**
 * Update entire component
 */
export function updateComponent(
  dsl: ScreenDSL,
  componentIndex: number,
  updatedComponent: Partial<Component>
): ComponentUpdateResult {
  // Validate component index
  if (componentIndex < 0 || componentIndex >= dsl.components.length) {
    return {
      success: false,
      dsl,
      error: 'Invalid component index',
      validationErrors: [{ field: 'componentIndex', message: 'Component index out of range' }],
    }
  }

  // Validate edit
  const validation = validateComponentEdit(dsl, componentIndex, updatedComponent)
  if (!validation.valid) {
    return {
      success: false,
      dsl,
      error: 'Validation failed',
      validationErrors: validation.errors,
    }
  }

  // Update component
  const updatedComponents = [...dsl.components]
  updatedComponents[componentIndex] = {
    ...updatedComponents[componentIndex],
    ...updatedComponent,
  }

  return {
    success: true,
    dsl: {
      ...dsl,
      components: updatedComponents,
    },
  }
}
