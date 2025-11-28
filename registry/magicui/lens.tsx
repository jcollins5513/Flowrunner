"use client"

import {
  HTMLAttributes,
  ReactElement,
  cloneElement,
  useMemo,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

type LensProps = HTMLAttributes<HTMLDivElement> & {
  zoomFactor?: number
  lensSize?: number
  isStatic?: boolean
  ariaLabel?: string
}

const Lens = ({
  children,
  className,
  zoomFactor = 2,
  lensSize = 160,
  isStatic = false,
  ariaLabel = "Magnifier lens",
  ...props
}: LensProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false })

  const child = useMemo(() => {
    const onlyChild = children as ReactElement
    return cloneElement(onlyChild, {
      ref: (node: HTMLImageElement) => {
        if (typeof (onlyChild as any).ref === "function") {
          ;(onlyChild as any).ref(node)
        }
      },
      className: cn("pointer-events-none select-none", onlyChild.props?.className),
    })
  }, [children])

  const handleMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    setPosition({ x, y, visible: true })
  }

  const handleLeave = () => setPosition((prev) => ({ ...prev, visible: false }))

  const backgroundStyle = useMemo(() => {
    const img = (children as ReactElement).props?.src
    if (!img) return {}
    const offsetX = position.x * zoomFactor - lensSize / 2
    const offsetY = position.y * zoomFactor - lensSize / 2
    return {
      backgroundImage: `url(${img})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${zoomFactor * 100}%`,
      backgroundPosition: `-${offsetX}px -${offsetY}px`,
    }
  }, [children, lensSize, position.x, position.y, zoomFactor])

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block overflow-hidden rounded-xl", className)}
      aria-label={ariaLabel}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...props}
    >
      {child}
      <div
        className={cn(
          "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 shadow-2xl ring-1 ring-black/40",
          (position.visible || isStatic) ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: lensSize,
          height: lensSize,
          left: position.x,
          top: position.y,
          ...backgroundStyle,
        }}
      />
    </div>
  )
}

export { Lens }
