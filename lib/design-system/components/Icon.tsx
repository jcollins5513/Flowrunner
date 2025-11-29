"use client";

import * as Lucide from "lucide-react";

import React from "react";

export type IconName = keyof typeof Lucide;

type IconProps = {
  name: string;
  size?: number;
  className?: string;
};

export function Icon({ name, size = 20, className }: IconProps) {
  const Component = (Lucide as any)[name] as React.ComponentType<{
    size?: number;
    className?: string;
  }>;

  if (!Component) {
    // fallback blank box
    return (
      <div
        className={`inline-block rounded-sm border border-dashed border-slate-600 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return <Component size={size} className={className} />;
}

