"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ShineBorderProps {
  children?: React.ReactNode
  className?: string
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: string
  shineColor?: string
}

export function ShineBorder({
  children,
  className,
  borderRadius = 8,
  borderWidth = 2,
  duration = 3,
  color,
  shineColor,
}: ShineBorderProps) {
  const finalColor = shineColor || color || "#00ffff"
  
  return (
    <div
      className={cn("relative", className)}
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
      }}
    >
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(45deg, transparent, ${finalColor}, transparent)`,
          backgroundSize: "200% 200%",
          animation: `shimmer ${duration}s linear infinite`,
        }}
      />
      {children && <div className="relative rounded-lg bg-background">{children}</div>}
    </div>
  )
}



