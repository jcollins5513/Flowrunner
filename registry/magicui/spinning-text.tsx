"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SpinningTextProps {
  text: string
  className?: string
}

export function SpinningText({ text, className }: SpinningTextProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin",
        className
      )}
    >
      {text}
    </div>
  )
}



