"use client";

import React, { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  // Extract error messages list cleanly in plain non-technical English
  const errorList: string[] = [];

  if (Array.isArray(errors)) {
    errors.forEach((err) => {
      if (typeof err === "string") {
        errorList.push(err);
      }
    });
  } else if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([key, err]: [string, any]) => {
      const fieldLabel = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      const rawMessage = err?.message || (typeof err === "string" ? err : "Please fill out this field");

      // Replace technical terms with clear plain language
      let cleanMsg = String(rawMessage)
        .replace(/Invalid input/i, "Please provide valid information")
        .replace(/Expected .*, received .*/i, "Please check the value entered")
        .replace(/Required/i, "is required");

      if (!cleanMsg.toLowerCase().includes(fieldLabel.toLowerCase())) {
        cleanMsg = `${fieldLabel}: ${cleanMsg}`;
      }

      errorList.push(cleanMsg);
    });
  }

  // Trigger Sonner toast notification whenever form errors occur
  useEffect(() => {
    if (errorList.length > 0) {
      toast.error("Form Validation Required", {
        description: `Please review missing field(s): ${errorList.slice(0, 3).join("; ")}${
          errorList.length > 3 ? "..." : ""
        }`,
        id: "form-validation-toast-id",
        duration: 5000,
      });
    }
  }, [errorList.length]);

  return (
    <div className="space-y-3 my-4">
      {/* Error Warning Banner */}
      {errorList.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="ml-2">
            <AlertTitle className="text-sm font-semibold text-red-800">
              Please Check Required Fields ({errorList.length} item{errorList.length > 1 ? "s" : ""})
            </AlertTitle>
            <AlertDescription className="text-xs text-red-700 mt-1">
              Please complete the required details below to continue:
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
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
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
              <AlertTitle className="text-sm font-semibold text-emerald-800">Section Complete</AlertTitle>
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
