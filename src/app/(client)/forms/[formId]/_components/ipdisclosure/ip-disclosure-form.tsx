"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ApplicantsInformation } from "./applicants-information";
import { CopyrightApplication } from "./copyright-forms/copyright-application";
import { PatentApplication } from "./patentum-forms/patentum-application";
import { MatrixSampleForm } from "./patentum-forms/matrix-form";
import { TrademarkApplication } from "./trademark-application/trademark-application";
import { TradeSecret } from "./trade-secret/trade-secret";
import { DisclosureConfirmation } from "./disclosure-confirmation";
import { useFormContext } from "./context/form-context";
import {
  useHydratedIpDisclosureStore,
  useIpDisclosureStore,
} from "@/lib/store/ip-disclosure-store";
import type { IpTypes } from "@/lib/store/ip-disclosure-store";
import { PatentSearchForm } from "./patentum-forms/patent-search-form";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, PlusCircle } from "lucide-react";
import { useIpDisclosure } from "./hooks/use-ip-disclosure";
import { useApplicationIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-application-ip-disclosure";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookmarkCheck,
  Bookmark,
  FileType
} from "lucide-react";
import {
  areIpTypesEqual,
  deriveIpTypesFromApplicationIpType,
  hasSelectedIpTypes,
  normalizeIpTypes,
} from "./utils/ip-type";

// Global logging control
const DEBUG = false;

const tabs = [
  {
    id: "applicants-information",
    label: "Applicant's Information",
    component: ApplicantsInformation,
    icon: FileType,
  },
  {
    id: "patent-application",
    label: "Patent/UM Application",
    component: PatentApplication,
    icon: Sparkles,
    showIf: (types: IpTypes) => types.patent || types.utilityModel,
  },
  {
    id: "matrix-sample",
    label: "Matrix Sample",
    component: MatrixSampleForm,
     icon: Sparkles,
    showIf: (types: IpTypes) => types.patent || types.utilityModel,
  },
  {
    id: "patent-search",
    label: "Patent Search Report",
    component: PatentSearchForm,
    icon: Sparkles,
    showIf: (types: IpTypes) => types.patent || types.utilityModel,
  },
  {
    id: "copyright-application",
    label: "Copyright Application",
    component: CopyrightApplication,
    icon: BookmarkCheck,
    showIf: (types: IpTypes) => types.copyright,
  },
  {
    id: "trademark",
    label: "Trademark Application",
    component: TrademarkApplication,
    icon: Bookmark,
    showIf: (types: IpTypes) => types.trademark,
  },
  {
    id: "trade-secret",
    label: "Trade Secret",
    component: TradeSecret,
    icon: FileType,
    showIf: (types: IpTypes) => types.tradeSecret,
  },
  {
    id: "confirmation",
    label: "Disclosure and Confirmation",
    component: DisclosureConfirmation,
    icon: FileType,
  },
];

