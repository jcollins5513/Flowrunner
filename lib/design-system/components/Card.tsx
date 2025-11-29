"use client";

import React from "react";
import { Surface } from "./Surface";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
};

export function Card({ children, className = "", interactive }: CardProps) {
  return (
    <Surface
      interactive={interactive}
      padding="lg"
      className={`w-full ${className}`}
    >
      {children}
    </Surface>
  );
}

