"use client";

import React, { useRef, useState } from "react";
import { FileText, Upload, CheckCircle2, XCircle, Trash2, Eye, AlertCircle, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FileItem {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status?: "uploaded" | "verified" | "rejected" | "pending";
  errorMessage?: string;
}

export interface FileUploadCardProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeBytes?: number; // default 10MB
  file?: FileItem | null;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUploadCard({
  label,
  description,
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  maxSizeBytes = 10 * 1024 * 1024,
  file,
  onFileSelect,
  onFileRemove,
  required = false,
  disabled = false,
  className,
}: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Inline validation
    if (selected.size > maxSizeBytes) {
      setInlineError(`File size exceeds limit (${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB)`);
      return;
    }

    setInlineError(null);
    onFileSelect(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-900 flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>

        {file?.status && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-semibold capitalize border",
              file.status === "verified"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : file.status === "rejected"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            )}
          >
            {file.status}
          </Badge>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
              <p className="text-[11px] text-slate-400">{formatSize(file.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {file.url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
              >
                <a href={file.url} target="_blank" rel="noreferrer">
                  <Eye className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}

            {!disabled && onFileRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors space-y-1.5",
            disabled
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
              : inlineError
              ? "border-rose-300 bg-rose-50/40 hover:bg-rose-50/70"
              : "border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30"
          )}
        >
          <Upload className="w-5 h-5 text-slate-400 mx-auto" />
          <p className="text-xs font-medium text-slate-700">
            Click to upload document <span className="text-slate-400 font-normal">({accept})</span>
          </p>
          <p className="text-[11px] text-slate-400">Max file size: {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB</p>
        </div>
      )}

      {inlineError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{inlineError}</span>
        </div>
      )}
    </div>
  );
}
