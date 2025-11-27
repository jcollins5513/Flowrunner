"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface TextAnimateProps {
  children: React.ReactNode
  className?: string
}

export function TextAnimate({ children, className }: TextAnimateProps) {
  return <div className={cn("text-2xl", className)}>{children}</div>
}



