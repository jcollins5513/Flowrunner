"use client";

import React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

type HoverCardProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
};

type HoverCardTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
};

type HoverCardContentProps = {
  children: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
};

function HoverCard({
  children,
  open,
  onOpenChange,
  openDelay = 200,
  closeDelay = 300,
}: HoverCardProps) {
  return (
    <HoverCardPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      openDelay={openDelay}
      closeDelay={closeDelay}
    >
      {children}
    </HoverCardPrimitive.Root>
  );
}

function HoverCardTrigger({
  children,
  asChild,
  className = "",
}: HoverCardTriggerProps) {
  return (
    <HoverCardPrimitive.Trigger asChild={asChild} className={className}>
      {children}
    </HoverCardPrimitive.Trigger>
  );
}

function HoverCardContent({
  children,
  className = "",
  side = "bottom",
  align = "center",
  sideOffset = 4,
}: HoverCardContentProps) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={`z-50 w-64 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-md p-4 text-slate-100 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
      >
        {children}
        <HoverCardPrimitive.Arrow className="fill-slate-900/95" />
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };

