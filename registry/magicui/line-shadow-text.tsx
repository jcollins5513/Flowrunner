"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface LineShadowTextProps {
  children: React.ReactNode
  className?: string
}

export function LineShadowText({
  children,
  className,
}: LineShadowTextProps) {
  return (
    <span
      className={cn(
        "text-4xl font-bold",
        className
      )}
    >
      {children}
    </span>
  )
}



