"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TextAdapterProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  tier?: "safe" | "advanced";
}

export function TextAdapter({
  content,
  className = "",
  style,
  tier = "safe",
}: TextAdapterProps) {
  const baseClasses = "text-base leading-relaxed text-slate-200";
  
  const tierClasses = tier === "advanced"
    ? "opacity-95"
    : "";

  return (
    <p
      className={cn(baseClasses, tierClasses, className)}
      style={style}
    >
      {content}
    </p>
  );
}

