"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function TimePicker({ className, ...props }: TimePickerProps) {
  return <Input type="time" className={cn("w-full", className)} {...props} />;
}
