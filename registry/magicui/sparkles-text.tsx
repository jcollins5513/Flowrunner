"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SparklesTextProps {
  children: React.ReactNode
  className?: string
}

export function SparklesText({ children, className }: SparklesTextProps) {
  return (
    <span className={cn("text-4xl font-bold", className)}>{children}</span>
  )
}



