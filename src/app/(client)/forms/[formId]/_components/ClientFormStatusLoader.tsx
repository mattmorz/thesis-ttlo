"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FormStatusSkeleton } from "./FormStatusSkeleton";

// Dynamically import the client-side component with SSR disabled
const DynamicFormStatusSection = dynamic(
  () => import("./FormStatusSection").then((mod) => mod.FormStatusSection),
  {
    ssr: false,
    loading: () => <FormStatusSkeleton />,
  }
);

interface ClientFormStatusLoaderProps {
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
 * Client-side only wrapper component that handles loading the form status section
 * with proper client-side hydration to prevent SSR hydration errors
 */
export function ClientFormStatusLoader({
  activeApplicationId,
  formStatusData,
  handleTabChange,
}: ClientFormStatusLoaderProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Only show the component after client-side hydration is complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR or before hydration is complete, render the skeleton
  if (!isMounted) {
    return <FormStatusSkeleton />;
  }

  // Once mounted on the client, render the dynamic component
  return (
    <DynamicFormStatusSection
      activeApplicationId={activeApplicationId}
      formStatusData={formStatusData}
      handleTabChange={handleTabChange}
    />
  );
}
