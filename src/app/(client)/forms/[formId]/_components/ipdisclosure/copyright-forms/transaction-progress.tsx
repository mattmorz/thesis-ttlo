"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
}

const steps: Step[] = [
  { id: "transaction-details", label: "Transaction Details" },
  { id: "applicant-info", label: "Applicant Information" },
  { id: "additional-details", label: "Additional Details" },
];

interface TransactionProgressProps {
  currentStep: string;
  completedSteps: string[];
}

export function TransactionProgress({
  currentStep,
  completedSteps,
}: TransactionProgressProps) {
  return (
    <div className="flex items-center justify-center space-x-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2",
                currentStep === step.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : completedSteps.includes(step.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground"
              )}
            >
              {completedSteps.includes(step.id) ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            <span className="mt-2 text-sm font-medium">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="ml-4 h-[2px] w-16 bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}
