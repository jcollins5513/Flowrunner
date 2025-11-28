"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SpinningTextProps {
  text?: string
  children?: React.ReactNode
  className?: string
  reverse?: boolean
  duration?: number
  radius?: number
}

export function SpinningText({ 
  text, 
  children, 
  className,
  reverse = false,
  duration = 4,
  radius = 6,
}: SpinningTextProps) {
  const content = children || text || ""
  const animationDirection = reverse ? "reverse" : "normal"
  
  return (
    <div
      className={cn(
        "inline-block",
        className
      )}
      style={{
        animation: `spin ${duration}s linear infinite`,
        animationDirection,
        transform: `rotateX(${radius}deg)`,
      }}
    >
      {content}
    </div>
  )
}



