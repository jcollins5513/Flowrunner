"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface MagicCardProps {
  gradientColor?: string
  gradientOpacity?: number
  className?: string
  children: React.ReactNode
}

export function MagicCard({
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  className,
  children,
}: MagicCardProps) {
  return (
    <div
      className={cn("relative rounded-lg", className)}
      style={{
        background: `linear-gradient(135deg, ${gradientColor}${Math.round(gradientOpacity * 255).toString(16)}, transparent)`,
      }}
    >
      {children}
    </div>
  )
}



