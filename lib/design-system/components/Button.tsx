"use client";

import React from "react";
import { tokens } from "../tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  iconLeft,
  iconRight,
  fullWidth,
  onClick,
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center rounded-full font-medium transition duration-200 select-none";

  const sizeClass =
    size === "sm"
      ? "h-8 px-4 text-xs"
      : size === "lg"
      ? "h-12 px-7 text-base"
      : "h-10 px-5 text-sm";

  const widthClass = fullWidth ? "w-full" : "inline-flex";

  const variantClass =
    variant === "primary"
      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_30px_rgba(236,72,153,0.7)] hover:shadow-[0_0_40px_rgba(236,72,153,0.9)]"
      : variant === "secondary"
      ? "bg-white/10 text-slate-100 border border-white/25 hover:bg-white/15"
      : "bg-transparent text-slate-200 border border-transparent hover:bg-white/5";

  const motionClass =
    "hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.97]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${sizeClass} ${widthClass} ${variantClass} ${motionClass} ${className}`}
    >
      {iconLeft && <span className="mr-2 flex items-center">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && (
        <span className="ml-2 flex items-center">{iconRight}</span>
      )}
    </button>
  );
}

