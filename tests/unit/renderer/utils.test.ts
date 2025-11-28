import { describe, it, expect } from 'vitest'
import {
  computeSlotPosition,
  getImagePlacement,
  validateComponentProps,
  generateLayoutDebugInfo,
} from '@/lib/renderer/utils'
import { type PatternDefinition } from '@/lib/patterns/schema'
import { type Component } from '@/lib/dsl/types'

describe('Renderer utilities', () => {
  describe('computeSlotPosition', () => {
    const position = { x: 1, y: 2, width: 2, height: 1 }

    it('computes grid position correctly', () => {
      const styles = computeSlotPosition(position, 'grid')

      expect(styles).toHaveProperty('gridColumn', '2 / 4')
      expect(styles).toHaveProperty('gridRow', '3 / 4')
    })

    it('computes flex position correctly', () => {
      const styles = computeSlotPosition(position, 'flex')

      expect(styles).toHaveProperty('order', 2)
      expect(styles).toHaveProperty('flex', 2)
    })
  })

  describe('getImagePlacement', () => {
    const mockPattern: Partial<PatternDefinition> = {
      imagePlacement: {
        hero: { position: 'top', size: 'full' },
        supporting: [
          { position: 'left', size: 'half' },
          { position: 'right', size: 'third' },
        ],
      },
    }

    it('returns hero image placement', () => {
      const placement = getImagePlacement(mockPattern as PatternDefinition, 'hero')

      expect(placement).toEqual({ position: 'top', size: 'full' })
    })

    it('returns supporting image placement by index', () => {
      const placement = getImagePlacement(mockPattern as PatternDefinition, 'supporting', 0)

      expect(placement).toEqual({ position: 'left', size: 'half' })
    })

    it('returns first supporting placement when index not provided', () => {
      const placement = getImagePlacement(mockPattern as PatternDefinition, 'supporting')

      expect(placement).toEqual({ position: 'left', size: 'half' })
    })

    it('returns null when pattern has no supporting placements', () => {
      const patternWithoutSupporting: Partial<PatternDefinition> = {
        imagePlacement: {
          hero: { position: 'top', size: 'full' },
        },
      }

      const placement = getImagePlacement(patternWithoutSupporting as PatternDefinition, 'supporting')

      expect(placement).toBeNull()
    })
  })

  describe('validateComponentProps', () => {
    it('validates component props correctly', () => {
      const component: Component = {
        type: 'button',
        content: 'Click me',
        props: {
          variant: 'default',
          size: 'md',
        },
      }

      const result = validateComponentProps(component, {
        variant: 'string',
        size: 'string',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('reports validation errors', () => {
      const component: Component = {
        type: 'button',
        content: 'Click me',
        props: {
          variant: 123, // Should be string
          size: 'md',
        },
      }

      const result = validateComponentProps(component, {
        variant: 'string',
        size: 'string',
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('variant')
    })

    it('handles missing props gracefully', () => {
      const component: Component = {
        type: 'button',
        content: 'Click me',
      }

      const result = validateComponentProps(component, {
        variant: 'string',
      })

      expect(result.valid).toBe(true)
    })
  })

  describe('generateLayoutDebugInfo', () => {
    it('generates debug info with slot information', () => {
      const pattern: Partial<PatternDefinition> = {
        family: 'ONB_HERO_TOP',
        variant: 1,
        layout: {
          structure: 'grid',
          positions: {
            hero_image: { x: 0, y: 0, width: 2, height: 1 },
            title: { x: 0, y: 1, width: 1, height: 1 },
            subtitle: { x: 0, y: 2, width: 1, height: 1 },
          },
        },
      }

      const components: Component[] = [
        { type: 'title', content: 'Test Title' },
        { type: 'subtitle', content: 'Test Subtitle' },
      ]

      const debugInfo = generateLayoutDebugInfo(pattern as PatternDefinition, components)

      expect(debugInfo.patternFamily).toBe('ONB_HERO_TOP')
      expect(debugInfo.patternVariant).toBe(1)
      expect(debugInfo.slots).toHaveLength(3)
      expect(debugInfo.slots.find((s) => s.name === 'title')?.hasComponent).toBe(true)
      expect(debugInfo.slots.find((s) => s.name === 'hero_image')?.hasComponent).toBe(false)
    })
  })
})

