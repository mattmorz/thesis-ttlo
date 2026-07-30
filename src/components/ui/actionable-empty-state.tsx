"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FolderPlus, LucideIcon } from "lucide-react";

export interface ActionableEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ActionableEmptyState({
  icon: Icon = FolderPlus,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: ActionableEmptyStateProps) {
  const PrimaryIcon = primaryAction?.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 my-4",
        className
      )}
    >
      <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50/40">
        <Icon className="size-7" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-medium px-5"
            >
              {PrimaryIcon && <PrimaryIcon className="size-4" />}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
