"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface FormProgressTrackerProps {
  applicationId: string | undefined | null;
  refreshInterval?: number;
}

export function FormProgressTracker({
  applicationId,
  refreshInterval = 60000, // Increase default refresh interval to 60 seconds
}: FormProgressTrackerProps) {
  // Local state for form status
  const [formStatus, setFormStatus] = useState({
    clientProfile: false,
    ipDisclosure: false,
    substantialUse: false,
    deedAssignment: false,
    applicationTitle: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number>(0);
  const [isCheckingProgress, setIsCheckingProgress] = useState(false);

  // Function to check form progress from the registry
  const checkFormProgress = async () => {
    if (!applicationId) {
      setError("No application ID provided");
      setLoading(false);
      return;
    }

    // Prevent concurrent checks
    if (isCheckingProgress) {
      return;
    }

    try {
      // Set a minimum interval between checks to avoid excessive API calls
      const now = Date.now();
      if (now - lastChecked < 10000 && lastChecked !== 0) {
        return; // Skip if checked within the last 10 seconds
      }

      setIsCheckingProgress(true);
      setLoading(true);
      console.log(`Checking form progress for application: ${applicationId}`);

      // Call our dedicated API endpoint
      const response = await fetch(
        `/api/form-progress?applicationId=${applicationId}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Unknown error");
      }

      // Update form status state
      setFormStatus({
        clientProfile: Boolean(result.data.clientProfile),
        ipDisclosure: Boolean(result.data.ipDisclosure),
        substantialUse: Boolean(result.data.substantialUse),
        deedAssignment: Boolean(result.data.deedAssignment),
        applicationTitle: Boolean(result.data.applicationTitle),
      });

      // Update DOM directly for immediate feedback
      updateDOMFormProgress(result.data);

      setLastChecked(now);
      setError(null);
    } catch (err) {
      console.error("Error checking form progress:", err);
      setError("Could not check form progress");
    } finally {
      setLoading(false);
      setIsCheckingProgress(false);
    }
  };

  // Helper to update DOM elements directly
  const updateDOMFormProgress = (status: any) => {
    try {
      // Calculate completed forms count
      const completedCount = Object.values(status).filter(Boolean).length;

      // Update counter elements
      const counterElements = document.querySelectorAll(
        ".form-progress-counter"
      );
      if (counterElements && counterElements.length > 0) {
        counterElements.forEach((el) => {
          el.textContent = `${completedCount} of 5 completed`;
        });
      }

      // Update status dots
      const updateFormDot = (formType: string, isCompleted: boolean) => {
        const formDot = document.querySelector(`.form-status-dot-${formType}`);
        if (formDot) {
          if (isCompleted) {
            formDot.classList.remove("bg-gray-200");
            formDot.classList.add("bg-[#1B5E20]");
          } else {
            formDot.classList.remove("bg-[#1B5E20]");
            formDot.classList.add("bg-gray-200");
          }
        }

        const formLabel = document.querySelector(
          `.form-status-label-${formType}`
        );
        if (formLabel) {
          if (isCompleted) {
            formLabel.classList.remove("text-gray-500");
            formLabel.classList.add("text-gray-800", "font-medium");
          } else {
            formLabel.classList.remove("text-gray-800", "font-medium");
            formLabel.classList.add("text-gray-500");
          }
        }
      };

      // Update each form indicator
      updateFormDot("client-profile", status.clientProfile);
      updateFormDot("application-title", status.applicationTitle);
      updateFormDot("ip-disclosure", status.ipDisclosure);
      updateFormDot("substantial-use", status.substantialUse);
      updateFormDot("deed-assignment", status.deedAssignment);
    } catch (err) {
      console.error("Error updating DOM for form progress:", err);
    }
  };

  // Check form progress when applicationId changes or on initial mount
  useEffect(() => {
    if (!applicationId) return;

    let isMounted = true;

    // Use a timeout to prevent multiple rapid calls when component mounts
    const initialCheckTimeout = setTimeout(() => {
      if (isMounted) {
        checkFormProgress();
      }
    }, 300);

    // Set up periodic checks with a more reasonable interval
    const intervalId = setInterval(() => {
      if (isMounted) {
        checkFormProgress();
      }
    }, refreshInterval);

    // Clean up interval and timeout on unmount or when applicationId changes
    return () => {
      isMounted = false;
      clearInterval(intervalId);
      clearTimeout(initialCheckTimeout);
    };
  }, [applicationId]);

  // Listen for form completion events for real-time updates
  useEffect(() => {
    const handleFormUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        formType: string;
        completed: boolean;
        applicationId?: string;
      }>;
      
      // Ensure the event is for the current application
      if (customEvent.detail.applicationId && customEvent.detail.applicationId !== applicationId) {
        return;
      }

      const { formType, completed } = customEvent.detail;

      if (formType in formStatus) {
        setFormStatus((prevStatus) => {
          if ((prevStatus as Record<string, boolean>)[formType] !== completed) {
            console.log(`Real-time update for ${formType}: ${completed}`);
            return { ...prevStatus, [formType]: completed };
          }
          return prevStatus;
        });
        
        // Also update the DOM immediately
        updateDOMFormProgress({ ...formStatus, [formType]: completed });
      }
    };

    window.addEventListener("form_completed", handleFormUpdate);
    window.addEventListener("clientProfileFormCompleted", handleFormUpdate);

    // Cleanup
    return () => {
      window.removeEventListener("form_completed", handleFormUpdate);
      window.removeEventListener("clientProfileFormCompleted", handleFormUpdate);
    };
  }, [applicationId, formStatus]);

  // Calculate completed forms count
  const completedCount = Object.values(formStatus).filter(Boolean).length;

  // Render the progress UI
  return (
    <div className="border rounded-md p-3 bg-gray-50 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Form Progress</h4>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 form-progress-counter">
          {loading ? "..." : `${completedCount} of 5 completed`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          {
            id: "client-profile",
            label: "Client Profile",
            required: true,
            completed: formStatus.clientProfile,
          },
          {
            id: "application-title",
            label: <>Application <br /> Title</>,
            required: true,
            completed: formStatus.applicationTitle,
          },
          {
            id: "ip-disclosure",
            label: "IP Disclosure",
            required: true,
            completed: formStatus.ipDisclosure,
          },
          {
            id: "substantial-use",
            label: "Substantial Use",
            required: false,
            completed: formStatus.substantialUse,
          },
          {
            id: "deed-assignment",
            label: "Deed of Assignment",
            required: false,
            completed: formStatus.deedAssignment,
          },
        ].map((form) => (
          <div
            key={form.id}
            className="flex items-center gap-2"
            title={`${form.label} form status`}
          >
            <div
              className={`size-3.5 rounded-full ${
                form.completed ? "bg-[#1B5E20]" : "bg-gray-200"
              } form-status-dot-${form.id}`}
            ></div>
            <span
              className={`text-xs ${
                form.completed ? "text-gray-800 font-medium" : "text-gray-500"
              } form-status-label-${form.id}`}
            >
              {form.label}{" "}
              {form.required && (
                <span className="text-[#1B5E20] font-medium">*</span>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-gray-500 mt-2 flex flex-wrap items-center gap-1">
        <span className="text-[#1B5E20] font-medium">*</span> Required for
        submission
        <span className="mx-1">•</span>
        <span className="italic">
          Status automatically refreshes every {refreshInterval / 1000} seconds
        </span>
      </div>

      {/* Add legend for form status indicators */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-[#1B5E20]"></div>
            <span className="text-[10px] text-gray-600">Submitted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-gray-200"></div>
            <span className="text-[10px] text-gray-600">Not Submitted</span>
          </div>
        </div>
      </div>

      {error && <div className="mt-2 text-xs text-red-500">Error: {error}</div>}
    </div>
  );
}
