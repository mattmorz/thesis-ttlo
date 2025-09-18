"use client";

import { useState, useEffect } from "react";
import { FormTabs } from "./form-navigation";
import { ClientProfileForm } from "./clientProfile/client-profile-form";
import { IPDisclosureForm } from "./ipdisclosure/ip-disclosure-form";
import { SubstantialUseForm } from "./substantialuse/substantial-use-form";
import { DeedAssignmentForm } from "./deedofassignment/deed-assignment-form";
import { OtherDocumentsSection } from "./otherDocuments";
import { Button } from "@/components/ui/button";
import { TRPCProvider } from "@/components/providers/trpc-provider";

interface ClientOnlyContentProps {
  activeForm: string;
  showDocuments?: boolean;
  setShowDocuments?: (show: boolean) => void;
}

/**
 * Client-side only component for form content
 * This component ensures that form content only renders after client hydration is complete
 * to prevent hydration mismatches
 */
export function ClientOnlyContent({
  activeForm,
  showDocuments = false,
  setShowDocuments = () => {},
}: ClientOnlyContentProps) {
  const [mounted, setMounted] = useState(false);

  // Only show the component after client-side hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a simple placeholder during SSR and hydration
    return (
      <div
        className="min-h-[500px] bg-gray-50/30 rounded-md"
        suppressHydrationWarning
      ></div>
    );
  }

  // Handle documents section
  if (showDocuments) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Other Documents</h2>
          <Button variant="outline" onClick={() => setShowDocuments(false)}>
            Back to Forms
          </Button>
        </div>
        <OtherDocumentsSection />
      </div>
    );
  }

  // Render appropriate form content based on active form tab
  switch (activeForm) {
    case FormTabs.CLIENT_PROFILE:
      return <ClientProfileForm />;
    case FormTabs.IP_DISCLOSURE:
      return (
        <TRPCProvider>
          <IPDisclosureForm />
        </TRPCProvider>
      );
    case FormTabs.SUBSTANTIAL_USE:
      return <SubstantialUseForm />;
    case FormTabs.DEED_ASSIGNMENT:
      return <DeedAssignmentForm />;
    default:
      return <ClientProfileForm />;
  }
}
