"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface Marker {
  lat: number
  lng: number
  size?: number
}

interface DottedMapProps {
  markers?: Marker[]
  className?: string
  width?: number
  height?: number
}

// Convert lat/lng to x/y coordinates for a world map
function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

export function DottedMap({
  markers = [],
  className,
  width = 800,
  height = 400,
}: DottedMapProps) {
  const markerPositions = useMemo(() => {
    return markers.map((marker) => {
      const { x, y } = latLngToXY(marker.lat, marker.lng, width, height)
      return {
        x,
        y,
        size: marker.size || 0.3,
      }
    })
  }, [markers, width, height])

  return (
    <div className={cn("relative size-full", className)}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* World map outline (simplified) */}
        <g className="stroke-gray-300 dark:stroke-gray-700 fill-transparent stroke-1">
          {/* Simplified continents - just basic shapes for visual reference */}
          <path
            d="M 100 150 Q 150 100 200 120 Q 250 140 300 130 Q 350 120 400 140 Q 450 160 500 150 Q 550 140 600 150 Q 650 160 700 150"
            fill="none"
            strokeWidth="1"
            opacity="0.3"
          />
        </g>

        {/* Markers */}
        {markerPositions.map((marker, index) => (
          <circle
            key={index}
            cx={marker.x}
            cy={marker.y}
            r={marker.size * 10}
            className="fill-primary animate-pulse"
            opacity="0.8"
          >
            <animate
              attributeName="r"
              values={`${marker.size * 8};${marker.size * 12};${marker.size * 8}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}

