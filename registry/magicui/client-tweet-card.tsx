"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ClientTweetCardProps {
  children: React.ReactNode
  className?: string
}

export function ClientTweetCard({
  children,
  className,
}: ClientTweetCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      {children}
    </div>
  )
}



