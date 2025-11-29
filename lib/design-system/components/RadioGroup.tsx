"use client";

import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

type RadioGroupProps = {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
};

type RadioItemProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

function RadioGroup({
  children,
  value,
  onValueChange,
  defaultValue,
  className = "",
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      className={className}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
}

function RadioItem({
  children,
  value,
  className = "",
  disabled,
  id,
}: RadioItemProps) {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupPrimitive.Item
        id={id}
        value={value}
        disabled={disabled}
        className={`aspect-square h-4 w-4 rounded-full border border-white/20 bg-slate-900/70 text-slate-100 ring-offset-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=checked]:border-transparent ${className}`}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {children && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none text-slate-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {children}
        </label>
      )}
    </div>
  );
}

export { RadioGroup, RadioItem };

