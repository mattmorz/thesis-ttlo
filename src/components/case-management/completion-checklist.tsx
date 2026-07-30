"use client";

import React from "react";
import { CheckCircle2, XCircle, ChevronRight, AlertCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ChecklistItem {
  key: string;
  label: string;
  isComplete: boolean;
  required: boolean;
  targetStepId?: string;
  missingNote?: string;
}

export interface CompletionChecklistProps {
  items: ChecklistItem[];
  onNavigateToStep?: (stepId: string) => void;
  className?: string;
}

export function CompletionChecklist({
  items,
  onNavigateToStep,
  className,
}: CompletionChecklistProps) {
  const completeItems = items.filter((i) => i.isComplete);
  const incompleteItems = items.filter((i) => !i.isComplete);

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Completion Checklist</h3>
          <p className="text-xs text-slate-500">Ensure all mandatory sections are satisfied before submission</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
          {completeItems.length} / {items.length} Ready
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border text-xs transition-colors",
              item.isComplete
                ? "border-emerald-100 bg-emerald-50/40 text-slate-800"
                : "border-orange-200 bg-orange-50/50 text-orange-900"
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {item.isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-orange-500 shrink-0" />
              )}
              <div className="truncate">
                <span className={cn("font-medium", item.isComplete ? "text-slate-700" : "text-orange-950 font-semibold")}>
                  {item.label}
                </span>
                {!item.isComplete && item.missingNote && (
                  <p className="text-[11px] text-orange-700 truncate">{item.missingNote}</p>
                )}
              </div>
            </div>

            {!item.isComplete && item.targetStepId && onNavigateToStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToStep(item.targetStepId!)}
                className="h-7 px-2 text-[11px] font-semibold text-orange-700 hover:text-orange-900 hover:bg-orange-100/60 shrink-0 gap-1"
              >
                Fix
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
