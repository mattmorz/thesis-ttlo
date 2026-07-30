"use client";

import React from "react";
import { Check, Lock, LucideIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon?: LucideIcon;
  required?: boolean;
}

export interface SubFormProgressInfo {
  completed: number;
  total: number;
}

export interface StickyStepperProps {
  steps: StepperStep[];
  activeStepId: string;
  completedStepIds: string[];
  subFormProgress?: Record<string, SubFormProgressInfo>;
  onSelectStep: (stepId: string) => void;
  isSticky?: boolean;
  className?: string;
}

export function StickyStepper({
  steps,
  activeStepId,
  completedStepIds,
  subFormProgress,
  onSelectStep,
  isSticky = true,
  className,
}: StickyStepperProps) {
  const activeIndex = steps.findIndex((s) => s.id === activeStepId);
  const totalSteps = steps.length;

  // Granular Sub-form weighted progress calculation
  const totalSubForms = subFormProgress
    ? Object.values(subFormProgress).reduce((sum, item) => sum + item.total, 0)
    : 0;

  const completedSubForms = subFormProgress
    ? Object.values(subFormProgress).reduce((sum, item) => sum + item.completed, 0)
    : 0;

  const progressPercent =
    totalSubForms > 0
      ? Math.round((completedSubForms / totalSubForms) * 100)
      : Math.round((completedStepIds.length / totalSteps) * 100);

  return (
    <nav
      aria-label="Application Progress Stepper"
      className={cn(
        "w-full bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs transition-all",
        isSticky && "sticky top-[69px] z-20 shadow-xs",
        className
      )}
    >
      {/* Header text + Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 mb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
            Progress
          </h2>
          <p className="text-xs text-slate-500">
            Step {activeIndex + 1} of {totalSteps}: {steps[activeIndex]?.label || ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
              {progressPercent}% Complete
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {totalSubForms > 0
                ? `${completedSubForms} of ${totalSubForms} Sub-sections Done`
                : `${completedStepIds.length} of ${totalSteps} Steps Done`}
            </span>
          </div>
          <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
            <div
              className="bg-emerald-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps visual node container */}
      <div className="relative pt-1">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{
              width: `${
                activeIndex > 0 ? (activeIndex / (totalSteps - 1)) * 100 : 0
              }%`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 relative z-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const stepSubInfo = subFormProgress?.[step.id];
            const isFullyCompleted =
              completedStepIds.includes(step.id) ||
              Boolean(stepSubInfo && stepSubInfo.completed === stepSubInfo.total && stepSubInfo.total > 0);
            const isPartiallyCompleted = !isFullyCompleted && Boolean(stepSubInfo && stepSubInfo.completed > 0);
            const isActive = step.id === activeStepId;

            // Sequential lock check: step is locked if any preceding step is not completed
            const isLocked =
              idx > 0 &&
              steps.slice(0, idx).some((prev) => {
                const prevSubInfo = subFormProgress?.[prev.id];
                const prevComplete =
                  completedStepIds.includes(prev.id) ||
                  Boolean(prevSubInfo && prevSubInfo.completed === prevSubInfo.total && prevSubInfo.total > 0);
                return !prevComplete;
              });

            const stepPercent = stepSubInfo && stepSubInfo.total > 0
              ? Math.round((stepSubInfo.completed / stepSubInfo.total) * 100)
              : isFullyCompleted ? 100 : 0;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep(step.id)}
                title={
                  isLocked
                    ? `Step locked: Please complete Step ${idx} first.`
                    : step.description || step.label
                }
                className={cn(
                  "group text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between relative",
                  isActive
                    ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-600/20"
                    : isFullyCompleted
                    ? "border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50"
                    : isPartiallyCompleted
                    ? "border-amber-200 bg-amber-50/20 hover:bg-amber-50/50"
                    : isLocked
                    ? "border-slate-200 bg-slate-50/60 opacity-75 cursor-pointer"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                {/* Node Top Row */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      isActive
                        ? "bg-emerald-700 text-white"
                        : isFullyCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : isPartiallyCompleted
                        ? "bg-amber-100 text-amber-800"
                        : isLocked
                        ? "bg-slate-200 text-slate-600"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    Step {idx + 1}
                  </span>

                  {/* Icon Node */}
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center transition-all",
                      isActive
                        ? "bg-emerald-700 text-white ring-4 ring-emerald-100 scale-110 shadow-xs"
                        : isFullyCompleted
                        ? "bg-emerald-600 text-white"
                        : isPartiallyCompleted
                        ? "bg-amber-500 text-white"
                        : isLocked
                        ? "bg-slate-200 text-slate-500"
                        : "bg-slate-100 text-slate-600 border border-slate-300"
                    )}
                  >
                    {isFullyCompleted ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : isLocked ? (
                      <Lock className="size-3.5 text-slate-500" />
                    ) : Icon ? (
                      <Icon className="size-3.5" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                </div>

                {/* Step Title & Short Description */}
                <div>
                  <h3
                    className={cn(
                      "text-xs sm:text-sm font-bold truncate",
                      isActive
                        ? "text-emerald-950"
                        : isFullyCompleted
                        ? "text-emerald-900"
                        : "text-slate-800"
                    )}
                  >
                    {step.label}
                  </h3>
                  {step.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Granular Sub-form Status Indicator Bar */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                    <span>
                      {isFullyCompleted
                        ? "Completed"
                        : stepSubInfo && stepSubInfo.total > 0
                        ? `${stepSubInfo.completed}/${stepSubInfo.total} Sub-sections`
                        : "Pending"}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {stepPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        isFullyCompleted ? "bg-emerald-600" : isPartiallyCompleted ? "bg-amber-500" : "bg-slate-200"
                      )}
                      style={{ width: `${stepPercent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
