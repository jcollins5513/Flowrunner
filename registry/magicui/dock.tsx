import React, {
  Children,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react"

import { cn } from "@/lib/utils"

type DockProps = {
  children: ReactNode
  className?: string
  iconMagnification?: number
  iconDistance?: number
}

type DockIconProps = HTMLAttributes<HTMLDivElement> & {
  index?: number
}

type DockContextValue = {
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
  iconMagnification: number
}

const DockContext = createContext<DockContextValue | null>(null)

const Dock = ({
  children,
  className,
  iconMagnification = 40,
  iconDistance = 80,
}: DockProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const value = useMemo(
    () => ({
      hoveredIndex,
      setHoveredIndex,
      iconMagnification,
    }),
    [hoveredIndex, iconMagnification]
  )

  const items = useMemo(
    () =>
      Children.toArray(children).map((child, index) =>
        cloneElement(child as ReactElement, { index })
      ),
    [children]
  )

  return (
    <DockContext.Provider value={value}>
      <div
        className={cn(
          "mx-auto flex h-16 items-end justify-center gap-3 rounded-2xl bg-background/80 px-4 py-3 shadow-lg ring-1 ring-border/60 backdrop-blur",
          className
        )}
        style={{ minWidth: iconDistance * 2 }}
      >
        {items}
      </div>
    </DockContext.Provider>
  )
}

const DockIcon = ({ className, children, index = 0, ...props }: DockIconProps) => {
  const ctx = useContext(DockContext)
  const isActive = ctx?.hoveredIndex === index
  const scale = isActive ? 1 + (ctx?.iconMagnification ?? 40) / 100 : 1

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => ctx?.setHoveredIndex(index)}
      onMouseLeave={() => ctx?.setHoveredIndex(null)}
      onFocus={() => ctx?.setHoveredIndex(index)}
      onBlur={() => ctx?.setHoveredIndex(null)}
      className={cn(
        "flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/80 text-foreground/80 transition-transform duration-200 ease-out",
        className
      )}
      style={{ transform: `scale(${scale})` }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Dock, DockIcon }
