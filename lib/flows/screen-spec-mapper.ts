import type { ScreenSpec } from '@/lib/specs/screen-spec'
import type { PatternFamily, PatternVariant } from '@/lib/dsl/types'
import type { ScreenGenerationPlan } from '@/lib/flow/templates/selector'

/**
 * Maps ScreenSpec screenType to pattern family
 */
export function mapScreenTypeToPatternFamily(screenType: ScreenSpec['screenType']): PatternFamily {
  switch (screenType) {
    case 'scanner':
      return 'DEMO_DEVICE_FULLBLEED' // Use device mockup pattern for scanner screens
    case 'dashboard':
      return 'DASHBOARD_OVERVIEW'
    case 'form':
      return 'ACT_FORM_MINIMAL'
    case 'detail':
      return 'PRODUCT_DETAIL'
    case 'landing':
    case 'hero':
      return 'HERO_CENTER_TEXT' // Hero/landing pages use centered hero
    case 'gallery':
    case 'photoLibrary':
      return 'DASHBOARD_OVERVIEW' // Gallery/photo library uses grid/list view
    case 'card':
      return 'HERO_CENTER_TEXT' // Card-based screens can use hero or custom patterns
    case 'unknown':
    default:
      return 'HERO_CENTER_TEXT' // Default fallback
  }
}

/**
 * Override pattern in a ScreenGenerationPlan based on ScreenSpec
 */
export function applyScreenSpecToPlan(
  plan: ScreenGenerationPlan,
  screenSpec: ScreenSpec
): ScreenGenerationPlan {
  const timestamp = Date.now()
  console.log(`[DEBUG:ScreenSpecMapper:${timestamp}] Applying ScreenSpec to plan:`, {
    screenType: screenSpec.screenType,
    screenName: screenSpec.screenName,
    currentPlanFamily: plan.pattern.family,
    currentPlanVariant: plan.pattern.variant,
  })

  const patternFamily = mapScreenTypeToPatternFamily(screenSpec.screenType)
  console.log(`[DEBUG:ScreenSpecMapper:${timestamp}] Mapped screenType to pattern family:`, {
    screenType: screenSpec.screenType,
    mappedFamily: patternFamily,
  })
  
  // If the screenType suggests a different pattern, override it
  if (patternFamily !== plan.pattern.family) {
    console.log(`[DEBUG:ScreenSpecMapper:${timestamp}] Overriding pattern based on ScreenSpec:`, {
      originalFamily: plan.pattern.family,
      originalVariant: plan.pattern.variant,
      newFamily: patternFamily,
      screenType: screenSpec.screenType,
    })
    
    return {
      ...plan,
      pattern: {
        family: patternFamily,
        variant: plan.pattern.variant, // Keep original variant for now, could be made smarter
      },
    }
  }
  
  console.log(`[DEBUG:ScreenSpecMapper:${timestamp}] No override needed, pattern families match:`, {
    planFamily: plan.pattern.family,
    mappedFamily: patternFamily,
  })
  
  return plan
}

