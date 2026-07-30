"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeedAssignment } from "./deed-assignment";
import { RoyaltyAgreement } from "./royalty-agreement";
import { SignatorySection } from "./signatory-section";
import { TypographyMuted } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getFormPermissions, bypassPermissions } from "@/lib/auth/permissions";
import { toast } from "sonner";
import { useDeedAssignmentStore } from "@/lib/store/deed-assignment-store";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FormValidationAlert } from "../FormValidationAlert";

// Add window interface for updateIPFormStatus
declare global {
  interface Window {
    updateIPFormStatus?: (
      formType: string,
      completed: boolean,
      applicationId: string
    ) => void;
  }
}

// Define types for form data
interface Creator {
  firstName: string;
  middleInitial: string;
  lastName: string;
}

interface DeedData {
  researchTitle: string;
  creators: Creator[];
  creatorAddress: string;
  assigneeName: string;
  assigneeRepresentative: string;
}

interface SignatoryData {
  day: string;
  month: string;
  year: string;
  inventors: Creator[];
  assigneeId: string;
  assigneeDate: string;
  assigneePlace: string;
  assignorId: string;
  assignorDate: string;
  assignorPlace: string;
  docNumber: string;
  pageNumber: string;
  bookNumber: string;
  seriesYear: string;
  notarizedDocumentPath: string;
}

interface FormState {
  deed: DeedData | null;
  royalty: Record<string, any>;
  signatory: SignatoryData | null;
}

