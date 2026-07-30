"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  FileDown,
  MoreVertical,
  Save,
  Send,
  Sparkles,
  Archive,
  AlertTriangle,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface GuidedHeaderProps {
  id: string;
  title: string;
  ipType: string;
  status: string;
  progressPercent?: number;
  lastSavedAt?: string | Date | null;
  userRole?: "admin" | "ttlo_staff" | "client";
  backUrl?: string;
  onSave?: () => void;
  onPreview?: () => void;
  onSubmit?: () => void;
  onExport?: () => void;
  onArchive?: () => void;
  onStatusChange?: (newStatus: string) => void;
  isSaving?: boolean;
  canSubmit?: boolean;
  className?: string;
}

export function getStatusConfig(status: string) {
  const normalized = (status || "draft").toLowerCase().replace(/_/g, " ");
  switch (normalized) {
    case "draft":
      return { label: "Draft", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" };
    case "submitted":
      return { label: "Submitted", badgeClass: "bg-blue-100 text-blue-800 border-blue-300" };
    case "under review":
    case "in progress":
      return { label: "Under Review", badgeClass: "bg-amber-100 text-amber-800 border-amber-300" };
    case "needs revision":
    case "pending revision":
      return { label: "Needs Revision", badgeClass: "bg-orange-100 text-orange-800 border-orange-300" };
    case "approved":
      return { label: "Approved", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "signing":
      return { label: "Signing", badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300" };
    case "filed":
    case "filed to ipophl":
      return { label: "Filed to IPOPHL", badgeClass: "bg-purple-100 text-purple-800 border-purple-300" };
    case "completed":
      return { label: "Completed", badgeClass: "bg-green-100 text-green-800 border-green-300" };
    default:
      return { label: status || "Draft", badgeClass: "bg-slate-100 text-slate-700 border-slate-300" };
  }
}

export function GuidedHeader({
  id,
  title,
  ipType,
  status,
  progressPercent = 0,
  lastSavedAt,
  userRole = "client",
  backUrl,
  onSave,
  onPreview,
  onSubmit,
  onExport,
  onArchive,
  onStatusChange,
  isSaving = false,
  canSubmit = true,
  className,
}: GuidedHeaderProps) {
  const statusCfg = getStatusConfig(status);
  const isStaff = userRole === "admin" || userRole === "ttlo_staff";
  const formattedId = id ? `#${id.substring(0, 8).toUpperCase()}` : "#---";

  const formattedSavedTime = React.useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      const d = typeof lastSavedAt === "string" ? new Date(lastSavedAt) : lastSavedAt;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  return (
    <header
      className={cn(
        "bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs px-4 sm:px-6 py-3.5 transition-all",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Top / Left: Title & Essential Metadata */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {backUrl && (
              <Link
                href={backUrl}
                className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Link>
            )}
            <span className="font-mono text-xs font-semibold text-slate-500">
              {formattedId}
            </span>
            <Badge
              variant="outline"
              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border-emerald-200 capitalize"
            >
              {ipType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={cn("text-[11px] font-medium border", statusCfg.badgeClass)}>
              {statusCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
              {title || "Untitled Application"}
            </h1>
          </div>

          {/* Subtext: Last saved & Progress % */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            {formattedSavedTime && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last saved {formattedSavedTime}</span>
              </span>
            )}
            {isSaving && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Saving draft...</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              Progress: {progressPercent}%
            </span>
          </div>
        </div>

        {/* Right: Primary Action Bar */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {/* Secondary Actions */}
          {onSave && status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save</span>
            </Button>
          )}

          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="h-9 text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}

          {/* Primary Action Button */}
          {!isStaff && status === "draft" && onSubmit && (
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!canSubmit || isSaving}
              className="h-9 text-xs font-semibold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Application</span>
            </Button>
          )}

          {/* Staff Status Dropdown */}
          {isStaff && onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                  <span>Manage Case</span>
                  <MoreVertical className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-slate-500">Advance Stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange("under_review")} className="text-amber-800 text-xs">
                  <Clock className="w-4 h-4 mr-2 text-amber-600" />
                  Mark Under Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("needs_revision")} className="text-orange-800 text-xs">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                  Request Revision
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("approved")} className="text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Approve Application
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("signing")} className="text-indigo-800 text-xs">
                  <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                  Ready for Signing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* More Dropdown for optional exports */}
          {(onExport || onArchive) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onExport && (
                  <DropdownMenuItem onClick={onExport} className="text-xs text-slate-700">
                    <FileDown className="w-4 h-4 mr-2 text-slate-400" />
                    Export Application PDF
                  </DropdownMenuItem>
                )}
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive} className="text-xs text-slate-600">
                    <Archive className="w-4 h-4 mr-2 text-slate-400" />
                    Archive Application
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
