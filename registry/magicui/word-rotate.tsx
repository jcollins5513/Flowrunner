"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface WordRotateProps {
  words: string[]
  duration?: number
  className?: string
}

export function WordRotate({
  words,
  duration = 2500,
  className,
}: WordRotateProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (words.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, duration)

    return () => clearInterval(interval)
  }, [words.length, duration])

  return <span className={cn("inline-block", className)}>{words[currentIndex]}</span>
}



