"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface RainbowButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 bg-[length:200%_auto] transition-all hover:bg-right hover:shadow-lg hover:shadow-violet-500/50",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}



