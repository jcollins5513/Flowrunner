'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScreenRenderer, type ComponentInteractionContext } from '@/components/renderer/ScreenRenderer'
import type { Component, ScreenDSL } from '@/lib/dsl/types'
import { type NextScreenTriggerContext } from '@/lib/flows/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GitBranch, LinkIcon, Sparkles, X } from 'lucide-react'

const CLICKABLE_COMPONENT_TYPES: Component['type'][] = ['button']

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

type ActionMenuState = {
  component: Component
  componentType: Component['type']
  slotName?: string
  sourceScreenId?: string
  anchor: { x: number; y: number }
  containerSize: { width: number; height: number }
}

export interface InteractiveScreenProps {
  screen: ScreenDSL
  screenId?: string
  screenIndex?: number
  className?: string
  disabled?: boolean
  clickableComponentTypes?: Component['type'][]
  onGenerateNext?: (context: NextScreenTriggerContext) => Promise<void> | void
  onLinkExisting?: (context: NextScreenTriggerContext) => Promise<void> | void
}

export function InteractiveScreen({
  screen,
  screenId,
  screenIndex,
  className,
  disabled = false,
  clickableComponentTypes = CLICKABLE_COMPONENT_TYPES,
  onGenerateNext,
  onLinkExisting,
}: InteractiveScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [menuState, setMenuState] = useState<ActionMenuState | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const interactiveTypes = useMemo(() => {
    return Array.from(new Set(clickableComponentTypes))
  }, [clickableComponentTypes])

  const closeMenu = useCallback(() => {
    setMenuState(null)
  }, [])

  useEffect(() => {
    if (!menuState) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('[data-flow-interactive-menu]')) {
        return
      }
      closeMenu()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuState, closeMenu])

  const handleComponentClick = useCallback(
    (
      componentType: Component['type'],
      component: Component,
      context: ComponentInteractionContext,
    ) => {
      if (disabled) {
        return
      }
      if (!interactiveTypes.includes(componentType)) {
        return
      }

      context.event.preventDefault()
      context.event.stopPropagation()

      const rect = containerRef.current?.getBoundingClientRect()
      const anchor = {
        x: rect ? context.event.clientX - rect.left : context.event.clientX,
        y: rect ? context.event.clientY - rect.top : context.event.clientY,
      }

      setMenuState({
        component,
        componentType,
        slotName: context.slotName,
        sourceScreenId: context.screenId,
        anchor,
        containerSize: {
          width: rect?.width ?? window.innerWidth,
          height: rect?.height ?? window.innerHeight,
        },
      })
    },
    [disabled, interactiveTypes],
  )

  const handleGenerateNext = useCallback(async () => {
    if (!menuState || !onGenerateNext || isGenerating) {
      return
    }
    setIsGenerating(true)
    try {
      await onGenerateNext({
        sourceScreenId: screenId ?? menuState.sourceScreenId,
        screen,
        component: menuState.component,
        componentType: menuState.componentType,
        slotName: menuState.slotName,
        trigger: 'click',
      })
      closeMenu()
    } finally {
      setIsGenerating(false)
    }
  }, [closeMenu, isGenerating, menuState, onGenerateNext, screen, screenId])

  const handleLinkExisting = useCallback(async () => {
    if (!menuState || !onLinkExisting) return
    await onLinkExisting({
      sourceScreenId: screenId ?? menuState.sourceScreenId,
      screen,
      component: menuState.component,
      componentType: menuState.componentType,
      slotName: menuState.slotName,
      trigger: 'click',
    })
    closeMenu()
  }, [closeMenu, menuState, onLinkExisting, screen, screenId])

  const menuPosition = useMemo(() => {
    if (!menuState) return null
    const menuWidth = 280
    const menuHeight = 188
    const maxX = Math.max(0, menuState.containerSize.width - menuWidth - 16)
    const maxY = Math.max(0, menuState.containerSize.height - menuHeight - 16)
    return {
      left: clamp(menuState.anchor.x - menuWidth / 2, 16, maxX || 16),
      top: clamp(menuState.anchor.y - menuHeight, 16, maxY || 16),
    }
  }, [menuState])

  return (
    <div
      ref={containerRef}
      className={cn(
        'interactive-screen relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl transition-shadow',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-6 z-10 flex flex-wrap items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        <span>Click any primary action to branch the flow</span>
        {typeof screenIndex === 'number' && (
          <span className="text-slate-400">Screen {screenIndex + 1}</span>
        )}
      </div>

      <ScreenRenderer
        dsl={screen}
        className="min-h-[640px]"
        onComponentClick={handleComponentClick}
        interactiveComponentTypes={interactiveTypes}
      />

      {menuState && (
        <>
          <span
            className="pointer-events-none absolute z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-indigo-400/30"
            style={{ left: menuState.anchor.x, top: menuState.anchor.y }}
          />
          {menuPosition && (
            <div
              data-flow-interactive-menu
              className="absolute z-30 w-[280px] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur"
              style={{ left: menuPosition.left, top: menuPosition.top }}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Navigation action
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {menuState.component.content}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeMenu}
                  className="h-7 w-7 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleGenerateNext}
                  disabled={!onGenerateNext || isGenerating}
                  className="w-full justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? 'Generating…' : 'Generate next screen'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2"
                  disabled={!onLinkExisting}
                  onClick={handleLinkExisting}
                >
                  <GitBranch className="h-4 w-4" />
                  Link to existing screen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center gap-2 text-slate-500 hover:text-slate-900"
                  onClick={closeMenu}
                >
                  <LinkIcon className="h-4 w-4" />
                  Configure navigation
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

