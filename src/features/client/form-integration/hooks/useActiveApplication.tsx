import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import type { NormalizedIpTypes } from "@/lib/utils/ip-types";

const DEBUG_APPLICATIONS = process.env.NODE_ENV === "development";

interface Application {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  progress: number;
  createdAt: string | null;
  ipType: string;
  selectedIpTypes?: NormalizedIpTypes | null;
}

type UseActiveApplicationReturn = {
  activeApplicationId: string | null;
  setActiveApplicationId: (
    id: string | null,
    options?: {
      clearFormData?: boolean;
      emitEvent?: boolean;
      skipReload?: boolean;
    }
  ) => void;
  activeApplication: Application | null;
  isLoading: boolean;
  error: Error | null;
  refetchApplications: () => Promise<void>;
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  clearFormData: () => void;
};

export function useActiveApplication(): UseActiveApplicationReturn {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  // Store the active application ID in local storage
  const [activeApplicationId, setActiveApplicationIdRaw] = useLocalStorage<
    string | null
  >("activeApplicationId", null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create a locking mechanism to prevent concurrent operations
  const locksRef = useRef<Record<string, boolean>>({});

  // Function to set a lock
  const setLock = useCallback((lockName: string) => {
    locksRef.current[lockName] = true;
  }, []);

  // Function to check if a lock is active
  const isLocked = useCallback((lockName: string) => {
    return locksRef.current[lockName] === true;
  }, []);

  // Function to release a lock
  const setUnlock = useCallback((lockName: string) => {
    locksRef.current[lockName] = false;
  }, []);

  // Internal setter that avoids clearing local data/reloading (used for auto-sync)
  const setActiveApplicationIdInternal = useCallback(
    (id: string | null) => {
      if (id === activeApplicationId) return;

      if (typeof window !== "undefined") {
        if (id) {
          localStorage.setItem("activeApplicationId", id);
          localStorage.setItem("activeApplicationIdSetAt", Date.now().toString());
        } else {
          localStorage.removeItem("activeApplicationId");
          localStorage.removeItem("activeApplicationIdSetAt");
        }

        const event = new CustomEvent("application-switched", {
          detail: { applicationId: id },
        });
        window.dispatchEvent(event);
      }

      setActiveApplicationIdRaw(id);
    },
    [activeApplicationId, setActiveApplicationIdRaw]
  );

  // Set active application mutation
  const setActiveApplicationMutation =
    trpc.formIntegration.setActiveApplication.useMutation({
      onSuccess: (data) => {
        console.log("Successfully set active application:", data);
        toast.success("Application selected successfully");
      },
      onError: (err) => {
        console.error("Failed to set active application:", err);
        toast.error("Failed to select application");

        // Handle authentication errors
        if (
          err.message.includes("logged in") ||
          err.message.includes("UNAUTHORIZED") ||
          err.message.includes("not authenticated")
        ) {
          toast.error("Authentication Error: Please sign in again");
          console.log("Authentication error detected");
          // Redirect could be implemented here if needed
          // window.location.href = "/auth/signin";
        }
      },
    });

  // Function to clear form data from localStorage
  const clearFormData = (options?: { emitEvent?: boolean }) => {
    console.log("Clearing all form data from localStorage");
    const emitEvent = options?.emitEvent !== false;

    // Only run localStorage operations on the client side
    if (typeof window !== "undefined") {
      // Client profile data
      localStorage.removeItem("clientInformationData");
      localStorage.removeItem("educationalBackgroundData");
      localStorage.removeItem("clientBackgroundIPData");

      // IP disclosure data
      localStorage.removeItem("ipDisclosureData");
      localStorage.removeItem("ipInventorsData");
      localStorage.removeItem("ip-disclosure-storage");

      // Copyright data
      localStorage.removeItem("copyrightApplicationData");

      // Patent data
      localStorage.removeItem("patentApplicationData");
      localStorage.removeItem("matrixSampleData");
      localStorage.removeItem("patentSearchData");

      // Trademark data
      localStorage.removeItem("trademarkData");

      // Trade secret data
      localStorage.removeItem("tradeSecretData");

      // Substantial use data
      localStorage.removeItem("substantialUseData");
      localStorage.removeItem("substantial-use-storage");

      // Deed of assignment data
      localStorage.removeItem("deedAssignmentData");
      localStorage.removeItem("signatoryData");
      localStorage.removeItem("royaltyData");
      localStorage.removeItem("deed-assignment-storage");

      // Form status data
      localStorage.removeItem("formSubmissionStatus");

      if (emitEvent) {
        // Also dispatch events to notify components that form data has been cleared
        try {
          const event = new CustomEvent("formDataCleared", {
            detail: { timestamp: Date.now() },
          });
          window.dispatchEvent(event);
        } catch (error) {
          console.error("Error dispatching formDataCleared event:", error);
        }
      }

      console.log("All form data cleared from localStorage");
    }
  };

  // Track application switch state to prevent multiple operations
  const [isSwitchingApp, setIsSwitchingApp] = useState(false);
  const [switchTimeoutId, setSwitchTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );

  // Function to set the active application
  const setActiveApplicationId = useCallback(
    (
      id: string | null,
      options?: {
        clearFormData?: boolean;
        emitEvent?: boolean;
        skipReload?: boolean;
      }
    ) => {
      console.log("Setting active application ID:", id);

      // If the ID is the same as the current one, do nothing
      if (id === activeApplicationId) {
        console.log("Application ID is the same as current, no changes needed");
        return;
      }

      // Check if we're already in the process of switching applications
      if (isLocked("application-switching")) {
        console.log("Already switching applications, ignoring new request");
        return;
      }

      try {
        // Lock the application switching process
        setLock("application-switching");
        console.log("Locking application switching");

        const shouldClearFormData = options?.clearFormData !== false;
        if (shouldClearFormData) {
          clearFormData({ emitEvent: options?.emitEvent });
        }

        if (shouldClearFormData) {
          // Force clear all client profile localStorage data to prevent stale application IDs
          localStorage.removeItem("clientInformationData");
          localStorage.removeItem("educationalBackgroundData");
          localStorage.removeItem("clientBackgroundIPData");
          console.log("Explicitly cleared all client profile form data");
        }

        // Clear IP disclosure store directly
        try {
          // Get the IP disclosure store state
          const ipDisclosureStore = (window as any)[
            "useIpDisclosureStore"
          ]?.getState();
          if (ipDisclosureStore) {
            // IMPORTANT: First explicitly clear the disclosure ID to break connection with previous app
            if (typeof ipDisclosureStore.setDisclosureId === "function") {
              console.log("Explicitly clearing disclosure ID");
              ipDisclosureStore.setDisclosureId(null);
            }

            // Reset application ID to null before setting the new one
            if (typeof ipDisclosureStore.setApplicationId === "function") {
              console.log(
                "Explicitly clearing application ID in disclosure store"
              );
              ipDisclosureStore.setApplicationId(null);
            }

            // Clear fetch attempted flag
            if (typeof ipDisclosureStore.setFetchAttempted === "function") {
              console.log("Resetting fetch attempted flag");
              ipDisclosureStore.setFetchAttempted(false);
            }

            // Full reset of the store state
            if (typeof ipDisclosureStore.resetStore === "function") {
              console.log("Full reset of IP disclosure store");
              ipDisclosureStore.resetStore();
            }

            // Clear local storage to ensure no data persistence
            if (typeof ipDisclosureStore.clearLocalStorage === "function") {
              console.log("Clearing IP disclosure local storage");
              ipDisclosureStore.clearLocalStorage();
            }
          } else {
            console.log("IP disclosure store not available");
          }
        } catch (error) {
          console.error("Error resetting IP disclosure store:", error);
        }

        // Then update the active application ID in localStorage
        if (id) {
          localStorage.setItem("activeApplicationId", id);
          localStorage.setItem("activeApplicationIdSetAt", Date.now().toString());
        } else {
          localStorage.removeItem("activeApplicationId");
          localStorage.removeItem("activeApplicationIdSetAt");
        }

        // Update the state
        setActiveApplicationIdRaw(id);

        // Dispatch an application-switched event to notify other components
        if (typeof window !== "undefined") {
          // Create and dispatch the custom event
          const event = new CustomEvent("application-switched", {
            detail: { applicationId: id },
          });
          window.dispatchEvent(event);

          if (!options?.skipReload) {
            // Set a short timeout then reload the page for a clean state
            setTimeout(() => {
              // Reload the page - this ensures a clean state
              window.location.reload();
            }, 300); // Increased delay to ensure all events are processed
          }
        }
      } finally {
        // Set a timeout to release the lock in case something goes wrong
        setTimeout(() => {
          if (isLocked("application-switching")) {
            setUnlock("application-switching");
            console.log("Released application switching lock via timeout");
          }
        }, 5000);
      }
    },
    [activeApplicationId, clearFormData, setLock, setUnlock, isLocked]
  );

  // Get user applications with safeguards
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    refetch,
    error: applicationsError,
  } = trpc.formIntegration.getUserApplications.useQuery(
    { userId: userId || "" },
    {
      // Allow the query to run as soon as the session is authenticated.
      // Some session payloads on the client do not expose `user.id`, but the
      // server-side tRPC context still has the authenticated user ID and can
      // resolve it from there.
      enabled: status === "authenticated",
      retry: 2,
      retryDelay: 1000,
    }
  );

  useEffect(() => {
    if (DEBUG_APPLICATIONS) {
      console.log("[useActiveApplication] snapshot", {
        sessionStatus: status,
        userId,
        activeApplicationId,
        storedActiveApplicationId:
          typeof window !== "undefined"
            ? localStorage.getItem("activeApplicationId")
            : null,
        storedActiveApplicationIdSetAt:
          typeof window !== "undefined"
            ? localStorage.getItem("activeApplicationIdSetAt")
            : null,
        applicationsCount: applications.length,
        isLoadingApplications,
        hasApplicationsData: Array.isArray(applicationsData),
        applicationsDataCount: Array.isArray(applicationsData)
          ? applicationsData.length
          : null,
        applicationsError: applicationsError?.message ?? null,
      });
    }
  }, [
    status,
    userId,
    activeApplicationId,
    applications.length,
    isLoadingApplications,
    applicationsData,
    applicationsError,
  ]);

  // Handle application errors
  useEffect(() => {
    if (applicationsError) {
      console.error("Error in getUserApplications query:", applicationsError);
      setError(
        applicationsError instanceof Error
          ? applicationsError
          : new Error(String(applicationsError))
      );
      setApplications([]); // Reset applications to prevent UI errors

      console.error("Error fetching applications:", applicationsError);

      // Set applications to empty array to prevent UI errors
      setApplications([]);

      // Handle authentication errors
      if (
        applicationsError.message.includes("logged in") ||
        applicationsError.message.includes("UNAUTHORIZED")
      ) {
        console.log("Authentication error detected, redirecting to sign-in...");
        // We could implement redirect logic here if needed
        // window.location.href = "/auth/signin";
      } else if (applicationsError.message.includes("transform")) {
        // Handle transformation errors by showing a toast
        toast.error("Error loading applications. Please refresh the page.");
      }
    } else {
      // Reset error if no error exists
      setError(null);
    }
  }, [applicationsError]);

  // Handle successful data fetch
  useEffect(() => {
    if (applicationsData) {
      if (DEBUG_APPLICATIONS) {
        console.log("[useActiveApplication] applicationsData received", {
          activeApplicationId,
          applicationsDataCount: Array.isArray(applicationsData)
            ? applicationsData.length
            : null,
          applicationsData,
        });
      }

      // Ensure we have a valid array of applications
      if (Array.isArray(applicationsData)) {
        const nextApplications = applicationsData as Application[];
        const hasExistingApplications = applications.length > 0;

        if (nextApplications.length === 0 && hasExistingApplications) {
          if (DEBUG_APPLICATIONS) {
            console.log(
              "[useActiveApplication] Preserving existing applications because the refetch returned an empty list",
              {
                existingApplicationsCount: applications.length,
                activeApplicationId,
              }
            );
          }
        } else {
          setApplications(nextApplications);
        }

        if (activeApplicationId) {
          const exists = nextApplications.some(
            (app) => app.id === activeApplicationId
          );

          if (!exists) {
            const setAtRaw =
              typeof window !== "undefined"
                ? localStorage.getItem("activeApplicationIdSetAt")
                : null;
            const setAt = setAtRaw ? Number(setAtRaw) : 0;
            const isRecent = setAt > 0 && Date.now() - setAt < 5000;

            if (DEBUG_APPLICATIONS) {
              console.log(
                "[useActiveApplication] active application missing from query result",
                {
                  activeApplicationId,
                  setAtRaw,
                  isRecent,
                  applicationsDataCount: nextApplications.length,
                }
              );
            }

            if (!isRecent && nextApplications.length > 0) {
              if (DEBUG_APPLICATIONS) {
                console.log(
                  "[useActiveApplication] Clearing stale active application after reload"
                );
              }
              clearFormData({ emitEvent: false });
              setActiveApplicationIdInternal(null);
              return;
            }
          }
        }

        // If there's no active application but there are applications, set the first one as active
        if (!activeApplicationId && nextApplications.length > 0) {
          if (DEBUG_APPLICATIONS) {
            console.log(
              "[useActiveApplication] No active application stored, selecting first application from query",
              nextApplications[0]?.id
            );
          }
          setActiveApplicationIdInternal(nextApplications[0].id);
        }
        if (nextApplications.length === 0) {
          if (DEBUG_APPLICATIONS) {
            console.log(
              "[useActiveApplication] Query returned zero applications for current user"
            );
          }
        }
      } else {
        console.error("Applications data is not an array:", applicationsData);
        setApplications([]);
      }
    }

    // Only set loading to false when we have either data or error
    if (applicationsData || applicationsError) {
      setIsLoading(false);
    }
  }, [applicationsData, activeApplicationId, applicationsError]);

  // Get the active application object
  const activeApplication = activeApplicationId
    ? applications.find((app) => app.id === activeApplicationId) || null
    : null;

  // Refetch applications with error handling
  const refetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Wait for refresh to complete
      const result = await refetch();

      // Check if the result contains data
      if (result.data) {
        if (Array.isArray(result.data)) {
          const nextApplications = result.data as Application[];
          if (nextApplications.length === 0 && applications.length > 0) {
            console.log(
              "[useActiveApplication] Refetch returned an empty list, keeping current applications in memory",
              {
                existingApplicationsCount: applications.length,
                activeApplicationId,
              }
            );
          } else {
            setApplications(nextApplications);
          }
        } else {
          console.warn("Refetched data is not an array:", result.data);
          setApplications([]);
        }
      }
    } catch (err) {
      console.error("Failed to refetch applications:", err);
      setError(err instanceof Error ? err : new Error(String(err)));

      // Reset applications to empty array on error
      setApplications([]);

      // Show error toast
      toast.error("Failed to refresh applications");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize or validate the active application
  useEffect(() => {
    if (!isLoadingApplications && applications.length > 0) {
      // If there's an active application ID but it's not in the applications list, reset it
      if (
        activeApplicationId &&
        !applications.some((app) => app.id === activeApplicationId)
      ) {
        console.log(
          "[useActiveApplication] Active application not in local applications list, switching to first item",
          {
            activeApplicationId,
            firstApplicationId: applications[0]?.id ?? null,
          }
        );
        setActiveApplicationIdInternal(applications[0].id);
      }
      // If there's no active application ID but there are applications, set the first one
      else if (!activeApplicationId) {
        console.log(
          "[useActiveApplication] Local applications list has items but no active application, selecting first",
          applications[0]?.id ?? null
        );
        setActiveApplicationIdInternal(applications[0].id);
      }
    }
  }, [
    applications,
    activeApplicationId,
    isLoadingApplications,
    setActiveApplicationIdInternal,
  ]);

  return {
    activeApplicationId,
    setActiveApplicationId,
    activeApplication,
    isLoading: isLoadingApplications || isLoading,
    error,
    refetchApplications,
    applications,
    setApplications,
    clearFormData,
  };
}
