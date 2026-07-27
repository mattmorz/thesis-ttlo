"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { FormTabs } from "./form-navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface FormStatusSectionProps {
  activeApplicationId: string | null;
  formStatusData: {
    clientProfile: boolean;
    ipDisclosure: boolean;
    substantialUse: boolean;
    deedAssignment: boolean;
  };
  handleTabChange: (tabId: string) => void;
}

/**
 * Form status section component that displays the completion status of each form
 * and provides buttons to navigate to incomplete forms
 */
export function FormStatusSection({
  activeApplicationId,
  formStatusData,
  handleTabChange,
}: FormStatusSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Check if all forms are completed
  const allFormsCompleted =
    formStatusData.clientProfile &&
    formStatusData.ipDisclosure &&
    formStatusData.substantialUse &&
    formStatusData.deedAssignment;

  // If no active application is selected, show a clear message for the user
  if (!activeApplicationId) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-md font-medium text-amber-800">
                No IP Applications Found
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {session?.user ? (
                  <>
                    You currently don't have any IP applications. Create your
                    first application to start filling out forms.
                  </>
                ) : (
                  <>
                    Welcome! As a new user, you'll need to create your first IP
                    application to get started.
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    const event = new CustomEvent("openCreateApplicationDialog");
                    window.dispatchEvent(event);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                  size="sm"
                >
                  Create New Application
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Status */}
      {allFormsCompleted ? (
        <div className="flex items-center gap-2.5 mb-2">
          <div className="size-6 rounded-full bg-emerald-50 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-emerald-700">
            All required forms completed
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 mb-2">
          <div className="size-6 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Please complete all required forms
          </p>
        </div>
      )}

      {/* Form Status Cards - Client Profile */}
      <div
        className={`border rounded-md p-3 ${
          formStatusData.clientProfile
            ? "border-l-2 border-l-emerald-500 bg-emerald-50/10"
            : "border-l-2 border-l-amber-400 bg-amber-50/10"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {formStatusData.clientProfile ? (
              <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
            ) : (
              <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
            )}
            <span className="text-sm font-medium">Client Profile</span>
          </div>
          {formStatusData.clientProfile ? (
            <span className="text-xs text-emerald-600 font-medium">
              Complete
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleTabChange(FormTabs.CLIENT_PROFILE)}
            >
              Complete Now
            </Button>
          )}
        </div>
      </div>

      {/* Form Status Cards - IP Disclosure */}
      <div
        className={`border rounded-md p-3 ${
          formStatusData.ipDisclosure
            ? "border-l-2 border-l-emerald-500 bg-emerald-50/10"
            : "border-l-2 border-l-amber-400 bg-amber-50/10"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {formStatusData.ipDisclosure ? (
              <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
            ) : (
              <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
            )}
            <span className="text-sm font-medium">IP Disclosure</span>
          </div>
          {formStatusData.ipDisclosure ? (
            <span className="text-xs text-emerald-600 font-medium">
              Complete
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleTabChange(FormTabs.IP_DISCLOSURE)}
            >
              Complete Now
            </Button>
          )}
        </div>
      </div>

      {/* Form Status Cards - Substantial Use */}
      <div
        className={`border rounded-md p-3 ${
          formStatusData.substantialUse
            ? "border-l-2 border-l-emerald-500 bg-emerald-50/10"
            : "border-l-2 border-l-amber-400 bg-amber-50/10"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {formStatusData.substantialUse ? (
              <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
            ) : (
              <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
            )}
            <span className="text-sm font-medium">Substantial Use</span>
          </div>
          {formStatusData.substantialUse ? (
            <span className="text-xs text-emerald-600 font-medium">
              Complete
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleTabChange(FormTabs.SUBSTANTIAL_USE)}
            >
              Complete Now
            </Button>
          )}
        </div>
      </div>

      {/* Form Status Cards - Deed of Assignment */}
      <div
        className={`border rounded-md p-3 ${
          formStatusData.deedAssignment
            ? "border-l-2 border-l-emerald-500 bg-emerald-50/10"
            : "border-l-2 border-l-amber-400 bg-amber-50/10"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {formStatusData.deedAssignment ? (
              <div className="size-5 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
            ) : (
              <div className="size-5 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 text-amber-600" />
              </div>
            )}
            <span className="text-sm font-medium">Deed of Assignment</span>
          </div>
          {formStatusData.deedAssignment ? (
            <span className="text-xs text-emerald-600 font-medium">
              Complete
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleTabChange(FormTabs.DEED_ASSIGNMENT)}
            >
              Complete Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
