"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface HighlighterProps {
  children: React.ReactNode
  className?: string
}

export function Highlighter({ children, className }: HighlighterProps) {
  return (
    <mark
      className={cn(
        "bg-yellow-200 dark:bg-yellow-800 rounded px-1",
        className
      )}
    >
      {children}
    </mark>
  )
}



