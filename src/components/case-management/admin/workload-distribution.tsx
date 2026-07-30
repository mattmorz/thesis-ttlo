"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffWorkloadItem {
  staffId: string;
  name: string;
  avatar?: string;
  role?: string;
  assignedCount: number;
}

export interface WorkloadDistributionProps {
  staffWorkloads: StaffWorkloadItem[];
  maxCapacity?: number;
  className?: string;
}

export function WorkloadDistribution({
  staffWorkloads,
  maxCapacity = 10,
  className,
}: WorkloadDistributionProps) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Staff Workload Distribution</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">{staffWorkloads.length} Active Staff</span>
      </div>

      <div className="space-y-3">
        {staffWorkloads.map((staff) => {
          const initials = staff.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const percentage = Math.min(100, Math.round((staff.assignedCount / maxCapacity) * 100));

          return (
            <div key={staff.staffId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={staff.avatar} />
                    <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-800">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-800">{staff.name}</span>
                </div>
                <span className="font-bold text-slate-700 font-mono">
                  {staff.assignedCount} {staff.assignedCount === 1 ? "Case" : "Cases"}
                </span>
              </div>

              <Progress
                value={percentage}
                className="h-2 bg-slate-100"
                indicatorClassName={cn(
                  percentage > 80
                    ? "bg-rose-500"
                    : percentage > 50
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
