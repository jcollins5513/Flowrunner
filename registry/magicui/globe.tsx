"use client"

import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type GlobeProps = HTMLAttributes<HTMLDivElement> & {
  size?: number
  hue?: number
}

const Globe = ({ className, size = 320, hue = 210, ...props }: GlobeProps) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
      {...props}
    >
      <div
        className="relative size-full animate-[spin_26s_linear_infinite] overflow-hidden rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, hsla(${hue},70%,60%,0.9), transparent 50%),
            radial-gradient(circle at 70% 70%, hsla(${hue + 40},70%,55%,0.8), transparent 55%),
            radial-gradient(circle at 60% 30%, hsla(${hue - 30},70%,55%,0.6), transparent 50%),
            radial-gradient(circle at 40% 70%, hsla(${hue + 20},70%,60%,0.65), transparent 52%),
            radial-gradient(circle, rgba(0,0,0,0.65), rgba(0,0,0,0.1))
          `,
          boxShadow:
            "inset 0 15px 50px rgba(0,0,0,0.35), 0 20px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div className="absolute inset-0 animate-[ping_4s_ease-in-out_infinite] rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 via-transparent to-black/40" />
      </div>
    </div>
  )
}

export { Globe }
