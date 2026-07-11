import React, { useState, useEffect } from "react";
// Import the main implementation and trpc
import { useIpDisclosure as useMainIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import type { ApplicantsInfo } from "@/lib/store/ip-disclosure-store";
import { toast } from "@/components/ui/use-toast";
import { trpc } from "@/trpc/client";

// Add a type definition for errors at the top of the file
type ApiError =
  | Error
  | { message?: string; code?: string; status?: number; [key: string]: any };

// Create a fixed type union for applicants info to avoid "Two different types with this name exist" error
type FixedApplicantsInfo = {
  email: string;
  applicants: { firstName: string; lastName: string; middleInitial?: string }[];
  inventors: { firstName: string; lastName: string; middleInitial?: string }[];
  ipTypes: {
    copyright: boolean;
    patent: boolean;
    utilityModel: boolean;
    industrialDesign: boolean;
    trademark: boolean;
    tradeSecret: boolean;
    other: boolean;
    notSure: boolean;
  };
  isRightfulOwner: boolean;
  otherIpType?: string;
  authorizedRepresentative?: string;
};

// Create a delegator hook that prevents infinite loops while providing compatibility
export const useIpDisclosure = () => {
  const mainHook = useMainIpDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingConfirmation, setIsSavingConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false);

  // Get the current disclosureId from the store
  const { disclosureId } = useIpDisclosureStore();

  // Add a mutation for updating disclosure status directly using the existing updateIpDisclosure mutation
  const updateDisclosureStatusMutation =
    trpc.ipDisclosure.updateIpDisclosure.useMutation({
      onSuccess: () => {
        console.log("Successfully updated disclosure status");
      },
      onError: (error: unknown) => {
        console.error("Error updating disclosure status:", error);
      },
    });

  // New function to fetch specifically confirmation data
  const fetchConfirmationData = async (disclosureId: string) => {
    console.log("Fetching confirmation data for disclosure:", disclosureId);
    if (!disclosureId) {
      console.error("No disclosure ID provided for fetching confirmation data");
      return null;
    }

    try {
      // Make direct API call to get confirmation data
      const response = await fetch(
        `/api/ip-disclosure/${disclosureId}/confirmation`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch confirmation data: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Fetched confirmation data:", data);

      // Check if data exists and has the expected structure
      if (data && data.data) {
        return data.data;
      } else if (
        data &&
        (data.written_disclosures || data.writtenDisclosures)
      ) {
        // Data might be directly returned without a 'data' wrapper
        return data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching confirmation data:", error);
      return null;
    }
  };

  // Enhanced version of saveApplicantsInfo with validation and form registry control
  const saveApplicantsInfoWithValidation = async (
    data?: ApplicantsInfo,
    registerForm: boolean = false
  ) => {
    console.log(
      "Saving applicants info with validation:",
      data,
      "Register form:",
      registerForm
    );

    // If no data provided, get it from the store
    if (!data) {
      const storeData = useIpDisclosureStore.getState().applicantsInfo;
      if (!storeData) {
        console.error("No applicants info data to save");
        toast({
          variant: "destructive",
          title: "Error",
          description: "No applicants information to save",
        });
        return null;
      }
      // Use the store data as our data to validate
      data = storeData as FixedApplicantsInfo;
    }

    // Check for required fields
    if (!data.email) {
      console.log("Email is required but missing");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email is required",
      });
      return null;
    }

    const hasAnyCompleteApplicant = (data.applicants ?? []).some(
      (person) =>
        Boolean(person?.firstName?.trim()) && Boolean(person?.lastName?.trim())
    );

    const hasAnyCompleteInventor = (data.inventors ?? []).some(
      (person) =>
        Boolean(person?.firstName?.trim()) && Boolean(person?.lastName?.trim())
    );

    // Check for at least one applicant with name
    if (!hasAnyCompleteApplicant) {
      console.log("Applicant information is incomplete");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "At least one applicant with first and last name is required",
      });
      return null;
    }

    // Check for at least one inventor with name
    if (!hasAnyCompleteInventor) {
      console.log("Inventor information is incomplete");
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "At least one inventor with first and last name is required",
      });
      return null;
    }

    setIsCreating(true);
    try {
      // Add registerForm property to the data
      if (data && typeof data === "object") {
        (data as any).registerForm = registerForm;
      }

      // Call the main hook implementation without passing arguments if it doesn't expect any
      if (mainHook.saveApplicantsInfo.length === 0) {
        // Update the store with our data first, then call the no-arg function
        useIpDisclosureStore.getState().setApplicantsInfo(data);
        return await mainHook.saveApplicantsInfo();
      } else {
        // The function expects an argument, so pass it
        return await mainHook.saveApplicantsInfo(data);
      }
    } catch (error) {
      console.error("Error in saveApplicantsInfo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error saving data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  // Check for existing disclosure and fetch data
  const checkExistingDisclosureAndFetch = async () => {
    console.log("Checking for existing disclosure and fetching data");
    setIsLoading(true);

    try {
      // First check if there's an existing disclosure in the store
      const storeDisclosureId = useIpDisclosureStore.getState().disclosureId;

      if (storeDisclosureId) {
        console.log("Found disclosure ID in store:", storeDisclosureId);
        // Fetch the data for this disclosure
        const data = await mainHook.fetchInitialData();
        console.log("Fetched initial data from store ID:", data);
        setHasCheckedExisting(true);
        setIsLoading(false);
        return data;
      }

      // No ID in store, make a proper API call to check for existing disclosure
      try {
        // Call the API to get existing disclosures for the current user
        const response = await fetch("/api/ip-disclosure/user-disclosures");

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const disclosures = await response.json();

        if (disclosures && disclosures.data && disclosures.data.length > 0) {
          // User has existing disclosures, use the latest one
          const latestDisclosure = disclosures.data[0];
          console.log("Found existing user disclosure:", latestDisclosure);

          // Set the disclosure ID in the store
          useIpDisclosureStore.getState().setDisclosureId(latestDisclosure.id);

          // Now fetch the detailed data
          const data = await mainHook.fetchInitialData();
          console.log("Fetched initial data for existing disclosure:", data);
          setHasCheckedExisting(true);
          setIsLoading(false);
          return data;
        } else {
          console.log(
            "No existing disclosures found for user, creating new one"
          );
          // No existing disclosures, create a new one
          const existingId = await mainHook.checkExistingDisclosure();
          console.log("Created new disclosure with ID:", existingId);

          if (existingId) {
            // Set the new disclosure ID in the store
            useIpDisclosureStore.getState().setDisclosureId(existingId);

            // Now fetch initial data (will return defaults for a new disclosure)
            const data = await mainHook.fetchInitialData();
            console.log("Fetched initial data for new disclosure:", data);
            setHasCheckedExisting(true);
            setIsLoading(false);
            return data;
          }
        }
      } catch (apiError) {
        console.error("Error checking user disclosures:", apiError);
        // Fall back to the main hook's check
        const existingId = await mainHook.checkExistingDisclosure();
        console.log("Fall back check result:", existingId);

        if (existingId) {
          console.log("Found/created disclosure ID:", existingId);
          // Set the disclosure ID in the store
          useIpDisclosureStore.getState().setDisclosureId(existingId);

          // Fetch the data for this disclosure
          const data = await mainHook.fetchInitialData();
          console.log("Fetched initial data:", data);
          setHasCheckedExisting(true);
          setIsLoading(false);
          return data;
        }
      }

      console.log("No existing disclosure found and failed to create new one");
      setHasCheckedExisting(true);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error("Error checking existing disclosure:", error);
      setHasCheckedExisting(true);
      setIsLoading(false);
      return null;
    }
  };

  // Now add registerForm parameter to other save methods
  const saveDisclosureConfirmation = async (
    data: any,
    registerForm: boolean = false
  ) => {
    console.log(
      `Saving disclosure confirmation with registerForm=${registerForm}`,
      data
    );
    if (!data) {
      console.error("No data provided to saveDisclosureConfirmation");
      return null;
    }

    // Add registerForm property to the data
    data.registerForm = registerForm;

    setIsSavingConfirmation(true);
    try {
      // Update the store with the data first
      useIpDisclosureStore.getState().setDisclosureConfirmation(data);

      // Call the main hook implementation without parameters
      return await mainHook.saveDisclosureConfirmation();
    } catch (error) {
      console.error("Error in saveDisclosureConfirmation:", error);
      return null;
    } finally {
      setIsSavingConfirmation(false);
    }
  };

  // Update submitIpDisclosure to always register form
  const submitIpDisclosure = async (data?: any) => {
    // Always set registerForm to true for submissions
    if (data && typeof data === "object") {
      data.registerForm = true;
    } else if (!data) {
      data = { registerForm: true };
    }

    console.log("Submitting IP disclosure with registerForm=true:", data);
    setIsSubmitting(true);
    try {
      // Update the store with our data first before calling the main hook
      if (data) {
        useIpDisclosureStore.getState().setDisclosureConfirmation(data);
      }
      // Call the main hook implementation without arguments
      return await mainHook.submitIpDisclosure();
    } catch (error) {
      console.error("Error in submitIpDisclosure:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update other save methods with the registerForm parameter
  const saveTrademarkApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    if (data && typeof data === "object") {
      data.registerForm = registerForm;
    }

    console.log(
      `Saving trademark application with registerForm=${registerForm}:`,
      data
    );
    try {
      // Update the store first if we have data
      if (data) {
        useIpDisclosureStore.getState().setTrademarkApplication(data);
      }
      // Call the main hook implementation without arguments
      return await mainHook.saveTrademarkApplication();
    } catch (error) {
      console.error("Error in saveTrademarkApplication:", error);
      return null;
    }
  };

  const saveCopyrightApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    if (data && typeof data === "object") {
      data.registerForm = registerForm;
    }

    console.log(
      `Saving copyright application with registerForm=${registerForm}:`,
      data
    );
    try {
      // Update the store first if we have data
      if (data) {
        useIpDisclosureStore.getState().setCopyrightApplication(data);
      }
      // Call the main hook implementation without arguments
      return await mainHook.saveCopyrightApplication();
    } catch (error) {
      console.error("Error in saveCopyrightApplication:", error);
      return null;
    }
  };

  const savePatentUtilityModelApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    if (data && typeof data === "object") {
      data.registerForm = registerForm;
    }

    console.log(
      `Saving patent/utility model application with registerForm=${registerForm}:`,
      data
    );
    try {
      // Update the store first if we have data
      if (data) {
        useIpDisclosureStore.getState().setPatentUtilityModelApplication(data);
      }
      // Call the main hook implementation without arguments
      return await mainHook.savePatentUtilityModelApplication();
    } catch (error) {
      console.error("Error in savePatentUtilityModelApplication:", error);
      return null;
    }
  };

  const saveTradeSecretApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    if (data && typeof data === "object") {
      data.registerForm = registerForm;
    }

    console.log(
      `Saving trade secret application with registerForm=${registerForm}:`,
      data
    );
    try {
      // Update the store first if we have data
      if (data) {
        useIpDisclosureStore.getState().setTradeSecretApplication(data);
      }
      // Call the main hook implementation without arguments
      return await mainHook.saveTradeSecretApplication();
    } catch (error) {
      console.error("Error in saveTradeSecretApplication:", error);
      return null;
    }
  };

  const checkTrademarkExists = async () => {
    try {
      // Get the disclosure ID from the store
      const disclosureId = useIpDisclosureStore.getState().disclosureId;

      // If no disclosure ID exists yet, return false
      if (!disclosureId) {
        console.warn(
          "Cannot check if trademark exists - no disclosure ID available"
        );
        return false;
      }

      // Check if the function exists on mainHook before calling it
      if (typeof (mainHook as any).checkTrademarkExists === "function") {
        // The function expects a disclosure ID parameter
        return await (mainHook as any).checkTrademarkExists(disclosureId);
      }

      // Fallback: Check if we have trademark data in the store
      const trademarkApplication =
        useIpDisclosureStore.getState().trademarkApplication;
      return !!trademarkApplication;
    } catch (error) {
      console.error("Error checking trademark exists:", error);
      return false;
    }
  };

  const createDefaultTrademarkApplication = async () => {
    try {
      // Check if the function exists on mainHook before calling it
      if (
        typeof (mainHook as any).createDefaultTrademarkApplication ===
        "function"
      ) {
        return await (mainHook as any).createDefaultTrademarkApplication();
      }

      // Fallback: Create a simple default trademark application
      return {
        name: "",
        description: "",
        classification: "",
        // Add any other default fields needed
      };
    } catch (error) {
      console.error("Error creating default trademark application:", error);
      return null;
    }
  };

  return {
    // Reexport functions from main hook with our enhancements
    saveApplicantsInfo: saveApplicantsInfoWithValidation,
    fetchInitialData: mainHook.fetchInitialData,
    checkExistingDisclosure: mainHook.checkExistingDisclosure,
    checkExistingDisclosureAndFetch,
    saveDisclosureConfirmation,
    submitIpDisclosure,
    saveTrademarkApplication,
    saveTradeSecretApplication,
    checkTrademarkExists,
    createDefaultTrademarkApplication,
    saveCopyrightApplication,
    savePatentUtilityModelApplication,

    // Pass through any other functions from mainHook that might be needed
    ...(mainHook as any),

    // State variables
    isLoading,
    isCreating,
    isUpdating,
    isSavingConfirmation,
    isSubmitting,
    hasCheckedExisting,
    // New function for fetching confirmation data
    fetchConfirmationData,
  };
};
