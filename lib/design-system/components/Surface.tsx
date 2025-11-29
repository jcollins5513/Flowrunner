"use client";

import React from "react";
import { tokens } from "../tokens";

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
};

export function Surface({
  children,
  className = "",
  padding = "md",
  interactive = false,
}: SurfaceProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm"
      ? "px-3 py-2"
      : padding === "lg"
      ? "px-6 py-5"
      : "px-4 py-3";

  const base =
    "relative rounded-2xl backdrop-blur-md border border-white/10 bg-slate-900/70 shadow-[0_18px_45px_rgba(15,23,42,0.9)]";

  const interactiveClass = interactive
    ? "transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(168,85,247,0.55)]"
    : "";

  return (
    <div
      className={`${base} ${paddingClass} ${interactiveClass} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(15,23,42,0.6))",
        boxShadow: tokens.shadows.card,
        borderRadius: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

