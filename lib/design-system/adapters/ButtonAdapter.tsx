"use client";

import React from "react";
import { SafeButton } from "../components/SafeButton";
import { AdvancedButton } from "../components/AdvancedButton";
import { Icon } from "../components/Icon";
import type { ComponentTier } from "@/lib/library/component-types";

export interface ButtonAdapterProps {
  content: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: React.CSSProperties;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: string;
  tier?: ComponentTier;
}

export function ButtonAdapter({
  content,
  onClick,
  className = "",
  style,
  variant = "primary",
  size = "md",
  icon,
  tier = "safe",
}: ButtonAdapterProps) {
  const ButtonComponent = tier === "advanced" ? AdvancedButton : SafeButton;
  
  // Map size
  const dsSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  // Render icon if provided
  const iconLeft = icon ? <Icon name={icon} size={16} /> : undefined;

  return (
    <ButtonComponent
      size={dsSize}
      onClick={onClick}
      className={className}
      style={style}
      iconLeft={iconLeft}
    >
      {content}
    </ButtonComponent>
  );
}

