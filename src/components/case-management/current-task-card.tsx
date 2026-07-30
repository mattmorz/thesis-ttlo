"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CurrentTaskCardProps {
  taskTitle: string;
  taskDescription?: string;
  estimatedTime?: string;
  remainingCount?: number;
  totalCount?: number;
  onContinue: () => void;
  isCompleted?: boolean;
  className?: string;
}

export function CurrentTaskCard({
  taskTitle,
  taskDescription = "Fill in the required details to complete this section of your application.",
  estimatedTime = "4 minutes",
  remainingCount = 1,
  totalCount = 4,
  onContinue,
  isCompleted = false,
  className,
}: CurrentTaskCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs transition-all",
        isCompleted
          ? "border-emerald-200 bg-emerald-50/20"
          : "border-emerald-700/20 ring-1 ring-emerald-600/10",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side: Task header & Details */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles className="size-3 text-emerald-700" />
              {isCompleted ? "All Steps Completed" : "Current Active Task"}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="size-3 text-slate-400" />
              Est. {estimatedTime}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {taskTitle}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
            {taskDescription}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <ListChecks className="size-3.5 text-emerald-600" />
              {isCompleted
                ? "Ready for Final Review"
                : `${remainingCount} section${remainingCount > 1 ? "s" : ""} remaining`}
            </span>
          </div>
        </div>

        {/* Right side: Action CTA */}
        <div className="shrink-0 self-start sm:self-center">
          <Button
            onClick={onContinue}
            className={cn(
              "gap-2 font-semibold shadow-xs text-xs sm:text-sm px-5 py-2.5 h-auto",
              isCompleted
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-emerald-700 hover:bg-emerald-800 text-white"
            )}
          >
            {isCompleted ? (
              <>
                <span>Review & Submit</span>
                <CheckCircle2 className="size-4" />
              </>
            ) : (
              <>
                <span>Continue Section</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
