"use client";

import React from "react";

type BackgroundProps = {
  children: React.ReactNode;
  variant?: "liquid-ribbon" | "radial-glow" | "subtle-noise";
  animated?: boolean;
  className?: string;
};

export function Background({
  children,
  variant = "liquid-ribbon",
  animated = true,
  className = "",
}: BackgroundProps) {
  const base =
    "relative min-h-full w-full overflow-hidden bg-slate-950 text-slate-100";

  const gradientClass =
    variant === "radial-glow"
      ? "bg-[radial-gradient(circle_at_top,_#4f46e5,_#020617_55%)]"
      : variant === "subtle-noise"
      ? "bg-slate-950"
      : "bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.25),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.3),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(248,250,252,0.08),transparent_55%)]";

  const animationLayer = animated ? (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      <div className="animate-[spin_16s_linear_infinite] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.0),rgba(56,189,248,0.2),rgba(248,250,252,0.0))] blur-3xl" />
    </div>
  ) : null;

  return (
    <div className={`${base} ${gradientClass} ${className}`}>
      {animationLayer}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

