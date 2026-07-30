"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string | boolean | number> {
  label: string;
  value: T;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | boolean | number> {
  options: SegmentedControlOption<T>[];
  value: T | undefined | null;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function SegmentedControl<T extends string | boolean | number>({
  options,
  value,
  onChange,
  className,
  size = "md",
  disabled = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 w-full sm:w-auto",
        disabled && "opacity-60 pointer-events-none",
        className
      )}
    >
      {options.map((option, idx) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={String(option.value) + idx}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            className={cn(
              "flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 select-none",
              size === "sm" && "px-2.5 py-1 text-xs",
              size === "md" && "px-3.5 py-1.5 text-xs sm:text-sm",
              size === "lg" && "px-4 py-2 text-sm",
              isSelected
                ? "bg-white text-emerald-800 font-semibold shadow-xs ring-1 ring-slate-200/70"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            {/* Visual indicator dot */}
            <span
              className={cn(
                "size-2 rounded-full transition-colors",
                isSelected ? "bg-emerald-600 ring-2 ring-emerald-100" : "bg-slate-300"
              )}
            />
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
