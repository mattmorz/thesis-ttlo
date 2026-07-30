"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  User,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Send,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface KanbanCardItem {
  id: string;
  title: string;
  applicantName: string;
  ipType: string;
  status: string; // "submitted", "under_review", "needs_revision", "approved", "signing", "filed", "completed"
  department?: string;
  updatedAt?: string;
}

export interface KanbanWorkflowProps {
  applications: KanbanCardItem[];
  onStatusAdvance?: (id: string, newStatus: string) => void;
  className?: string;
}

export const KANBAN_COLUMNS = [
  { id: "submitted", title: "Submitted", color: "bg-blue-500" },
  { id: "under_review", title: "Under Review", color: "bg-amber-500" },
  { id: "needs_revision", title: "Revision Needed", color: "bg-orange-500" },
  { id: "approved", title: "Approved", color: "bg-emerald-500" },
  { id: "signing", title: "Signing", color: "bg-indigo-500" },
  { id: "filed", title: "Filed to IPOPHL", color: "bg-purple-500" },
  { id: "completed", title: "Completed", color: "bg-green-600" },
];

export function KanbanWorkflow({
  applications,
  onStatusAdvance,
  className,
}: KanbanWorkflowProps) {
  const getNextStage = (current: string) => {
    switch (current) {
      case "submitted":
        return "under_review";
      case "under_review":
        return "approved";
      case "needs_revision":
        return "under_review";
      case "approved":
        return "signing";
      case "signing":
        return "filed";
      case "filed":
        return "completed";
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto pb-4", className)}>
      <div className="flex gap-4 min-w-[1200px]">
        {KANBAN_COLUMNS.map((col) => {
          const columnApps = applications.filter((app) => {
            const norm = app.status?.toLowerCase().replace(/ /g, "_");
            if (col.id === "under_review") {
              return norm === "under_review" || norm === "in_progress";
            }
            if (col.id === "needs_revision") {
              return norm === "needs_revision" || norm === "pending_revision";
            }
            return norm === col.id;
          });

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col max-h-[700px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", col.color)} />
                  <h3 className="text-xs font-bold text-slate-800">{col.title}</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-700 border-slate-300">
                  {columnApps.length}
                </Badge>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {columnApps.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400 italic border border-dashed border-slate-200 rounded-lg">
                    No cases in this stage
                  </div>
                ) : (
                  columnApps.map((app) => {
                    const nextStage = getNextStage(app.status);

                    return (
                      <Card
                        key={app.id}
                        className="p-3 bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            #{app.id.substring(0, 8).toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
                            {app.ipType.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <Link
                          href={`/admin/projects/${app.id}`}
                          className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 block leading-tight line-clamp-2"
                        >
                          {app.title}
                        </Link>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{app.applicantName}</span>
                        </div>

                        {/* Quick Advance Stage Button */}
                        {nextStage && onStatusAdvance && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onStatusAdvance(app.id, nextStage)}
                              className="h-6 px-2 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 gap-1"
                            >
                              Advance Stage
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