export function DeedAssignmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "deed";
  const { data: session } = useSession();
  const [formStatus, setFormStatus] = useState<
    "draft" | "submitted" | "approved" | "rejected" | "pending_revision"
  >("draft");
  const [isLoading, setIsLoading] = useState(true);

  // Get the active application ID
  const { activeApplicationId, clearFormData } = useActiveApplication();
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      toast.success("Deed of Assignment form submitted successfully");
    },
    onError: (error) => {
      toast.error(`Error submitting form: ${error.message}`);
    },
  });

  // Add refs to prevent race conditions
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const lastSuccessfulFetchRef = useRef<Record<string, number>>({});
  const notFoundCacheRef = useRef<Record<string, boolean>>({});

  // Use the store for state management
  const {
    deed,
    signatory,
    royalty,
    syncWithLocalStorage,
    updateDeedData,
    updateSignatoryData,
  } = useDeedAssignmentStore();

  // Ensure "deed" tab is shown by default when navigating directly to the form
  useEffect(() => {
    // If there's no specific tab in the URL but we're on the deed-assignment form tab
    // in the parent component, set the URL to include the default "deed" tab
    const parentTab = searchParams.get("tab");
    if (parentTab === "deed-assignment" && !searchParams.has("subTab")) {
      router.replace(`?tab=deed-assignment&subTab=deed`, { scroll: false });
    }
  }, [searchParams, router]);

  // Get the sub-tab parameter or use "deed" as default
  const subTab = searchParams.get("subTab") || "deed";

  // Determine if the user can edit the form
  const canEdit =
    bypassPermissions(session) ||
    getFormPermissions(session, formStatus).canEdit;

  // Listen for application switched events
  useEffect(() => {
    // Skip server-side rendering
    if (typeof window === "undefined") return;

    const handleApplicationSwitchedEvent = (e: CustomEvent) => {
      if (!isMountedRef.current) return;

      console.log("[Form] Application switched event received:", e.detail);

      // Clear localStorage data for deed assignment form
      localStorage.removeItem(
        `deedAssignmentData_${e.detail.previousApplicationId}`
      );
      localStorage.removeItem(
        `signatoryData_${e.detail.previousApplicationId}`
      );
      localStorage.removeItem(`royaltyData_${e.detail.previousApplicationId}`);

      // Clear not-found cache for the switched applications
      if (e.detail.previousApplicationId) {
        delete notFoundCacheRef.current[e.detail.previousApplicationId];
      }
      if (e.detail.applicationId) {
        delete notFoundCacheRef.current[e.detail.applicationId];
      }

      // Reset loading state
      setIsLoading(true);

      // Fetch data for the new application
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchData();
        }
      }, 500);
    };

    const handleFormDataClearedEvent = () => {
      if (!isMountedRef.current) return;
      console.log("[Form] Form data cleared event received");

      // Clear our localStorage data
      localStorage.removeItem(`deedAssignmentData_${activeApplicationId}`);
      localStorage.removeItem(`signatoryData_${activeApplicationId}`);
      localStorage.removeItem(`royaltyData_${activeApplicationId}`);

      // Reset not-found cache
      notFoundCacheRef.current = {};

      // Sync with clean localStorage
      syncWithLocalStorage();
    };

    // Register event listeners
    window.addEventListener(
      "application-switched",
      handleApplicationSwitchedEvent as EventListener
    );
    window.addEventListener(
      "formDataCleared",
      handleFormDataClearedEvent as EventListener
    );

    return () => {
      // Cleanup event listeners on unmount
      window.removeEventListener(
        "application-switched",
        handleApplicationSwitchedEvent as EventListener
      );
      window.removeEventListener(
        "formDataCleared",
        handleFormDataClearedEvent as EventListener
      );
    };
  }, [activeApplicationId, syncWithLocalStorage]);

  // Fetch data from API when component mounts or active application changes
  useEffect(() => {
    console.log("[Form] DeedAssignmentForm mounted or application changed");

    // Check if the user is authenticated and has an active application
    if (!session || !activeApplicationId) {
      console.log("[Form] No session or active application, waiting...");
      return;
    }

    console.log("[Form] Session and application found, fetching form data");
    fetchData();
  }, [session, activeApplicationId]);

  // Sync with localStorage on tab change
  useEffect(() => {
    syncWithLocalStorage();
  }, [subTab, syncWithLocalStorage, activeApplicationId]);

  // Check form registry status on mount
  useEffect(() => {
    const checkFormRegistry = async () => {
      if (!session?.user?.id || !activeApplicationId) return;

      try {
        // Only attempt to use getFormBySource if it exists
        if (typeof formSubmission.getFormBySource === "function") {
          // Check registry status silently without logging
          const registryStatus = await formSubmission
            .getFormBySource(
              "deed_of_assignment",
              activeApplicationId,
              activeApplicationId
            )
            .catch(() => {
              // Silently handle registry not found
              return null;
            });

          if (registryStatus) {
            // Update form status based on registry if needed
            const status = registryStatus.status as string;
            if (
              (formStatus === "draft" || !formStatus) &&
              (status === "submitted" || status === "approved")
            ) {
              setFormStatus(status as "submitted" | "approved");

              // Update form status in parent application
              if (window.updateIPFormStatus) {
                window.updateIPFormStatus(
                  "deedOfAssignment",
                  true,
                  activeApplicationId
                );
              }
            }
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    };

    checkFormRegistry();
  }, [session, activeApplicationId, formStatus, formSubmission]);

  const fetchData = async () => {
    // Skip if already fetching or component is not mounted
    if (isFetchingRef.current || !isMountedRef.current) {
      console.log("[Form] Skipping fetch - already fetching or unmounted");
      return;
    }

    // Skip if no active application
    if (!activeApplicationId) {
      console.log("[Form] Skipping fetch - no active application");
      setIsLoading(false);
      return;
    }

    // Check if we've already found there's no data for this application
    if (notFoundCacheRef.current[activeApplicationId]) {
      console.log("[Form] Skipping fetch - cached 404 for this application");
      setIsLoading(false);
      syncWithLocalStorage();
      return;
    }

    // Check if we've fetched data recently for this application
    const lastFetchTime = lastSuccessfulFetchRef.current[activeApplicationId];
    const now = Date.now();
    if (lastFetchTime && now - lastFetchTime < 5000) {
      // 5 seconds cache
      console.log("[Form] Skipping fetch - data recently loaded");
      setIsLoading(false);
      return;
    }

    try {
      console.log("[Form] Starting to fetch deed of assignment data");
      setIsLoading(true);
      isFetchingRef.current = true;

      // Generate a unique request ID for this fetch to handle race conditions
      const fetchId = Date.now().toString();

      const response = await fetch(
        `/api/deed-of-assignment?applicationId=${activeApplicationId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            "X-Fetch-ID": fetchId,
          },
        }
      );

      // Skip processing if component unmounted during fetch
      if (!isMountedRef.current) {
        console.log("[Form] Component unmounted during fetch, aborting");
        return;
      }

      console.log("[Form] API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Form] Deed of assignment data received");

        // Record successful fetch time
        lastSuccessfulFetchRef.current[activeApplicationId] = Date.now();

        if (data && data.data) {
          console.log("[Form] Formatting API data to match form schema");
          const apiData = data.data;

          // Format API data to match form schema
          const deedData = {
            researchTitle: apiData.researchTitle || "",
            creators: apiData.creators || [
              {
                firstName: "",
                middleInitial: "",
                lastName: "",
              },
            ],
            creatorAddress: apiData.creatorAddress || "",
            assigneeName: apiData.assigneeName || "CARAGA STATE UNIVERSITY",
            assigneeRepresentative:
              apiData.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
          };

          // Format signatory data
          const signatoryData = {
            day: apiData.day || "",
            month: apiData.month || "",
            year: apiData.year || "",
            inventors: apiData.inventors || [
              {
                firstName: "",
                middleInitial: "",
                lastName: "",
              },
            ],
            assigneeId: apiData.assigneeId || "M98 – 009",
            assigneeDate: apiData.assigneeDate || "",
            assigneePlace: apiData.assigneePlace || "Butuan City",
            assignorId: apiData.assignorId || "",
            assignorDate: apiData.assignorDate || "",
            assignorPlace: apiData.assignorPlace || "Butuan City",
            docNumber: apiData.docNumber || "",
            pageNumber: apiData.pageNumber || "",
            bookNumber: apiData.bookNumber || "",
            seriesYear: apiData.seriesYear || "",
            notarizedDocumentPath: apiData.notarizedDocumentPath || "",
          };

          // Save formatted data to localStorage with application-specific keys
          localStorage.setItem(
            `deedAssignmentData_${activeApplicationId}`,
            JSON.stringify(deedData)
          );
          localStorage.setItem(
            `signatoryData_${activeApplicationId}`,
            JSON.stringify(signatoryData)
          );

          // Update store state
          updateDeedData(deedData);
          updateSignatoryData(signatoryData);

          // Set form status
          setFormStatus(apiData.status || "draft");
          console.log("[Form] Form status set to:", apiData.status || "draft");
        }

        // Check form registry status if API fetch was successful
        if (session?.user?.id && activeApplicationId) {
          try {
            // Only attempt to use getFormBySource if it exists
            if (typeof formSubmission.getFormBySource === "function") {
              // Silently check form registry status
              const registryStatus = await formSubmission
                .getFormBySource(
                  "deed_of_assignment",
                  activeApplicationId,
                  activeApplicationId
                )
                .catch(() => {
                  // Silently handle registry not found
                  return null;
                });

              if (registryStatus) {
                // If the registry shows the form is submitted/approved, update the form status
                const status = registryStatus.status as string;
                if (status === "submitted" || status === "approved") {
                  setFormStatus(status as "submitted" | "approved");
                }
              }
            }
          } catch (regError) {
            // Non-critical error, don't disrupt the flow
          }
        }
      } else if (response.status === 404) {
        console.log("[Form] No deed of assignment found for this application");

        // Create empty template data structures to avoid errors
        const emptyDeedData = {
          researchTitle: "",
          creators: [
            {
              firstName: "",
              middleInitial: "",
              lastName: "",
            },
          ],
          creatorAddress: "",
          assigneeName: "CARAGA STATE UNIVERSITY",
          assigneeRepresentative: "ROLYN C. DAGUIL, Ph.D.",
        };

        const emptySignatoryData = {
          day: "",
          month: "",
          year: "",
          inventors: [
            {
              firstName: "",
              middleInitial: "",
              lastName: "",
            },
          ],
          assigneeId: "M98 – 009",
          assigneeDate: "",
          assigneePlace: "Butuan City",
          assignorId: "",
          assignorDate: "",
          assignorPlace: "Butuan City",
          docNumber: "",
          pageNumber: "",
          bookNumber: "",
          seriesYear: "",
          notarizedDocumentPath: "",
        };

        // Save empty template data to localStorage with application-specific keys
        localStorage.setItem(
          `deedAssignmentData_${activeApplicationId}`,
          JSON.stringify(emptyDeedData)
        );
        localStorage.setItem(
          `signatoryData_${activeApplicationId}`,
          JSON.stringify(emptySignatoryData)
        );

        // Update store state with empty templates
        updateDeedData(emptyDeedData);
        updateSignatoryData(emptySignatoryData);

        // Cache the not-found status for this application
        notFoundCacheRef.current[activeApplicationId] = true;

        // Set form status to draft
        setFormStatus("draft");
      } else {
        console.error("[Form] Error fetching data:", response.status);
        toast.error("Could not load your saved data. Please try again later.");
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error("[Form] Error fetching data:", err);
      toast.error("Unable to load your form data. Starting with a blank form.");
      // Try to load from localStorage if API fetch fails
      syncWithLocalStorage();
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    }
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    console.log("[Form] Tab changed to:", value);
    // Preserve the main tab while changing the sub-tab
    const mainTab = searchParams.get("tab") || "deed-assignment";
    router.push(`?tab=${mainTab}&subTab=${value}`, { scroll: false });

    // Ensure data is in sync when changing tabs
    syncWithLocalStorage();
  };

  // Determine if form is disabled based on permissions and status
  const isFormDisabled = !canEdit;

  if (isLoading) {
    return (
      <div className="p-8 text-center">Loading deed of assignment data...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Deed of Assignment
        </h2>
        <TypographyMuted>
          Complete the deed of assignment form and related documents.
        </TypographyMuted>
      </div>
      <Separator className="my-4" />

      {/* Form Validation & Warning Alert */}
      <FormValidationAlert
        warningMessage={
          !activeApplicationId
            ? "No active IP application selected. Please select an application to save deed assignment details."
            : null
        }
      />

      {/* HCI Sub-stepper Bar */}
      <div className="bg-slate-50 border rounded-lg p-3 mb-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {[
            { id: "deed", label: "1. Deed Details", desc: "Assignor, assignee & research info" },
            { id: "royalty", label: "2. Royalty Agreement", desc: "Commercialization & revenue terms" },
            { id: "signatory", label: "3. Signatory Section", desc: "Dates, notary & authorization" },
          ].map((step) => {
            const isActive = subTab === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleTabChange(step.id)}
                className={cn(
                  "flex-1 text-left px-3 py-2 rounded-md transition-all text-xs border",
                  isActive
                    ? "bg-white border-[#1B5E20] text-[#1B5E20] font-semibold shadow-sm ring-1 ring-[#1B5E20]"
                    : "border-transparent text-gray-600 hover:bg-white/60"
                )}
              >
                <div className="font-semibold">{step.label}</div>
                <div className="text-[10px] text-gray-500 hidden sm:block mt-0.5">
                  {step.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Tabs
        defaultValue="deed"
        value={subTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="flex w-full bg-muted/10 p-1 rounded-none border-b justify-start">
          <TabsTrigger
            value="deed"
            className="relative px-6 py-2.5 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Deed Details
          </TabsTrigger>
          <TabsTrigger
            value="royalty"
            className="relative px-6 py-2.5 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Royalty Agreement
          </TabsTrigger>
          <TabsTrigger
            value="signatory"
            className="relative px-6 py-2.5 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Signatory Section
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deed" className="mt-6 space-y-6">
          <DeedAssignment
            initialData={deed}
            isDisabled={isFormDisabled}
            formStatus={formStatus}
            useStore={true}
          />
        </TabsContent>

        <TabsContent value="royalty" className="mt-6 space-y-6">
          <RoyaltyAgreement isDisabled={isFormDisabled} />
        </TabsContent>

        <TabsContent value="signatory" className="mt-6 space-y-6">
          <SignatorySection
            initialData={signatory}
            isDisabled={isFormDisabled}
            formStatus={formStatus}
            useStore={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
