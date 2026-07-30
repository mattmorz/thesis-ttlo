"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, FileUp, UserCheck, MessageSquare, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  activityType: "update" | "status_change" | "comment" | "submission" | "approval" | "revision";
  createdAt: string;
  userAccount?: {
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export interface TimelineViewProps {
  events: TimelineEvent[];
  className?: string;
}

export function TimelineView({ events, className }: TimelineViewProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">No activity history available yet.</p>
      </div>
    );
  }

  const getEventIcon = (type: TimelineEvent["activityType"]) => {
    switch (type) {
      case "status_change":
        return <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />;
      case "approval":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "revision":
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600" />;
      case "comment":
        return <MessageSquare className="w-3.5 h-3.5 text-blue-600" />;
      case "submission":
        return <FileUp className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Clock className="w-4 h-4 text-emerald-600" />
        Audit Trail & Case History
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {events.map((evt) => {
          const authorName = evt.userAccount?.name || "System User";
          const initials = authorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const timeAgo = formatDistanceToNow(new Date(evt.createdAt), { addSuffix: true });

          return (
            <div key={evt.id} className="relative flex items-start gap-3 text-xs group">
              {/* Node Icon on Timeline Line */}
              <div className="absolute -left-[1.375rem] top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                {getEventIcon(evt.activityType)}
              </div>

              {/* Event Content Box */}
              <div className="flex-1 bg-slate-50/60 hover:bg-slate-50 border border-slate-200/80 rounded-lg p-3 transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{evt.title}</span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">{timeAgo}</span>
                </div>

                {evt.description && (
                  <p className="text-slate-600 text-xs leading-relaxed">{evt.description}</p>
                )}

                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={evt.userAccount?.image || undefined} />
                    <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-800">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-slate-700">{authorName}</span>
                  {evt.userAccount?.role && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize border-slate-200">
                      {evt.userAccount.role.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
