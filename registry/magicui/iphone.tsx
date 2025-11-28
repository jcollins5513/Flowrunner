"use client"

import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type IphoneProps = HTMLAttributes<HTMLDivElement> & {
  videoSrc: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
}

const Iphone = ({
  className,
  videoSrc,
  autoPlay = true,
  muted = true,
  loop = true,
  ...props
}: IphoneProps) => {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[1125/2436] w-full max-w-[434px] overflow-hidden rounded-[38px] border-4 border-black/80 bg-black shadow-xl ring-1 ring-black/60 dark:border-white/10 dark:ring-white/10",
        className
      )}
      {...props}
    >
      <div className="absolute inset-x-14 top-0 z-10 h-7 rounded-b-2xl bg-black/70 backdrop-blur dark:bg-white/10" />
      <video
        src={videoSrc}
        className="size-full object-cover"
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        loop={loop}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
    </div>
  )
}

export { Iphone }
