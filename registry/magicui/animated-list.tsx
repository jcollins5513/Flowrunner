"use client"

import { Children, HTMLAttributes, ReactElement, cloneElement } from "react"

import { cn } from "@/lib/utils"

type AnimatedListProps = HTMLAttributes<HTMLDivElement>

const AnimatedList = ({ children, className, ...props }: AnimatedListProps) => {
  const items = Children.toArray(children) as ReactElement[]
  const doubled = [...items, ...items] // loop the list for a marquee effect

  return (
    <div className={cn("relative h-full overflow-hidden", className)} {...props}>
      <div
        className="animate-[scrollList_18s_linear_infinite]"
        style={{
          display: "grid",
          gap: "0.75rem",
        }}
      >
        {doubled.map((child, index) =>
          cloneElement(child, { key: `${child.key ?? index}-${index}` })
        )}
      </div>
      <style>
        {`
          @keyframes scrollList {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
        `}
      </style>
    </div>
  )
}

export { AnimatedList }
