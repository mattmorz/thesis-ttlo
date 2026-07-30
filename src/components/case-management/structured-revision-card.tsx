"use client";

import React from "react";
import { AlertTriangle, Clock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RevisionRequest {
  id: string;
  section: string;
  sectionKey: string;
  comment: string;
  requestedBy: string;
  requestedAt: string;
  deadline?: string;
  isResolved?: boolean;
}

export interface StructuredRevisionCardProps {
  revisions: RevisionRequest[];
  onResolveRevision?: (revisionId: string, sectionKey: string) => void;
  className?: string;
}

export function StructuredRevisionCard({
  revisions,
  onResolveRevision,
  className,
}: StructuredRevisionCardProps) {
  if (!revisions || revisions.length === 0) return null;

  const pendingRevisions = revisions.filter((r) => !r.isResolved);

  return (
    <div className={cn("bg-orange-50/70 border border-orange-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-orange-200/80 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-orange-950">Structured Revision Requests</h3>
            <p className="text-xs text-orange-800">Address the following staff feedback items to proceed</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-orange-100 text-orange-900 border-orange-300 font-bold text-xs">
          {pendingRevisions.length} Action Needed
        </Badge>
      </div>

      <div className="space-y-3">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className={cn(
              "p-4 rounded-lg border text-xs space-y-2 transition-colors",
              rev.isResolved
                ? "bg-white/80 border-slate-200 opacity-60"
                : "bg-white border-orange-200 shadow-sm"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-900 border-orange-300 font-semibold text-xs capitalize">
                  Section: {rev.section}
                </Badge>
                {rev.isResolved && (
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs">
                    Resolved
                  </Badge>
                )}
              </div>

              {rev.deadline && !rev.isResolved && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-orange-800 bg-orange-100/70 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3 text-orange-600" />
                  Deadline: {new Date(rev.deadline).toLocaleDateString()}
                </span>
              )}
            </div>

            <p className="text-slate-800 leading-relaxed font-medium pl-1">{rev.comment}</p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Requested by: <strong className="text-slate-700">{rev.requestedBy}</strong>
              </span>

              {!rev.isResolved && onResolveRevision && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolveRevision(rev.id, rev.sectionKey)}
                  className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-medium gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Mark Section Resolved
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
