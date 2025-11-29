"use client";

import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Icon } from "./Icon";

type SelectProps = {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
};

type SelectTriggerProps = {
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
};

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
};

function Select({ children, value, onValueChange, defaultValue, disabled }: SelectProps) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      disabled={disabled}
    >
      {children}
    </SelectPrimitive.Root>
  );
}

function SelectTrigger({
  children,
  className = "",
  placeholder,
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={`inline-flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <SelectPrimitive.Value placeholder={placeholder}>
        {children}
      </SelectPrimitive.Value>
      <SelectPrimitive.Icon className="text-slate-400">
        <Icon name="ChevronDown" size={16} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  children,
  className = "",
  position = "popper",
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={`relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-md text-slate-100 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  children,
  value,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-800 focus:text-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Icon name="Check" size={16} className="text-slate-100" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SelectPrimitive.Group>{children}</SelectPrimitive.Group>;
}

function SelectLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SelectPrimitive.Label
      className={`py-1.5 pl-8 pr-2 text-sm font-semibold text-slate-400 ${className}`}
    >
      {children}
    </SelectPrimitive.Label>
  );
}

function SelectSeparator({
  className = "",
}: {
  className?: string;
}) {
  return (
    <SelectPrimitive.Separator
      className={`-mx-1 my-1 h-px bg-white/10 ${className}`}
    />
  );
}

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
};

