"use client"

import { HTMLAttributes, ReactNode, useMemo } from "react"

import { cn } from "@/lib/utils"

type OrbitingCirclesProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  radius?: number
  speed?: number
  reverse?: boolean
  iconSize?: number
}

const OrbitingCircles = ({
  children,
  className,
  radius = 140,
  speed = 12,
  reverse = false,
  iconSize = 48,
  ...props
}: OrbitingCirclesProps) => {
  const items = useMemo(() => {
    const array = Array.isArray(children) ? children : [children]
    const cleaned = array.filter(Boolean) as ReactNode[]
    const angleStep = (2 * Math.PI) / cleaned.length
    return cleaned.map((child, index) => {
      const angle = angleStep * index
      return { child, angle, index }
    })
  }, [children])

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.index}
          className="absolute"
          style={{
            width: radius * 2,
            height: radius * 2,
            animation: `spin ${speed}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
            transformOrigin: "center",
            transform: `rotate(${(item.angle * 180) / Math.PI}deg)`,
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 p-3 shadow-lg ring-1 ring-border/60 backdrop-blur"
            style={{
              transform: `translate(${radius}px, -50%) rotate(${
                reverse ? -item.angle : item.angle
              }rad)`,
              width: iconSize,
              height: iconSize,
            }}
          >
            <div className="flex size-full items-center justify-center text-foreground/80">
              {item.child}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { OrbitingCircles }
