"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SafariProps {
  children?: React.ReactNode
  className?: string
  url?: string
  videoSrc?: string
}

export function Safari({ children, className, url, videoSrc }: SafariProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-background overflow-hidden",
        className
      )}
    >
      {/* Safari browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 rounded-md bg-background border border-border px-3 py-1 text-sm text-muted-foreground text-center">
          {url || "example.com"}
        </div>
      </div>
      {/* Content area */}
      {videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto"
        />
      ) : (
        children
      )}
    </div>
  )
}



