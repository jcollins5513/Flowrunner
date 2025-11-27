"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface AnimatedShinyTextProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedShinyText({
  children,
  className,
}: AnimatedShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer",
        className
      )}
    >
      {children}
    </span>
  )
}



