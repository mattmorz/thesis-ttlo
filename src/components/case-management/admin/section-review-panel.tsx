"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertTriangle, Clock, MessageSquare, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { SectionCommentThread, CommentItem } from "../section-comment-thread";
import { cn } from "@/lib/utils";

export interface ReviewSectionItem {
  key: string;
  title: string;
  status: "approved" | "needs_revision" | "pending";
  comments?: CommentItem[];
  reviewerFeedback?: string;
}

export interface SectionReviewPanelProps {
  sections: ReviewSectionItem[];
  userRole?: "admin" | "ttlo_staff" | "client";
  onSectionStatusChange?: (sectionKey: string, newStatus: "approved" | "needs_revision" | "pending", feedback?: string) => void;
  onAddComment?: (sectionKey: string, content: string, isInternal: boolean) => void;
  className?: string;
}

export function SectionReviewPanel({
  sections,
  userRole = "ttlo_staff",
  onSectionStatusChange,
  onAddComment,
  className,
}: SectionReviewPanelProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(sections[0]?.key || null);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});

  const isStaff = userRole === "admin" || userRole === "ttlo_staff";

  const handleStatusClick = (key: string, status: "approved" | "needs_revision" | "pending") => {
    if (!onSectionStatusChange) return;
    const feedback = feedbackInput[key] || "";
    onSectionStatusChange(key, status, feedback);
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Section-by-Section Staff Review Panel
          </h3>
          <p className="text-xs text-slate-500">Inspect and approve logical sections independently</p>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
          {sections.filter((s) => s.status === "approved").length} / {sections.length} Approved
        </span>
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const isExpanded = expandedKey === section.key;
          const comments = section.comments || [];

          return (
            <div
              key={section.key}
              className={cn(
                "border rounded-xl transition-colors overflow-hidden",
                section.status === "approved"
                  ? "border-emerald-200 bg-emerald-50/20"
                  : section.status === "needs_revision"
                  ? "border-orange-200 bg-orange-50/20"
                  : "border-slate-200 bg-white"
              )}
            >
              {/* Header bar */}
              <div
                onClick={() => setExpandedKey(isExpanded ? null : section.key)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {section.status === "approved" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : section.status === "needs_revision" ? (
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="font-semibold text-xs text-slate-900">{section.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold uppercase border",
                      section.status === "approved"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : section.status === "needs_revision"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                    )}
                  >
                    {section.status.replace("_", " ")}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-100 bg-white space-y-4 text-xs">
                  {/* Review Action Controls for Staff */}
                  {isStaff && onSectionStatusChange && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <p className="font-semibold text-slate-800 text-[11px]">Staff Assessment & Approval:</p>
                      
                      <Textarea
                        placeholder={`Optional specific feedback for ${section.title}...`}
                        value={feedbackInput[section.key] || ""}
                        onChange={(e) =>
                          setFeedbackInput({ ...feedbackInput, [section.key]: e.target.value })
                        }
                        rows={2}
                        className="text-xs resize-none bg-white border-slate-200"
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleStatusClick(section.key, "approved")}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Section
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusClick(section.key, "needs_revision")}
                          className="h-7 text-xs border-orange-300 text-orange-800 hover:bg-orange-50 gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                          Request Revision
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Section Comments */}
                  {onAddComment && (
                    <SectionCommentThread
                      sectionTitle={section.title}
                      sectionKey={section.key}
                      comments={comments}
                      userRole={userRole}
                      onAddComment={onAddComment}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
