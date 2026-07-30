"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Plus, X, CalendarIcon, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfYear,
  isAfter,
  isBefore,
  startOfYear,
} from "date-fns";
import { useSession } from "next-auth/react";
import { getFormPermissions, bypassPermissions } from "@/lib/auth/permissions";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";

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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FormValidationAlert } from "../FormValidationAlert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CaptionLabelProps } from "react-day-picker";

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

const formSchema = z.object({
  applicants: z
    .array(
      z.object({
        firstName: z
          .string()
          .min(1, { message: "First name is required" })
          .transform((val) => val.toUpperCase()),
        middleInitial: z
          .string()
          .optional()
          .transform((val) => (val ? val.toUpperCase() : val)),
        lastName: z
          .string()
          .min(1, { message: "Last name is required" })
          .transform((val) => val.toUpperCase()),
        date: z.date({
          required_error: "Certification date is required",
        }),
      })
    )
    .min(1, { message: "At least one applicant is required" }),
  laboratoryFacilities: z.object({
    experimentalApparatus: z.boolean().default(false),
    labInstruments: z.boolean().default(false),
    dataAnalysisTools: z.boolean().default(false),
    technicalSupport: z.boolean().default(false),
    farmMachineShop: z.boolean().default(false),
    specializedSoftware: z.object({
      checked: z.boolean().default(false),
      specification: z.string().optional(),
    }),
    other: z.object({
      checked: z.boolean().default(false),
      specification: z.string().optional(),
    }),
  }),
  fundingResources: z.object({
    personalFunds: z.boolean().default(false),
    grantsAndWages: z.boolean().default(false),
    scholarships: z.boolean().default(false),
    industryPartnerships: z.boolean().default(false),
    collaboration: z.boolean().default(false),
    other: z.object({
      checked: z.boolean().default(false),
      specification: z.string().optional(),
    }),
  }),
  remarks: z.string().optional(),
  researchTitle: z.string().min(1, { message: "Research title is required" }),
});

