"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { safeFetch } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Add TypeScript declaration for window global methods
declare global {
  interface Window {
    updateIPFormStatus?: (
      formType: string,
      completed: boolean,
      applicationId: string
    ) => void;
  }
}

/**
 * Form schema for background IP information
 *
 * The schema is divided into four main sections:
 * 1. Research Publication Status (yes/no/submitted)
 * 2. Instructional Materials Development (yes/no/ongoing)
 * 3. IP Rights Knowledge
 * 4. IP Protection Experience (with detailed type selection)
 */
const formSchema = z.object({
  publishedResearch: z.object({
    value: z.enum(["yes", "no", "submitted"]).nullable(),
  }),
  developedMaterials: z.object({
    value: z.enum(["yes", "no", "ongoing"]).nullable(),
  }),
  familiarWithIPRights: z.object({
    value: z.enum(["yes", "no"]).nullable(),
  }),
  ipExperience: z.object({
    hasExperience: z.enum(["yes", "no"]).nullable(),
    types: z
      .object({
        patent: z.boolean().default(false),
        copyright: z.boolean().default(false),
        trademark: z.boolean().default(false),
        industrialDesign: z.boolean().default(false),
        utilityModel: z.boolean().default(false),
        other: z.boolean().default(false),
      })
      .default({
        patent: false,
        copyright: false,
        trademark: false,
        industrialDesign: false,
        utilityModel: false,
        other: false,
      }),
    otherSpecify: z.string().optional(),
  }),
});

// Add these props to the component
interface ClientBackgroundIPProps {
  initialData?: any;
  isDisabled?: boolean;
  formStatus?: string;
  canApprove?: boolean;
  disableLocalStorage?: boolean;
  onDraftChange?: (key: string, value: string | null) => void;
}

/**
 * ClientBackgroundIP Component
 *
 * This component handles the background IP tab of the client profile form.
 * It is the final tab in the client profile form sequence.
 *
 * It manages:
 * - Research and publication experience
 * - Instructional materials development status
 * - IP rights knowledge assessment
 * - IP protection experience with detailed type selection
 *
 * Features:
 * - Data persistence using localStorage
 * - Conditional rendering for IP types selection
 * - Form validation
 * - Error handling
 * - Final form submission handling
 * - Navigation to previous tab
 */
