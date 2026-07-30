"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Lock, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface CommentItem {
  id: string;
  authorName: string;
  authorRole: "admin" | "ttlo_staff" | "client";
  authorImage?: string;
  content: string;
  createdAt: string;
  isInternalOnly?: boolean;
}

export interface SectionCommentThreadProps {
  sectionTitle: string;
  sectionKey: string;
  comments: CommentItem[];
  userRole?: "admin" | "ttlo_staff" | "client";
  onAddComment: (sectionKey: string, content: string, isInternalOnly: boolean) => void;
  className?: string;
}

export function SectionCommentThread({
  sectionTitle,
  sectionKey,
  comments,
  userRole = "client",
  onAddComment,
  className,
}: SectionCommentThreadProps) {
  const [newContent, setNewContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const isStaff = userRole === "admin" || userRole === "ttlo_staff";

  // Filter out internal comments for applicant users
  const visibleComments = comments.filter((c) => !c.isInternalOnly || isStaff);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddComment(sectionKey, newContent.trim(), isInternal && isStaff);
    setNewContent("");
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-semibold text-slate-900">Comments: {sectionTitle}</h4>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {visibleComments.length} {visibleComments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* List of comments */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {visibleComments.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No comments attached to this section yet.</p>
        ) : (
          visibleComments.map((comment) => {
            const initials = comment.authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={comment.id}
                className={cn(
                  "p-3 rounded-lg border text-xs space-y-1.5 transition-colors",
                  comment.isInternalOnly
                    ? "bg-purple-50/70 border-purple-200"
                    : comment.authorRole !== "client"
                    ? "bg-slate-50 border-slate-200"
                    : "bg-emerald-50/40 border-emerald-100"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={comment.authorImage} />
                      <AvatarFallback className="text-[9px] bg-slate-200 text-slate-700">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-slate-900">{comment.authorName}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize border-slate-200">
                      {comment.authorRole.replace("_", " ")}
                    </Badge>

                    {comment.isInternalOnly && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Internal Note
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed pl-7">{comment.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-100">
        <Textarea
          placeholder={
            isInternal && isStaff
              ? "Write internal staff note (hidden from applicant)..."
              : `Add a comment regarding ${sectionTitle}...`
          }
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={2}
          className="text-xs resize-none border-slate-200 focus:border-emerald-500"
        />

        <div className="flex items-center justify-between">
          {isStaff ? (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
              />
              <Lock className="w-3 h-3 text-purple-600" />
              <span className="text-[11px] font-medium">Internal Note (Staff only)</span>
            </label>
          ) : (
            <div />
          )}

          <Button
            type="submit"
            disabled={!newContent.trim()}
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs text-white",
              isInternal && isStaff ? "bg-purple-700 hover:bg-purple-800" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Comment</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
