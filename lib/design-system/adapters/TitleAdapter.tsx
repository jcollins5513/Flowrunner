"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TitleAdapterProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  tier?: "safe" | "advanced";
}

export function TitleAdapter({
  content,
  className = "",
  style,
  tier = "safe",
}: TitleAdapterProps) {
  // Use design system styling tokens
  const baseClasses = "text-4xl font-bold leading-tight tracking-tight text-slate-100";
  
  // Advanced tier can have more styling
  const tierClasses = tier === "advanced" 
    ? "bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
    : "";

  return (
    <h1
      className={cn(baseClasses, tierClasses, className)}
      style={style}
    >
      {content}
    </h1>
  );
}

