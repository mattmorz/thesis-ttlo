import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { toast } from "sonner";
import { useFormContext } from "../context/form-context";
import { useState } from "react";

// Add types for submission progress
interface SubmissionProgress {
  step: number;
  total: number;
  message: string;
  isComplete: boolean;
}

interface FormNavigationProps {
  showNext?: boolean;
  showPrevious?: boolean;
  showSubmit?: boolean;
  showSave?: boolean;
  isNextDisabled?: boolean;
  isSubmitDisabled?: boolean;
  isPreviousDisabled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  onSubmitAttempt?: () => void;
  currentTab?: string;
  isSubmitting?: boolean;
  submissionProgress?: SubmissionProgress;
  isSaving?: boolean;
}

export function FormNavigation({
  showNext = false,
  showPrevious = false,
  showSubmit = false,
  showSave = true,
  isNextDisabled = false,
  isSubmitDisabled = false,
  isPreviousDisabled = false,
  onPrevious,
  onNext,
  onSave,
  onSubmitAttempt,
  currentTab,
  isSubmitting = false,
  submissionProgress,
  isSaving = false,
}: FormNavigationProps) {
  const { setActiveTab } = useIpDisclosureStore();
  const { selectedIpTypes } = useFormContext();
  const [saveRetries, setSaveRetries] = useState(0);
  const MAX_SAVE_RETRIES = 2;

  const handlePrevious = () => {
    console.log("FormNavigation: Previous button clicked");
    if (onPrevious) {
      console.log("FormNavigation: Calling onPrevious handler");
      onPrevious();
      // Log current tab after navigation
      setTimeout(() => {
        console.log(
          "FormNavigation: Current tab after navigation:",
          currentTab
        );
      }, 200);
    }
  };

  const handleSave = async () => {
    console.log("FormNavigation: Save button clicked");
    if (!onSave) return;

    try {
      // Wait for the save operation to complete
      await onSave();
    } catch (error) {
      console.error("Error during save operation:", error);
      toast.error("Failed to save data");
    }
  };

  const handleNext = () => {
    console.log("FormNavigation: Next button clicked");
    if (onNext) {
      console.log("FormNavigation: Calling onNext handler");
      onNext();
      // Log current tab after navigation
      setTimeout(() => {
        console.log(
          "FormNavigation: Current tab after navigation:",
          currentTab
        );
      }, 200);
    }
  };

  const handleSubmit = () => {
    console.log("FormNavigation: Submit button clicked");
    if (onSubmitAttempt) {
      console.log("FormNavigation: Calling onSubmitAttempt handler");
      onSubmitAttempt();
    }
  };

  return (
    <>
      <Separator className="my-6" />
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          {showPrevious && currentTab !== "applicants-info" && (
            <Button
              variant="secondary"
              type="button"
              onClick={handlePrevious}
              className="bg-green-50 text-green-700 hover:bg-green-100"
              disabled={isPreviousDisabled || isSubmitting}
            >
              Previous
            </Button>
          )}

          {/* Show submission progress when submitting */}
          {isSubmitting && submissionProgress && (
            <div className="flex items-center ml-4">
              <p className="text-sm font-medium text-slate-700">
                {submissionProgress.message} ({submissionProgress.step}/
                {submissionProgress.total})
              </p>
            </div>
          )}

          {showSave && (
            <Button
              variant="outline"
              type="button"
              onClick={handleSave}
              className="border-green-200 text-green-700 hover:bg-green-50"
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-t-transparent border-green-600 rounded-full animate-spin"></span>
                  Saving...
                </span>
              ) : (
                "Update"
              )}
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          {showNext && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled || isSaving || isSubmitting}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              Next
            </Button>
          )}

          {showSubmit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                disabled={isSubmitDisabled || isSubmitting}
                className="bg-green-700 text-white hover:bg-green-800"
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                ) : (
                  "Submit Form"
                )}
              </Button>
              {isSubmitDisabled && !isSubmitting && (
                <span className="inline-flex items-center text-sm text-amber-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Declaration required
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
