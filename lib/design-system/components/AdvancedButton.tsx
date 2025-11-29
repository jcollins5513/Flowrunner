"use client";

import React from "react";
import { Button, ButtonProps } from "./Button";

export function AdvancedButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

