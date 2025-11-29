"use client"

import React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface TextAnimateProps {
  children: React.ReactNode
  className?: string
  variants?: any
  by?: "word" | "character" | "line"
}

export function TextAnimate({ 
  children, 
  className,
  variants,
  by = "word",
}: TextAnimateProps) {
  const text = typeof children === "string" ? children : String(children)
  
  if (!variants) {
    return <div className={cn("text-2xl", className)}>{children}</div>
  }

  const items = by === "character" 
    ? text.split("")
    : by === "word"
    ? text.split(" ")
    : text.split("\n")

  return (
    <motion.div
      className={cn("text-2xl", className)}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {items.map((item, i) => (
        <motion.span
          key={i}
          variants={variants}
          custom={i}
          style={{ display: "inline-block" }}
        >
          {item}
          {by === "word" && i < items.length - 1 && " "}
          {by === "line" && i < items.length - 1 && "\n"}
        </motion.span>
      ))}
    </motion.div>
  )
}



