"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface RetroGridProps {
  className?: string
}

export function RetroGrid({ className }: RetroGridProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 opacity-50",
        "[background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)]",
        "[background-size:24px_24px]",
        className
      )}
    />
  )
}



