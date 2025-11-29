/**
 * Component Adapters
 * 
 * Adapters that wrap base library components to accept DSL content as props.
 * These adapters allow demo components to be used with dynamic content.
 */

'use client'

import React from 'react'
import { HeroHighlight } from '@/components/ui/hero-highlight'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'

/**
 * Hero Highlight adapter that accepts content as children
 * This wraps the base HeroHighlight component to accept DSL content dynamically.
 */
export const HeroHighlightAdapter = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode
    className?: string
    [key: string]: any
  }
>(({ children, className, ...props }, ref) => {
  return (
    <HeroHighlight containerClassName={className} {...props}>
      <div 
        ref={ref}
        className="text-2xl md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white"
      >
        {children}
      </div>
    </HeroHighlight>
  )
})

HeroHighlightAdapter.displayName = 'HeroHighlightAdapter'

/**
 * Text Generate adapter that accepts content as words prop
 */
export function TextGenerateAdapter({ 
  children,
  className,
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const words = typeof children === 'string' ? children : String(children)
  return (
    <TextGenerateEffect 
      words={words} 
      className={className}
      {...props}
    />
  )
}

