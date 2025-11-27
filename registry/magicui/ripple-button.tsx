"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface RippleButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  rippleColor?: string
}

export function RippleButton({
  children,
  rippleColor = "#ADD8E6",
  className,
  ...props
}: RippleButtonProps) {
  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </Button>
  )
}



