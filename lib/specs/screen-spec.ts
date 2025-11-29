import { z } from 'zod'

// ScreenSpec Zod Schema
const topBarSchema = z.object({
  title: z.string().min(1),
  rightActionButton: z
    .object({
      id: z.string().min(1),
      label: z.string().optional(),
      icon: z.string().optional(),
    })
    .optional(),
})

const mainSchema = z.object({
  type: z.enum(['cameraScanner', 'static', 'list', 'form', 'card', 'gallery', 'grid', 'hero', 'carousel']),
  hasScanFrame: z.boolean().optional(),
  overlayStyle: z.enum(['rounded-frame', 'corners-only', 'none']).optional(),
  cardCount: z.number().optional(), // For card-based layouts
  cardStyle: z.enum(['revolving', 'stacked', 'grid', 'carousel']).optional(), // For card layouts
})

const bottomCenterButtonSchema = z
  .object({
    id: z.string().min(1),
    variant: z.enum(['primary', 'ghost']),
    shape: z.enum(['circle', 'pill']),
    label: z.string().optional(),
    icon: z.string().optional(),
  })
  .optional()

const tabBarSchema = z
  .object({
    activeTabId: z.string().min(1),
    tabs: z.array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        icon: z.string().optional(),
      })
    ),
  })
  .optional()

const backgroundSchema = z
  .object({
    type: z.enum(['animatedGradient', 'solid']),
    emphasis: z.enum(['subtle', 'strong']),
  })
  .optional()

const fxPresetSchema = z
  .enum([
    'none',
    'subtle-fade',
    'slide-up',
    'scale-in',
    'parallax',
    'glow',
    'blur-reveal',
    'particle-burst',
    'gradient-shift',
    'glassmorphism',
    'neon',
    'retro-scan',
    'smooth-float',
    'magnetic-hover',
    'ripple',
    'shimmer',
    'morphing',
    'cinematic',
  ])
  .optional()

const layoutSchema = z.object({
  topBar: topBarSchema.optional(),
  main: mainSchema,
  bottomCenterButton: bottomCenterButtonSchema,
  tabBar: tabBarSchema,
  background: backgroundSchema,
  fxPreset: fxPresetSchema,
})

export const screenSpecSchema = z.object({
  screenName: z.string().min(1),
  screenType: z.enum([
    'scanner', 
    'form', 
    'dashboard', 
    'detail', 
    'landing', 
    'gallery', 
    'photoLibrary', 
    'card', 
    'hero', 
    'unknown'
  ]),
  layout: layoutSchema,
})

// TypeScript types
export type TopBar = z.infer<typeof topBarSchema>
export type Main = z.infer<typeof mainSchema>
export type BottomCenterButton = z.infer<typeof bottomCenterButtonSchema>
export type TabBar = z.infer<typeof tabBarSchema>
export type Background = z.infer<typeof backgroundSchema>
export type FXPreset = z.infer<typeof fxPresetSchema>
export type Layout = z.infer<typeof layoutSchema>
export type ScreenSpec = z.infer<typeof screenSpecSchema>

// Helper to create a minimal fallback ScreenSpec
export function createFallbackScreenSpec(prompt: string): ScreenSpec {
  return {
    screenName: 'Screen',
    screenType: 'unknown',
    layout: {
      main: {
        type: 'static',
      },
    },
  }
}

