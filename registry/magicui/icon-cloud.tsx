"use client"

import { ReactNode, useMemo } from "react"

import { cn } from "@/lib/utils"

type IconCloudProps = {
  icons: ReactNode[]
  className?: string
  radius?: number
  speed?: number
}

const IconCloud = ({
  icons,
  className,
  radius = 140,
  speed = 22,
}: IconCloudProps) => {
  const placedIcons = useMemo(() => {
    const count = Math.max(icons.length, 1)
    return icons.map((icon, index) => {
      const phi = Math.acos(-1 + (2 * index + 1) / count)
      const theta = Math.sqrt((count + 1) * Math.PI) * phi
      const x = radius * Math.cos(theta) * Math.sin(phi)
      const y = radius * Math.sin(theta) * Math.sin(phi)
      const z = radius * Math.cos(phi)
      return { icon, x, y, z, index }
    })
  }, [icons, radius])

  return (
    <div
      className={cn(
        "relative aspect-square w-full max-w-md overflow-visible",
        className
      )}
    >
      <div
        className="absolute inset-0 origin-center animate-[spin_{{speed}}s_linear_infinite]"
        style={{
          animationDuration: `${speed}s`,
          transformStyle: "preserve-3d",
        }}
      >
        {placedIcons.map((item) => (
          <div
            key={item.index}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/30 p-3 shadow-lg ring-1 ring-border/60 backdrop-blur"
            style={{
              transform: `
                translate3d(${item.x}px, ${item.y}px, ${item.z}px)
              `,
            }}
          >
            <div className="h-10 w-10 text-foreground/80">{item.icon}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { IconCloud }
