"use client"

import { HTMLAttributes, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type NumberTickerProps = HTMLAttributes<HTMLSpanElement> & {
  value: number
  decimalPlaces?: number
  durationMs?: number
}

const NumberTicker = ({
  value,
  decimalPlaces = 0,
  durationMs = 1200,
  className,
  ...props
}: NumberTickerProps) => {
  const [displayValue, setDisplayValue] = useState(0)
  const startValue = useRef(0)
  const startTime = useRef<number | null>(null)

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }),
    [decimalPlaces]
  )

  useEffect(() => {
    startValue.current = displayValue
    startTime.current = null
    let frame: number

    const step = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(1, elapsed / durationMs)
      const next = startValue.current + (value - startValue.current) * progress
      setDisplayValue(next)
      if (progress < 1) {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])

  return (
    <span className={cn("inline-flex tabular-nums", className)} {...props}>
      {formatter.format(displayValue)}
    </span>
  )
}

export { NumberTicker }
