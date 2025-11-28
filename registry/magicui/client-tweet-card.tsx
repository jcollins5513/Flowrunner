"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ClientTweetCardProps {
  children?: React.ReactNode
  className?: string
  id?: string
}

export function ClientTweetCard({
  children,
  className,
  id,
}: ClientTweetCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      {children || (
        <div className="text-muted-foreground">
          Tweet {id || "placeholder"}
        </div>
      )}
    </div>
  )
}



