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
  FileText,
  Clock,
  User,
  Building,
  MoreVertical,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Archive,
  ArrowLeft,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CaseHeaderProps {
  id: string;
  title: string;
  ipType: string;
  status: string;
  applicantName?: string;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
  userRole?: "admin" | "ttlo_staff" | "client";
  onStatusChange?: (newStatus: string) => void;
  onExport?: () => void;
  onArchive?: () => void;
  backUrl?: string;
}

export function getStatusBadgeVariant(status: string) {
  const normalized = status?.toLowerCase().replace(/_/g, " ");
  switch (normalized) {
    case "draft":
      return { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-300" };
    case "submitted":
      return { label: "Submitted", className: "bg-blue-100 text-blue-800 border-blue-300" };
    case "under review":
    case "in progress":
      return { label: "Under Review", className: "bg-amber-100 text-amber-800 border-amber-300" };
    case "needs revision":
    case "pending revision":
      return { label: "Needs Revision", className: "bg-orange-100 text-orange-800 border-orange-300" };
    case "approved":
      return { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
    case "signing":
      return { label: "Signing", className: "bg-indigo-100 text-indigo-800 border-indigo-300" };
    case "filed to ipophl":
    case "filed":
      return { label: "Filed to IPOPHL", className: "bg-purple-100 text-purple-800 border-purple-300" };
    case "completed":
      return { label: "Completed", className: "bg-green-100 text-green-800 border-green-300" };
    case "archived":
      return { label: "Archived", className: "bg-gray-100 text-gray-600 border-gray-300" };
    default:
      return { label: status || "Unknown", className: "bg-gray-100 text-gray-700 border-gray-300" };
  }
}

export function CaseHeader({
  id,
  title,
  ipType,
  status,
  applicantName = "N/A",
  department = "Caraga State University",
  createdAt,
  updatedAt,
  userRole = "client",
  onStatusChange,
  onExport,
  onArchive,
  backUrl,
}: CaseHeaderProps) {
  const badge = getStatusBadgeVariant(status);
  const isStaff = userRole === "admin" || userRole === "ttlo_staff";

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left column: Navigation, Title & Metadata */}
        <div className="space-y-2 max-w-3xl">
          {backUrl && (
            <Link
              href={backUrl}
              className="inline-flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to List
            </Link>
          )}
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-slate-600 bg-slate-50 border-slate-200">
              CASE #{id.substring(0, 8).toUpperCase()}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs font-semibold text-emerald-800 bg-emerald-50 border-emerald-200">
              {ipType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-medium border", badge.className)}>
              {badge.label}
            </Badge>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {title || "Untitled Application"}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-700 font-medium">{applicantName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{department}</span>
            </span>
            {createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Created {new Date(createdAt).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right column: Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-center pt-2 md:pt-0">
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="h-9 gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-50">
              <FileDown className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export Case</span>
            </Button>
          )}

          {/* Applicant Actions */}
          {!isStaff && status === "draft" && onStatusChange && (
            <Button size="sm" onClick={() => onStatusChange("submitted")} className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="w-4 h-4" />
              Submit Application
            </Button>
          )}

          {/* Staff Workflow Actions */}
          {isStaff && onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
                  <span>Update Case Stage</span>
                  <MoreVertical className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-slate-500">Advance Lifecycle</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange("under_review")} className="text-amber-800">
                  <Clock className="w-4 h-4 mr-2 text-amber-600" />
                  Mark Under Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("needs_revision")} className="text-orange-800">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                  Request Revision
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("approved")} className="text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Approve Application
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("signing")} className="text-indigo-800">
                  <FileText className="w-4 h-4 mr-2 text-indigo-600" />
                  Ready for Signing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("filed")} className="text-purple-800">
                  <Send className="w-4 h-4 mr-2 text-purple-600" />
                  Filed to IPOPHL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange("completed")} className="text-green-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Mark Completed
                </DropdownMenuItem>
                {onArchive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onArchive} className="text-slate-600">
                      <Archive className="w-4 h-4 mr-2 text-slate-400" />
                      Archive Case
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
