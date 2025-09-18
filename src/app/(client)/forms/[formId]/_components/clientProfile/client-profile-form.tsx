"use client";

// Client Profile Form Component
//
// CHANGES IMPLEMENTED:
// 1. Added event listener for "applicationSwitched" events that properly resets and reloads form data
// 2. Enhanced data fetching with proper mounting/unmounting guards to prevent memory leaks
// 3. Improved error handling with meaningful error messages and fallback to empty form
// 4. Added mount safeguard to detect and fix inconsistencies between form state and active application
// 5. Implemented data consistency checks to reconcile localStorage with form state automatically
// 6. Added detailed logging to help trace data flow and identify potential issues
// 7. Fixed type safety issues with null handling for applicationId
// 8. Fixed infinite prompt issue with improved localStorage handling

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientInformation } from "./client-information";
import { EducationalBackground } from "./educational-background";
import { ClientBackgroundIP } from "./client-background-ip";
import { toast } from "sonner";
import { getFormPermissions, bypassPermissions } from "@/lib/auth/permissions";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { safeFetch } from "@/lib/utils";

// Add TypeScript declaration for window global methods
declare global {
  interface Window {
    updateIPFormStatus?: (
      formType: string,
      completed: boolean,
      applicationId: string
    ) => void;
    _apiRequestsInProgress?: Record<string, boolean>;
    _clientProfileFetchInProgress?: Record<string, boolean>;
  }
}

/**
 * Schema for the client profile form
 * This schema is used for any form-wide validation or data handling
 */
const clientProfileSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  businessType: z.enum(["company", "soleProprietor"]),
  // Add more fields as needed
});

/**
 * ClientProfileForm Component
 *
 * This is the main container component for the client profile form.
 * It manages:
 * - Tab navigation and state
 * - Form-wide data persistence
 * - Routing between different sections
 * - Role-based access control
 *
 * The form consists of three main tabs:
 * 1. Personal Information
 * 2. Educational Background
 * 3. Background IP
 */
