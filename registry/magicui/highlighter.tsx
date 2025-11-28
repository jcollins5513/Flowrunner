"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface HighlighterProps {
  children: React.ReactNode
  className?: string
  action?: "highlight" | "underline" | "strikethrough"
  color?: string
}

export function Highlighter({ 
  children, 
  className,
  action = "highlight",
  color,
}: HighlighterProps) {
  const style: React.CSSProperties = {}
  
  if (action === "highlight") {
    style.backgroundColor = color || "rgba(255, 255, 0, 0.4)"
  } else if (action === "underline") {
    style.textDecoration = "underline"
    style.textDecorationColor = color || "#FF9800"
    style.textDecorationThickness = "2px"
  } else if (action === "strikethrough") {
    style.textDecoration = "line-through"
    style.textDecorationColor = color || "#FF9800"
  }

  return (
    <mark
      className={cn(
        action === "highlight" && !color && "bg-yellow-200 dark:bg-yellow-800",
        "rounded px-1",
        className
      )}
      style={style}
    >
      {children}
    </mark>
  )
}



