"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface BorderBeamProps {
  children: React.ReactNode
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  children,
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg opacity-75"
        style={{
          backgroundImage: `linear-gradient(${anchor}deg, ${colorFrom}, ${colorTo}, transparent)`,
        }}
      />
    </div>
  )
}



