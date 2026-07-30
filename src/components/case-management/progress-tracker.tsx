"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "incomplete" | "warning";
  errorCount?: number;
}

export interface ProgressTrackerProps {
  steps: StepItem[];
  currentStepId?: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function ProgressTracker({
  steps,
  currentStepId,
  onStepClick,
  className,
}: ProgressTrackerProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const percentage = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">Application Completion</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
            {percentage}% Complete
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {completedCount} of {steps.length} Sections
        </span>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2.5 bg-slate-100" indicatorClassName="bg-emerald-600 transition-all duration-300" />

      {/* Step Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
        {steps.map((step, idx) => {
          const isActive = currentStepId === step.id;
          const isDone = step.status === "completed";
          const isWarning = step.status === "warning";
          const isInProgress = step.status === "in_progress";

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              className={cn(
                "flex items-center gap-1.5 p-2 rounded-lg border text-left text-xs font-medium transition-all",
                isActive
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                  : isDone
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : isWarning
                  ? "border-orange-200 bg-orange-50 text-orange-800"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : isWarning ? (
                <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              ) : isInProgress ? (
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span className="truncate">{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
