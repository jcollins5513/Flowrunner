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
}: ScrollVelocityRowProps) {
  return (
    <div className={cn("flex gap-4 whitespace-nowrap", className)}>
      {children}
    </div>
  )
}



