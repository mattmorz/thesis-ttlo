"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FormValidationAlertProps {
  errors?: Record<string, any> | string[];
  warningMessage?: string | null;
  successMessage?: string | null;
  onDismissSuccess?: () => void;
  className?: string;
}

export function FormValidationAlert({
  errors,
  warningMessage,
  successMessage,
  onDismissSuccess,
  className,
}: FormValidationAlertProps) {
  // Extract error messages list
  const errorList: string[] = [];
  if (Array.isArray(errors)) {
    errorList.push(...errors);
  } else if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([key, err]: [string, any]) => {
      if (err?.message) {
        errorList.push(`${key}: ${err.message}`);
      } else if (typeof err === "string") {
        errorList.push(err);
      }
    });
  }

  return (
    <div className="space-y-3 my-4">
      {/* Error Warning Banner */}
      {errorList.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="text-sm font-semibold text-red-800">
              Form Validation Error ({errorList.length} field{errorList.length > 1 ? "s" : ""})
            </AlertTitle>
            <AlertDescription className="text-xs text-red-700 mt-1">
              Please fix the following issues before saving or proceeding:
              <ul className="list-disc list-inside mt-1.5 space-y-1 font-medium">
                {errorList.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Warning Alert Banner */}
      {warningMessage && errorList.length === 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="ml-2">
            <AlertTitle className="text-sm font-semibold text-amber-800">Attention Required</AlertTitle>
            <AlertDescription className="text-xs text-amber-700 mt-0.5">
              {warningMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Success Message Banner */}
      {successMessage && errorList.length === 0 && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <AlertTitle className="text-sm font-semibold text-emerald-800">Success</AlertTitle>
              <AlertDescription className="text-xs text-emerald-700">
                {successMessage}
              </AlertDescription>
            </div>
          </div>
          {onDismissSuccess && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-emerald-700 hover:bg-emerald-100"
              onClick={onDismissSuccess}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </Alert>
      )}
    </div>
  );
}
