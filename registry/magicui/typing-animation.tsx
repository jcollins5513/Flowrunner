"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface TypingAnimationProps {
  text?: string
  words?: string[]
  className?: string
  speed?: number
  cursorStyle?: "line" | "block" | "underscore"
  loop?: boolean
}

export function TypingAnimation({
  text,
  words,
  className,
  speed = 50,
  cursorStyle = "line",
  loop = false,
}: TypingAnimationProps) {
  const wordsArray = words || (text ? [text] : [])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const currentWord = wordsArray[currentWordIndex] || ""

  useEffect(() => {
    if (wordsArray.length === 0) return
    if (isComplete && !loop) return // Stop animation when complete and loop is false

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < currentWord.length) {
          setDisplayedText(currentWord.slice(0, currentIndex + 1))
          setCurrentIndex(currentIndex + 1)
        } else {
          setIsDeleting(true)
        }
      } else {
        if (currentIndex > 0) {
          setDisplayedText(currentWord.slice(0, currentIndex - 1))
          setCurrentIndex(currentIndex - 1)
        } else {
          setIsDeleting(false)
          const nextIndex = loop 
            ? (currentWordIndex + 1) % wordsArray.length
            : currentWordIndex + 1
          if (nextIndex < wordsArray.length) {
            setCurrentWordIndex(nextIndex)
          } else {
            // All words exhausted and loop is false - mark as complete
            setIsComplete(true)
          }
        }
      }
    }, speed)

    return () => clearTimeout(timeout)
  }, [currentIndex, currentWord, isDeleting, wordsArray, currentWordIndex, loop, speed, isComplete])

  const cursor = cursorStyle === "block" ? "█" : cursorStyle === "underscore" ? "_" : "|"

  return (
    <span className={cn("inline-block", className)}>
      {displayedText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  )
}



