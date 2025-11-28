import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type AuroraTextProps = HTMLAttributes<HTMLSpanElement>

const AuroraText = ({ children, className, ...props }: AuroraTextProps) => {
  return (
    <span
      className={cn(
        "relative inline-flex items-center px-2 py-1",
        "bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 bg-clip-text text-transparent",
        "before:absolute before:inset-0 before:-z-10 before:blur-2xl before:bg-gradient-to-r before:from-indigo-500/40 before:via-sky-400/40 before:to-emerald-400/40",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { AuroraText }
