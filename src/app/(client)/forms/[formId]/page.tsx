"use client";

import { FormProvider } from "./_components/ipdisclosure/context/form-context";
import { PageContent } from "./_components/PageContent";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import PageContent with SSR disabled to prevent hydration issues
const DynamicPageContent = dynamic(
  () =>
    import("./_components/PageContent").then((mod) => ({
      default: mod.PageContent,
    })),
  { ssr: false }
);

export default function FormDetailPage() {
  const params = useParams();
  const formId = params?.formId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add event listeners for form changes - these will be handled by PageContent
  // We just need to pass the events through
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFormCompleted = (event: CustomEvent) => {
      const { formType, completed, applicationId } = event.detail;
      console.log(`[Page] Form ${formType} completed: ${completed}`);

      // Forward the event to PageContent using a standard DOM event
      window.dispatchEvent(
        new CustomEvent("formCompletionChange", {
          detail: { formType, completed, applicationId },
        })
      );

      // Execute any necessary side effects
      console.log(`[Page] ${formType} registration forwarded`);
    };

    // Add a visual-only update handler that doesn't trigger registry creation
    const handleVisualUpdate = (event: CustomEvent) => {
      const { formType, completed, applicationId } = event.detail;
      console.log(
        `[Page] Visual update for ${formType}: ${completed} (NO REGISTRY)`
      );

      // Forward the event
      window.dispatchEvent(
        new CustomEvent("formStatusVisualUpdate", {
          detail: { formType, completed, applicationId },
        })
      );
    };

    // Listen for specific form type completions
    const handleClientProfileCompleted = (event: CustomEvent) => {
      const { completed, applicationId } = event.detail;
      console.log(`[Page] Client Profile completed: ${completed}`);

      // Forward the event
      window.dispatchEvent(
        new CustomEvent("formCompletionChange", {
          detail: { formType: "clientProfile", completed, applicationId },
        })
      );

      // Execute any necessary side effects
      console.log(`[Page] Client Profile registration forwarded`);
    };

    // Add a visual-only update handler for client profile specifically
    const handleClientProfileVisualUpdate = (event: CustomEvent) => {
      const { completed, applicationId } = event.detail;
      console.log(
        `[Page] Client Profile visual update: ${completed} (NO REGISTRY)`
      );

      // Forward the event
      window.dispatchEvent(
        new CustomEvent("formStatusVisualUpdate", {
          detail: { formType: "clientProfile", completed, applicationId },
        })
      );
    };

    // Add event listeners
    window.addEventListener(
      "formCompletionChange",
      handleFormCompleted as EventListener
    );
    window.addEventListener(
      "formStatusVisualUpdate",
      handleVisualUpdate as EventListener
    );
    window.addEventListener(
      "clientProfileFormCompleted",
      handleClientProfileCompleted as EventListener
    );
    window.addEventListener(
      "clientProfileFormVisualUpdate",
      handleClientProfileVisualUpdate as EventListener
    );

    return () => {
      // Remove event listeners
      window.removeEventListener(
        "formCompletionChange",
        handleFormCompleted as EventListener
      );
      window.removeEventListener(
        "formStatusVisualUpdate",
        handleVisualUpdate as EventListener
      );
      window.removeEventListener(
        "clientProfileFormCompleted",
        handleClientProfileCompleted as EventListener
      );
      window.removeEventListener(
        "clientProfileFormVisualUpdate",
        handleClientProfileVisualUpdate as EventListener
      );
    };
  }, []);

  // If not mounted yet, show a simple loading indicator with matching structure
  if (!mounted) {
    return (
      <div suppressHydrationWarning className="container mx-auto py-6 px-4">
        <div className="animate-pulse bg-gray-100 h-16 w-full rounded-lg mb-6"></div>
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-100 h-64 w-full rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Use TRPCProvider and FormProvider for the client-side rendered component
  return (
    <TRPCProvider>
      <FormProvider>
        <DynamicPageContent />
      </FormProvider>
    </TRPCProvider>
  );
}
