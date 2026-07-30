"use client";

import React from "react";
import {
  User,
  FileText,
  ClipboardCheck,
  FileSignature,
  Check,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormStatusState {
  clientProfile: boolean;
  ipDisclosure: boolean;
  substantialUse: boolean;
  deedAssignment: boolean;
}

interface FormStepperProps {
  activeForm: string;
  formStatus: FormStatusState;
  onSelectForm: (formId: string) => void;
  applicationId?: string | null;
  className?: string;
}

export interface StepItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
  statusKey: keyof FormStatusState;
  description: string;
}

export const FORM_STEPS: StepItem[] = [
  {
    id: "client-profile",
    label: "Client Profile",
    shortLabel: "Profile",
    icon: User,
    required: true,
    statusKey: "clientProfile",
    description: "Applicant personal & institutional information",
  },
  {
    id: "ip-disclosure",
    label: "IP Disclosure Form",
    shortLabel: "IP Disclosure",
    icon: FileText,
    required: true,
    statusKey: "ipDisclosure",
    description: "Details, claims & development timeline",
  },
  {
    id: "substantial-use",
    label: "Substantial Use",
    shortLabel: "Substantial Use",
    icon: ClipboardCheck,
    required: false,
    statusKey: "substantialUse",
    description: "Declaration of university resources used",
  },
  {
    id: "deed-assignment",
    label: "Deed of Assignment",
    shortLabel: "Deed Assignment",
    icon: FileSignature,
    required: false,
    statusKey: "deedAssignment",
    description: "Ownership transfer & formal authorization",
  },
];

export function FormStepper({
  activeForm,
  formStatus,
  onSelectForm,
  applicationId,
  className,
}: FormStepperProps) {
  const completedCount = FORM_STEPS.filter(
    (step) => formStatus[step.statusKey]
  ).length;

  const totalSteps = FORM_STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  const activeIndex = FORM_STEPS.findIndex((step) => step.id === activeForm);

  return (
    <div
      className={cn(
        "w-full bg-white border rounded-xl p-4 md:p-5 shadow-sm space-y-4",
        className
      )}
    >
      {/* Header section with progress score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-[#1B5E20]/10 flex items-center justify-center text-[#1B5E20]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight">
              Application Submission Workflow
            </h2>
            <p className="text-xs text-gray-500">
              Follow the guided steps below to complete your IP application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-500 font-medium block">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-[#1B5E20]">
              {completedCount} of {totalSteps} Forms Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-20 sm:w-28 bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
            <div
              className="bg-[#1B5E20] h-full transition-all duration-500 ease-in-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper items container */}
      <div className="relative pt-2">
        {/* Connecting progress line behind step icons (desktop) */}
        <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-0.5 bg-gray-200 -z-0">
          <div
            className="h-full bg-[#1B5E20] transition-all duration-500 ease-out"
            style={{
              width: `${
                activeIndex > 0
                  ? (activeIndex / (totalSteps - 1)) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-2 relative z-10">
          {FORM_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = Boolean(formStatus[step.statusKey]);
            const isActive = activeForm === step.id;
            const isDisabled = !applicationId;

            // Sequential Prerequisite check: Step is locked if ANY previous step is uncompleted
            const isLocked =
              idx > 0 &&
              FORM_STEPS.slice(0, idx).some(
                (prevStep) => !formStatus[prevStep.statusKey]
              );

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => !isDisabled && onSelectForm(step.id)}
                disabled={isDisabled}
                title={
                  isLocked
                    ? `Step locked: Please complete Step ${idx} (${FORM_STEPS[idx - 1].label}) first.`
                    : step.description
                }
                className={cn(
                  "group relative text-left p-3 rounded-lg border transition-all duration-200 flex flex-col justify-between",
                  isActive
                    ? "border-[#1B5E20] bg-[#1B5E20]/5 shadow-sm ring-1 ring-[#1B5E20]"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80"
                    : isLocked
                    ? "border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer"
                    : "border-gray-200 bg-white hover:bg-gray-50",
                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-white"
                )}
              >
                {/* Top bar with Step badge & Status Icon */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        isActive
                          ? "bg-[#1B5E20] text-white"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : isLocked
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      Step {idx + 1}
                    </span>
                    {step.required && (
                      <span
                        className="text-xs text-red-500 font-bold"
                        title="Required form"
                      >
                        *
                      </span>
                    )}
                  </div>

                  {/* Step node icon */}
                  <div
                    className={cn(
                      "size-7 rounded-full flex items-center justify-center transition-all",
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-sm"
                        : isActive
                        ? "bg-[#1B5E20] text-white ring-4 ring-[#1B5E20]/20"
                        : isLocked
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-gray-100 text-gray-500 border border-gray-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[3]" />
                    ) : isLocked ? (
                      <Lock className="size-3.5 text-amber-700" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </div>
                </div>

                {/* Step title and info */}
                <div>
                  <h3
                    className={cn(
                      "text-xs sm:text-sm font-semibold truncate",
                      isActive
                        ? "text-[#1B5E20]"
                        : isCompleted
                        ? "text-emerald-900"
                        : isLocked
                        ? "text-amber-900"
                        : "text-gray-800"
                    )}
                  >
                    {step.label}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Bottom status badge */}
                <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <Check className="size-3 text-emerald-600" /> Completed
                    </span>
                  ) : isActive ? (
                    <span className="font-semibold text-[#1B5E20] flex items-center gap-0.5">
                      Current Step <ChevronRight className="size-3" />
                    </span>
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                      <Lock className="size-3 text-amber-600" /> Locked (Step {idx} first)
                    </span>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
