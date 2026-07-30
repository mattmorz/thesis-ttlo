"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutoSaveIndicatorProps {
  status: "saving" | "saved" | "unsaved" | "error";
  lastSavedAt?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  className,
}: AutoSaveIndicatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium transition-colors", className)}>
      {status === "saving" && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
          <span className="text-amber-700">Saving draft...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-700">
            Saved {lastSavedAt ? `${Math.max(1, Math.floor((Date.now() - lastSavedAt.getTime()) / 1000))}s ago` : ""}
          </span>
        </>
      )}

      {status === "unsaved" && (
        <>
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          <span className="text-slate-500">Unsaved changes</span>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-rose-600 font-semibold">Save failed</span>
        </>
      )}
    </div>
  );
}
