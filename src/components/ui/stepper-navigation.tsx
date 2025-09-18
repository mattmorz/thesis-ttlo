"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  isDisabled?: boolean;
}

export function StepperNavigation({ 
  steps, 
  currentStep, 
  onStepClick 
}: {
  steps: Step[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
}) {
  return (
    <div className="relative mb-8">
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted-foreground/20" />
      <ol className="relative z-10 flex justify-between">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick(step.id)}
              disabled={step.isDisabled}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                step.isCompleted ? "bg-primary" : "bg-muted",
                step.isActive && "ring-2 ring-offset-2 ring-primary",
                step.isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {step.isCompleted ? (
                <Check className="h-4 w-4 text-primary-foreground" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>
            <span className={cn(
              "ml-2 text-sm font-medium",
              step.isDisabled && "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
} 