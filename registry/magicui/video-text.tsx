"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface VideoTextProps {
  children: React.ReactNode
  className?: string
  videoSrc?: string
  src?: string
}

export function VideoText({
  children,
  className,
  videoSrc,
  src,
}: VideoTextProps) {
  const finalVideoSrc = src || videoSrc
  
  return (
    <div className={cn("relative", className)}>
      {finalVideoSrc ? (
        <video
          src={finalVideoSrc}
          autoPlay
          loop
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}



