"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function ShimmerButton({
  children,
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden bg-primary text-primary-foreground transition-all hover:scale-105",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}



