"use client";

import React from "react";
import { Button, ButtonProps } from "./Button";

export function SafeButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}

