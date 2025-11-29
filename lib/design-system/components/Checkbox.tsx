"use client";

import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Icon } from "./Icon";

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
};

function Checkbox({
  checked,
  onCheckedChange,
  defaultChecked,
  disabled,
  className = "",
  id,
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      defaultChecked={defaultChecked}
      disabled={disabled}
      className={`peer h-4 w-4 shrink-0 rounded-sm border border-white/20 bg-slate-900/70 ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=checked]:text-white data-[state=checked]:border-transparent ${className}`}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Icon name="Check" size={12} className="text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

