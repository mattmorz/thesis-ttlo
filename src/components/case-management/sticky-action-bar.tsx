"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Save, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StickyActionBarProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  canSubmit?: boolean;
  isSaving?: boolean;
  lastSavedText?: string | null;
  validationStatus?: {
    isComplete: boolean;
    missingCount?: number;
  };
  nextLabel?: string;
  className?: string;
}

export function StickyActionBar({
  onPrevious,
  onNext,
  onSaveDraft,
  onSubmit,
  hasPrevious = true,
  hasNext = true,
  canSubmit = false,
  isSaving = false,
  lastSavedText,
  validationStatus,
  nextLabel = "Continue",
  className,
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-4 sm:px-6 py-3 transition-all",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left status / feedback */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          {validationStatus && (
            <div className="flex items-center gap-2 text-xs">
              {validationStatus.isComplete ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Section Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  <AlertCircle className="size-3.5 text-amber-600" />
                  Missing {validationStatus.missingCount || "required"} field{(validationStatus.missingCount || 0) > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {lastSavedText && (
            <span className="text-xs text-slate-500 inline-flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-600" />
              <span>{lastSavedText}</span>
            </span>
          )}

          {isSaving && (
            <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
              <Sparkles className="size-3 animate-spin text-emerald-600" />
              <span>Saving draft...</span>
            </span>
          )}
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {hasPrevious && onPrevious && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrevious}
              className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>Previous</span>
            </Button>
          )}

          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-100 gap-1.5"
            >
              <Save className="size-3.5 text-slate-500" />
              <span>Save Draft</span>
            </Button>
          )}

          {hasNext && onNext && (
            <Button
              type="button"
              size="sm"
              onClick={onNext}
              className="h-9 px-5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs gap-1.5"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          )}

          {canSubmit && onSubmit && (
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              className="h-9 px-5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm gap-1.5"
            >
              <Send className="size-3.5" />
              <span>Submit Application</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
