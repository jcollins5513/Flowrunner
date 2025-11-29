/**
 * FX Presets - Predefined visual effects and animation configurations
 */

export type FXPreset =
  | 'none'
  | 'subtle-fade'
  | 'slide-up'
  | 'scale-in'
  | 'parallax'
  | 'glow'
  | 'blur-reveal'
  | 'particle-burst'
  | 'gradient-shift'
  | 'glassmorphism'
  | 'neon'
  | 'retro-scan'
  | 'smooth-float'
  | 'magnetic-hover'
  | 'ripple'
  | 'shimmer'
  | 'morphing'
  | 'cinematic'

export interface FXPresetConfig {
  name: FXPreset
  displayName: string
  description: string
  animations: {
    hero?: Record<string, unknown>
    title?: Record<string, unknown>
    subtitle?: Record<string, unknown>
    button?: Record<string, unknown>
    background?: Record<string, unknown>
    global?: Record<string, unknown>
  }
  effects: {
    blur?: number
    glow?: {
      color?: string
      intensity?: number
    }
    shadow?: {
      color?: string
      blur?: number
      spread?: number
    }
    backdrop?: {
      blur?: number
      opacity?: number
    }
  }
  transitions?: {
    duration?: number
    easing?: string
  }
}

export const FX_PRESETS: Record<FXPreset, FXPresetConfig> = {
  'none': {
    name: 'none',
    displayName: 'No Effects',
    description: 'Clean, no animations or effects',
    animations: {},
    effects: {},
  },
  'subtle-fade': {
    name: 'subtle-fade',
    displayName: 'Subtle Fade',
    description: 'Gentle fade-in animations',
    animations: {
      hero: { fadeIn: true, delay: 0, duration: 600 },
      title: { fadeIn: true, delay: 200, duration: 500 },
      subtitle: { fadeIn: true, delay: 400, duration: 500 },
      button: { fadeIn: true, delay: 600, duration: 500 },
    },
    effects: {},
    transitions: { duration: 500, easing: 'ease-out' },
  },
  'slide-up': {
    name: 'slide-up',
    displayName: 'Slide Up',
    description: 'Elements slide up from bottom',
    animations: {
      hero: { slideIn: { direction: 'up' }, delay: 0, duration: 700 },
      title: { slideIn: { direction: 'up' }, delay: 200, duration: 600 },
      subtitle: { slideIn: { direction: 'up' }, delay: 400, duration: 600 },
      button: { slideIn: { direction: 'up' }, delay: 600, duration: 600 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'scale-in': {
    name: 'scale-in',
    displayName: 'Scale In',
    description: 'Elements scale in from center',
    animations: {
      hero: { scale: true, delay: 0, duration: 500 },
      title: { scale: true, delay: 200, duration: 400 },
      subtitle: { scale: true, delay: 400, duration: 400 },
      button: { scale: true, delay: 600, duration: 400 },
    },
    effects: {},
    transitions: { duration: 400, easing: 'ease-out' },
  },
  'parallax': {
    name: 'parallax',
    displayName: 'Parallax',
    description: 'Parallax scrolling effect with depth',
    animations: {
      background: { parallax: { speed: 0.5 }, duration: 1000 },
      hero: { parallax: { speed: 0.3 }, delay: 100, duration: 800 },
      title: { slideIn: { direction: 'up' }, delay: 300, duration: 600 },
      subtitle: { slideIn: { direction: 'up' }, delay: 500, duration: 600 },
      button: { fadeIn: true, delay: 700, duration: 500 },
    },
    effects: {
      backdrop: { blur: 2, opacity: 0.9 },
    },
    transitions: { duration: 800, easing: 'ease-out' },
  },
  'glow': {
    name: 'glow',
    displayName: 'Glow',
    description: 'Luminous glow effects on elements',
    animations: {
      title: { fadeIn: true, delay: 200, duration: 600 },
      button: { fadeIn: true, delay: 400, duration: 600 },
    },
    effects: {
      glow: { color: '#A855F7', intensity: 0.8 },
      shadow: { color: '#A855F7', blur: 20, spread: 0 },
    },
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'blur-reveal': {
    name: 'blur-reveal',
    displayName: 'Blur Reveal',
    description: 'Elements reveal from blur',
    animations: {
      hero: { blurReveal: true, delay: 0, duration: 800 },
      title: { blurReveal: true, delay: 300, duration: 700 },
      subtitle: { blurReveal: true, delay: 500, duration: 700 },
      button: { blurReveal: true, delay: 700, duration: 600 },
    },
    effects: {
      blur: 10,
    },
    transitions: { duration: 700, easing: 'ease-out' },
  },
  'particle-burst': {
    name: 'particle-burst',
    displayName: 'Particle Burst',
    description: 'Animated particle effects',
    animations: {
      background: { particles: { count: 50, speed: 2 }, duration: 2000 },
      title: { fadeIn: true, delay: 500, duration: 600 },
      button: { scale: true, delay: 800, duration: 500 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'gradient-shift': {
    name: 'gradient-shift',
    displayName: 'Gradient Shift',
    description: 'Animated gradient color shifts',
    animations: {
      background: { gradientShift: { speed: 3 }, duration: 5000 },
      title: { fadeIn: true, delay: 300, duration: 600 },
      subtitle: { fadeIn: true, delay: 500, duration: 600 },
      button: { fadeIn: true, delay: 700, duration: 600 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'glassmorphism': {
    name: 'glassmorphism',
    displayName: 'Glassmorphism',
    description: 'Frosted glass effect with backdrop blur',
    animations: {
      title: { fadeIn: true, delay: 200, duration: 600 },
      subtitle: { fadeIn: true, delay: 400, duration: 600 },
      button: { fadeIn: true, delay: 600, duration: 600 },
    },
    effects: {
      backdrop: { blur: 10, opacity: 0.7 },
      shadow: { color: 'rgba(255,255,255,0.1)', blur: 10, spread: 0 },
    },
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'neon': {
    name: 'neon',
    displayName: 'Neon',
    description: 'Neon glow and cyberpunk aesthetic',
    animations: {
      title: { neonPulse: true, delay: 200, duration: 2000 },
      button: { neonPulse: true, delay: 400, duration: 2000 },
    },
    effects: {
      glow: { color: '#00FFFF', intensity: 1.0 },
      shadow: { color: '#00FFFF', blur: 15, spread: 2 },
    },
    transitions: { duration: 300, easing: 'ease-out' },
  },
  'retro-scan': {
    name: 'retro-scan',
    displayName: 'Retro Scan',
    description: 'Vintage CRT scanline effect',
    animations: {
      background: { scanlines: true, duration: 1000 },
      title: { fadeIn: true, delay: 300, duration: 600 },
      subtitle: { fadeIn: true, delay: 500, duration: 600 },
    },
    effects: {
      backdrop: { blur: 1, opacity: 0.95 },
    },
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'smooth-float': {
    name: 'smooth-float',
    displayName: 'Smooth Float',
    description: 'Gentle floating animation',
    animations: {
      hero: { float: { amplitude: 20, speed: 3 }, duration: 3000 },
      title: { fadeIn: true, delay: 200, duration: 600 },
      button: { fadeIn: true, delay: 400, duration: 600 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'magnetic-hover': {
    name: 'magnetic-hover',
    displayName: 'Magnetic Hover',
    description: 'Magnetic attraction effect on hover',
    animations: {
      button: { magnetic: true, delay: 0, duration: 300 },
    },
    effects: {},
    transitions: { duration: 300, easing: 'ease-out' },
  },
  'ripple': {
    name: 'ripple',
    displayName: 'Ripple',
    description: 'Ripple wave effects',
    animations: {
      background: { ripple: { count: 3, speed: 2 }, duration: 2000 },
      title: { fadeIn: true, delay: 400, duration: 600 },
      button: { ripple: { trigger: 'hover' }, duration: 500 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'shimmer': {
    name: 'shimmer',
    displayName: 'Shimmer',
    description: 'Shimmering light sweep effect',
    animations: {
      title: { shimmer: { speed: 2 }, duration: 2000 },
      button: { shimmer: { speed: 2 }, delay: 500, duration: 2000 },
    },
    effects: {},
    transitions: { duration: 600, easing: 'ease-out' },
  },
  'morphing': {
    name: 'morphing',
    displayName: 'Morphing',
    description: 'Fluid morphing shapes and transitions',
    animations: {
      background: { morph: { speed: 1.5 }, duration: 4000 },
      hero: { fadeIn: true, delay: 300, duration: 800 },
      title: { fadeIn: true, delay: 500, duration: 700 },
    },
    effects: {
      backdrop: { blur: 5, opacity: 0.8 },
    },
    transitions: { duration: 800, easing: 'ease-in-out' },
  },
  'cinematic': {
    name: 'cinematic',
    displayName: 'Cinematic',
    description: 'Cinematic entrance with dramatic timing',
    animations: {
      hero: { fadeIn: true, delay: 0, duration: 1200 },
      title: { slideIn: { direction: 'up' }, delay: 400, duration: 800 },
      subtitle: { slideIn: { direction: 'up' }, delay: 700, duration: 800 },
      button: { scale: true, delay: 1000, duration: 600 },
    },
    effects: {
      backdrop: { blur: 3, opacity: 0.9 },
      shadow: { color: 'rgba(0,0,0,0.3)', blur: 30, spread: 0 },
    },
    transitions: { duration: 1000, easing: 'ease-out' },
  },
}

/**
 * Get FX preset configuration by name
 */
export function getFXPreset(preset: FXPreset): FXPresetConfig {
  return FX_PRESETS[preset] || FX_PRESETS.none
}

/**
 * Convert FX preset to DSL animations format
 */
export function fxPresetToAnimations(preset: FXPreset): Record<string, unknown> {
  const config = getFXPreset(preset)
  const animations: Record<string, unknown> = {}

  // Merge all component animations into a single animations object
  Object.entries(config.animations).forEach(([component, anim]) => {
    if (anim) {
      animations[component] = anim
    }
  })

  // Add global animations
  if (config.animations.global) {
    Object.assign(animations, config.animations.global)
  }

  // Add effects as metadata
  if (Object.keys(config.effects).length > 0) {
    animations.effects = config.effects
  }

  // Add transitions
  if (config.transitions) {
    animations.transitions = config.transitions
  }

  return animations
}

/**
 * Infer FX preset from prompt keywords
 */
export function inferFXPresetFromPrompt(prompt: string): FXPreset {
  const lowerPrompt = prompt.toLowerCase()

  // Keyword matching for FX presets
  if (lowerPrompt.includes('parallax')) return 'parallax'
  if (lowerPrompt.includes('glow') || lowerPrompt.includes('neon')) return 'neon'
  if (lowerPrompt.includes('glass') || lowerPrompt.includes('frosted')) return 'glassmorphism'
  if (lowerPrompt.includes('blur')) return 'blur-reveal'
  if (lowerPrompt.includes('particle')) return 'particle-burst'
  if (lowerPrompt.includes('gradient') && lowerPrompt.includes('shift')) return 'gradient-shift'
  if (lowerPrompt.includes('retro') || lowerPrompt.includes('vintage') || lowerPrompt.includes('crt')) return 'retro-scan'
  if (lowerPrompt.includes('float') || lowerPrompt.includes('hover')) return 'smooth-float'
  if (lowerPrompt.includes('ripple')) return 'ripple'
  if (lowerPrompt.includes('shimmer') || lowerPrompt.includes('shine')) return 'shimmer'
  if (lowerPrompt.includes('morph') || lowerPrompt.includes('fluid')) return 'morphing'
  if (lowerPrompt.includes('cinematic') || lowerPrompt.includes('dramatic')) return 'cinematic'
  if (lowerPrompt.includes('slide')) return 'slide-up'
  if (lowerPrompt.includes('scale')) return 'scale-in'
  if (lowerPrompt.includes('fade') || lowerPrompt.includes('subtle')) return 'subtle-fade'

  // Default for landing pages with effects
  if (lowerPrompt.includes('landing') && (lowerPrompt.includes('effect') || lowerPrompt.includes('animation'))) {
    return 'cinematic'
  }

  return 'subtle-fade' // Default subtle animation
}