export function ClientProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get the current tab parameter, default to "personal" if not provided
  const clientTabParam = searchParams.get("clientTab") || "personal";
  const { data: session } = useSession();
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("personal"); // Default to personal tab
  const [noActiveApplication, setNoActiveApplication] =
    useState<boolean>(false);

  // Get active application for form registry integration
  const { activeApplicationId, isLoading: isAppLoading } =
    useActiveApplication();

  // Reference to store client profile data separately
  const activeFormDataRef = useRef<any>(null);

  // Get permissions
  const permissions = getFormPermissions(session, formStatus);
  const isDevAdmin = bypassPermissions(session);

  // Use permissions or bypass for admin in development
  const canEdit = isDevAdmin || permissions.canEdit;
  const canSubmit = isDevAdmin || permissions.canSubmit;
  const canApprove = isDevAdmin || permissions.canApprove;

  // Form-wide state management
  const [formState, setFormState] = useState<{
    personal: any;
    education: any;
    background: any;
  }>({
    personal: null,
    education: null,
    background: null,
  });

  // Flag to prevent showing the localStorage prompt multiple times
  const [hasShownStoragePrompt, setHasShownStoragePrompt] = useState(false);
  // Ref to track if form data has been initialized
  const formInitializedRef = useRef(false);

  // Add form submission hook - important for registry integration
  const formSubmission = useFormSubmission({
    onSuccess: (data) => {
      console.log("[ClientProfileForm] Form submission successful:", data);
      toast.success("Client profile form registered successfully");
    },
    onError: (error) => {
      console.error("[ClientProfileForm] Form submission error:", error);
      toast.error(`Error registering form: ${error.message}`);
    },
  });

  // Add function to directly register the form in the submission registry
  const registerFormSubmission = async (clientProfileId: string) => {
    if (!activeApplicationId || !clientProfileId) {
      console.error(
        "[ClientProfileForm] Cannot register form without application ID or profile ID"
      );
      return null;
    }

    try {
      console.log(
        "[ClientProfileForm] Registering form submission in registry"
      );

      const profile = formState.personal || {};
      const fullName = `${profile.firstName || ""} ${
        profile.lastName || ""
      }`.trim();

      // Use the formSubmission hook to register the form
      const result = await formSubmission.registerFormDirect({
        sourceType: "client_profile",
        sourceId: clientProfileId,
        ipApplicationId: activeApplicationId,
        title: `Client Profile - ${fullName || "New Profile"}`,
        description: "Client profile form submission",
        status: "submitted",
        inventorsCreators: [{ name: fullName, role: "Applicant" }],
      });

      console.log("[ClientProfileForm] Form registered successfully:", result);
      return result;
    } catch (error) {
      console.error("[ClientProfileForm] Error registering form:", error);
      return null;
    }
  };

  // Add reference to keep track of registration attempts
  const registrationAttemptedRef = useRef<Record<string, boolean>>({});

  // Add effect to ensure form is registered when form data changes and status is submitted
  useEffect(() => {
    // If we have a client profile ID and the form is in submitted/approved state,
    // ensure it's registered in the form submission registry
    const ensureFormRegistered = async () => {
      // Skip if no application ID or not yet loaded
      if (!activeApplicationId || isLoading) return;

      if (formStatus === "submitted" || formStatus === "approved") {
        // Check if this profile has a form submission registry entry
        try {
          const profileIdFromState = activeFormDataRef.current?.clientId;

          // Skip if no profile ID or already attempted for this profile
          if (
            !profileIdFromState ||
            registrationAttemptedRef.current[profileIdFromState]
          )
            return;

          // Mark as attempted to prevent duplicate calls
          registrationAttemptedRef.current[profileIdFromState] = true;

          console.log(
            "[ClientProfileForm] Checking form registry status for profile:",
            profileIdFromState
          );

          // Check if form is already registered
          const registryEntry = await formSubmission
            .getFormBySource(
              "client_profile",
              profileIdFromState,
              activeApplicationId
            )
            .catch(() => null);

          if (!registryEntry) {
            console.log(
              "[ClientProfileForm] No registry entry found, creating one"
            );
            await registerFormSubmission(profileIdFromState);
          } else {
            console.log(
              "[ClientProfileForm] Registry entry already exists:",
              registryEntry
            );
          }
        } catch (error) {
          console.error(
            "[ClientProfileForm] Error checking/ensuring registry:",
            error
          );
        }
      }
    };

    ensureFormRegistered();
  }, [activeApplicationId, isLoading]);

  // Set the active tab when component mounts
  useEffect(() => {
    if (clientTabParam) {
      setActiveTab(clientTabParam);
    }
  }, [clientTabParam]);

  // Listen for application switched events and form data cleared events
  useEffect(() => {
    // Skip server-side rendering
    if (typeof window === "undefined") return;

    const handleFormDataCleared = () => {
      console.log("Form data cleared event received, resetting form state");
      // Clear localStorage data to prevent data leakage between applications
      localStorage.removeItem("clientInformationData");
      localStorage.removeItem("educationalBackgroundData");
      localStorage.removeItem("clientBackgroundIPData");
      // Reset all state and trigger a page reload to ensure clean state
      window.location.reload();
    };

    const handleApplicationSwitched = (event: CustomEvent) => {
      console.log(
        "Application switched event received, clearing localStorage and reloading form data"
      );
      // Clear localStorage data to prevent data leakage between applications
      localStorage.removeItem("clientInformationData");
      localStorage.removeItem("educationalBackgroundData");
      localStorage.removeItem("clientBackgroundIPData");

      // Reset form state to prevent showing stale data
      setFormState({
        personal: null,
        education: null,
        background: null,
      });

      // Instead of complex state management, simply reload the page
      window.location.reload();
    };

    window.addEventListener(
      "formDataCleared",
      handleFormDataCleared as EventListener
    );
    window.addEventListener(
      "applicationSwitched",
      handleApplicationSwitched as EventListener
    );

    return () => {
      window.removeEventListener(
        "formDataCleared",
        handleFormDataCleared as EventListener
      );
      window.removeEventListener(
        "applicationSwitched",
        handleApplicationSwitched as EventListener
      );
    };
  }, []);

  // Initialize form with local storage data if available
  useEffect(() => {
    if (typeof window === "undefined") return; // Skip server-side rendering
    if (!activeApplicationId || isAppLoading) return; // Wait for application to be ready
    if (formInitializedRef.current) return; // Skip if form is already initialized

    const initializeForm = async () => {
      try {
        console.log("[ClientProfileForm] Initializing form...");

        // Always fetch from API and ignore localStorage data
        await fetchDataFromAPI();
      } catch (error) {
        console.error(
          "[ClientProfileForm] Error during form initialization:",
          error
        );
        setIsLoading(false);

        // Initialize empty form as fallback
        initializeEmptyForm(false);
        formInitializedRef.current = true;
      }
    };

    initializeForm();
  }, [activeApplicationId, isAppLoading]);

  // Function to fetch data from API
  const fetchDataFromAPI = async () => {
    if (!activeApplicationId || !session?.user?.id) {
      console.log("[ClientProfileForm] Missing dependencies for API fetch", {
        hasActiveApp: !!activeApplicationId,
        hasUser: !!session?.user?.id,
      });

      setIsLoading(false);
      if (!activeApplicationId && session?.user?.id) {
        setNoActiveApplication(true);
      }
      formInitializedRef.current = true;
      return;
    }

    // Reset the no active application flag if we have an active application
    setNoActiveApplication(false);

    const cacheKey = `client-profile-fetch-${activeApplicationId}`;

    // Set up tracking to prevent duplicate requests
    if (!window._clientProfileFetchInProgress) {
      window._clientProfileFetchInProgress = {};
    }

    if (!window._apiRequestsInProgress) {
      window._apiRequestsInProgress = {};
    }

    // Check for existing requests
    if (window._clientProfileFetchInProgress[activeApplicationId]) {
      console.log(
        `[ClientProfileForm] Already fetching for ${activeApplicationId}`
      );
      return;
    }

    // Mark request as in progress
    window._clientProfileFetchInProgress[activeApplicationId] = true;
    window._apiRequestsInProgress[cacheKey] = true;

    try {
      console.log(
        `[ClientProfileForm] Fetching data for application: ${activeApplicationId}`
      );

      // First check if profile exists in submission registry
      const registryResponse = await safeFetch(
        `/api/form-registry/check?formType=client_profile&applicationId=${activeApplicationId}`,
        {},
        `registry-check-${activeApplicationId}`
      );

      let submissionExists = false;

      if (registryResponse.ok) {
        const registryData = await registryResponse.json();
        submissionExists = registryData?.exists || false;
        console.log(
          `[ClientProfileForm] Registry check: ${
            submissionExists ? "Entry exists" : "No entry found"
          }`
        );
      }

      // First check if this application has a client profile
      const existsResponse = await safeFetch(
        `/api/client-profile/exists/${activeApplicationId}`,
        {},
        `client-profile-exists-${activeApplicationId}`
      );

      if (existsResponse.status === 404) {
        console.log(
          `[ClientProfileForm] No profile found, initializing empty form`
        );
        // Pass the submission registry status to initializeEmptyForm
        initializeEmptyForm(submissionExists);
        formInitializedRef.current = true;
        return;
      }

      if (!existsResponse.ok) {
        throw new Error(
          `Failed to check profile: ${existsResponse.statusText}`
        );
      }

      // Parse the response
      const existsData = await existsResponse.json();
      const profileExists = existsData?.exists || false;

      if (profileExists) {
        // Profile exists, fetch the full data
        const url = `/api/client-profile?applicationId=${activeApplicationId}&formLoad=true&registerForm=${!submissionExists}`;
        const response = await safeFetch(
          url,
          {},
          `client-profile-data-${activeApplicationId}`
        );

        if (response.status === 404) {
          console.log(
            "[ClientProfileForm] Profile data not found, initializing empty form"
          );
          initializeEmptyForm(submissionExists);
          formInitializedRef.current = true;
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData.success && responseData.data) {
          console.log("[ClientProfileForm] Successfully loaded profile data");

          // Format API data for form use
          const personalData = {
            firstName: responseData.data.firstName || "",
            lastName: responseData.data.lastName || "",
            middleName: responseData.data.middleName || "",
            gender:
              typeof responseData.data.gender === "object"
                ? responseData.data.gender
                : { value: responseData.data.gender || "male" },
            age: responseData.data.age ? String(responseData.data.age) : "",
            citizenship:
              typeof responseData.data.citizenship === "object"
                ? responseData.data.citizenship
                : {
                    value: responseData.data.citizenship || "filipino",
                    otherValue: null,
                  },
            mailingAddress: responseData.data.mailingAddress || "",
            contactNumber: responseData.data.contactNumber || "",
            email: responseData.data.email || "",
            companyName: responseData.data.companyName || "",
            companyStreet: responseData.data.companyStreet || "",
            companyBarangay: responseData.data.companyBarangay || "",
            companyCityMunicipality:
              responseData.data.companyCityMunicipality || "",
            companyProvince: responseData.data.companyProvince || "",
            companyEmail: responseData.data.companyEmail || "",
            occupation: responseData.data.occupation || "",
          };

          const educationData = {
            highestDegree:
              typeof responseData.data.highestDegree === "object"
                ? responseData.data.highestDegree
                : {
                    value: responseData.data.highestDegree || "bachelor",
                    otherValue: null,
                  },
            degree: responseData.data.degree || "",
            profession: responseData.data.profession || "",
          };

          const backgroundData = {
            publishedResearch:
              typeof responseData.data.publishedResearch === "object"
                ? responseData.data.publishedResearch
                : { value: responseData.data.publishedResearch || "no" },
            developedMaterials:
              typeof responseData.data.developedMaterials === "object"
                ? responseData.data.developedMaterials
                : { value: responseData.data.developedMaterials || "no" },
            familiarWithIPRights:
              typeof responseData.data.familiarWithIpRights === "object"
                ? responseData.data.familiarWithIpRights
                : {
                    value: responseData.data.familiarWithIpRights
                      ? "yes"
                      : "no",
                  },
            ipExperience:
              typeof responseData.data.ipExperience === "object"
                ? responseData.data.ipExperience
                : {
                    hasExperience: "no",
                    types: {
                      patent: false,
                      copyright: false,
                      trademark: false,
                      industrialDesign: false,
                      utilityModel: false,
                      other: false,
                    },
                    otherSpecify: "",
                  },
          };

          // Update form state with API data
          setFormState({
            personal: personalData,
            education: educationData,
            background: backgroundData,
          });

          // Update localStorage with server data for consistency
          localStorage.setItem(
            "clientInformationData",
            JSON.stringify(personalData)
          );
          localStorage.setItem(
            "educationalBackgroundData",
            JSON.stringify(educationData)
          );
          localStorage.setItem(
            "clientBackgroundIPData",
            JSON.stringify(backgroundData)
          );

          // Set form status
          if (responseData.data.status) {
            setFormStatus(responseData.data.status);
          }

          // If we've successfully loaded data and it exists in the registry,
          // ensure the status is updated in the UI
          if (submissionExists) {
            updateFormSubmissionStatus(true);
          }

          // Store the profile data in our ref for later use
          activeFormDataRef.current = responseData.data;
          console.log(
            "[ClientProfileForm] Stored profile data in ref:",
            responseData.data
          );
        } else {
          console.log(
            "[ClientProfileForm] No data returned, initializing empty form"
          );
          initializeEmptyForm(submissionExists);
        }
      } else {
        // No profile exists for this application
        console.log(
          "[ClientProfileForm] No profile exists, initializing empty form"
        );
        initializeEmptyForm(submissionExists);
      }

      formInitializedRef.current = true;
    } catch (error) {
      console.error("[ClientProfileForm] Error fetching data:", error);

      setFetchError(error instanceof Error ? error.message : "Unknown error");

      toast.error("Error loading client profile", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to load client profile data",
      });

      // Initialize empty form as fallback
      initializeEmptyForm(false);
    } finally {
      setIsLoading(false);

      // Clear request tracking flags
      if (window._apiRequestsInProgress) {
        delete window._apiRequestsInProgress[cacheKey];
      }

      if (window._clientProfileFetchInProgress) {
        delete window._clientProfileFetchInProgress[activeApplicationId];
      }

      formInitializedRef.current = true;
    }
  };

  // Helper function to update form submission status in UI
  const updateFormSubmissionStatus = (completed: boolean) => {
    if (!activeApplicationId) {
      console.log(
        "[ClientProfileForm] Cannot update form status: No active application ID"
      );
      return;
    }

    console.log(
      `[ClientProfileForm] Updating form status to: ${
        completed ? "completed" : "incomplete"
      } for application ID: ${activeApplicationId}`
    );

    // Update UI through the global handler if available
    if (window.updateIPFormStatus) {
      console.log(
        "[ClientProfileForm] Using global updateIPFormStatus handler"
      );
      window.updateIPFormStatus(
        "clientProfile",
        completed,
        activeApplicationId
      );
    } else {
      // Fallback to custom event
      console.log("[ClientProfileForm] Using custom event fallback");
      const event = new CustomEvent("clientProfileFormCompleted", {
        detail: { completed, applicationId: activeApplicationId },
      });
      window.dispatchEvent(event);
    }
  };

  // Add function to dispatch form completed events
  const dispatchFormCompleted = (
    clientProfileId?: string,
    registryId?: string
  ) => {
    if (typeof window !== "undefined" && activeApplicationId) {
      console.log("[ClientProfileForm] Dispatching form completed events");

      // Dispatch standard form_completed event
      const formCompletedEvent = new CustomEvent("form_completed", {
        detail: {
          formType: "client_profile",
          completed: true,
          applicationId: activeApplicationId,
          ...(clientProfileId && { clientProfileId }), // Include profile ID if available
          ...(registryId && { registryId }), // Include registry ID if available
        },
      });
      window.dispatchEvent(formCompletedEvent);

      // Dispatch component-specific event
      const specificFormCompletedEvent = new CustomEvent(
        "clientProfileFormCompleted",
        {
          detail: {
            completed: true,
            applicationId: activeApplicationId,
            ...(clientProfileId && { clientProfileId }),
            ...(registryId && { registryId }),
          },
        }
      );
      window.dispatchEvent(specificFormCompletedEvent);

      console.log("[ClientProfileForm] Form completed events dispatched");
    }
  };

  // Add event listener for client profile submission events
  useEffect(() => {
    // Function to handle submission event
    const handleSubmissionEvent = (event: Event) => {
      // Type the event correctly
      const customEvent = event as CustomEvent<{
        applicationId: string;
        clientProfileId?: string;
        registryId?: string;
      }>;

      console.log(
        "Client profile submission event received:",
        customEvent.detail
      );

      // Update form status and refresh data if needed
      if (customEvent.detail.applicationId === activeApplicationId) {
        updateFormSubmissionStatus(true);

        // Force a fresh fetch on next load
        localStorage.removeItem("clientInformationData");
        localStorage.removeItem("educationalBackgroundData");
        localStorage.removeItem("clientBackgroundIPData");

        // Increment refresh trigger or reload page if needed
        window.location.reload();
      }
    };

    // Add event listener
    window.addEventListener(
      "clientProfileSubmitted",
      handleSubmissionEvent as EventListener
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "clientProfileSubmitted",
        handleSubmissionEvent as EventListener
      );
    };
  }, [activeApplicationId]);

  // Helper function to initialize empty personal data
  const initializeEmptyPersonalData = () => {
    return {
      firstName: "",
      lastName: "",
      middleName: "",
      gender: { value: "male" },
      age: "",
      citizenship: { value: "filipino", otherValue: null },
      mailingAddress: "",
      contactNumber: "",
      email: "",
      companyName: "",
      companyStreet: "",
      companyBarangay: "",
      companyCityMunicipality: "",
      companyProvince: "",
      companyEmail: "",
      occupation: "",
    };
  };

  // Helper function to initialize empty education data
  const initializeEmptyEducationData = () => {
    return {
      highestDegree: { value: "bachelor", otherValue: null },
      degree: "",
      profession: "",
    };
  };

  // Helper function to initialize empty background data
  const initializeEmptyBackgroundData = () => {
    return {
      publishedResearch: { value: "no" },
      developedMaterials: { value: "no" },
      familiarWithIPRights: { value: "no" },
      ipExperience: {
        hasExperience: "no",
        types: {
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        },
        otherSpecify: "",
      },
    };
  };

  // Add the helper function to initialize empty form fields
  const initializeEmptyForm = (registryEntryExists: boolean = false) => {
    console.log("[ClientProfileForm] Initializing empty form fields");

    // Update form state with empty data
    setFormState({
      personal: initializeEmptyPersonalData(),
      education: initializeEmptyEducationData(),
      background: initializeEmptyBackgroundData(),
    });

    // Clear any stored form data in localStorage for this form
    try {
      // Clear both legacy and application-specific keys
      localStorage.removeItem("clientInformationData");
      localStorage.removeItem("educationalBackgroundData");
      localStorage.removeItem("clientBackgroundIPData");

      // Also clear application-specific keys if we have an active application
      if (activeApplicationId) {
        localStorage.removeItem(`clientInformationData-${activeApplicationId}`);
        localStorage.removeItem(
          `educationalBackgroundData-${activeApplicationId}`
        );
        localStorage.removeItem(
          `clientBackgroundIPData-${activeApplicationId}`
        );
      }

      // Trigger a custom event to notify the application that the form is not completed
      // unless we have a registry entry already
      if (!registryEntryExists) {
        const event = new CustomEvent("clientProfileFormReset", {
          detail: {
            completed: false,
            applicationId: activeApplicationId || "",
          },
        });
        window.dispatchEvent(event);
      } else {
        // If registry entry exists, update UI to show form is completed
        updateFormSubmissionStatus(true);
      }

      // Only use updateIPFormStatus if we have a valid application ID
      // And we're intentionally submitting the form (not just viewing)
      if (window.updateIPFormStatus && activeApplicationId) {
        // Don't automatically update form status when initializing empty form
        // unless we already have a registry entry
        if (registryEntryExists) {
          window.updateIPFormStatus("clientProfile", true, activeApplicationId);
        } else {
          console.log(
            "[ClientProfileForm] Skipping form status update for initialization"
          );
        }
      }
    } catch (error) {
      console.error("Error clearing form data from localStorage:", error);
    }

    // Reset form status to draft
    setFormStatus("draft");
  };

  // Handle tab changes - Now updates URL with clientTab parameter
  const handleTabChange = (value: string) => {
    setActiveTab(value); // Set active tab in component state

    // Update URL with the new tab
    const params = new URLSearchParams(searchParams.toString());
    params.set("clientTab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Determine if form is disabled based on permissions and status
  const isFormDisabled = !canEdit || (formStatus !== "draft" && !canApprove);

  if (isLoading) {
    return (
      <div className="p-8 text-center">Loading client profile data...</div>
    );
  }

  // Show message if no active application is selected
  if (noActiveApplication) {
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
                {session?.user.id ? (
                  <>
                    You need to create an IP application before you can fill out
                    a client profile form. Please create a new IP application
                    using the button below.
                  </>
                ) : (
                  <>
                    Welcome to our IP Management system! As a new user, you'll
                    need to create your first IP application before filling out
                    any forms.
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

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      {activeApplicationId && (
        <div className="bg-green-50 border border-green-100 rounded-md p-3 mb-4">
          <div className="flex items-center gap-2">
            {formStatus === "approved" ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : formStatus === "rejected" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-green-600"></div>
            )}
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Client Profile Form
                {formStatus === "approved" && " (Approved)"}
                {formStatus === "rejected" && " (Needs Revision)"}
              </h3>
              <p className="text-xs text-green-700">
                {formStatus === "approved" ? (
                  <>This form has been approved.</>
                ) : formStatus === "rejected" ? (
                  <>This form has been rejected and needs revision.</>
                ) : (
                  <>
                    Fill out your personal information, educational background,
                    and IP experience. Fields marked with an asterisk (*) are
                    required.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form header */}
      <div className="mb-4">
        <h2 className="text-xl font-medium text-[#1B5E20]">
          Client Profile Form
        </h2>
        <p className="text-sm text-muted-foreground">
          Fill out your personal details below. You can navigate between
          sections using the tabs.
        </p>
      </div>

      <Tabs
        defaultValue="personal"
        value={activeTab}
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-3 bg-muted/10 p-1 rounded-none border-b">
          <TabsTrigger
            value="personal"
            className="relative px-3 py-2 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Personal Information
          </TabsTrigger>
          <TabsTrigger
            value="education"
            className="relative px-3 py-2 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Educational Background
          </TabsTrigger>
          <TabsTrigger
            value="background"
            className="relative px-3 py-2 text-sm font-medium text-muted-foreground
            data-[state=active]:text-[#1B5E20] data-[state=active]:bg-transparent
            data-[state=active]:after:absolute data-[state=active]:after:bottom-0 
            data-[state=active]:after:left-0 data-[state=active]:after:right-0
            data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#1B5E20]
            hover:text-[#1B5E20]/80 transition-colors"
          >
            Background IP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <ClientInformation
            initialData={formState.personal}
            isDisabled={isFormDisabled}
            formStatus={formStatus}
          />
        </TabsContent>
        <TabsContent value="education" className="mt-6">
          <EducationalBackground
            initialData={formState.education}
            isDisabled={isFormDisabled}
            formStatus={formStatus}
          />
        </TabsContent>
        <TabsContent value="background" className="mt-6">
          <ClientBackgroundIP
            initialData={formState.background}
            isDisabled={isFormDisabled}
            formStatus={formStatus}
            canApprove={canApprove}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
