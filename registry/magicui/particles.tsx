"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ParticlesProps {
  className?: string
  quantity?: number
  ease?: number
  size?: number
  refresh?: boolean
  color?: string
  vx?: number
  vy?: number
}

export function Particles({
  className,
  quantity = 30,
  ease = 50,
  size = 0.5,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}: ParticlesProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {/* Particles will be rendered here */}
    </div>
  )
}



