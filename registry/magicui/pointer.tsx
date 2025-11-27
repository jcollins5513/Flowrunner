"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface PointerProps {
  className?: string
  x?: number
  y?: number
}

export function Pointer({ className, x, y }: PointerProps) {
  return (
    <motion.div
      className={cn("pointer-events-none absolute z-50", className)}
      initial={{ opacity: 0 }}
      animate={{ x, y, opacity: 1 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
    >
      <div className="h-4 w-4 rounded-full bg-primary" />
    </motion.div>
  )
}



