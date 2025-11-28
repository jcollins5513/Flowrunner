"use client"

import { HTMLAttributes, useMemo } from "react"

import { cn } from "@/lib/utils"

type AnimatedGridPatternProps = HTMLAttributes<HTMLDivElement> & {
  numSquares?: number
  maxOpacity?: number
  duration?: number
  repeatDelay?: number
}

type Square = {
  id: number
  left: string
  top: string
  size: number
  delay: number
}

const AnimatedGridPattern = ({
  className,
  numSquares = 24,
  maxOpacity = 0.12,
  duration = 3,
  repeatDelay = 1,
  ...props
}: AnimatedGridPatternProps) => {
  const squares = useMemo<Square[]>(() => {
    return Array.from({ length: numSquares }, (_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 40 + Math.random() * 50,
      delay: Math.random() * (duration + repeatDelay),
    }))
  }, [numSquares, duration, repeatDelay])

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    >
      <style>
        {`
          @keyframes gridPulse {
            0% { opacity: 0; transform: scale(0.9); }
            50% { opacity: ${maxOpacity}; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.9); }
          }
        `}
      </style>
      {squares.map((square) => (
        <span
          key={square.id}
          className="absolute rounded-md bg-gradient-to-tr from-primary/20 via-primary/40 to-primary/5"
          style={{
            left: square.left,
            top: square.top,
            width: square.size,
            height: square.size,
            opacity: maxOpacity,
            animation: `gridPulse ${duration}s ease-in-out infinite`,
            animationDelay: `${square.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export { AnimatedGridPattern }
