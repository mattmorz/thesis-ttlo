"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusBadgeVariant } from "../case-header";
import { User, Building, FileText, Clock, Layers, DollarSign, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface QuickInfoData {
  id: string;
  title: string;
  applicantName: string;
  applicantEmail?: string;
  department?: string;
  ipType: string;
  status: string;
  inventors?: string[];
  fundingSource?: string;
  grantNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  documentsCount?: number;
  pendingTasksCount?: number;
}

export interface QuickInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuickInfoData | null;
}

export function QuickInfoDrawer({ isOpen, onClose, data }: QuickInfoDrawerProps) {
  if (!data) return null;

  const badge = getStatusBadgeVariant(data.status);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6">
        <SheetHeader className="text-left border-b border-slate-100 pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400">#{data.id.substring(0, 8).toUpperCase()}</span>
            <Badge variant="outline" className="capitalize text-xs bg-emerald-50 text-emerald-800 border-emerald-200">
              {data.ipType.replace(/_/g, " ")}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-bold text-slate-900 leading-snug">{data.title}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">Quick Case Information Preview</SheetDescription>
        </SheetHeader>

        {/* Current Status Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Current Stage Status:</span>
          <Badge variant="outline" className={`text-xs font-bold ${badge.className}`}>
            {badge.label}
          </Badge>
        </div>

        {/* Primary Applicant & Institution */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Applicant Details</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">{data.applicantName}</p>
                {data.applicantEmail && <p className="text-slate-500 text-[11px]">{data.applicantEmail}</p>}
              </div>
            </div>

            {data.department && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700">{data.department}</span>
              </div>
            )}
          </div>
        </div>

        {/* Inventors */}
        {data.inventors && data.inventors.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Inventors & Authors</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.inventors.map((inv, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-700">
                  {inv}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Funding Source */}
        {data.fundingSource && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Research Funding</h4>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{data.fundingSource}</span>
              {data.grantNumber && <span className="text-slate-400 font-mono text-[11px]">({data.grantNumber})</span>}
            </div>
          </div>
        )}

        {/* Stats Metrics */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-lg font-bold text-slate-900 block">{data.documentsCount ?? 0}</span>
            <span className="text-[11px] text-slate-500">Documents Uploaded</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-lg font-bold text-slate-900 block">{data.pendingTasksCount ?? 0}</span>
            <span className="text-[11px] text-slate-500">Pending Tasks</span>
          </div>
        </div>

        {/* Full Case Detail Link Button */}
        <div className="pt-4">
          <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
            <Link href={`/admin/projects/${data.id}`}>
              <span>Open Full Case Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
