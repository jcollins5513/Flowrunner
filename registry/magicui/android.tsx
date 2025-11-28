"use client"

import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type AndroidProps = HTMLAttributes<HTMLDivElement> & {
  src: string
}

const Android = ({ className, src, ...props }: AndroidProps) => {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/19] w-full max-w-sm overflow-hidden rounded-[30px] border-4 border-emerald-500/50 bg-black shadow-2xl ring-1 ring-emerald-400/30",
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-16 top-0 z-10 h-6 rounded-b-2xl bg-black/60 backdrop-blur" />
      <img src={src} alt="Android frame" className="size-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
    </div>
  )
}

export { Android }
