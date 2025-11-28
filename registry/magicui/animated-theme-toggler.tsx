"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type AnimatedThemeTogglerProps = {
  className?: string
}

const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const currentlyDark = root.classList.contains("dark")
    setIsDark(currentlyDark)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDark])

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-border/60 transition hover:-translate-y-[1px] hover:shadow-lg",
        className
      )}
      onClick={() => setIsDark((prev) => !prev)}
    >
      <span className="relative flex size-6 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-5 w-5 text-amber-500 transition-all duration-300",
            isDark ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-5 w-5 text-slate-300 transition-all duration-300",
            isDark ? "scale-100 opacity-100" : "scale-0 opacity-0 -rotate-90"
          )}
        />
      </span>
      <span className="text-foreground/80">
        {isDark ? "Switch to Light" : "Switch to Dark"}
      </span>
    </button>
  )
}

export { AnimatedThemeToggler }
