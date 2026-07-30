"use client";

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
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

  // Trigger Sonner toast notification whenever form errors occur (Toast is sufficient)
  useEffect(() => {
    if (errorList.length > 0) {
      toast.error("Please fill in required details", {
        description: `${errorList.slice(0, 3).join("; ")}${
          errorList.length > 3 ? "..." : ""
        }`,
        id: "form-validation-toast-id",
        duration: 5000,
      });
    }
  }, [errorList.length]);

  // If there are only validation errors (or no warning/success messages), return null since toast handles error feedback
  if (!warningMessage && !successMessage) {
    return null;
  }

  return (
    <div className="space-y-3 my-3">
      {/* Warning Alert Banner */}
      {warningMessage && errorList.length === 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm py-2 px-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <div className="ml-2">
            <AlertTitle className="text-xs font-semibold text-amber-800">Attention Required</AlertTitle>
            <AlertDescription className="text-[11px] text-amber-700 mt-0.5">
              {warningMessage}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Success Message Banner */}
      {successMessage && errorList.length === 0 && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm flex items-center justify-between py-2 px-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div>
              <AlertTitle className="text-xs font-semibold text-emerald-800">Section Complete</AlertTitle>
              <AlertDescription className="text-[11px] text-emerald-700">
                {successMessage}
              </AlertDescription>
            </div>
          </div>
          {onDismissSuccess && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-emerald-700 hover:bg-emerald-100"
              onClick={onDismissSuccess}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </Alert>
      )}
    </div>
  );
}