export function ClientBackgroundIP({
  initialData,
  isDisabled = false,
  formStatus = "draft",
  canApprove = false,
  disableLocalStorage = false,
  onDraftChange,
}: ClientBackgroundIPProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "background";
  const { data: session } = useSession();
  const [formStatusState, setFormStatusState] = useState(formStatus);
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ipTypeCheckboxes, setIpTypeCheckboxes] = useState<{
    patent: boolean;
    copyright: boolean;
    trademark: boolean;
    industrialDesign: boolean;
    utilityModel: boolean;
    other: boolean;
  }>({
    patent: false,
    copyright: false,
    trademark: false,
    industrialDesign: false,
    utilityModel: false,
    other: false,
  });

  // Get active application for registry integration
  const { activeApplicationId } = useActiveApplication();

  const canUseStorage =
    !disableLocalStorage && typeof window !== "undefined";
  const getStorageItem = (key: string) =>
    canUseStorage ? localStorage.getItem(key) : null;
  const setStorageItem = (key: string, value: string) => {
    if (canUseStorage) {
      localStorage.setItem(key, value);
      return;
    }
    onDraftChange?.(key, value);
  };
  const removeStorageItem = (key: string) => {
    if (canUseStorage) {
      localStorage.removeItem(key);
      return;
    }
    onDraftChange?.(key, null);
  };

  // Add form submission hook for registry integration
  const formSubmission = useFormSubmission({
    onSuccess: (data) => {
      console.log("[ClientBackgroundIP] Form registry successful:", data);
    },
    onError: (error) => {
      console.error("[ClientBackgroundIP] Form registry error:", error);
    },
  });

  // Initialize the form first before using it
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      publishedResearch: { value: null },
      developedMaterials: { value: null },
      familiarWithIPRights: { value: null },
      ipExperience: {
        hasExperience: null,
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
    },
  });

  // Load initial data or saved data on component mount or when tab changes
  useEffect(() => {
    try {
      // Skip loading if component is already loaded
      if (isLoading || !activeApplicationId) return;

      setIsLoading(true);

      // First try to load from localStorage to get the most recent changes
      const savedData = getStorageItem("clientBackgroundIPData");
      let formattedData;

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(
          "Found saved client background IP data in localStorage:",
          parsedData
        );

        // Use the saved data from localStorage as primary source
        formattedData = { ...parsedData };

        // Ensure the ipExperience structure is valid
        if (!formattedData.ipExperience) {
          formattedData.ipExperience = {
            hasExperience: null,
            types: {
              patent: false,
              copyright: false,
              trademark: false,
              industrialDesign: false,
              utilityModel: false,
              other: false,
            },
          };
        } else if (
          formattedData.ipExperience.hasExperience &&
          !formattedData.ipExperience.types
        ) {
          formattedData.ipExperience.types = {
            patent: false,
            copyright: false,
            trademark: false,
            industrialDesign: false,
            utilityModel: false,
            other: false,
          };
        }

        // If user has no IP experience, ensure types array is empty
        if (
          formattedData.ipExperience &&
          formattedData.ipExperience.hasExperience === false
        ) {
          formattedData.ipExperience.types = {
            patent: false,
            copyright: false,
            trademark: false,
            industrialDesign: false,
            utilityModel: false,
            other: false,
          };
        }

        console.log("Using localStorage data as priority:", formattedData);
      }
      // If no localStorage data but initialData exists, use that
      else if (initialData) {
        console.log(
          "No localStorage data found, using initialData:",
          initialData
        );

        // Format the initial data
        formattedData = { ...initialData };

        // Ensure the ipExperience structure is valid
        if (!formattedData.ipExperience) {
          formattedData.ipExperience = {
            hasExperience: null,
            types: {
              patent: false,
              copyright: false,
              trademark: false,
              industrialDesign: false,
              utilityModel: false,
              other: false,
            },
          };
        } else if (
          formattedData.ipExperience.hasExperience &&
          !formattedData.ipExperience.types
        ) {
          formattedData.ipExperience.types = {
            patent: false,
            copyright: false,
            trademark: false,
            industrialDesign: false,
            utilityModel: false,
            other: false,
          };
        }

        // If user has no IP experience, ensure types array is empty
        if (
          formattedData.ipExperience &&
          formattedData.ipExperience.hasExperience === false
        ) {
          formattedData.ipExperience.types = {
            patent: false,
            copyright: false,
            trademark: false,
            industrialDesign: false,
            utilityModel: false,
            other: false,
          };
        }

        // Also save initialData to localStorage for consistency
        setStorageItem(
          "clientBackgroundIPData",
          JSON.stringify(formattedData)
        );
      }

      // If we have data from either source, use it
      if (formattedData) {
        console.log("Setting form with data:", formattedData);

        // Ensure the form is reset with the correct data
        setTimeout(() => {
          form.reset({
            publishedResearch: formattedData.publishedResearch || { value: null },
            developedMaterials: formattedData.developedMaterials || {
              value: null,
            },
            familiarWithIPRights: formattedData.familiarWithIPRights || {
              value: null,
            },
            ipExperience: {
              hasExperience:
                formattedData.ipExperience?.hasExperience ?? null,
              types: formattedData.ipExperience?.types || {
                patent: false,
                copyright: false,
                trademark: false,
                industrialDesign: false,
                utilityModel: false,
                other: false,
              },
              otherSpecify: formattedData.ipExperience?.otherSpecify || "",
            },
          });

          setFormData(formattedData);
          setIsFormLoaded(true);
        }, 0);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error("Error loading saved data:", errorObj);
      setError(errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [initialData, form, activeApplicationId, currentTab]);

  // Watch for tab changes and save state when leaving
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;


    // Add event listener for tab changes
    const handleTabChange = () => {
      if (isFormLoaded) {
        // Save current form state to localStorage
        const values = form.getValues();
        const formattedValues = formatData(values);
        console.log("Tab change detected, saving form state:", formattedValues);
        setStorageItem(
          "clientBackgroundIPData",
          JSON.stringify(formattedValues)
        );
      }
    };

    // Also listen for URL changes that don't trigger popstate
    const handleBeforeUnload = () => {
      if (isFormLoaded) {
        const values = form.getValues();
        const formattedValues = formatData(values);
        console.log(
          "Page unload detected, saving form state:",
          formattedValues
        );
        setStorageItem(
          "clientBackgroundIPData",
          JSON.stringify(formattedValues)
        );
      }
    };

    // Listen for URL param changes which indicate tab changes
    window.addEventListener("popstate", handleTabChange);
    // Also listen for tab navigation/page refresh
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function
    return () => {
      // Save state when component unmounts
      if (isFormLoaded) {
        const values = form.getValues();
        const formattedValues = formatData(values);
        console.log("Saving form data on component unmount:", formattedValues);
        setStorageItem(
          "clientBackgroundIPData",
          JSON.stringify(formattedValues)
        );
      }
      // Remove event listeners
      window.removeEventListener("popstate", handleTabChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form, isFormLoaded]);

  // Helper function to format data consistently
  const formatData = (data: any) => {
    // Create a deep copy to avoid mutating the original data
    const formattedData: any = JSON.parse(JSON.stringify(data));

    // Ensure publishedResearch has correct structure and value
    if (formattedData.publishedResearch) {
      if (typeof formattedData.publishedResearch === "string") {
        formattedData.publishedResearch = {
          value: ["yes", "no", "submitted"].includes(
            formattedData.publishedResearch
          )
            ? formattedData.publishedResearch
            : null,
        };
      } else if (typeof formattedData.publishedResearch === "object") {
        if (
          !["yes", "no", "submitted"].includes(
            formattedData.publishedResearch.value
          )
        ) {
          formattedData.publishedResearch.value = null;
        }
      }
    } else {
      formattedData.publishedResearch = { value: null };
    }

    // Ensure developedMaterials has correct structure and value
    if (formattedData.developedMaterials) {
      if (typeof formattedData.developedMaterials === "string") {
        formattedData.developedMaterials = {
          value: ["yes", "no", "ongoing"].includes(
            formattedData.developedMaterials
          )
            ? formattedData.developedMaterials
            : null,
        };
      } else if (typeof formattedData.developedMaterials === "object") {
        if (
          !["yes", "no", "ongoing"].includes(
            formattedData.developedMaterials.value
          )
        ) {
          formattedData.developedMaterials.value = null;
        }
      }
    } else {
      formattedData.developedMaterials = { value: null };
    }

    // Ensure familiarWithIPRights has correct structure and value
    if (formattedData.familiarWithIPRights) {
      if (typeof formattedData.familiarWithIPRights === "string") {
        formattedData.familiarWithIPRights = {
          value: ["yes", "no"].includes(formattedData.familiarWithIPRights)
            ? formattedData.familiarWithIPRights
            : null,
        };
      } else if (typeof formattedData.familiarWithIPRights === "object") {
        if (!["yes", "no"].includes(formattedData.familiarWithIPRights.value)) {
          formattedData.familiarWithIPRights.value = null;
        }
      }
    } else {
      formattedData.familiarWithIPRights = { value: null };
    }

    // Ensure ipExperience has correct structure
    if (
      !formattedData.ipExperience ||
      typeof formattedData.ipExperience !== "object"
    ) {
      formattedData.ipExperience = {
        hasExperience: null,
        types: {
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        },
        otherSpecify: "",
      };
    } else if (formattedData.ipExperience) {
      // Ensure hasExperience is "yes" or "no" or null
      if (
        !["yes", "no"].includes(formattedData.ipExperience.hasExperience) &&
        formattedData.ipExperience.hasExperience !== null
      ) {
        formattedData.ipExperience.hasExperience = null;
      }

      // Initialize types if missing
      if (!formattedData.ipExperience.types) {
        formattedData.ipExperience.types = {
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        };
      }

      // If user has no IP experience, ensure types array is empty
      if (
        formattedData.ipExperience &&
        formattedData.ipExperience.hasExperience === false
      ) {
        setIpTypeCheckboxes({
          patent: false,
          copyright: false,
          trademark: false,
          industrialDesign: false,
          utilityModel: false,
          other: false,
        });
      }
    }

    return formattedData;
  };

  // Modify the saveFormState to use the formatData function
  const saveFormState = () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return null;

    try {
      // Only save if the form is loaded to avoid overwriting with default values
      if (isFormLoaded) {
        const values = form.getValues();
        // Use the proper formatData function
        const formattedValues = formatData(values);
        setStorageItem(
          "clientBackgroundIPData",
          JSON.stringify(formattedValues)
        );
        console.log(
          "Saved current form state to localStorage:",
          formattedValues
        );
        setFormData(formattedValues);
        return formattedValues;
      } else {
        console.log("Form not fully loaded yet, skipping save operation");
        return null;
      }
    } catch (err) {
      console.error("Error saving form state:", err);
      return null;
    }
  };

  // Watch fields for conditional rendering
  const hasIPExperience = form.watch("ipExperience.hasExperience");

  // Watch fields for disabling the "Submit Form" button
  const publishedResearch = form.watch("publishedResearch.value");
  const developedMaterials = form.watch("developedMaterials.value");
  const familiarWithIPRights = form.watch("familiarWithIPRights.value");
  const ipExperienceTypes = form.watch("ipExperience.types");
  const otherSpecify = form.watch("ipExperience.otherSpecify");

  let isSubmitDisabled =
    !publishedResearch ||
    !developedMaterials ||
    !familiarWithIPRights ||
    !hasIPExperience;

  if (hasIPExperience === "yes") {
    const hasOneType = Object.values(ipExperienceTypes).some((v) => v);
    if (!hasOneType) {
      isSubmitDisabled = true;
    }
    if (ipExperienceTypes.other && !otherSpecify?.trim()) {
      isSubmitDisabled = true;
    }
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    if (isDisabled) {
      toast.error("Form is currently locked and cannot be submitted");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get active application ID
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsSubmitting(false);
        return;
      }

      // Store in localStorage for form persistence
      setStorageItem("clientBackgroundIPData", JSON.stringify(values));
      setFormData(values);

      // Show loading toast
      const toastId = toast.loading("Submitting Form", {
        description: "Please wait while we process your submission...",
      });

      // First, check if a profile already exists for this application
      console.log(
        `Checking if profile exists for application: ${applicationId}`
      );
      const checkResponse = await fetch(
        `/api/client-profile/exists/${applicationId}`
      );
      const checkData = await checkResponse.json();

      // Format the background IP data
      const formattedBackgroundIp = formatData(values);

      // Format data for API
      const apiData = {
        backgroundIP: formattedBackgroundIp,
        status: "draft", // Changed from "submitted" to "draft"
        applicationId: applicationId, // Include application ID
      };

      // Determine whether to use POST (create) or PUT (update)
      const method = checkData.exists ? "PUT" : "POST";
      console.log(
        `Using ${method} method for background IP submission. Profile exists: ${checkData.exists}`
      );

      // Submit to API
      const response = await fetch("/api/client-profile", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to save background IP information"
        );
      }

      // Update the client profile form status
      if (window.updateIPFormStatus) {
        window.updateIPFormStatus("clientProfile", true, applicationId);
      } else {
        // Fallback to custom event
        const event = new CustomEvent("clientProfileFormCompleted", {
          detail: { completed: true, applicationId },
        });
        window.dispatchEvent(event);
      }

      // Dismiss loading toast
      toast.dismiss(toastId);

      // Show success toast
      toast.success("Client Profile Submitted!", {
        description:
          "Your information has been successfully submitted to the system.",
      });

      // If button click was "next" or "finish", handle accordingly
      if (clickedButton === "finish") {
        handleFinishClick();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving your data"
      );
    } finally {
      setIsSubmitting(false);
      setClickedButton(null);
    }
  }

  // Handle update without submission
  async function handleUpdate() {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    try {
      setIsUpdating(true);

      // Get active application ID
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsUpdating(false);
        return;
      }

      // Get form values from the current tab
      const currentFormValues = form.getValues();

      // Format the current background IP data
      const formattedBackgroundIp = formatData(currentFormValues);

      // Save current form data to localStorage
      setStorageItem(
        "clientBackgroundIPData",
        JSON.stringify(formattedBackgroundIp)
      );

      // Load data from all tabs via localStorage
      let personalInfo = {};
      let educationalBackground = {};

      try {
        // Get personal information data
        const personalData = getStorageItem("clientInformationData");
        if (personalData) {
          personalInfo = JSON.parse(personalData);
          console.log(
            "Loaded personal information data for update:",
            personalInfo
          );
        }

        // Get educational background data
        const educationData = getStorageItem("educationalBackgroundData");
        if (educationData) {
          educationalBackground = JSON.parse(educationData);
          console.log(
            "Loaded educational background data for update:",
            educationalBackground
          );
        }
      } catch (err) {
        console.error("Error loading data from other tabs:", err);
      }

      // Show loading toast
      toast.loading("Updating All Form Data", {
        description: "Please wait while we save your forms...",
      });

      // First, check if a profile already exists for this application
      console.log(
        `Checking if profile exists for application: ${applicationId}`
      );
      const checkResponse = await fetch(
        `/api/client-profile/exists/${applicationId}`
      );
      const checkData = await checkResponse.json();

      // Format data for API - include data from all tabs
      const apiData = {
        personalInfo: personalInfo,
        educationalBackground: educationalBackground,
        backgroundIP: formattedBackgroundIp,
        status: "draft",
        applicationId: applicationId, // Include application ID
      };

      // Determine whether to use POST (create) or PUT (update)
      const method = checkData.exists ? "PUT" : "POST";
      console.log(
        `Using ${method} method for complete profile update. Profile exists: ${checkData.exists}`
      );

      // Submit to API for update
      const response = await fetch("/api/client-profile", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update form");
      }

      const result = await response.json();

      // Update the client profile form status
      if (window.updateIPFormStatus) {
        window.updateIPFormStatus("clientProfile", true, activeApplicationId);
      } else {
        // Fallback to custom event
        const event = new CustomEvent("clientProfileFormCompleted", {
          detail: { completed: true, applicationId },
        });
        window.dispatchEvent(event);
      }

      // Dismiss loading toast
      toast.dismiss();

      // Show success toast
      toast.success("All Profile Data Updated", {
        description: "Your changes for all tabs have been saved.",
      });

      console.log("Form updated successfully:", result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error updating form:", error);
      setError(error);

      // Dismiss loading toast
      toast.dismiss();

      // Show error toast
      toast.error("Error Updating Forms", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle approval/rejection
  async function handleApproval(newStatus: "approved" | "rejected") {
    try {
      setIsApproving(true);

      // Get active application ID
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsApproving(false);
        return;
      }

      // Show loading toast
      toast.loading(
        `${newStatus === "approved" ? "Approving" : "Rejecting"} Form`,
        {
          description: "Please wait while we process your request...",
        }
      );

      // First, check if a profile already exists for this application
      const checkResponse = await fetch(
        `/api/client-profile/exists/${applicationId}`
      );
      const checkData = await checkResponse.json();

      if (!checkData.exists) {
        throw new Error(
          "Cannot approve/reject: No profile found for this application"
        );
      }

      // Submit to API for status update
      const response = await fetch("/api/client-profile", {
        method: "PUT", // Always use PUT for status updates as the profile must exist
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          applicationId: applicationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${newStatus} form`);
      }

      const result = await response.json();

      // Update form status
      setFormStatusState(newStatus);

      // Dismiss loading toast
      toast.dismiss();

      // Show success toast
      if (newStatus === "approved") {
        toast.success("Form Approved Successfully", {
          description:
            "The client profile has been approved and the user has been notified.",
        });
      } else {
        toast.error("Form Rejected", {
          description:
            "The client profile has been rejected and the user has been notified.",
        });
      }

      console.log(`Form ${newStatus} successfully:`, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error ${newStatus} form:`, error);
      setError(error);

      // Dismiss loading toast
      toast.dismiss();

      // Show error toast
      toast.error(
        `Error ${newStatus === "approved" ? "Approving" : "Rejecting"} Form`,
        {
          description: error.message || "An unexpected error occurred",
        }
      );
    } finally {
      setIsApproving(false);
    }
  }

  // Update the handlePreviousClick to use formatData
  const handlePreviousClick = () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    try {
      // Get the current form values
      const values = form.getValues();

      // Format and validate the data before saving
      const formattedValues = formatData(values);

      // Save to localStorage without making an API call
      setStorageItem(
        "clientBackgroundIPData",
        JSON.stringify(formattedValues)
      );
      console.log("Background IP data saved to localStorage:", formattedValues);

      // If we have an active application, update the form status silently
      if (activeApplicationId && window.updateIPFormStatus) {
        window.updateIPFormStatus("clientProfile", true, activeApplicationId);
      }

      // Navigate to the previous tab by updating URL params
      const url = new URL(window.location.href);
      url.searchParams.set("clientTab", "education");
      window.history.pushState({}, "", url);

      // Trigger a navigation event to ensure the UI updates
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      console.error("Error saving form data or navigating:", error);
    }
  };

  // Handle form completion without API submission
  const handleCompleteForm = async () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    try {
      setIsSubmitting(true);

      // Run validation manually first
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Show loading toast immediately
      const toastId = toast.loading("Submitting Form", {
        description: "Please wait while we save all your information...",
      });

      // IMPORTANT: Ensure we use the most current application ID directly from the hook
      // This prevents stale cached IDs from being used
      const applicationId = activeApplicationId;
      console.log(
        "[ClientBackgroundIP] Preparing to submit form with application ID:",
        applicationId
      );

      // Double-check localStorage for consistency
      const storedActiveAppId = getStorageItem("activeApplicationId");
      if (storedActiveAppId !== applicationId) {
        console.warn(
          "[ClientBackgroundIP] Application ID mismatch detected before submission:",
          {
            hookAppId: applicationId,
            storedAppId: storedActiveAppId,
          }
        );

        // Force synchronization
        if (applicationId) {
          setStorageItem("activeApplicationId", applicationId);
          console.log(
            "[ClientBackgroundIP] Corrected application ID in localStorage to:",
            applicationId
          );
        } else if (storedActiveAppId) {
          // If hook has no application ID but localStorage does, use the localStorage value
          console.log(
            "[ClientBackgroundIP] Using localStorage application ID:",
            storedActiveAppId
          );
        }
      }

      // Final application ID check
      const finalApplicationId = applicationId || storedActiveAppId;
      if (!finalApplicationId) {
        toast.dismiss(toastId);
        toast.error("No active application selected", {
          description: "Please select or create an application first.",
        });
        return;
      }

      console.log(
        "[ClientBackgroundIP] Final application ID for submission:",
        finalApplicationId
      );

      // Get form values from the current tab
      const currentFormValues = form.getValues();

      // Format the current background IP data
      const formattedBackgroundIp = formatData(currentFormValues);

      // Save current form data to localStorage
      setStorageItem(
        "clientBackgroundIPData",
        JSON.stringify(formattedBackgroundIp)
      );

      // Load data from all tabs via localStorage
      let personalInfo = {};
      let educationalBackground = {};

      try {
        // Get personal information data
        const personalData = getStorageItem("clientInformationData");
        if (personalData) {
          personalInfo = JSON.parse(personalData);
          console.log(
            "Loaded personal information data for submission:",
            personalInfo
          );
        } else {
          toast.dismiss(toastId);
          toast.error("Missing Personal Information", {
            description: "Please complete the Personal Information tab first.",
          });
          return;
        }

        // Get educational background data
        const educationData = getStorageItem("educationalBackgroundData");
        if (educationData) {
          educationalBackground = JSON.parse(educationData);
          console.log(
            "Loaded educational background data for submission:",
            educationalBackground
          );
        } else {
          toast.dismiss(toastId);
          toast.error("Missing Educational Background", {
            description:
              "Please complete the Educational Background tab first.",
          });
          return;
        }
      } catch (err) {
        console.error("Error loading data from other tabs:", err);
        toast.dismiss(toastId);
        toast.error("Error processing form data", {
          description: "Could not load data from previous tabs.",
        });
        return;
      }

      // First, check if a profile already exists for this application
      console.log(
        `Checking if profile exists for application: ${finalApplicationId}`
      );

      const checkResponse = await safeFetch(
        `/api/client-profile/exists/${finalApplicationId}`,
        {},
        `client-profile-exists-check-${finalApplicationId}`
      );
      const checkData = await checkResponse.json();

      // Format data for API - include data from all tabs
      const apiData = {
        personalInfo: personalInfo,
        educationalBackground: educationalBackground,
        backgroundIP: formattedBackgroundIp,
        status: "submitted", // Set status to submitted on completion
        applicationId: finalApplicationId, // Include application ID
      };

      // Determine whether to use POST (create) or PUT (update)
      const method = checkData.exists ? "PUT" : "POST";
      console.log(
        `Using ${method} method for complete profile submission. Profile exists: ${checkData.exists}`
      );

      // Submit to API with safeFetch
      const response = await safeFetch(
        "/api/client-profile",
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        },
        `client-profile-submit-${finalApplicationId}-${method}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      const result = await response.json();

      // Update the client profile form status
      if (window.updateIPFormStatus) {
        window.updateIPFormStatus("clientProfile", true, finalApplicationId);
      } else {
        // Fallback to custom event
        const event = new CustomEvent("clientProfileFormCompleted", {
          detail: { completed: true, applicationId: finalApplicationId },
        });
        window.dispatchEvent(event);
      }

      // Now explicitly ensure form registry entry exists
      try {
        console.log(
          "[ClientBackgroundIP] Ensuring form is registered in the submission registry..."
        );

        // Use direct fetch instead of the hook function
        let registryExists = false;

        try {
          const checkUrl = new URL(
            "/api/form-registry/check",
            window.location.origin
          );
          checkUrl.searchParams.append("sourceType", "client_profile");
          checkUrl.searchParams.append("ipApplicationId", finalApplicationId);
          checkUrl.searchParams.append("sourceId", result.data.clientId);

          console.log(
            "[ClientBackgroundIP] Checking registry with URL:",
            checkUrl.toString()
          );

          const checkRegistryResponse = await fetch(checkUrl.toString(), {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (checkRegistryResponse.ok) {
            const checkData = await checkRegistryResponse.json();
            registryExists = checkData.exists;
            console.log(
              "[ClientBackgroundIP] Registry check result:",
              checkData
            );
          } else {
            console.error(
              "[ClientBackgroundIP] Error checking registry:",
              checkRegistryResponse.status,
              checkRegistryResponse.statusText
            );

            // Try to log response body for more details
            try {
              const errorText = await checkRegistryResponse.text();
              console.error(
                "[ClientBackgroundIP] Registry check error details:",
                errorText
              );
            } catch (parseError) {
              console.error(
                "[ClientBackgroundIP] Could not parse registry error response:",
                parseError
              );
            }

            // Proceed with registry creation anyway as fallback
            registryExists = false;
          }
        } catch (checkError) {
          console.error(
            "[ClientBackgroundIP] Exception checking registry:",
            checkError
          );
          // Proceed with registry creation as fallback
          registryExists = false;
        }

        if (!registryExists) {
          console.log("[ClientBackgroundIP] No registry found, creating one");

          try {
            // Create registry entry by directly calling the API
            console.log("[ClientBackgroundIP] Calling API to create registry");

            const registryParams = {
              sourceType: "client_profile",
              sourceId: result.data.clientId,
              ipApplicationId: finalApplicationId,
              status: "submitted",
              title: `Client Profile - ${
                (apiData.personalInfo as Record<string, any>)?.firstName || ""
              } ${
                (apiData.personalInfo as Record<string, any>)?.lastName || ""
              }`,
              description: "Client Profile form submission",
              inventorsCreators: [
                {
                  name:
                    `${
                      (apiData.personalInfo as Record<string, any>)
                        ?.firstName || ""
                    } ${
                      (apiData.personalInfo as Record<string, any>)?.lastName ||
                      ""
                    }`.trim() || "Applicant",
                  role: "Applicant",
                },
              ],
            };

            // Make direct API call instead of using the hook function
            const registryResponse = await fetch("/api/form-registry", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(registryParams),
            });

            if (!registryResponse.ok) {
              const errorData = await registryResponse.json();
              throw new Error(errorData.error || "Failed to register form");
            }

            const registryResult = await registryResponse.json();
            console.log(
              "[ClientBackgroundIP] Registry API response:",
              registryResult
            );

            if (registryResult?.data?.registryId) {
              console.log(
                "[ClientBackgroundIP] Registry creation successful:",
                registryResult.data
              );

              // Also trigger a client profile form completion event with the registry ID
              const registryCompletedEvent = new CustomEvent(
                "clientProfileFormCompleted",
                {
                  detail: {
                    completed: true,
                    applicationId: finalApplicationId,
                    clientProfileId: result.data.clientId,
                    registryId: registryResult.data.registryId,
                  },
                }
              );
              window.dispatchEvent(registryCompletedEvent);
            } else {
              console.error(
                "[ClientBackgroundIP] Error creating registry: Registry result is undefined or missing registryId",
                registryResult
              );
            }
          } catch (createRegistryError) {
            console.error(
              "[ClientBackgroundIP] Exception creating registry:",
              createRegistryError
            );
          }
        } else {
          console.log(
            "[ClientBackgroundIP] Registry already exists, no need to create"
          );
        }
      } catch (registryError) {
        console.error(
          "[ClientBackgroundIP] Error ensuring registry submission:",
          registryError
        );
        // Continue with form submission flow - don't let registry issues block submission
        console.log("[ClientBackgroundIP] Continuing despite registry error");
      }

      // Dismiss loading toast
      toast.dismiss(toastId);

      // Show success toast
      toast.success("Client Profile Submitted!", {
        description:
          "Your information has been successfully submitted to the system.",
      });

      console.log("Form submitted successfully:", result);

      // Move directly to the Application Title form after successful submission
      setTimeout(() => {
        router.push("/forms?tab=application-title");
      }, 300);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving your data"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Finish button click to navigate to dashboard
  const handleFinishClick = () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    try {
      // Get the current form values
      const values = form.getValues();

      // Format and validate the data before saving
      const formattedValues = formatData(values);

      // Save to localStorage without making an API call
      setStorageItem(
        "clientBackgroundIPData",
        JSON.stringify(formattedValues)
      );
      console.log(
        "Background IP data saved to localStorage before finishing:",
        formattedValues
      );

      // If we have an active application, update the form status silently
      if (activeApplicationId && window.updateIPFormStatus) {
        window.updateIPFormStatus("clientProfile", true, activeApplicationId);
      }

      // Show success message before redirecting
      toast.success("Client profile completed successfully!");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving form data or navigating:", error);
      toast.error("Failed to complete submission. Please try again.");
    }
  };

  // Add custom styles for radio buttons and checkboxes
  const customRadioStyles =
    "text-black border-black focus:ring-black data-[state=checked]:bg-black data-[state=checked]:border-black";
  const customCheckboxStyles =
    "text-black border-black focus:ring-black data-[state=checked]:bg-black data-[state=checked]:border-black rounded-sm";

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>An error occurred: {error.message}</p>
            </div>
          )}

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                CLIENT&apos;S BACKGROUND ON IP
              </CardTitle>
              <CardDescription>
                Please provide information about your experience with
                intellectual property
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <FormField
                control={form.control}
                name="publishedResearch.value"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold">
                      Have you published any research output? <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="research-yes"
                          checked={field.value === "yes"}
                          onCheckedChange={() => field.onChange("yes")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="research-yes"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="research-no"
                          checked={field.value === "no"}
                          onCheckedChange={() => field.onChange("no")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="research-no"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          No
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="research-submitted"
                          checked={field.value === "submitted"}
                          onCheckedChange={() => field.onChange("submitted")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="research-submitted"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Submitted
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="developedMaterials.value"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold">
                      Have you developed instructional materials (IMs) (e.g.
                      Books, Manuals, Journals, etc.)? <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="materials-yes"
                          checked={field.value === "yes"}
                          onCheckedChange={() => field.onChange("yes")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="materials-yes"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="materials-no"
                          checked={field.value === "no"}
                          onCheckedChange={() => field.onChange("no")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="materials-no"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          No
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="materials-ongoing"
                          checked={field.value === "ongoing"}
                          onCheckedChange={() => field.onChange("ongoing")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="materials-ongoing"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Ongoing
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="familiarWithIPRights.value"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold">
                      Are you familiar with the Intellectual Property Rights (RA
                      8293)? <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ip-rights-yes"
                          checked={field.value === "yes"}
                          onCheckedChange={() => field.onChange("yes")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="ip-rights-yes"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ip-rights-no"
                          checked={field.value === "no"}
                          onCheckedChange={() => field.onChange("no")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="ip-rights-no"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          No
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ipExperience.hasExperience"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold">
                      Do you have any experience in applying for IP protection? <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ip-exp-yes"
                          checked={field.value === "yes"}
                          onCheckedChange={() => field.onChange("yes")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="ip-exp-yes"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ip-exp-no"
                          checked={field.value === "no"}
                          onCheckedChange={() => field.onChange("no")}
                          className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                        />
                        <label
                          htmlFor="ip-exp-no"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          No
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasIPExperience === "yes" && (
                <div className="pl-6 border-l-2 border-gray-200">
                  <FormLabel className="block mb-3 italic">
                    If Yes, kindly mark the appropriate box(es):
                  </FormLabel>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="ipExperience.types.copyright"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Copyright
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipExperience.types.patent"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Patent</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipExperience.types.utilityModel"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Utility Model
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipExperience.types.industrialDesign"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Industrial Design
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipExperience.types.trademark"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Trademark
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipExperience.types.other"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Others, specify:
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch("ipExperience.types.other") && (
                      <FormField
                        control={form.control}
                        name="ipExperience.otherSpecify"
                        render={({ field }) => (
                          <FormItem className="ml-6">
                            <FormControl>
                              <Input placeholder="Please specify" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          <div className="flex justify-between gap-4">
            <Button
              type="button"
              onClick={handlePreviousClick}
              variant="outline"
              className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
            >
              Previous
            </Button>
            <div className="flex-1"></div>
            {!isDisabled && (
              <Button
                variant="outline"
                type="button"
                className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Form"}
              </Button>
            )}
            {canApprove && formStatus === "submitted" && (
              <>
                <Button
                  variant="outline"
                  type="button"
                  className="text-green-600 border-green-600 hover:bg-green-600/10"
                  onClick={() => handleApproval("approved")}
                  disabled={isApproving}
                >
                  {isApproving ? "Processing..." : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="text-red-600 border-red-600 hover:bg-red-600/10"
                  onClick={() => handleApproval("rejected")}
                  disabled={isApproving}
                >
                  {isApproving ? "Processing..." : "Reject"}
                </Button>
              </>
            )}
            <Button
              type="button"
              onClick={handleCompleteForm}
              className="bg-[#1B5E20] hover:bg-[#1B5E20]/90"
              disabled={isSubmitting || isSubmitDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Form"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
