"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  Clock,
  Send,
  MoreHorizontal,
  ChevronRight,
  FileDown,
  Archive,
  Layers,
  Inbox,
  User,
  Building,
} from "lucide-react";
import { getStatusBadgeVariant } from "../case-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ApplicationRow {
  id: string;
  title: string;
  applicantName: string;
  department: string;
  ipType: string;
  status: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
}

export interface StaffWorkQueueProps {
  applications: ApplicationRow[];
  onBulkAssign?: (selectedIds: string[]) => void;
  onBulkStatusChange?: (selectedIds: string[], newStatus: string) => void;
  onBulkExport?: (selectedIds: string[]) => void;
  onOpenQuickInfo?: (applicationId: string) => void;
  className?: string;
}

export function StaffWorkQueue({
  applications,
  onBulkAssign,
  onBulkStatusChange,
  onBulkExport,
  onOpenQuickInfo,
  className,
}: StaffWorkQueueProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter based on active tab and search query
  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const normalizedStatus = app.status?.toLowerCase();
    switch (activeTab) {
      case "needs_assignment":
        return !app.assignedStaffName;
      case "waiting_review":
        return normalizedStatus === "submitted" || normalizedStatus === "under_review";
      case "waiting_applicant":
        return normalizedStatus === "needs_revision" || normalizedStatus === "draft";
      case "ready_approval":
        return normalizedStatus === "approved" || normalizedStatus === "signing";
      case "completed":
        return normalizedStatus === "completed" || normalizedStatus === "filed";
      default:
        return true;
    }
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-emerald-600" />
            Staff Application Work Queue
          </h2>
          <p className="text-xs text-slate-500">Categorized processing queue for assigned case workflows</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search title, applicant, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs border-slate-200 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-slate-100/70 p-1 text-xs">
          <TabsTrigger value="all" className="text-xs font-semibold px-3 py-1.5">
            All Cases ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="needs_assignment" className="text-xs font-semibold px-3 py-1.5">
            Needs Assignment ({applications.filter((a) => !a.assignedStaffName).length})
          </TabsTrigger>
          <TabsTrigger value="waiting_review" className="text-xs font-semibold px-3 py-1.5">
            Waiting Review (
            {
              applications.filter(
                (a) => a.status === "submitted" || a.status === "under_review"
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="waiting_applicant" className="text-xs font-semibold px-3 py-1.5">
            Waiting Applicant (
            {
              applications.filter(
                (a) => a.status === "needs_revision" || a.status === "draft"
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="ready_approval" className="text-xs font-semibold px-3 py-1.5">
            Ready Approval (
            {
              applications.filter(
                (a) => a.status === "approved" || a.status === "signing"
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-semibold px-3 py-1.5">
            Completed (
            {
              applications.filter(
                (a) => a.status === "completed" || a.status === "filed"
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Action Bar if selection made */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
          <span className="font-semibold text-emerald-900">
            {selectedIds.length} {selectedIds.length === 1 ? "application" : "applications"} selected
          </span>

          <div className="flex items-center gap-2">
            {onBulkAssign && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAssign(selectedIds)}
                className="h-8 text-xs bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign Staff
              </Button>
            )}

            {onBulkStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1">
                    <span>Batch Update Status</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedIds, "under_review")}>
                    Set Under Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedIds, "approved")}>
                    Set Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkStatusChange(selectedIds, "archived")}>
                    Set Archived
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {onBulkExport && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onBulkExport(selectedIds)}
                className="h-8 text-xs text-slate-700 hover:bg-emerald-100/50 gap-1"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Queue Application List */}
      <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 p-3 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider items-center">
          <div className="col-span-1 flex items-center">
            <Checkbox
              checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
              onCheckedChange={toggleSelectAll}
            />
          </div>
          <div className="col-span-4 sm:col-span-4">Application & Title</div>
          <div className="col-span-3 sm:col-span-2">Applicant / Dept</div>
          <div className="col-span-2 sm:col-span-2">Stage Status</div>
          <div className="hidden sm:block sm:col-span-2">Assignee</div>
          <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No applications match the selected queue filter.
          </div>
        ) : (
          filtered.map((app) => {
            const badge = getStatusBadgeVariant(app.status);
            const isSelected = selectedIds.includes(app.id);

            return (
              <div
                key={app.id}
                className={cn(
                  "p-3 grid grid-cols-12 gap-2 text-xs items-center hover:bg-slate-50/80 transition-colors",
                  isSelected && "bg-emerald-50/40"
                )}
              >
                {/* Select Checkbox */}
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectOne(app.id)}
                  />
                </div>

                {/* Title & Type */}
                <div className="col-span-4 sm:col-span-4 pr-2">
                  <Link
                    href={`/admin/projects/${app.id}`}
                    className="font-bold text-slate-900 hover:text-emerald-700 truncate block text-xs"
                  >
                    {app.title}
                  </Link>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="font-mono text-[10px] text-slate-400">#{app.id.substring(0, 8).toUpperCase()}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize bg-slate-50 border-slate-200">
                      {app.ipType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Applicant & Dept */}
                <div className="col-span-3 sm:col-span-2">
                  <p className="font-medium text-slate-800 truncate text-xs">{app.applicantName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{app.department}</p>
                </div>

                {/* Stage Status */}
                <div className="col-span-2 sm:col-span-2">
                  <Badge variant="outline" className={cn("text-[10px] font-semibold border", badge.className)}>
                    {badge.label}
                  </Badge>
                </div>

                {/* Assignee */}
                <div className="hidden sm:block sm:col-span-2 text-slate-600 font-medium truncate text-xs">
                  {app.assignedStaffName ? (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{app.assignedStaffName}</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold text-[11px] italic">Unassigned</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 sm:col-span-1 text-right flex items-center justify-end gap-1">
                  {onOpenQuickInfo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenQuickInfo(app.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                      title="Quick Info Drawer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-700">
                    <Link href={`/admin/projects/${app.id}`}>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
