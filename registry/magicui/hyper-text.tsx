"use client"

import { HTMLAttributes, useMemo } from "react"

import { cn } from "@/lib/utils"

type HyperTextProps = HTMLAttributes<HTMLSpanElement>

const HyperText = ({ children, className, ...props }: HyperTextProps) => {
  const id = useMemo(
    () => `hypertext-${Math.random().toString(36).slice(2)}`,
    []
  )

  return (
    <span
      className={cn(
        "relative inline-flex cursor-pointer overflow-hidden rounded-md bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-3 py-1 text-lg font-semibold leading-tight text-foreground transition",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent before:opacity-0 before:blur",
        "hover:scale-[1.01] hover:before:translate-x-full hover:before:opacity-100",
        className
      )}
      style={{
        WebkitMaskImage: `radial-gradient(200% 100% at 50% 50%, #000 60%, transparent)`,
      }}
      data-id={id}
      {...props}
    >
      <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  )
}

export { HyperText }
