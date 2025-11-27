"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface MorphingTextProps {
  texts: string[]
  duration?: number
  className?: string
}

export function MorphingText({
  texts,
  duration = 2000,
  className,
}: MorphingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (texts.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length)
    }, duration)

    return () => clearInterval(interval)
  }, [texts.length, duration])

  return (
    <span className={cn("inline-block", className)}>{texts[currentIndex]}</span>
  )
}



