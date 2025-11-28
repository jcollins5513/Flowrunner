"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface LineShadowTextProps {
  children: React.ReactNode
  className?: string
  shadowColor?: string
}

export function LineShadowText({
  children,
  className,
  shadowColor,
}: LineShadowTextProps) {
  return (
    <span
      className={cn(
        "text-4xl font-bold",
        className
      )}
      style={shadowColor ? { 
        textShadow: `2px 2px 0 ${shadowColor}, 4px 4px 0 ${shadowColor}` 
      } : undefined}
    >
      {children}
    </span>
  )
}



