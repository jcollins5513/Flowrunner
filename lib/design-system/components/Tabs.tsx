"use client";

import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

type TabsProps = {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
};

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

type TabsTriggerProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
};

type TabsContentProps = {
  children: React.ReactNode;
  value: string;
  className?: string;
};

function Tabs({ children, value, onValueChange, defaultValue, className = "" }: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      className={className}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={`inline-flex h-10 items-center justify-center rounded-lg bg-slate-900/70 p-1 text-slate-400 ${className}`}
    >
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ children, value, className = "" }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-slate-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 data-[state=active]:shadow-sm ${className}`}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ children, value, className = "" }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={`mt-2 ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

