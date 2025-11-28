"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ScrollVelocityContainerProps {
  children: React.ReactNode
  className?: string
}

export interface ScrollVelocityRowProps {
  children: React.ReactNode
  className?: string
  baseVelocity?: number
  direction?: number
}

export function ScrollVelocityContainer({
  children,
  className,
}: ScrollVelocityContainerProps) {
  return <div className={cn("overflow-hidden", className)}>{children}</div>
}

export function ScrollVelocityRow({
  children,
  className,
  baseVelocity = 0,
  direction = 1,
}: ScrollVelocityRowProps) {
  // Use a sensible default if baseVelocity is 0 or not provided
  const animationDuration = baseVelocity > 0 ? baseVelocity : 20;
  
  return (
    <div 
      className={cn("flex gap-4 whitespace-nowrap", className)}
      style={{
        animation: baseVelocity > 0 
          ? `scroll ${animationDuration}s linear infinite`
          : undefined,
        animationDirection: direction > 0 ? 'normal' : 'reverse',
      }}
    >
      {children}
    </div>
  )
}



