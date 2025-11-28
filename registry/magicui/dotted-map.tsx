import { HTMLAttributes, useMemo } from "react"

import { cn } from "@/lib/utils"

type Marker = {
  lat: number
  lng: number
  size?: number
  color?: string
}

type DottedMapProps = HTMLAttributes<SVGSVGElement> & {
  markers?: Marker[]
}

const buildDots = (cols: number, rows: number) => {
  const dots: Array<{ cx: number; cy: number }> = []
  for (let x = 0; x < cols; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      dots.push({ cx: x, cy: y })
    }
  }
  return dots
}

const project = (lat: number, lng: number, width: number, height: number) => {
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

const DottedMap = ({ markers = [], className, ...props }: DottedMapProps) => {
  const cols = 72
  const rows = 36
  const dots = useMemo(() => buildDots(cols, rows), [cols, rows])

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={cn("size-full text-muted-foreground/40", className)}
      role="img"
      aria-label="Dotted world map"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        <radialGradient id="dotGradient" r="65%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r={0.18}
          fill="url(#dotGradient)"
        />
      ))}
      {markers.map((marker, index) => {
        const { x, y } = project(marker.lat, marker.lng, cols, rows)
        return (
          <circle
            key={`${marker.lat}-${marker.lng}-${index}`}
            cx={x}
            cy={y}
            r={marker.size ?? 0.6}
            fill={marker.color ?? "hsl(var(--primary))"}
            className="drop-shadow"
          />
        )
      })}
    </svg>
  )
}

export { DottedMap }
