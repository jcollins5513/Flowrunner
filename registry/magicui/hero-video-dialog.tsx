"use client"

import { HTMLAttributes, useMemo, useState } from "react"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"

type HeroVideoDialogProps = HTMLAttributes<HTMLDivElement> & {
  videoSrc: string
  thumbnailSrc: string
  thumbnailAlt?: string
  animationStyle?: "top-in-bottom-out" | "fade" | "none"
}

const overlayAnimations: Record<
  NonNullable<HeroVideoDialogProps["animationStyle"]>,
  string
> = {
  "top-in-bottom-out":
    "animate-[slide-down_260ms_ease-out] data-[state=closed]:animate-[slide-up_200ms_ease-in]",
  fade: "animate-[fade-in_160ms_ease-out] data-[state=closed]:animate-[fade-out_140ms_ease-in]",
  none: "",
}

const HeroVideoDialog = ({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Hero video thumbnail",
  animationStyle = "fade",
  className,
  ...props
}: HeroVideoDialogProps) => {
  const [open, setOpen] = useState(false)
  const animationClass = useMemo(
    () => overlayAnimations[animationStyle] ?? overlayAnimations.fade,
    [animationStyle]
  )

  return (
    <div className={cn("relative w-full", className)} {...props}>
      <button
        type="button"
        className="group relative block w-full overflow-hidden rounded-2xl border border-border/60 shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setOpen(true)}
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity group-hover:opacity-70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-105 group-hover:bg-white">
            <Play className="h-6 w-6" />
          </span>
        </div>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
            animationClass
          )}
          onClick={() => setOpen(false)}
          data-state="open"
        >
          <div
            className="relative aspect-video w-[90vw] max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={videoSrc}
              title="Hero video"
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { HeroVideoDialog }
