// Navigation Editing Operations
// Utilities for managing navigation in editing mode

import type { ScreenDSL, Navigation } from '../dsl/types'
import { updateComponentProps } from './component-ops'

export interface NavigationUpdateResult {
  dsl: ScreenDSL
  navigation: Navigation
}

/**
 * Set navigation target for a screen
 */
export function setNavigationTarget(
  dsl: ScreenDSL,
  targetScreenId: string,
  trigger?: string
): NavigationUpdateResult {
  const navigation: Navigation = {
    type: 'internal',
    screenId: targetScreenId,
  }

  return {
    dsl: {
      ...dsl,
      navigation,
    },
    navigation,
  }
}

/**
 * Set external navigation URL
 */
export function setExternalNavigation(
  dsl: ScreenDSL,
  url: string,
  trigger?: string
): NavigationUpdateResult {
  const navigation: Navigation = {
    type: 'external',
    url,
  }

  return {
    dsl: {
      ...dsl,
      navigation,
    },
    navigation,
  }
}

/**
 * Remove navigation from a screen
 */
export function removeNavigation(dsl: ScreenDSL): ScreenDSL {
  const { navigation, ...rest } = dsl
  return rest
}

/**
 * Check if a screen has navigation
 */
export function hasNavigation(dsl: ScreenDSL): boolean {
  return !!dsl.navigation && (!!dsl.navigation.screenId || !!dsl.navigation.url)
}

/**
 * Get navigation target screen ID
 */
export function getNavigationTarget(dsl: ScreenDSL): string | null {
  return dsl.navigation?.screenId || null
}

/**
 * Get navigation URL (for external navigation)
 */
export function getNavigationUrl(dsl: ScreenDSL): string | null {
  return dsl.navigation?.url || null
}
