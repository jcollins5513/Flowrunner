"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient",
        className
      )}
    >
      {children}
    </span>
  )
}



