"use client"

import {
  RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"

import { cn } from "@/lib/utils"

type AnimatedBeamProps = {
  containerRef: RefObject<HTMLElement>
  fromRef: RefObject<HTMLElement>
  toRef: RefObject<HTMLElement>
  duration?: number
  className?: string
  gradientStart?: string
  gradientStop?: string
  pathWidth?: number
}

type Point = { x: number; y: number }

const defaultColor = "hsl(var(--primary))"

export const AnimatedBeam = ({
  containerRef,
  fromRef,
  toRef,
  duration = 2.5,
  className,
  gradientStart = defaultColor,
  gradientStop = "hsl(var(--primary) / 0.3)",
  pathWidth = 3,
}: AnimatedBeamProps) => {
  const [start, setStart] = useState<Point | null>(null)
  const [end, setEnd] = useState<Point | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const updatePositions = () => {
    const container = containerRef.current?.getBoundingClientRect()
    const from = fromRef.current?.getBoundingClientRect()
    const to = toRef.current?.getBoundingClientRect()
    if (!container || !from || !to) return

    setSize({ width: container.width, height: container.height })
    setStart({
      x: from.left - container.left + from.width / 2,
      y: from.top - container.top + from.height / 2,
    })
    setEnd({
      x: to.left - container.left + to.width / 2,
      y: to.top - container.top + to.height / 2,
    })
  }

  useLayoutEffect(() => {
    updatePositions()
  })

  useEffect(() => {
    const handleResize = () => updatePositions()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  const path = useMemo(() => {
    if (!start || !end) return ""
    const offset = (end.x - start.x) * 0.25
    return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y} ${
      end.x - offset
    } ${end.y} ${end.x} ${end.y}`
  }, [end, start])

  if (!start || !end) return null

  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className
      )}
      width={size.width}
      height={size.height}
    >
      <defs>
        <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradientStart} />
          <stop offset="100%" stopColor={gradientStop} />
        </linearGradient>
        <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#beam-gradient)"
        strokeWidth={pathWidth}
        strokeLinecap="round"
        filter="url(#beam-glow)"
        style={{
          strokeDasharray: 12,
          strokeDashoffset: 0,
          animation: `dash ${duration}s linear infinite`,
        }}
      />
      <style>
        {`
          @keyframes dash {
            from { stroke-dashoffset: 24; }
            to { stroke-dashoffset: 0; }
          }
        `}
      </style>
    </svg>
  )
}