export function SubstantialUseForm() {
  const router = useRouter();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session } = useSession();
  const [formStatus, setFormStatus] = useState<string>("draft");
  const [formData, setFormData] = useState<any>(null);

  // Get the active application ID
  const { activeApplicationId, clearFormData } = useActiveApplication();
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      toast.success("Substantial Use form submitted successfully");
    },
    onError: (error) => {
      toast.error(`Error submitting form: ${error.message}`);
    },
  });

  // Extract functions from formSubmission
  const { registerForm, submitForm } = formSubmission;
  // Only use getFormBySource if it exists
  const getFormBySource = formSubmission.getFormBySource || null;

  // Add a ref to prevent infinite fetches
  const isFetchingRef = useRef(false);

  // Get permissions
  const permissions = getFormPermissions(session, formStatus);
  const isDevAdmin = bypassPermissions(session);

  // Use permissions or bypass for admin in development
  const canEdit = isDevAdmin || permissions.canEdit;
  const canSubmit = isDevAdmin || permissions.canSubmit;
  const canApprove = isDevAdmin || permissions.canApprove;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicants: [
        {
          firstName: "",
          middleInitial: "",
          lastName: "",
          date: new Date(),
        },
      ],
      laboratoryFacilities: {
        experimentalApparatus: false,
        labInstruments: false,
        dataAnalysisTools: false,
        technicalSupport: false,
        farmMachineShop: false,
        specializedSoftware: { checked: false, specification: "" },
        other: { checked: false, specification: "" },
      },
      fundingResources: {
        personalFunds: false,
        grantsAndWages: false,
        scholarships: false,
        industryPartnerships: false,
        collaboration: false,
        other: { checked: false, specification: "" },
      },
      remarks: "",
      researchTitle: "",
    },
  });

  const {
    fields: applicantFields,
    append: appendApplicant,
    remove: removeApplicant,
  } = useFieldArray({
    control: form.control,
    name: "applicants",
  });

  // Add a ref to track if component is mounted
  const isMounted = useRef(true);

  // Set to false when unmounting
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Add a ref to track when we last successfully fetched data for this application
  const lastSuccessfulFetchRef = useRef<Record<string, number>>({});

  // Add a ref to track when we last received a 404 for this application
  const notFoundCacheRef = useRef<Record<string, number>>({});

  // Create a resetFormWithDefaults function wrapped in useCallback
  const resetFormWithDefaults = useCallback(() => {
    console.log("Resetting form with defaults");

    // Default reset values based on the form schema
    const resetValues = {
      applicants: [
        {
          firstName: "",
          middleInitial: "",
          lastName: "",
          date: new Date(),
        },
      ],
      laboratoryFacilities: {
        experimentalApparatus: false,
        labInstruments: false,
        dataAnalysisTools: false,
        technicalSupport: false,
        farmMachineShop: false,
        specializedSoftware: { checked: false, specification: "" },
        other: { checked: false, specification: "" },
      },
      fundingResources: {
        personalFunds: false,
        grantsAndWages: false,
        scholarships: false,
        industryPartnerships: false,
        collaboration: false,
        other: { checked: false, specification: "" },
      },
      remarks: "",
      researchTitle: "",
    };

    // Reset form with default values
    form.reset(resetValues);

    // Update form status
    setFormStatus("draft");

    console.log("Form reset completed with default values");
  }, [form]);

  // Memoize fetchData function
  const fetchData = useCallback(async () => {
    // Skip if already fetching or no active application
    if (isFetchingRef.current || !activeApplicationId || !session?.user?.id) {
      console.log("Skipping fetchData due to prerequisites not met:", {
        isFetching: isFetchingRef.current,
        hasActiveApp: !!activeApplicationId,
        hasUser: !!session?.user?.id,
      });
      return;
    }

    // Check if we've already determined this application has no form (404 response)
    // and cache this result for a longer time (5 minutes)
    const now = Date.now();
    const lastNotFoundTime = activeApplicationId
      ? notFoundCacheRef.current[activeApplicationId] || 0
      : 0;
    const NOT_FOUND_CACHE_DURATION = 300000; // 5 minutes for 404 responses

    if (
      activeApplicationId &&
      lastNotFoundTime > 0 &&
      now - lastNotFoundTime < NOT_FOUND_CACHE_DURATION
    ) {
      console.log(
        `Skipping fetch - already received 404 for this application ${Math.round(
          (now - lastNotFoundTime) / 1000
        )}s ago. Will try again in ${Math.round(
          (NOT_FOUND_CACHE_DURATION - (now - lastNotFoundTime)) / 1000
        )}s`
      );
      // Process as if we received a 404 - set up form with defaults
      resetFormWithDefaults();
      return;
    }

    // Check if we've successfully fetched this application's data recently (last 60 seconds)
    const lastSuccessTime = activeApplicationId
      ? lastSuccessfulFetchRef.current[activeApplicationId] || 0
      : 0;
    const CACHE_DURATION = 60000; // 60 seconds

    if (
      activeApplicationId &&
      lastSuccessTime > 0 &&
      now - lastSuccessTime < CACHE_DURATION
    ) {
      console.log(
        `Skipping fetch - already successfully fetched data for this application ${Math.round(
          (now - lastSuccessTime) / 1000
        )}s ago`
      );
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      console.log("Fetching substantial use form data...");

      // First, check if there's an existing form linked to the current application
      // Only try if getFormBySource exists
      if (getFormBySource) {
        try {
          const formRegistry = await getFormBySource(
            "substantial_use",
            session?.user?.id || "",
            activeApplicationId
          );

          if (formRegistry && formRegistry.sourceId) {
            console.log("Found existing form registry:", formRegistry);
          }
        } catch (error) {
          console.log(
            "Form registry check failed, continuing with API fetch:",
            error
          );
          // Continue with API fetch even if registry check fails
        }
      } else {
        console.log(
          "getFormBySource function not available, skipping registry check"
        );
      }

      // Check localStorage first - if we've previously seen a 404 for this application
      const appNotFoundKey = `substantial_use_not_found_${activeApplicationId}`;
      const storedNotFoundValue = localStorage.getItem(appNotFoundKey);

      if (storedNotFoundValue) {
        // Check if the not found flag has a timestamp and is still valid
        try {
          const notFoundData = JSON.parse(storedNotFoundValue);
          const notFoundTimestamp = notFoundData.timestamp || 0;

          if (now - notFoundTimestamp < NOT_FOUND_CACHE_DURATION) {
            console.log(
              `Previously established that no form exists for this application (${Math.round(
                (now - notFoundTimestamp) / 1000
              )}s ago), skipping API call`
            );
            // Update memory cache
            if (activeApplicationId) {
              notFoundCacheRef.current[activeApplicationId] = notFoundTimestamp;
            }
            // Process as if we received a 404
            resetFormWithDefaults();
            return;
          } else {
            console.log("Not found cache expired, trying API again");
            // Remove expired cache
            localStorage.removeItem(appNotFoundKey);
          }
        } catch (e) {
          // If parsing fails, it's an old format without timestamp
          // Remove it and continue with the fetch
          localStorage.removeItem(appNotFoundKey);
        }
      }

      // Fetch data from API with applicationId parameter
      // Use current window location instead of hardcoded port
      const url = new URL("/api/substantial-use", window.location.origin);
      if (activeApplicationId) {
        url.searchParams.append("applicationId", activeApplicationId);
      }

      console.log("Fetching from API:", url.toString());
      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });

      console.log("API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Data fetched from API:", data);

        // Record successful fetch time
        if (activeApplicationId) {
          lastSuccessfulFetchRef.current[activeApplicationId] = Date.now();
          // Also clear any not found cache for this application
          delete notFoundCacheRef.current[activeApplicationId];
          localStorage.removeItem(appNotFoundKey);
        }

        if (data && data.data) {
          // Debug log for API response data structure
          console.log("API data structure:", {
            researchTitle: data.data.researchTitle || data.data.research_title,
            laboratoryFacilitiesType:
              typeof data.data.laboratoryFacilities ||
              typeof data.data.laboratory_facilities,
            laboratoryFacilities:
              data.data.laboratoryFacilities || data.data.laboratory_facilities,
            fundingResourcesType:
              typeof data.data.fundingResources ||
              typeof data.data.funding_resources,
            fundingResources:
              data.data.fundingResources || data.data.funding_resources,
            remarks: data.data.remarks,
            status: data.data.status,
          });

          // Extract data using both camelCase and snake_case keys
          const researchTitle =
            data.data.researchTitle || data.data.research_title || "";

          // Parse JSON strings if needed
          let laboratoryFacilities =
            data.data.laboratoryFacilities ||
            data.data.laboratory_facilities ||
            {};
          let fundingResources =
            data.data.fundingResources || data.data.funding_resources || {};

          // If the data is stored as a string in the database, parse it
          if (typeof laboratoryFacilities === "string") {
            try {
              laboratoryFacilities = JSON.parse(laboratoryFacilities);
            } catch (e) {
              console.error(
                "[GET] Error parsing laboratoryFacilities string:",
                e
              );
              laboratoryFacilities = {};
            }
          }

          if (typeof fundingResources === "string") {
            try {
              fundingResources = JSON.parse(fundingResources);
            } catch (e) {
              console.error("[GET] Error parsing funding resources string:", e);
              fundingResources = {};
            }
          }

          // Format API data to match form schema
          const formattedData = {
            researchTitle,
            applicants:
              data.data.applicants?.length > 0
                ? data.data.applicants.map((applicant: any) => ({
                    firstName: applicant.firstName || "",
                    middleInitial: applicant.middleInitial || "",
                    lastName: applicant.lastName || "",
                    date: applicant.date
                      ? new Date(applicant.date)
                      : new Date(),
                  }))
                : [
                    {
                      firstName: "",
                      middleInitial: "",
                      lastName: "",
                      date: new Date(),
                    },
                  ],
            laboratoryFacilities: {
              experimentalApparatus:
                laboratoryFacilities.experimentalApparatus || false,
              labInstruments: laboratoryFacilities.labInstruments || false,
              dataAnalysisTools:
                laboratoryFacilities.dataAnalysisTools || false,
              technicalSupport: laboratoryFacilities.technicalSupport || false,
              farmMachineShop: laboratoryFacilities.farmMachineShop || false,
              specializedSoftware: {
                checked:
                  laboratoryFacilities.specializedSoftware?.checked || false,
                specification:
                  laboratoryFacilities.specializedSoftware?.specification || "",
              },
              other: {
                checked: laboratoryFacilities.other?.checked || false,
                specification: laboratoryFacilities.other?.specification || "",
              },
            },
            fundingResources: {
              personalFunds: fundingResources.personalFunds || false,
              grantsAndWages: fundingResources.grantsAndWages || false,
              scholarships: fundingResources.scholarships || false,
              industryPartnerships:
                fundingResources.industryPartnerships || false,
              collaboration: fundingResources.collaboration || false,
              other: {
                checked: fundingResources.other?.checked || false,
                specification: fundingResources.other?.specification || "",
              },
            },
            remarks: data.data.remarks || "",
          };

          console.log("Formatted data to be loaded into form:", formattedData);

          // Set form data for future reference
          setFormData(data.data);

          // Reset form with formatted API data
          form.reset(formattedData);
          console.log("Form reset with formatted API data");

          // Set form status
          setFormStatus(data.data.status || "draft");

          // Store in localStorage to avoid unnecessary fetches
          try {
            // Store the current timestamp when we last got a successful result
            if (activeApplicationId) {
              localStorage.setItem(
                `substantial_use_last_fetch_${activeApplicationId}`,
                Date.now().toString()
              );
            }

            // Store basic form data to use as a local cache
            if (activeApplicationId) {
              localStorage.setItem(
                `substantial_use_data_${activeApplicationId}`,
                JSON.stringify({
                  formattedData,
                  status: data.data.status || "draft",
                  timestamp: Date.now(),
                })
              );
            }
          } catch (e) {
            console.error("Error storing form data in localStorage:", e);
            // Continue execution even if localStorage fails
          }
        }
      } else if (response.status === 404) {
        console.log(
          "No form found for this application - this is expected for new applications"
        );

        // Store the fact that this app doesn't have a form yet with a timestamp
        if (activeApplicationId) {
          const notFoundData = {
            timestamp: Date.now(),
            message: "No form found for this application",
          };

          // Store in memory cache
          notFoundCacheRef.current[activeApplicationId] =
            notFoundData.timestamp;

          // Store in localStorage with structured data
          localStorage.setItem(appNotFoundKey, JSON.stringify(notFoundData));

          console.log(
            `Cached 404 response for ${activeApplicationId} - will not retry for ${
              NOT_FOUND_CACHE_DURATION / 1000
            }s`
          );
        }

        // Reset the form with defaults instead of checking localStorage
        resetFormWithDefaults();
      } else {
        // Handle other API errors
        console.error(`API error: ${response.status}`);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error as Error);

      // Attempt to reset form with defaults on error - use direct form reset instead of resetFormWithDefaults
      // This avoids circular dependency
      console.log("Resetting form with defaults due to error");
      resetFormWithDefaults();
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [
    activeApplicationId,
    form,
    getFormBySource,
    session?.user?.id,
    resetFormWithDefaults,
  ]);

  // Create a specific handler for application switching
  const handleApplicationSwitched = useCallback(
    (newAppId: string) => {
      console.log("Application switched to:", newAppId);

      // This function is now simplified since the page will reload
      // We just need to clear caches before the reload happens

      // Clear any cached data for the previous application
      // Use the activeApplicationId from the hook
      const currentAppId = activeApplicationId;
      if (currentAppId) {
        const prevAppNotFoundKey = `substantial_use_not_found_${currentAppId}`;
        localStorage.removeItem(prevAppNotFoundKey);
        localStorage.removeItem(`substantial_use_last_fetch_${currentAppId}`);
        localStorage.removeItem(`substantial_use_data_${currentAppId}`);
      }

      // Also clear any cached data for the new application to ensure a fresh start
      if (newAppId) {
        localStorage.removeItem(`substantial_use_not_found_${newAppId}`);
        localStorage.removeItem(`substantial_use_last_fetch_${newAppId}`);
        localStorage.removeItem(`substantial_use_data_${newAppId}`);
      }
    },
    [activeApplicationId]
  );

  // Listen for application switch events and form data cleared events
  useEffect(() => {
    const handleApplicationSwitchedEvent = (e: CustomEvent) => {
      if (e.detail && e.detail.applicationId) {
        handleApplicationSwitched(e.detail.applicationId);
      }
    };

    const handleFormDataClearedEvent = () => {
      console.log("Form data cleared event detected");
      // Reset the form when form data is cleared
      setFormData(null);
      setFormStatus("draft");
      form.reset({});

      // Fetch fresh data if we have an active application
      if (activeApplicationId && isMounted.current) {
        setTimeout(() => {
          if (isMounted.current) {
            fetchData();
          }
        }, 300);
      }
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
      // Remove event listeners on unmount
      window.removeEventListener(
        "application-switched",
        handleApplicationSwitchedEvent as EventListener
      );

      window.removeEventListener(
        "formDataCleared",
        handleFormDataClearedEvent as EventListener
      );
    };
  }, [handleApplicationSwitched, form, activeApplicationId, fetchData]);

  // Also fix the direct activeApplicationId effect handler to clear the not found flag
  useEffect(() => {
    if (!isMounted.current || !activeApplicationId || !session || isLoading) {
      return;
    }

    console.log("Active application ID changed:", activeApplicationId);

    // Clear any cached "not found" flags when application changes
    const appNotFoundKey = `substantial_use_not_found_${activeApplicationId}`;
    localStorage.removeItem(appNotFoundKey);

    // Clear form when application changes to prepare for new data
    form.reset({});

    // Create a unique key for this effect instance to prevent race conditions
    // with multiple rapid application changes
    const effectInstanceId = Math.random().toString(36).substring(2, 10);
    const thisEffectKey = `effect_${effectInstanceId}`;

    // Store this effect instance so we can check for newer ones
    const currentEffectKey = `app_switch_effect_${activeApplicationId}`;
    localStorage.setItem(currentEffectKey, thisEffectKey);

    // Add a small delay to avoid rapid consecutive calls
    const timeoutId = setTimeout(() => {
      // Only proceed if this is still the most recent effect for this application
      // and the component is still mounted
      if (
        isMounted.current &&
        localStorage.getItem(currentEffectKey) === thisEffectKey
      ) {
        // Clear any potential race conditions by removing the stored key
        localStorage.removeItem(currentEffectKey);

        fetchData();
      } else {
        console.log(
          "Skipping fetchData due to newer application change or unmount"
        );
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeApplicationId, session, fetchData, form, isLoading]);

  // Add functionality to window for other components to update form status
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track if component is mounted
    let isMounted = true;

    // Track last event time to debounce events
    let lastEventTime = 0;
    const EVENT_DEBOUNCE_TIME = 2000; // 2 seconds

    // Handle form status update requests from other components
    const originalUpdateFn = window.updateIPFormStatus;
    window.updateIPFormStatus = (formType, completed, applicationId) => {
      // Call original function if exists
      if (originalUpdateFn) {
        originalUpdateFn(formType, completed, applicationId);
      }

      // Skip if component unmounted or not matching our form type and app ID
      if (!isMounted) return;

      if (
        formType === "substantial_use" &&
        applicationId === activeApplicationId
      ) {
        console.log(
          `Updating form status: ${formType} - ${
            completed ? "completed" : "incomplete"
          }`
        );
        // Don't directly call fetchData to prevent infinite loops
        // Instead, set a flag that can be checked elsewhere
        if (completed && formStatus !== "submitted") {
          setFormStatus("submitted");
        }
      }
    };

    // Add form_completed event listener
    const handleFormCompleted = (event: CustomEvent) => {
      // Skip if component unmounted
      if (!isMounted) return;

      // Prevent handling if we're already fetching to avoid loops
      if (isFetchingRef.current) return;

      // Implement debouncing to prevent rapid successive events
      const now = Date.now();
      if (now - lastEventTime < EVENT_DEBOUNCE_TIME) {
        console.log(
          "Debouncing form_completed event - too soon after previous event"
        );
        return;
      }

      // Update last event time
      lastEventTime = now;

      // Check if we've recently fetched this application's data
      const lastSuccessTime = activeApplicationId
        ? lastSuccessfulFetchRef.current[activeApplicationId] || 0
        : 0;
      const CACHE_DURATION = 10000; // 10 seconds for events (shorter than main cache)

      if (activeApplicationId && now - lastSuccessTime < CACHE_DURATION) {
        console.log(
          `Skipping form_completed fetch - already fetched data recently (${Math.round(
            (now - lastSuccessTime) / 1000
          )}s ago)`
        );
        return;
      }

      console.log("Form completed event", event.detail);
      if (
        event.detail.formType === "substantial_use" &&
        event.detail.applicationId === activeApplicationId
      ) {
        // Only refresh data if it's for our form type and application
        // Add a slight delay to avoid race conditions
        setTimeout(() => {
          if (isMounted && !isFetchingRef.current) {
            fetchData();
          }
        }, 300);
      }
    };

    window.addEventListener(
      "form_completed",
      handleFormCompleted as EventListener
    );

    return () => {
      isMounted = false;
      // Restore original function and remove event listener
      window.updateIPFormStatus = originalUpdateFn;
      window.removeEventListener(
        "form_completed",
        handleFormCompleted as EventListener
      );
    };
  }, [activeApplicationId, fetchData, formStatus, lastSuccessfulFetchRef]);

  // Clear form when no application is selected
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!activeApplicationId && form) {
      // Clear form if no application is selected
      console.log("No active application, clearing form");
      setFormData(null);
      resetFormWithDefaults();
    }
  }, [activeApplicationId, form, resetFormWithDefaults]);

  // Dispatch event when form is completed
  const dispatchFormCompleted = (substantialUseId?: string) => {
    if (typeof window !== "undefined" && activeApplicationId) {
      const event = new CustomEvent("form_completed", {
        detail: {
          formType: "substantial_use",
          completed: true,
          applicationId: activeApplicationId,
          ...(substantialUseId && { substantialUseId }), // Include substantialUseId if available
        },
      });
      window.dispatchEvent(event);
    }
  };

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      console.log("Starting form submission process...");
      console.log("Form values:", JSON.stringify(values, null, 2));

      if (!activeApplicationId) {
        toast.error(
          "No application selected. Please select or create an application first."
        );
        setIsSubmitting(false);
        return;
      }

      // Prepare data for API
      const preparedData = {
        userId: session?.user?.id,
        researchTitle: values.researchTitle?.trim(),
        applicants: values.applicants?.map((applicant) => ({
          firstName: applicant.firstName?.trim(),
          lastName: applicant.lastName?.trim(),
          middleInitial: applicant.middleInitial?.trim(),
          date: applicant.date?.toISOString(),
        })),
        laboratoryFacilities: values.laboratoryFacilities,
        fundingResources: values.fundingResources,
        remarks: values.remarks?.trim(),
        status: "draft", // Default for new submissions
        applicationId: activeApplicationId, // Add the application ID
      };

      console.log(
        "[Substantial Use Form] Submitting form values:",
        preparedData
      );

      // Save current form data to localStorage with applicationId
      // Use consistent key for localStorage across the application
      localStorage.setItem(
        "substantialUseFormData",
        JSON.stringify({
          ...preparedData,
          applicationId: activeApplicationId,
        })
      );

      // Clear any "not found" flag since we're submitting a form for this application
      const appNotFoundKey = `substantial_use_not_found_${activeApplicationId}`;
      localStorage.removeItem(appNotFoundKey);

      // Show a loading toast while submitting
      const submitToastId = "submitting-form";
      toast.loading("Submitting your form...", { id: submitToastId });

      // First submit the actual form data to get the substantialUseId
      setIsLoading(true);
      let substantialUseId;
      try {
        const response = await fetch("/api/substantial-use", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preparedData),
        });

        // Parse the response
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error(
            "[Substantial Use Form] Error parsing response:",
            parseError
          );
          toast.error("Failed to parse server response", { id: submitToastId });
          throw new Error("Failed to parse API response");
        }

        // Handle different status codes
        if (response.ok) {
          console.log(
            "[Substantial Use Form] Form submitted successfully:",
            data
          );

          // Get the substantialUseId from the response
          substantialUseId = data.data?.substantialUseId;

          if (!substantialUseId) {
            console.error(
              "[Substantial Use Form] No substantialUseId in response:",
              data
            );
            toast.error("Missing substantialUseId in response", {
              id: submitToastId,
            });
            throw new Error("Missing substantialUseId in API response");
          }

          // Now register the form with the form integration system using the substantialUseId
          let registryResult = null;
          try {
            if (typeof registerForm === "function") {
              registryResult = await registerForm(
                session?.user?.id || "",
                "substantial_use",
                substantialUseId, // Use the actual substantialUseId from the API response
                {
                  title:
                    values.researchTitle || "Substantial Use Certification",
                  description:
                    "Certification of Substantial Use form submission",
                  applicationId: activeApplicationId,
                  // Add inventors/creators if relevant
                  inventorsCreators: values.applicants?.map((a) => ({
                    name: `${a.firstName} ${a.lastName}`,
                    role: a.middleInitial ? "Applicant" : undefined,
                  })),
                }
              );
              console.log(
                "Form registered successfully with substantialUseId:",
                substantialUseId
              );
            } else {
              console.log(
                "registerForm function not available, continuing without registration"
              );
            }
          } catch (regError) {
            console.error("Error registering form:", regError);
            toast.error(
              "Error registering form, but continuing with submission"
            );
            // Continue with form submission even if registration fails
          }

          // Set form status to submitted
          setFormStatus("submitted");

          // Dispatch form completion event
          dispatchFormCompleted(substantialUseId);

          toast.success("Form Submitted", {
            id: submitToastId,
            description:
              "Your substantial use form has been submitted successfully.",
          });

          // Navigate back to forms page after a short delay
          setTimeout(() => {
            router.push(`/forms?tab=substantial-use`);
          }, 1000);
        } else if (response.status === 404) {
          toast.error("Endpoint Not Found", {
            id: submitToastId,
            description:
              "The server endpoint could not be found. Please try again later.",
          });
          console.error("[Substantial Use Form] API Error 404:", data);
          throw new Error("Endpoint not found");
        } else {
          toast.error("Submission Failed", {
            id: submitToastId,
            description: data.error || `Server error: ${response.status}`,
          });
          console.error("[Substantial Use Form] API Error:", data);
          throw new Error(data.error || `API error: ${response.status}`);
        }
      } catch (fetchError) {
        console.error("[Substantial Use Form] Fetch error:", fetchError);
        toast.error("Failed to communicate with server", { id: submitToastId });
        throw fetchError;
      }
    } catch (error) {
      console.error("[Substantial Use Form] Error submitting form:", error);
      toast.error("Submission Failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }

  // Handle form update
  async function handleUpdate() {
    try {
      setIsUpdating(true);
      const values = form.getValues();

      if (!activeApplicationId) {
        toast.error(
          "No application selected. Please select or create an application first."
        );
        setIsUpdating(false);
        return;
      }

      // Prepare data for API using consistent camelCase keys
      const preparedData = {
        userId: session?.user?.id,
        researchTitle: values.researchTitle?.trim(),
        applicants: values.applicants?.map((applicant) => ({
          firstName: applicant.firstName?.trim(),
          lastName: applicant.lastName?.trim(),
          middleInitial: applicant.middleInitial?.trim(),
          date: applicant.date?.toISOString(),
        })),
        laboratoryFacilities: values.laboratoryFacilities,
        fundingResources: values.fundingResources,
        remarks: values.remarks?.trim(),
        applicationId: activeApplicationId, // Add the application ID
        // Don't change status on update, unless specifically requested
      };

      // Save current form data to localStorage with applicationId
      localStorage.setItem(
        "substantialUseFormData",
        JSON.stringify({
          ...preparedData,
          applicationId: activeApplicationId,
        })
      );

      console.log("[Substantial Use Form] Updating form values:", preparedData);

      // Show loading toast
      const updateToastId = "updating-form";
      toast.loading("Updating your form...", { id: updateToastId });

      setIsLoading(true);
      const response = await fetch("/api/substantial-use", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preparedData),
      });

      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error(
          "[Substantial Use Form] Error parsing response:",
          parseError
        );
        throw new Error("Failed to parse API response");
      }

      if (!response.ok) {
        toast.error("Update Failed", { id: updateToastId });
        console.error("[Substantial Use Form] API Error:", data);
        throw new Error(data.error || `API error: ${response.status}`);
      }

      console.log("[Substantial Use Form] Form updated successfully:", data);

      toast.success("Form Updated", {
        id: updateToastId,
        description: "Your substantial use form has been saved as a draft.",
      });
    } catch (error) {
      console.error("[Substantial Use Form] Error updating form:", error);
      toast.error("Update Failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  }

  const handleApproval = async (newStatus: "approved" | "rejected") => {
    try {
      // Show loading toast
      toast.loading(
        `${newStatus === "approved" ? "Approving" : "Rejecting"} Form`,
        {
          description: "Please wait while we process your request...",
        }
      );

      const response = await fetch("/api/substantial-use", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus} form`);
      }

      setFormStatus(newStatus);
      toast.dismiss(); // Dismiss loading toast
      if (newStatus === "approved") {
        toast.success("Form Approved", {
          description:
            "The substantial use form has been approved successfully.",
        });
      } else {
        toast.error("Form Rejected", {
          description: "The substantial use form has been rejected.",
        });
      }
    } catch (error) {
      console.error(`Error ${newStatus} form:`, error);
      toast.dismiss(); // Dismiss loading toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while processing the form.";
      toast.error(
        `${newStatus === "approved" ? "Approval" : "Rejection"} Failed`,
        {
          description: errorMessage,
        }
      );
    }
  };

  // Add custom styles for checkboxes
  const customCheckboxStyles =
    "text-black border-black focus:ring-black data-[state=checked]:bg-black data-[state=checked]:border-black rounded-sm";

  // Check if form is disabled (already submitted)
  // TODO: Implement role-based permissions
  // For production:
  // - Only allow editing if user has admin role or is the form owner
  // - Check submission status and user permissions
  // - Add role check: isAdmin || (isOwner && !isSubmitted)
  const isFormDisabled = false; // Temporarily disabled for testing

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Top Form Validation Alert & Error Warnings */}
        <FormValidationAlert errors={form.formState.errors} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>An error occurred: {error.message}</p>
          </div>
        )}

        {isFormDisabled && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="font-bold">Form Already Submitted</p>
            <p>
              This form has been submitted and cannot be modified. Contact an
              administrator if you need to make changes.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Substantial Use Form</h2>
        </div>

        <div className="text-left mb-8">
          <h2 className="text-xl font-bold">
            Certification of Substantial Use of University Resources
          </h2>
        </div>

        <Card>
          <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
            <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
              Research Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Please provide details about your research
            </p>
          </div>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="researchTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Research Title <span className="text-red-500 font-bold ml-0.5" title="Required field">*</span>
                  </FormLabel>
                  <FormDescription>
                    This is to certify that aside from the ordinarily available
                    resources of the University such as office, library,
                    computers and storage servers during the course of the
                    development of the research entitled:
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Enter research title"
                      {...field}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-8">
          {/* Laboratory Facilities Card */}
          <Card>
            <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
              <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
                Laboratory Facilities
              </h3>
              <p className="text-sm text-muted-foreground">
                Resources used for your research
              </p>
            </div>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Please check the appropriate boxes
                </p>
              </div>
              <FormLabel className="text-base font-medium block mb-4">
                I/we have utilized any of the following resources:
              </FormLabel>
              <div className="space-y-4">
                {[
                  {
                    name: "experimentalApparatus" as const,
                    label: "Experimental Apparatus",
                  },
                  { name: "labInstruments" as const, label: "Lab Instruments" },
                  {
                    name: "dataAnalysisTools" as const,
                    label: "Data Analysis Tools",
                  },
                  {
                    name: "technicalSupport" as const,
                    label: "Technical Support",
                  },
                  {
                    name: "farmMachineShop" as const,
                    label: "Farm/Machine Shop",
                  },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={`laboratoryFacilities.${item.name}` as const}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={customCheckboxStyles}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="laboratoryFacilities.specializedSoftware.checked"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={customCheckboxStyles}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <div className="space-y-2 flex-1">
                          <FormLabel className="font-normal">
                            Specialized Software (please specify):
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="laboratoryFacilities.specializedSoftware.specification"
                            render={({ field: specField }) => (
                              <FormControl>
                                <Input
                                  {...specField}
                                  disabled={!field.value || !canEdit}
                                  className={!field.value ? "opacity-50" : ""}
                                  placeholder="Enter specialized software..."
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="laboratoryFacilities.other.checked"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={customCheckboxStyles}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <div className="space-y-2 flex-1">
                          <FormLabel className="font-normal">
                            Other (please specify):
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="laboratoryFacilities.other.specification"
                            render={({ field: specField }) => (
                              <FormControl>
                                <Input
                                  {...specField}
                                  disabled={!field.value || !canEdit}
                                  className={!field.value ? "opacity-50" : ""}
                                  placeholder="Enter other facilities..."
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Funding Resources Card */}
          <Card>
            <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
              <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
                Funding Resources
              </h3>
              <p className="text-sm text-muted-foreground">
                Financial support for your research
              </p>
            </div>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Please check the appropriate boxes
                </p>
              </div>
              <FormLabel className="text-base font-medium block mb-4">
                I/we have utilized any of the following resources:
              </FormLabel>
              <div className="space-y-4">
                {[
                  {
                    name: "personalFunds" as const,
                    label: "Personal Funds/Resources",
                  },
                  {
                    name: "grantsAndWages" as const,
                    label: "Grants/Funding/Wages/Allowances/Stipend/Salary",
                  },
                  { name: "scholarships" as const, label: "Scholarships" },
                  {
                    name: "industryPartnerships" as const,
                    label: "Industry Partnerships",
                  },
                  {
                    name: "collaboration" as const,
                    label: "Collaboration with Other Institutions",
                  },
                ].map((item) => (
                  <FormField
                    key={item.name}
                    control={form.control}
                    name={`fundingResources.${item.name}` as const}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={customCheckboxStyles}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}

                <FormField
                  control={form.control}
                  name="fundingResources.other.checked"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={customCheckboxStyles}
                            disabled={!canEdit}
                          />
                        </FormControl>
                        <div className="space-y-2 flex-1">
                          <FormLabel className="font-normal">
                            Other (please specify):
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="fundingResources.other.specification"
                            render={({ field: specField }) => (
                              <FormControl>
                                <Input
                                  {...specField}
                                  disabled={!field.value || !canEdit}
                                  className={!field.value ? "opacity-50" : ""}
                                  placeholder="Enter other funding sources..."
                                />
                              </FormControl>
                            )}
                          />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Remarks Card */}
        <Card>
          <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
            <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
              Additional Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Any other relevant details about your research
            </p>
          </div>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional remarks..."
                      className="min-h-[150px] resize-y"
                      {...field}
                      disabled={!canEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Applicant Information and Certification */}
        <Card>
          <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
            <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
              Applicant Information and Signature
            </h3>
            <p className="text-sm text-muted-foreground">
              Applicant details and signature date
            </p>
          </div>
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-between items-center">
              <FormLabel className="text-base">Applicant Details</FormLabel>
              {!isFormDisabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendApplicant({
                      firstName: "",
                      middleInitial: "",
                      lastName: "",
                      date: new Date(),
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Applicant
                </Button>
              )}
            </div>

            {applicantFields.map((field, index) => (
              <div key={field.id} className="relative">
                <div className="border rounded-lg p-6">
                  <div className="absolute -top-3 left-4 bg-background px-2 text-sm font-medium text-muted-foreground">
                    Applicant {index + 1}
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`applicants.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="First Name"
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                disabled={!canEdit}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`applicants.${index}.middleInitial`}
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormLabel>M.I.</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="M.I."
                                maxLength={2}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                disabled={!canEdit}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`applicants.${index}.lastName`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Last Name"
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                disabled={!canEdit}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`applicants.${index}.date`}
                      render={({ field }) => {
                        const [month, setMonth] = useState<Date>(
                          field.value || new Date()
                        );
                        const [isYearView, setIsYearView] = useState(false);
                        const startDate = new Date(1980, 0);
                        const endDate = new Date(2030, 11);

                        const years = eachYearOfInterval({
                          start: startOfYear(startDate),
                          end: endOfYear(endDate),
                        });

                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>Certification Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    disabled={!canEdit}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <div className="p-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mb-3 justify-between text-left font-normal"
                                    onClick={() => setIsYearView(!isYearView)}
                                  >
                                    {format(month, "MMMM yyyy")}
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 transition-transform",
                                        isYearView ? "rotate-180" : ""
                                      )}
                                    />
                                  </Button>

                                  {isYearView ? (
                                    <div className="h-[240px]">
                                      <ScrollArea className="h-full">
                                        {years.map((year) => {
                                          const isCurrentYear =
                                            year.getFullYear() ===
                                            month.getFullYear();

                                          return (
                                            <Collapsible
                                              key={year.getFullYear()}
                                              className="border-t border-border px-2 py-1"
                                              defaultOpen={isCurrentYear}
                                            >
                                              <CollapsibleTrigger asChild>
                                                <Button
                                                  className="flex w-full justify-start gap-2 text-sm font-medium hover:bg-transparent [&[data-state=open]>svg]:rotate-180"
                                                  variant="ghost"
                                                  size="sm"
                                                >
                                                  <ChevronDown
                                                    size={16}
                                                    strokeWidth={2}
                                                    className="shrink-0 text-muted-foreground/80 transition-transform duration-200"
                                                    aria-hidden="true"
                                                  />
                                                  {year.getFullYear()}
                                                </Button>
                                              </CollapsibleTrigger>
                                              <CollapsibleContent>
                                                <div className="grid grid-cols-3 gap-2 px-3 py-2">
                                                  {eachMonthOfInterval({
                                                    start: startOfYear(year),
                                                    end: endOfYear(year),
                                                  }).map((month) => {
                                                    const isSelected =
                                                      field.value &&
                                                      month.getMonth() ===
                                                        field.value.getMonth() &&
                                                      year.getFullYear() ===
                                                        field.value.getFullYear();

                                                    return (
                                                      <Button
                                                        key={month.getTime()}
                                                        variant={
                                                          isSelected
                                                            ? "default"
                                                            : "outline"
                                                        }
                                                        size="sm"
                                                        className={cn(
                                                          "h-7",
                                                          isSelected &&
                                                            "bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white"
                                                        )}
                                                        onClick={() => {
                                                          setMonth(month);
                                                          setIsYearView(false);
                                                        }}
                                                      >
                                                        {format(month, "MMM")}
                                                      </Button>
                                                    );
                                                  })}
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          );
                                        })}
                                      </ScrollArea>
                                    </div>
                                  ) : (
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      month={month}
                                      onMonthChange={setMonth}
                                      disabled={!canEdit}
                                      className="border-none p-0"
                                      classNames={{
                                        day_selected:
                                          "bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90",
                                        day_today:
                                          "bg-slate-100 text-slate-900",
                                      }}
                                    />
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  {/* Remove Button */}
                  {index > 0 && !isFormDisabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -top-3 right-4"
                      onClick={() => removeApplicant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {!isFormDisabled && (
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
            {canSubmit && (
              <Button
                type="submit"
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90"
                disabled={!canSubmit}
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            )}
            {canApprove && formStatus === "submitted" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
                  onClick={() => handleApproval("approved")}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
                  onClick={() => handleApproval("rejected")}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="outline"
              type="button"
              className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update Form"}
            </Button>
            <div className="ml-auto">
              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 text-sm font-semibold"
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("tab", "deed-assignment");
                  router.push(`?${params.toString()}`);
                }}
              >
                Proceed to Deed of Assignment Form →
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
