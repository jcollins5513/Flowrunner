"use client"

import { HTMLAttributes, useMemo } from "react"

import { cn } from "@/lib/utils"

type MeteorsProps = HTMLAttributes<HTMLDivElement> & {
  number?: number
}

type Meteor = {
  id: number
  delay: number
  duration: number
  top: string
  left: string
}

const Meteors = ({ className, number = 20, ...props }: MeteorsProps) => {
  const meteors = useMemo<Meteor[]>(() => {
    return Array.from({ length: number }, (_, index) => ({
      id: index,
      delay: Math.random() * 4,
      duration: 1.5 + Math.random() * 2,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }))
  }, [number])

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} {...props}>
      <style>
        {`
          @keyframes meteor {
            0% { transform: translate3d(0, 0, 0); opacity: 1; }
            100% { transform: translate3d(-200px, 320px, 0); opacity: 0; }
          }
        `}
      </style>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="pointer-events-none absolute h-px w-24 rotate-[130deg] bg-gradient-to-r from-transparent via-white to-white/0 opacity-70"
          style={{
            top: meteor.top,
            left: meteor.left,
            animation: `meteor ${meteor.duration}s linear infinite`,
            animationDelay: `${meteor.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export { Meteors }
