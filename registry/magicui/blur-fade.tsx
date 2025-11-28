"use client"

import { HTMLAttributes, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type BlurFadeProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number
  inView?: boolean
}

const BlurFade = ({
  children,
  className,
  delay = 0,
  inView = false,
  ...props
}: BlurFadeProps) => {
  const [visible, setVisible] = useState(inView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inView) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
          }
        })
      },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [inView])

  return (
    <div
      ref={ref}
      className={cn(
        "transition duration-700 ease-out",
        visible ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-sm",
        className
      )}
      style={{ transitionDelay: `${delay}s` }}
      {...props}
    >
      {children}
    </div>
  )
}

export { BlurFade }
