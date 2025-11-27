"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SafariProps {
  children: React.ReactNode
  className?: string
}

export function Safari({ children, className }: SafariProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-background",
        className
      )}
    >
      {children}
    </div>
  )
}



