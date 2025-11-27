"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ProgressiveBlurProps {
  position?: "top" | "bottom"
  height?: string
  className?: string
  children?: React.ReactNode
}

export function ProgressiveBlur({
  position = "bottom",
  height = "40%",
  className,
  children,
}: ProgressiveBlurProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 right-0 z-10",
        position === "top" ? "top-0" : "bottom-0",
        className
      )}
      style={{
        height,
        background: `linear-gradient(to ${position}, transparent, rgba(var(--background), 0.8), rgba(var(--background), 1))`,
      }}
    >
      {children}
    </div>
  )
}



