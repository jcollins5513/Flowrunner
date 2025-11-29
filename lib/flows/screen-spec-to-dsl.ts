import type { ScreenSpec } from '@/lib/specs/screen-spec'
import type { Component } from '@/lib/dsl/types'
import type { PatternDefinition } from '@/lib/patterns/schema'

/**
 * Maps ScreenSpec fields into component content overrides
 * This ensures the rendered screen reflects the ScreenSpec instead of static template copy
 */
export function mapScreenSpecToComponents(
  screenSpec: ScreenSpec,
  patternDefinition: PatternDefinition,
  existingComponents: Component[]
): Component[] {
  const timestamp = Date.now()
  console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Mapping ScreenSpec to components:`, {
    screenName: screenSpec.screenName,
    screenType: screenSpec.screenType,
    hasTopBar: !!screenSpec.layout.topBar,
    hasBottomButton: !!screenSpec.layout.bottomCenterButton,
    existingComponentCount: existingComponents.length,
    existingComponentTypes: existingComponents.map(c => c.type),
  })

  const components: Component[] = []
  const componentMap = new Map<string, Component>()
  
  // Index existing components by type
  existingComponents.forEach((comp) => {
    componentMap.set(comp.type, comp)
  })

  // Map topBar to title component, or use screenName if no topBar
  const titleText = screenSpec.layout.topBar?.title || screenSpec.screenName
  if (screenSpec.layout.topBar || screenSpec.screenName) {
    console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Processing title:`, {
      title: titleText,
      hasTopBar: !!screenSpec.layout.topBar,
      hasRightButton: !!screenSpec.layout.topBar?.rightActionButton,
    })
    const titleComponent = componentMap.get('title')
    if (titleComponent) {
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Overriding title component:`, {
        oldContent: titleComponent.content?.substring(0, 50),
        newContent: titleText,
      })
      components.push({
        ...titleComponent,
        content: titleText,
      })
    } else if (patternDefinition.componentSlots.required.includes('title') || 
               patternDefinition.componentSlots.optional.includes('title')) {
      // Create title if slot exists but component doesn't
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Creating new title component from ScreenSpec`)
      components.push({
        type: 'title',
        content: titleText,
      })
    }

    // Map rightActionButton to a button component (if slot available)
    if (screenSpec.layout.topBar.rightActionButton) {
      const button = screenSpec.layout.topBar.rightActionButton
      const buttonComponent = componentMap.get('button')
      if (buttonComponent) {
        components.push({
          ...buttonComponent,
          content: button.label || button.id,
          props: {
            ...buttonComponent.props,
            id: button.id,
            icon: button.icon,
            variant: 'ghost', // Top bar buttons are typically ghost style
          },
        })
      }
    }
  } else {
    // Even without topBar, try to override title with screenName if title slot exists
    const titleComponent = componentMap.get('title')
    if (titleComponent && screenSpec.screenName) {
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Overriding title with screenName (no topBar):`, {
        oldContent: titleComponent.content?.substring(0, 50),
        newContent: screenSpec.screenName,
      })
      components.push({
        ...titleComponent,
        content: screenSpec.screenName,
      })
    }
  }

  // Map bottomCenterButton to primary button component
  if (screenSpec.layout.bottomCenterButton) {
    const button = screenSpec.layout.bottomCenterButton
    console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Processing bottomCenterButton:`, {
      id: button.id,
      label: button.label,
      variant: button.variant,
      shape: button.shape,
    })
    const buttonComponent = componentMap.get('button')
    if (buttonComponent) {
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Overriding button component:`, {
        oldContent: buttonComponent.content?.substring(0, 50),
        newContent: button.label || button.id,
      })
      components.push({
        ...buttonComponent,
        content: button.label || button.id,
        props: {
          ...buttonComponent.props,
          id: button.id,
          variant: button.variant,
          shape: button.shape,
          icon: button.icon,
        },
      })
    } else if (patternDefinition.componentSlots.required.includes('button') || 
               patternDefinition.componentSlots.optional.includes('button')) {
      // Create button if slot exists but component doesn't
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Creating new button component from ScreenSpec`)
      components.push({
        type: 'button',
        content: button.label || button.id,
        props: {
          id: button.id,
          variant: button.variant,
          shape: button.shape,
          icon: button.icon,
        },
      })
    }
  }

  // Map tabBar to navigation metadata (for now, we'll store it in component props)
  // In the future, this could be a dedicated navigation component
  if (screenSpec.layout.tabBar) {
    const tabBar = screenSpec.layout.tabBar
    // Store tab bar info in metadata - we'll need to extend Component type or use props
    // For now, we'll add it as a special component or metadata
    console.log('[DEBUG:ScreenSpecToDSL] TabBar detected:', {
      activeTabId: tabBar.activeTabId,
      tabCount: tabBar.tabs.length,
    })
    // TODO: Create navigation component or extend metadata to include tabBar
  }

  // Preserve other existing components that weren't overridden
  existingComponents.forEach((comp) => {
    const overridden = components.find((c) => c.type === comp.type)
    if (!overridden) {
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Preserving component not overridden:`, {
        type: comp.type,
        contentPreview: comp.content?.substring(0, 50),
      })
      components.push(comp)
    } else {
      console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Component was overridden, skipping original:`, {
        type: comp.type,
        originalContent: comp.content?.substring(0, 50),
        newContent: overridden.content?.substring(0, 50),
      })
    }
  })

  console.log(`[DEBUG:ScreenSpecToDSL:${timestamp}] Component mapping complete:`, {
    totalComponents: components.length,
    componentTypes: components.map(c => c.type),
    componentContents: components.map(c => ({
      type: c.type,
      contentPreview: c.content?.substring(0, 50),
    })),
  })

  return components
}

/**
 * Apply ScreenSpec content overrides to components in a DSL
 */
export function applyScreenSpecContentOverrides(
  screenSpec: ScreenSpec,
  patternDefinition: PatternDefinition,
  components: Component[]
): Component[] {
  return mapScreenSpecToComponents(screenSpec, patternDefinition, components)
}

