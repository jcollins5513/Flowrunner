"use client";

import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};

function Label({ children, htmlFor, className = "" }: LabelProps) {
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none text-slate-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </LabelPrimitive.Root>
  );
}

export { Label };