export function IPDisclosureForm() {
  const getIpTypeStorageKey = (applicationId: string) =>
    `application-selected-ip-types-${applicationId}`;
  const {
    selectedIpTypes,
    setSelectedIpTypes,
    isHydrated: formContextHydrated,
  } = useFormContext();
  const { activeTab, setActiveTab, visibleTabs, clearLocalStorage } =
    useHydratedIpDisclosureStore();
  const {
    applicantsInfo,
    copyrightApplication,
    patentUtilityModelApplication,
    trademarkApplication,
    tradeSecretApplication,
    disclosureConfirmation,
  } = useIpDisclosureStore();
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const ipDisclosure = useIpDisclosure();
  const [checkedForExisting, setCheckedForExisting] = useState(false);
  const { disclosureId, isHydrated: storeHydrated } =
    useHydratedIpDisclosureStore();
  const router = useRouter();

  // Use our new hook for application integration
  const {
    activeApplicationId,
    activeApplication,
    isLoading: isLoadingApplication,
    refreshData,
  } = useApplicationIpDisclosure();

  const localStorageIpTypes = useMemo(() => {
    if (!activeApplicationId || typeof window === "undefined") {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(
        getIpTypeStorageKey(activeApplicationId)
      );
      if (!raw) return null;
      return normalizeIpTypes(JSON.parse(raw));
    } catch (error) {
      console.error("Failed to parse stored application IP types:", error);
      return null;
    }
  }, [activeApplicationId]);

  const derivedIpTypes = useMemo(
    () => {
      if (activeApplication?.selectedIpTypes) {
        const normalizedFromApp = normalizeIpTypes(activeApplication.selectedIpTypes);
        // Some endpoints may return jsonb as a JSON string or otherwise malformed shape.
        // Only trust the application value if it actually contains selected flags.
        if (hasSelectedIpTypes(normalizedFromApp)) {
          return normalizedFromApp;
        }
      }
      if (hasSelectedIpTypes(localStorageIpTypes)) {
        return normalizeIpTypes(localStorageIpTypes);
      }

      return deriveIpTypesFromApplicationIpType(
        activeApplication?.ipType ?? undefined
      ).ipTypes;
    },
    [
      activeApplication?.ipType,
      activeApplication?.selectedIpTypes,
      localStorageIpTypes,
    ]
  );

  useEffect(() => {
    if (!formContextHydrated) return;
    if (hasSelectedIpTypes(applicantsInfo?.ipTypes)) {
      const nextTypes = normalizeIpTypes(applicantsInfo?.ipTypes);
      if (!areIpTypesEqual(selectedIpTypes, nextTypes)) {
        setSelectedIpTypes(nextTypes);
      }
      return;
    }
    if (hasSelectedIpTypes(selectedIpTypes)) return;
    if (hasSelectedIpTypes(derivedIpTypes)) {
      if (!areIpTypesEqual(selectedIpTypes, derivedIpTypes)) {
        setSelectedIpTypes(derivedIpTypes);
      }
    }
  }, [
    applicantsInfo?.ipTypes,
    derivedIpTypes,
    formContextHydrated,
    selectedIpTypes,
    setSelectedIpTypes,
  ]);

  // Add error handling
  useEffect(() => {
    // Wait for hydration
    if (!storeHydrated) {
      return;
    }

    // Set loading to false once hydrated
    setIsLoading(false);

    try {
      // Simple test: try to access localStorage
      window.localStorage.getItem("test");
    } catch (err) {
      console.error("Error accessing localStorage:", err);
      setError(true);
    }
  }, [storeHydrated]);

  // Add a function to clear local storage and refresh
  const handleClearStorageAndRefresh = useCallback(() => {
    try {
      clearLocalStorage();
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear storage:", err);
      // If that fails, try to clear directly
      try {
        localStorage.removeItem("ip-disclosure-storage");
        window.location.reload();
      } catch (e) {
        console.error("Failed to clear storage directly:", e);
      }
    }
  }, [clearLocalStorage]);

  // Get active IP types, using live checkbox state on the applicants tab,
  // and saved store data once navigating away.
  const activeIpTypes: IpTypes = useMemo(() => {
    if (activeTab === "applicants-information") {
      if (hasSelectedIpTypes(selectedIpTypes)) {
        return normalizeIpTypes(selectedIpTypes);
      }
      if (hasSelectedIpTypes(applicantsInfo?.ipTypes)) {
        return normalizeIpTypes(applicantsInfo?.ipTypes);
      }
      return derivedIpTypes;
    }
    if (hasSelectedIpTypes(applicantsInfo?.ipTypes)) {
      return normalizeIpTypes(applicantsInfo?.ipTypes);
    }
    if (hasSelectedIpTypes(selectedIpTypes)) {
      return normalizeIpTypes(selectedIpTypes);
    }
    if (hasSelectedIpTypes(derivedIpTypes)) {
      return derivedIpTypes;
    }
    return normalizeIpTypes(selectedIpTypes);
  }, [
    activeTab,
    applicantsInfo?.ipTypes,
    derivedIpTypes,
    selectedIpTypes,
  ]);

  // Memoize visible tab components based on active IP types
  const visibleTabComponents = useMemo(() => {
    // Log for debugging
    if (DEBUG) {
      console.log("Computing visible tabs with IP types:", activeIpTypes);
    }

    return tabs.filter((tab) => {
      // Always show applicants-information and confirmation tabs
      if (tab.id === "applicants-information" || tab.id === "confirmation") {
        return true;
      }
      // For other tabs, check if they should be shown based on the showIf condition
      return tab.showIf && tab.showIf(activeIpTypes);
    });
  }, [activeIpTypes]);

  // Set default active tab when component mounts and handle invalid tabs - only once when visibility changes
  useEffect(() => {
    // Skip if not hydrated yet
    if (!storeHydrated) return;

    // Check if activeTab is a valid tab
    const isValidTab = visibleTabComponents.some((tab) => tab.id === activeTab);

    // Set default tab on first mount or if active tab becomes invalid
    if (!activeTab || activeTab === "" || !isValidTab) {
      setActiveTab("applicants-information");
    }

    // Log visible tabs for debugging
    console.log(
      "Visible tabs:",
      visibleTabComponents.map((tab) => tab.id)
    );
  }, [visibleTabComponents, storeHydrated, activeTab, setActiveTab]);

  // Add a useEffect to check for existing disclosures when the component mounts
  useEffect(() => {
    const checkForExistingDisclosure = async () => {
      if (
        storeHydrated &&
        !disclosureId &&
        !checkedForExisting &&
        activeApplicationId
      ) {
        console.log("Checking for existing disclosures on form mount");
        setIsLoading(true);
        try {
          const existingData =
            await ipDisclosure.checkExistingDisclosureAndFetch();
          if (existingData) {
            console.log("Found existing disclosure data:", existingData);
          } else {
            console.log("No existing disclosure found");
          }
        } catch (error) {
          console.error("Error checking for existing disclosures:", error);
        } finally {
          setIsLoading(false);
          setCheckedForExisting(true);
        }
      }
    };

    checkForExistingDisclosure();
  }, [storeHydrated, disclosureId, checkedForExisting, activeApplicationId]);

  // Navigate to the form management page to create a new application
  const handleCreateApplication = useCallback(() => {
    router.push("/forms");
  }, [router]);

  // Show loading state while hydrating
  if (isLoading || isLoadingApplication) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-lg">Loading form data...</span>
      </div>
    );
  }

  // Show error state if localStorage access fails
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <p>
              There was a problem loading the form data. This may be due to
              corrupted local storage.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearStorageAndRefresh}
            >
              Clear Local Storage and Reload
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show notification when no active application is selected
  if (!activeApplicationId) {
    return (
      <div className="p-8 space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-lg font-medium text-amber-800">
                No Active IP Application Found
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {activeApplicationId === null ? (
                  <>
                    Welcome to the IP Disclosure forms! To proceed, you need to
                    create or select an IP application first. This will allow
                    you to properly organize and track your intellectual
                    property.
                  </>
                ) : (
                  <>
                    You need to create or select an IP application before you
                    can proceed with the IP disclosure forms. All intellectual
                    property disclosures must be linked to an application.
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push("/applications/new")}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Create New Application
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safely set the current tab, with a fallback to applicants-info
  const currentTab =
    activeTab && visibleTabComponents.some((tab) => tab.id === activeTab)
      ? activeTab
      : "applicants-information";
  const currentTabIndex = visibleTabComponents.findIndex(
    (tab) => tab.id === currentTab
  );

  const isTabComplete = (tabId: string) => {
    switch (tabId) {
      case "applicants-information":
        return Boolean(applicantsInfo);
      case "patent-application":
        return Boolean(
          patentUtilityModelApplication?.title ||
            patentUtilityModelApplication?.description ||
            patentUtilityModelApplication?.additionalData
        );
      case "matrix-sample":
        return Boolean(patentUtilityModelApplication?.matrixSample);
      case "patent-search":
        return Boolean(patentUtilityModelApplication?.searchReport);
      case "copyright-application":
        return Boolean(copyrightApplication);
      case "trademark":
        return Boolean(trademarkApplication);
      case "trade-secret":
        return Boolean(tradeSecretApplication);
      case "confirmation":
        return Boolean(disclosureConfirmation);
      default:
        return false;
    }
  };

  // Log current navigation state for debugging
  console.log("IP Disclosure Form - Current navigation state:", {
    activeTab,
    currentTab,
    visibleTabs: visibleTabComponents.map((tab) => tab.id),
  });
const getNextTab = (currentTabId: string) => {
  const index = visibleTabComponents.findIndex(
    (tab) => tab.id === currentTabId
  );

  if (index === -1) return "applicants-information";

  return visibleTabComponents[index + 1]?.id || currentTabId;
};
  // Function to handle tab changes (previously was using setActiveTabForStore)
  const handleTabChange = (tabId: string) => {
    console.log("IP Disclosure Form - Changing tab to:", tabId);
    console.log("Current active tab before change:", activeTab);

    // Check if the tab is in the visible tabs list
    const isVisible = visibleTabComponents.some((tab) => tab.id === tabId);
    console.log(
      `IP Disclosure Form - Is ${tabId} in visible tabs? ${isVisible}`
    );

    if (isVisible) {
      setActiveTab(tabId);
      console.log("IP Disclosure Form - Tab set to:", tabId);
    } else {
      console.warn(
        `IP Disclosure Form - Tab ${tabId} not in visible tabs, not changing`
      );

      // If trying to navigate to trademark, check if we have a trademark-application tab
      if (
        tabId === "trademark" &&
        visibleTabComponents.some((tab) => tab.id === "trademark-application")
      ) {
        console.log(
          "IP Disclosure Form - Redirecting from 'trademark' to 'trademark-application'"
        );
        setActiveTab("trademark-application");
      }
      // If trying to navigate to trade-secret-confirmation, check if we have a trade-secret tab
      else if (
        tabId === "trade-secret-confirmation" &&
        visibleTabComponents.some((tab) => tab.id === "trade-secret")
      ) {
        console.log(
          "IP Disclosure Form - Redirecting from 'trade-secret-confirmation' to 'trade-secret'"
        );
        setActiveTab("trade-secret");
      }
      // If trying to navigate to trademark-confirmation, check if we have a trademark-application tab
      else if (
        tabId === "trademark-confirmation" &&
        visibleTabComponents.some((tab) => tab.id === "trademark-application")
      ) {
        console.log(
          "IP Disclosure Form - Redirecting from 'trademark-confirmation' to 'trademark-application'"
        );
        setActiveTab("trademark-application");
      }
    }
  };

  // Map the trademark tab to the TrademarkApplication component
  const renderTabContent = () => {
    console.log("IP Disclosure Form - Rendering content for tab:", currentTab);

    switch (currentTab) {
      case "applicants-information":
        return <ApplicantsInformation />;
      case "patent-application":
        return <PatentApplication />;
      case "matrix-sample":
        return <MatrixSampleForm />;
      case "patent-search":
        return <PatentSearchForm />;
      case "copyright-application":
        return <CopyrightApplication />;
      case "trademark":
      case "trademark-application":
        return <TrademarkApplication />;
      case "trade-secret":
        return <TradeSecret />;
      case "confirmation":
        return <DisclosureConfirmation />;
      default:
        console.warn(
          "IP Disclosure Form - Unknown tab, falling back to applicants information:",
          currentTab
        );
        return <ApplicantsInformation />;
    }
  };

  return (
    <div className="space-y-6">
      {activeApplication && (
        <Alert className="bg-green-50 border-green-200">
          <AlertTitle className="text-green-800 flex items-center">
            Active Application: {activeApplication.title}
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {activeApplication.ipType}
            </span>
          </AlertTitle>
          <AlertDescription className="text-green-700">
            {activeApplication.description || "No description provided."}
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-6 border-green-200">
        <Tabs
          value={currentTab}
          defaultValue="applicants-information"
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="overflow-x-auto -mx-6">
            <div className="px-6 min-w-max">
              <TabsList className="h-auto min-h-10 items-start justify-start text-muted-foreground flex flex-nowrap w-full bg-muted/10 p-1 rounded-none border-b">
                {visibleTabComponents.map((tab, index) => {
                  const isFutureTab =
                    currentTabIndex !== -1 && index > currentTabIndex;
                  const isCompletedTab = isTabComplete(tab.id);
                  const isDisabled = isFutureTab && !isCompletedTab;
                  return (
                 <TabsTrigger
  key={tab.id}
  value={tab.id}
  disabled={isDisabled}
  className="inline-flex items-center justify-center whitespace-nowrap rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm relative py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20] hover:text-[#1B5E20]/80 transition-colors px-2 md:px-3 lg:px-4"
>
  <div className="flex items-center gap-2">
    {tab.icon && <tab.icon className="h-4 w-4" />}
    <span>{tab.label}</span>
  </div>
</TabsTrigger>
                );
                })}
              </TabsList>
            </div>
          </div>

          <div className="mt-6">{renderTabContent()}</div>
        </Tabs>
      </Card>
    </div>
  );
}
