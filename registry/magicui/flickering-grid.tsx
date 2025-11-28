import { HTMLAttributes, useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

type FlickeringGridProps = HTMLAttributes<HTMLDivElement> & {
  squareSize?: number
  gridGap?: number
  color?: string
  maxOpacity?: number
  flickerChance?: number
  height?: number
  width?: number
}

type Cell = { id: string; delay: number; duration: number }

const FlickeringGrid = ({
  className,
  squareSize = 4,
  gridGap = 6,
  color = "rgba(255,255,255,0.6)",
  maxOpacity = 0.5,
  flickerChance = 0.08,
  height = 600,
  width = 600,
  ...props
}: FlickeringGridProps) => {
  const [animationName, setAnimationName] = useState("")
  const rows = Math.max(2, Math.ceil(height / (squareSize + gridGap)))
  const cols = Math.max(2, Math.ceil(width / (squareSize + gridGap)))

  const cells: Cell[] = useMemo(() => {
    const items: Cell[] = []
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const delay = Math.random() * 4
        const duration = 1.5 + Math.random() * 3
        items.push({ id: `${r}-${c}`, delay, duration })
      }
    }
    return items
  }, [rows, cols])

  useEffect(() => {
    const name = `flicker-${Math.random().toString(36).slice(2)}`
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes ${name} {
        0%, 100% { opacity: 0; }
        50% { opacity: ${maxOpacity}; }
      }
    `
    document.head.appendChild(style)
    setAnimationName(name)
    return () => {
      document.head.removeChild(style)
    }
  }, [maxOpacity])

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ height, width }}
      {...props}
    >
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${squareSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${squareSize}px)`,
          gap: gridGap,
        }}
      >
        {cells.map((cell) => {
          const shouldFlicker = Math.random() < flickerChance
          return (
            <div
              key={cell.id}
              className="rounded-[2px]"
              style={{
                backgroundColor: color,
                opacity: shouldFlicker ? maxOpacity : maxOpacity / 4,
                animation: shouldFlicker
                  ? `${animationName} ${cell.duration}s ease-in-out infinite`
                  : "none",
                animationDelay: `${cell.delay}s`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export { FlickeringGrid }
