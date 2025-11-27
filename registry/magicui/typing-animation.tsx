"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface TypingAnimationProps {
  text: string
  className?: string
  speed?: number
}

export function TypingAnimation({
  text,
  className,
  speed = 50,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return <span className={cn("inline-block", className)}>{displayedText}</span>
}



