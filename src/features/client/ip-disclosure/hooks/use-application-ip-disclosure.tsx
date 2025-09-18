import { useEffect, useState } from "react";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { useToast } from "@/components/ui/use-toast";
import { batchRemoveLocalStorageItems } from "../../../../lib/utils/localStorage-utils";

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _ipDisclosureTimeouts?: NodeJS.Timeout[];
    _clearIpDisclosureTrackers?: () => void;
  }
}

/**
 * Hook to connect the active application with the IP disclosure store
 * This ensures that IP disclosure data is correctly associated with the current application
 */
export function useApplicationIpDisclosure() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [localFetchAttempted, setLocalFetchAttempted] = useState(false);

  // Get the active application state
  const {
    activeApplicationId,
    activeApplication,
    isLoading: isLoadingApplication,
    error: activeApplicationError,
    refetchApplications,
  } = useActiveApplication();

  // Get access to the IP disclosure store
  const {
    setApplicationId,
    applicationId,
    fetchInitialData,
    isLoading: isLoadingDisclosure,
    resetStore,
    disclosureId,
    applicantsInfo,
    hydrated,
    initialDataFetched,
    setFetchAttempted,
  } = useIpDisclosureStore();

  // Get the IP disclosure hook for data operations
  const { checkExistingDisclosureAndFetch, isLoading: isLoadingDisclosureOps } =
    useIpDisclosure();

  // When the active application changes, update the store
  useEffect(() => {
    // Control verbosity of logging
    const DEBUG = false;

    if (!hydrated) {
      if (DEBUG) {
        console.log("Store not yet hydrated, waiting...");
      }
      return;
    }

    // Only proceed if we have an application ID and it's different from what's in the store
    if (activeApplicationId && activeApplicationId !== applicationId) {
      if (DEBUG) {
        console.log(
          `Updating IP disclosure store with application ID: ${activeApplicationId}`
        );
      }

      // Clear localStorage first to prevent stale data
      batchRemoveLocalStorageItems(["ip-disclosure-storage"]);

      // Reset store before setting new application to ensure clean state
      resetStore();

      // Set the application ID in the store
      setApplicationId(activeApplicationId);

      // Load data for this application
      setLoadingApplication(true);
      setFetchAttempted(false);

      // Clear any previous operation tracking for this application
      sessionStorage.removeItem(`appIdLastChecked_${activeApplicationId}`);

      // Set application switching context to bypass throttling
      sessionStorage.setItem("ipDisclosureAppSwitching", "true");

      // Force a small delay to ensure localStorage is cleared
      setTimeout(() => {
        checkExistingDisclosureAndFetch()
          .then((data: any) => {
            if (DEBUG) {
              console.log(`Data loaded for application:`, {
                applicationId: activeApplicationId,
                hasData: !!data,
                disclosureId: data?.disclosureId,
              });
            }

            // Mark that we've attempted a fetch regardless of the result
            setFetchAttempted(true);
            setLocalFetchAttempted(true);

            // If no data was found, show a subtle toast notification
            if (!data) {
              toast({
                title: "New Application",
                description: "Starting with a clean form for this application",
                variant: "default",
              });
            }
          })
          .catch((error: Error) => {
            console.error("Error loading data for application:", error);
            // Mark that we've attempted a fetch despite the error
            setFetchAttempted(true);
            setLocalFetchAttempted(true);
            toast({
              title: "Note",
              description: "No existing data found for this application",
              variant: "default",
            });
          })
          .finally(() => {
            setLoadingApplication(false);
            setIsInitialized(true);
            setFetchAttempted(true);
            setLocalFetchAttempted(true);

            // Clean up app switching context
            sessionStorage.removeItem("ipDisclosureAppSwitching");
          });
      }, 100); // Small delay to ensure cleanup is complete
    } else if (
      activeApplicationId &&
      activeApplicationId === applicationId &&
      !isInitialized
    ) {
      // We already have the correct application ID, just need to initialize
      setIsInitialized(true);
    } else if (!activeApplicationId && !isLoadingApplication) {
      // No active application but we're not loading, so we're initialized
      setIsInitialized(true);
    }
  }, [
    activeApplicationId,
    applicationId,
    isLoadingApplication,
    setApplicationId,
    hydrated,
    isInitialized,
    resetStore,
    checkExistingDisclosureAndFetch,
    toast,
    setFetchAttempted,
  ]);

  // Listen for application switch events
  useEffect(() => {
    // Control verbosity of logging
    const DEBUG = false;

    // Track any route changes for throttling determination
    const handleRouteChange = () => {
      // Set current timestamp to indicate a route change
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lastRouteChange", Date.now().toString());

        if (DEBUG) {
          console.log(
            "Route change detected, setting lastRouteChange timestamp"
          );
        }
      }
    };

    // Track clicks on navigation elements to detect tab changes
    const handleNavClick = (e: MouseEvent) => {
      // Check if the click target is a navigation element
      const target = e.target as HTMLElement;
      const isNavElement =
        target.closest("a") ||
        target.closest("button") ||
        target.closest('[role="tab"]') ||
        target.closest('[role="link"]');

      if (isNavElement) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastRouteChange", Date.now().toString());

          if (DEBUG) {
            console.log(
              "Navigation click detected, setting lastRouteChange timestamp"
            );
          }
        }
      }
    };

    const handleApplicationSwitch = (
      event: CustomEvent<{ applicationId: string | null }>
    ) => {
      // Set a flag for debug mode to control verbosity
      const DEBUG = false;

      if (DEBUG) {
        console.log(
          `Application switch event detected: ${event.detail.applicationId}`
        );
      }

      // First, fully reset the store state
      resetStore();
      setFetchAttempted(false);
      setLocalFetchAttempted(false);
      setIsInitialized(false);
      setLoadingApplication(true);

      // Reset any existing timeouts to prevent pending operations from old state
      const existingTimeouts = window._ipDisclosureTimeouts || [];
      if (existingTimeouts.length > 0) {
        existingTimeouts.forEach((timeoutId: NodeJS.Timeout) =>
          clearTimeout(timeoutId)
        );
        window._ipDisclosureTimeouts = [];
      }

      // Clear operation trackers and throttle maps to ensure operations aren't blocked
      if (typeof window._clearIpDisclosureTrackers === "function") {
        window._clearIpDisclosureTrackers();
      }

      // Explicitly clear sessionStorage throttling items
      sessionStorage.removeItem("lastCheckExistingDisclosureAndFetch");
      sessionStorage.removeItem("lastCheckExistingDisclosureAppId");

      // If switching to a specific application ID, remove it from the "no record" list
      // to allow a fresh check
      if (event.detail.applicationId) {
        try {
          const noRecordAppIds = JSON.parse(
            sessionStorage.getItem("ipDisclosureNoRecordAppIds") || "[]"
          );
          const updatedList = noRecordAppIds.filter(
            (id: string) => id !== event.detail.applicationId
          );
          sessionStorage.setItem(
            "ipDisclosureNoRecordAppIds",
            JSON.stringify(updatedList)
          );

          // Also remove from checked IDs
          const checkedAppIds = JSON.parse(
            sessionStorage.getItem("checkedDisclosureAppIds") || "[]"
          );
          const updatedCheckedList = checkedAppIds.filter(
            (id: string) => id !== event.detail.applicationId
          );
          sessionStorage.setItem(
            "checkedDisclosureAppIds",
            JSON.stringify(updatedCheckedList)
          );

          // Remove specific timestamp for this app ID
          sessionStorage.removeItem(
            `appIdLastChecked_${event.detail.applicationId}`
          );
        } catch (e) {
          console.error("Error updating no-record app IDs:", e);
        }
      }

      // Use a small delay to ensure the store is reset before trying to clear localStorage
      setTimeout(() => {
        // Clear IP disclosure data from localStorage
        if (typeof window !== "undefined") {
          if (DEBUG) {
            console.log("Clearing IP disclosure data from localStorage");
          }

          try {
            // Batch localStorage operations to reduce performance impact
            const keysToRemove = [
              "ipDisclosureData",
              "ipInventorsData",
              "ip-disclosure-storage",
              "patent-tabs-storage",
              "applicants-info-form",
              "applicantsInfoData",
            ];

            // Use batched removal for known keys
            batchRemoveLocalStorageItems(keysToRemove);

            // Second pass: search for pattern matches
            // Remove any other IP disclosure related items
            const patternKeysToRemove = [];
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (
                  key &&
                  (key.includes("ipDisclosure") ||
                    key.includes("disclosure") ||
                    key.includes("patent") ||
                    key.includes("copyright") ||
                    key.includes("trademark") ||
                    key.includes("transaction") ||
                    key.includes("tradeSecret"))
                ) {
                  patternKeysToRemove.push(key);
                }
              }

              // Use batched removal for pattern-matched keys
              batchRemoveLocalStorageItems(patternKeysToRemove);

              if (DEBUG) {
                console.log("Cleared IP disclosure localStorage items:", [
                  ...keysToRemove,
                  ...patternKeysToRemove,
                ]);
              }
            } catch (e) {
              console.error("Error during localStorage cleanup:", e);
            }
          } catch (e) {
            console.error("Error clearing localStorage:", e);
          }
        }

        // If no new application ID, we're done (just cleared everything)
        if (!event.detail.applicationId) {
          if (DEBUG) {
            console.log("No new application ID provided, store reset complete");
          }
          setLoadingApplication(false);
          setIsInitialized(true);
          return;
        }

        // Set the new application ID
        if (DEBUG) {
          console.log(
            `Setting new application ID: ${event.detail.applicationId}`
          );
        }
        setApplicationId(event.detail.applicationId);

        // Allow the application ID to be set before continuing
        setTimeout(() => {
          // Load data for this application
          setLoadingApplication(true);

          // Set application switching context to bypass throttling
          sessionStorage.setItem("ipDisclosureAppSwitching", "true");

          // Set a timeout for the fetch operation to prevent hanging
          const fetchPromise = checkExistingDisclosureAndFetch();
          const timeoutPromise = new Promise<null>((resolve) => {
            const timeoutId = setTimeout(() => {
              if (DEBUG) {
                console.warn("Fetch operation timed out");
              }
              resolve(null);
            }, 10000); // 10 second timeout

            // Store timeout ID for cleanup
            if (!window._ipDisclosureTimeouts)
              window._ipDisclosureTimeouts = [];
            window._ipDisclosureTimeouts.push(timeoutId);
          });

          // Use Promise.race to apply timeout
          Promise.race([fetchPromise, timeoutPromise])
            .then((data: any) => {
              if (!data) {
                if (DEBUG) {
                  console.log("Operation returned no data or timed out");
                }
                setFetchAttempted(true);
                setLocalFetchAttempted(true);
                setIsInitialized(true);

                // Show a minimal notification for new applications
                toast({
                  title: "New Application",
                  description: "Starting with a clean form",
                  variant: "default",
                });

                return;
              }

              const hasData =
                !!data &&
                Object.keys(data).some(
                  (key) =>
                    key !== "disclosureId" &&
                    key !== "applicationId" &&
                    !!data[key]
                );

              if (DEBUG) {
                console.log(`Data loaded after switch event:`, {
                  applicationId: event.detail.applicationId,
                  hasData,
                  disclosureId: data?.disclosureId || null,
                });
              }

              // Mark that we've attempted a fetch regardless of the result
              setFetchAttempted(true);
              setLocalFetchAttempted(true);
              setIsInitialized(true);

              // Provide feedback about data availability
              if (!hasData) {
                toast({
                  title: "New Application",
                  description: "No existing data found for this application",
                  variant: "default",
                });
              }
            })
            .catch((error: Error) => {
              console.error("Error loading data after switch event:", error);
              // Mark that we've attempted a fetch despite the error
              setFetchAttempted(true);
              setLocalFetchAttempted(true);
              setIsInitialized(true);
              toast({
                title: "No Data Found",
                description: "Starting with a clean form for this application",
                variant: "default",
              });
            })
            .finally(() => {
              setLoadingApplication(false);
              setFetchAttempted(true);
              setLocalFetchAttempted(true);
              setIsInitialized(true);

              // Clear the app switching flag
              sessionStorage.removeItem("ipDisclosureAppSwitching");
            });
        }, 200); // Short delay to ensure application ID is set
      }, 200); // Short delay to ensure store is reset
    };

    // Add event listeners
    window.addEventListener(
      "application-switched" as any,
      handleApplicationSwitch as EventListener
    );

    // Add listeners for route/tab change detection
    window.addEventListener("popstate", handleRouteChange);
    document.addEventListener("click", handleNavClick);

    // Cleanup the listeners on unmount
    return () => {
      window.removeEventListener(
        "application-switched" as any,
        handleApplicationSwitch as EventListener
      );

      // Remove route change listeners
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener("click", handleNavClick);

      // Clear any pending timeouts
      const existingTimeouts = window._ipDisclosureTimeouts || [];
      if (existingTimeouts.length > 0) {
        existingTimeouts.forEach((timeoutId: NodeJS.Timeout) =>
          clearTimeout(timeoutId)
        );
        window._ipDisclosureTimeouts = [];
      }
    };
  }, [
    resetStore,
    setApplicationId,
    checkExistingDisclosureAndFetch,
    toast,
    setFetchAttempted,
  ]);

  return {
    // Application data
    activeApplicationId,
    activeApplication,

    // Disclosure data
    disclosureId,
    applicationId,
    applicantsInfo,

    // Loading states
    isLoading:
      isLoadingApplication ||
      isLoadingDisclosure ||
      isLoadingDisclosureOps ||
      loadingApplication,
    isInitialized,
    initialDataFetched,
    fetchAttempted: localFetchAttempted,

    // Error states
    activeApplicationError,

    // Actions
    refreshData: checkExistingDisclosureAndFetch,
    refetchApplications,
    resetDisclosureStore: resetStore,
  };
}
