"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SubtitleAdapterProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  tier?: "safe" | "advanced";
}

export function SubtitleAdapter({
  content,
  className = "",
  style,
  tier = "safe",
}: SubtitleAdapterProps) {
  const baseClasses = "text-xl font-medium leading-relaxed text-slate-300";
  
  const tierClasses = tier === "advanced"
    ? "opacity-90"
    : "";

  return (
    <h2
      className={cn(baseClasses, tierClasses, className)}
      style={style}
    >
      {content}
    </h2>
  );
}

