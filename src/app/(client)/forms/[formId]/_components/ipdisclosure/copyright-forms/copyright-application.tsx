"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Info, CalendarIcon, ChevronDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "../context/form-context";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { FormNavigation } from "../components/form-navigation";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// Define schema for copyright application
const formSchema = z.object({
  workTitle: z.string().min(1, "Work title is required"),
  workDescription: z.string().min(1, "Work description is required"),
  creationDate: z.string().min(1, "Creation date is required"),
  category: z.string().optional().default("Literary Work"),
  publicationStatus: z.string().optional().default("unpublished"),
  publicationDate: z.string().optional(),
  publicationCountry: z.string().optional(),
});

// Create a store for copyright application data
interface CopyrightApplicationState {
  data: z.infer<typeof formSchema> | null;
  setData: (data: z.infer<typeof formSchema>) => void;
}

const useCopyrightApplicationStore = create<CopyrightApplicationState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "copyright-application-storage",
    }
  )
);

// Define starting and ending dates for the calendar picker
const now = new Date();
const startDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
const endDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years in future

export function CopyrightApplication() {
  const {
    activeTab,
    setActiveTab,
    setCopyrightApplication,
    copyrightApplication,
    disclosureId,
    applicationId,
  } = useIpDisclosureStore();
  const { data, setData } = useCopyrightApplicationStore();
  const { isHydrated } = useFormContext();
  const {
    saveCopyrightApplication,
    isLoading,
    fetchInitialData,
    checkExistingDisclosureAndFetch,
  } = useIpDisclosure();

  // Track whether initial data load has happened
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  // Add a shared isResetting state
  const [isResetting, setIsResetting] = useState(false);

  // Create local state for form values
  const [formData, setFormData] = useState<z.infer<typeof formSchema>>({
    workTitle: "",
    workDescription: "",
    creationDate: "",
    category: "Literary Work",
    publicationStatus: "unpublished",
    publicationDate: "",
    publicationCountry: "",
  });

  // Add a ref to track if we've already started loading data
  const initialLoadAttemptedRef = useRef(false);

  // Reference for tracking updates
  const isUpdatingRef = useRef(false);
  const previousValuesRef = useRef(data);
  // Add debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Add update count ref to detect potential infinite loops
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  // Initialize form with the local state
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    values: formData, // Explicitly set values from our state
  });

  // Update the form whenever formData changes
  useEffect(() => {
    if (formData) {
      form.reset(formData);
      console.log("Copyright form reset with data:", formData);
    }
  }, [formData, form]);

  // Function to check for potential infinite loops
  const checkForLoops = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // If updates are happening very rapidly, it might be a loop
    if (timeSinceLastUpdate < 100) {
      updateCountRef.current++;

      // If we've had many rapid updates, it might be a loop
      if (updateCountRef.current > 10) {
        console.error(
          "Potential infinite loop detected in copyright-application"
        );
        console.error(
          `${updateCountRef.current} updates in ${timeSinceLastUpdate}ms`
        );

        // Reset counter after warning
        updateCountRef.current = 0;
        return true;
      }
    } else {
      // Reset counter if updates aren't rapid
      updateCountRef.current = 0;
    }

    lastUpdateTimeRef.current = now;
    return false;
  }, []);

  // Simplified function to load data from disclosure or existing data
  useEffect(() => {
    // Only attempt to load data if:
    // 1. The store is hydrated
    // 2. We haven't loaded data yet
    // 3. We haven't already attempted to load data (prevents duplicate loads)
    if (isHydrated && !initialDataLoaded && !initialLoadAttemptedRef.current) {
      // Mark that we've attempted to load data
      initialLoadAttemptedRef.current = true;

      console.log(
        "Copyright form: Component is hydrated, checking for existing data"
      );

      const loadData = async () => {
        try {
          let loadedData = null;
          let sourceOfData = "none";

          // First, check if we have disclosure ID in the store
          if (disclosureId) {
            console.log(
              "Copyright form: Disclosure ID found in store:",
              disclosureId
            );
            try {
              // Fetch data using the disclosure ID
              const data = await fetchInitialData();
              console.log(
                "Copyright form: Raw data returned from fetchInitialData:",
                data
              );

              if (data && data.copyrightApplication) {
                loadedData = data;
                sourceOfData = "fetchInitialData";
                console.log(
                  "Copyright form: Data loaded from fetchInitialData:",
                  data
                );
              }
            } catch (fetchError) {
              console.error(
                "Copyright form: Error fetching data for disclosure:",
                fetchError
              );
            }
          }

          // If we couldn't get data from disclosure ID, try checking for existing disclosures
          if (!loadedData) {
            try {
              const existingData = await checkExistingDisclosureAndFetch();
              console.log(
                "Copyright form: Raw data returned from checkExistingDisclosureAndFetch:",
                existingData
              );

              if (existingData && existingData.copyrightApplication) {
                loadedData = existingData;
                sourceOfData = "checkExistingDisclosureAndFetch";
                console.log(
                  "Copyright form: Data loaded from checkExistingDisclosureAndFetch:",
                  existingData
                );
              }
            } catch (existingError) {
              console.error(
                "Copyright form: Error checking for existing disclosures:",
                existingError
              );
            }
          }

          // Last resort: Check if we have data in the store that wasn't included in the API responses
          if (!loadedData) {
            const storeData = {
              copyrightApplication:
                useIpDisclosureStore.getState().copyrightApplication,
              disclosureId: useIpDisclosureStore.getState().disclosureId,
              applicationId: useIpDisclosureStore.getState().applicationId,
            };

            if (storeData.copyrightApplication) {
              loadedData = storeData;
              sourceOfData = "store";
              console.log(
                "Copyright form: Using existing data from store:",
                storeData
              );
            }
          }

          // If we have data, set it to our form state
          if (loadedData && loadedData.copyrightApplication) {
            console.log(
              `Copyright form: Using data from ${sourceOfData} to populate form`
            );

            // Format the data for our form
            const formattedData = {
              workTitle: loadedData.copyrightApplication.workTitle || "",
              workDescription:
                loadedData.copyrightApplication.workDescription || "",
              creationDate: loadedData.copyrightApplication.creationDate || "",
              category:
                loadedData.copyrightApplication.category || "Literary Work",
              publicationStatus:
                loadedData.copyrightApplication.publicationStatus ||
                "unpublished",
              publicationDate:
                loadedData.copyrightApplication.publicationDate || "",
              publicationCountry:
                loadedData.copyrightApplication.publicationCountry || "",
            };

            // Update our local state
            console.log("Copyright form: Setting form data:", formattedData);
            setFormData(formattedData);

            // Directly apply values to the form - use setTimeout to ensure the form is ready
            setTimeout(() => {
              // First reset the form to clear any existing values
              form.reset(formattedData);

              // Then manually set each field to be extra sure
              form.setValue("workTitle", formattedData.workTitle);
              form.setValue("workDescription", formattedData.workDescription);
              form.setValue("creationDate", formattedData.creationDate);
              form.setValue("category", formattedData.category);
              form.setValue(
                "publicationStatus",
                formattedData.publicationStatus
              );
              form.setValue("publicationDate", formattedData.publicationDate);
              form.setValue(
                "publicationCountry",
                formattedData.publicationCountry
              );

              console.log(
                "Copyright form: Form values after direct setting:",
                form.getValues()
              );
            }, 0);
          } else {
            // If no data found, initialize with defaults
            console.log(
              "Copyright form: No existing data found, using defaults"
            );
            const defaultValues = {
              workTitle: "",
              workDescription: "",
              creationDate: "",
              category: "Literary Work",
              publicationStatus: "unpublished",
              publicationDate: "",
              publicationCountry: "",
            };
            setFormData(defaultValues);
            form.reset(defaultValues);
          }

          setInitialDataLoaded(true);
        } catch (error) {
          console.error(
            "Copyright form: Unexpected error during initial data loading:",
            error
          );
          setInitialDataLoaded(true);
        }
      };

      loadData();
    }
  }, [
    isHydrated,
    disclosureId,
    applicationId,
    fetchInitialData,
    form,
    initialDataLoaded,
    checkExistingDisclosureAndFetch,
  ]);

  // Add a new effect to handle when navigating back to the copyright tab
  useEffect(() => {
    // This effect should run when the activeTab is 'copyright-application'
    // and the store already has data (after navigating back from another tab)
    if (
      activeTab === "copyright-application" &&
      copyrightApplication &&
      isHydrated &&
      initialDataLoaded
    ) {
      console.log(
        "Back on copyright application tab, refreshing display with store data:",
        copyrightApplication
      );

      // Create formatted data for the form
      const formattedData = {
        workTitle: copyrightApplication.workTitle || "",
        workDescription: copyrightApplication.workDescription || "",
        creationDate: copyrightApplication.creationDate || "",
        category: copyrightApplication.category || "Literary Work",
        publicationStatus:
          copyrightApplication.publicationStatus || "unpublished",
        publicationDate: copyrightApplication.publicationDate || "",
        publicationCountry: copyrightApplication.publicationCountry || "",
      };

      // Update local state
      setFormData(formattedData);

      // Apply values to form with a small delay to ensure component is ready
      setTimeout(() => {
        form.reset(formattedData);

        // Manually set each field to be extra sure
        form.setValue("workTitle", formattedData.workTitle);
        form.setValue("workDescription", formattedData.workDescription);
        form.setValue("creationDate", formattedData.creationDate);
        form.setValue("category", formattedData.category);
        form.setValue("publicationStatus", formattedData.publicationStatus);
        form.setValue("publicationDate", formattedData.publicationDate);
        form.setValue("publicationCountry", formattedData.publicationCountry);

        console.log(
          "Copyright form values refreshed on tab return:",
          form.getValues()
        );
      }, 50);
    }
  }, [activeTab, copyrightApplication, isHydrated, form, initialDataLoaded]);

  // Modify the debounced update function to use loop detection
  const debouncedUpdateStore = useCallback(
    (formValues: any) => {
      // Check for potential loops
      if (checkForLoops()) {
        console.warn("Skipping update due to potential loop");
        return;
      }

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        // Use a careful comparison with previous values
        const currentValues = previousValuesRef.current;

        // Check for meaningful changes
        const hasChanges =
          !currentValues ||
          JSON.stringify(formValues) !== JSON.stringify(currentValues);

        if (!hasChanges) {
          console.log(
            "Skipping update - no meaningful changes detected in copyright application"
          );
          return;
        }

        // Log what we're doing
        console.log("Debounced update: saving copyright application to stores");

        // Add metadata to indicate this is a user edit
        const sanitizedValues = {
          ...formValues,
          _metadata: {
            userEdited: true,
            lastModified: Date.now(),
            source: "user-input",
          },
        };

        // Update the stores (only if not already updating)
        if (!isUpdatingRef.current) {
          // Set updating flag to prevent concurrent updates
          isUpdatingRef.current = true;

          try {
            setData(sanitizedValues);
            setCopyrightApplication(sanitizedValues);
            previousValuesRef.current = { ...sanitizedValues };

            // Log the data saved to the store for debugging
            console.log("Updated copyright form data:", sanitizedValues);
          } finally {
            // Clear the updating flag
            isUpdatingRef.current = false;
          }
        }

        // Clear the timer ref
        debounceTimerRef.current = null;
      }, 1000); // Debounce timeout in ms
    },
    [setData, setCopyrightApplication, checkForLoops]
  );

  // Cleanup effect for the debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Watch for form changes with improved handling
  useEffect(() => {
    // Don't watch for changes until the component is ready
    if (!initialDataLoaded) {
      console.log(
        "Not watching copyright form changes because initialDataLoaded is false"
      );
      return;
    }

    // Skip if we're already updating
    if (isUpdatingRef.current) {
      console.log(
        "Not watching copyright form changes because an update is in progress"
      );
      return;
    }

    console.log("Setting up copyright form change watcher");

    // Create a variable to track the last update time
    let lastUpdateTime = Date.now();
    const MIN_UPDATE_INTERVAL = 300; // Minimum time between updates in ms

    // Get current form values to initialize the previousValuesRef
    const currentValues = form.getValues();
    previousValuesRef.current = { ...currentValues };

    // Set up subscription to watch for field changes
    const subscription = form.watch((value, { name, type }) => {
      // Immediately exit if an update operation is in progress
      if (isUpdatingRef.current) {
        console.log(
          "Skipping copyright form watch update - operation in progress"
        );
        return;
      }

      // Rate limit updates
      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        return;
      }

      // Only process meaningful changes when they occur
      if (value && Object.keys(value).length > 0) {
        console.log(
          `Copyright form field "${name}" changed with type "${type}"`
        );

        // Update last update time
        lastUpdateTime = now;

        // Get the full form values
        const formValues = form.getValues();

        // Use the debounced update function
        debouncedUpdateStore(formValues);
      }
    });

    return () => {
      console.log("Cleaning up copyright form change watcher");
      subscription.unsubscribe();
    };
  }, [initialDataLoaded, form, debouncedUpdateStore]);

  const handleSave = async () => {
    try {
      // Show loading toast
      const toastId = toast.loading("Saving copyright application data...");

      // Validate the form
      const isValid = await form.trigger();
      if (!isValid) {
        console.log("Copyright form validation failed");
        toast.error("Please fill in all required fields", { id: toastId });
        return;
      }

      // Get form values
      const formValues = form.getValues();

      // Extract only the essential fields we need
      const essentialData = {
        workTitle: formValues.workTitle || "",
        workDescription: formValues.workDescription || "",
        creationDate: formValues.creationDate || "",
        category: formValues.category || "Literary Work",
        publicationStatus: formValues.publicationStatus || "unpublished",
        // Include publication details only if published
        ...(formValues.publicationStatus === "published" && {
          publicationDate: formValues.publicationDate || "",
          publicationCountry: formValues.publicationCountry || "",
        }),
        // Add metadata
        _metadata: {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-direct-save",
        },
      };

      // Log the data being saved
      console.log(
        "Saving essential copyright application data:",
        essentialData
      );

      // Save to local stores using the simplified data
      setData(essentialData);
      setCopyrightApplication(essentialData);
      previousValuesRef.current = { ...essentialData };

      // Save to the database using tRPC
      const success = await saveCopyrightApplication();

      if (success) {
        console.log(
          "Copyright application data saved successfully to database"
        );
        toast.success("Copyright application data saved successfully", {
          id: toastId,
        });
      } else {
        console.error("Failed to save copyright application data to database");
        toast.error("Failed to save copyright application data", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Error saving copyright application:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      toast.error("An error occurred while saving copyright application");
    }
  };

  const handleNext = async () => {
    try {
      // Show loading feedback
      const toastId = toast.loading("Validating form...");

      // Validate the form
      const isValid = await form.trigger();
      if (!isValid) {
        console.log("Form validation failed");
        toast.error("Please fill in all required fields", { id: toastId });
        return;
      }

      // Get form values
      const formValues = form.getValues();

      // Extract only the essential fields we need
      const essentialData = {
        workTitle: formValues.workTitle || "",
        workDescription: formValues.workDescription || "",
        creationDate: formValues.creationDate || "",
        category: formValues.category || "Literary Work",
        publicationStatus: formValues.publicationStatus || "unpublished",
        // Include publication details only if published
        ...(formValues.publicationStatus === "published" && {
          publicationDate: formValues.publicationDate || "",
          publicationCountry: formValues.publicationCountry || "",
        }),
        // Add metadata
        _metadata: {
          userEdited: true,
          lastModified: Date.now(),
          source: "navigation",
        },
      };

      // Update in-memory state with only the essential data
      console.log(
        "Storing essential copyright data before navigation:",
        essentialData
      );

      // Update both local stores to ensure data persistence
      setData(essentialData);
      setCopyrightApplication(essentialData);
      previousValuesRef.current = { ...essentialData };

      // Success message
      toast.success("Data saved in memory", { id: toastId });

      // Navigate to the next tab immediately
      setActiveTab("transaction-form-1");
    } catch (error) {
      console.error("Error in handleNext function:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      toast.error("An error occurred while processing your request");
    }
  };

  // Add handlePrevious function to navigate back to applicants-info
  const handlePrevious = () => {
    try {
      // Get form values and preserve them in memory
      const values = form.getValues();

      // Add metadata
      const dataToSave = {
        ...values,
        _metadata: {
          userEdited: true,
          lastModified: Date.now(),
          source: "navigation",
        },
      };

      // Update in-memory state to prevent data loss
      console.log("Saving copyright application data before navigating back");

      // Update both local stores to ensure data persistence
      setData(dataToSave);
      setCopyrightApplication(dataToSave);
      previousValuesRef.current = { ...dataToSave };

      // Navigate to the previous tab (applicants-info)
      setActiveTab("applicants-info");
      console.log("Navigated to applicants-info");
    } catch (error) {
      console.error("Error navigating to previous tab:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      toast.error("An error occurred while navigating to the previous page");

      // Try emergency navigation if all else fails
      setActiveTab("applicants-info");
    }
  };

  // FormRecoveryPanel component for debugging and data recovery
  const FormRecoveryPanel = () => {
    const [recoveryExpanded, setRecoveryExpanded] = useState(false);

    if (!recoveryExpanded) {
      return (
        <div className="flex justify-center mt-6 mb-2">
          <div className="relative group">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded shadow-sm border border-amber-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-max max-w-xs">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[8px] w-3 h-3 bg-amber-100 border-b border-r border-amber-200 rotate-45"></div>
              ⚠️ Only use if you're experiencing data issues
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecoveryExpanded(true)}
              className="text-amber-600 hover:text-amber-800 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 group flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 group-hover:text-amber-600" />
              <span>Form Recovery</span>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 border border-amber-200 rounded-md bg-amber-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-medium text-amber-800">
              Form Recovery Options
            </h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRecoveryExpanded(false)}
            className="h-8 w-8 p-0 rounded-full text-amber-700 hover:bg-amber-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="mb-4 p-2 bg-white/50 border border-amber-200 rounded text-xs text-amber-800">
          <p className="font-medium mb-1">
            ⚠️ Caution: Use these options only if you're experiencing issues
            with the form data
          </p>
          <p>
            Restoring data may overwrite your current changes. Make sure you've
            saved your work before proceeding.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReloadFormData}
            disabled={isResetting}
            className="flex items-center justify-center gap-2 border-amber-300 bg-white hover:bg-amber-100 text-amber-700"
          >
            {isResetting ? (
              <svg
                className="animate-spin h-4 w-4 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
            Restore Local Data
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchFromServer}
            disabled={isResetting}
            className="flex items-center justify-center gap-2 border-amber-300 bg-white hover:bg-amber-100 text-amber-700"
          >
            {isResetting ? (
              <svg
                className="animate-spin h-4 w-4 text-amber-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            )}
            Fetch from Server
          </Button>
        </div>
      </div>
    );
  };

  // Move these helper functions outside of FormRecoveryPanel
  // to make them accessible to both the panel and the popover
  const handleReloadFormData = async () => {
    try {
      setIsResetting(true);
      // Loading toast
      toast("Restoring form data...", {
        duration: Infinity, // Prevent auto-dismiss
        icon: "⏳",
      });

      if (copyrightApplication) {
        console.log(
          "Reloading copyright form with stored data:",
          copyrightApplication
        );

        const resetData = {
          workTitle: copyrightApplication.workTitle || "",
          workDescription: copyrightApplication.workDescription || "",
          creationDate: copyrightApplication.creationDate || "",
          category: copyrightApplication.category || "Literary Work",
          publicationStatus:
            copyrightApplication.publicationStatus || "unpublished",
          publicationDate: copyrightApplication.publicationDate || "",
          publicationCountry: copyrightApplication.publicationCountry || "",
        };

        // Update local state and form
        setFormData(resetData);
        form.reset(resetData);

        // Manually set each field as needed
        form.setValue("workTitle", resetData.workTitle);
        form.setValue("workDescription", resetData.workDescription);
        form.setValue("creationDate", resetData.creationDate);
        form.setValue("category", resetData.category);
        form.setValue("publicationStatus", resetData.publicationStatus);
        form.setValue("publicationDate", resetData.publicationDate);
        form.setValue("publicationCountry", resetData.publicationCountry);

        // Success toast
        toast.dismiss(); // Clear any previous toasts
        toast("Form data restored successfully", {
          duration: 3000,
          icon: "✅",
          style: {
            backgroundColor: "#f0fdf4",
            borderColor: "#86efac",
            color: "#166534",
          },
        });
      } else {
        // Error toast
        toast.dismiss(); // Clear any previous toasts
        toast("No saved data available to restore", {
          duration: 3000,
          icon: "❌",
          style: {
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
            color: "#b91c1c",
          },
        });
      }
    } catch (error) {
      console.error("Error reloading form data:", error);
      // Error toast
      toast.dismiss();
      toast("Failed to restore form data", {
        duration: 3000,
        icon: "❌",
        style: {
          backgroundColor: "#fef2f2",
          borderColor: "#fecaca",
          color: "#b91c1c",
        },
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleFetchFromServer = async () => {
    try {
      setIsResetting(true);
      // Loading toast
      toast("Fetching latest data from server...", {
        duration: Infinity, // Prevent auto-dismiss
        icon: "⏳",
      });

      // Attempt to reload data from the server
      const data = await fetchInitialData();

      if (data && data.copyrightApplication) {
        console.log(
          "Retrieved copyright data from server:",
          data.copyrightApplication
        );

        // Format the data
        const formattedData = {
          workTitle: data.copyrightApplication.workTitle || "",
          workDescription: data.copyrightApplication.workDescription || "",
          creationDate: data.copyrightApplication.creationDate || "",
          category: data.copyrightApplication.category || "Literary Work",
          publicationStatus:
            data.copyrightApplication.publicationStatus || "unpublished",
          publicationDate: data.copyrightApplication.publicationDate || "",
          publicationCountry:
            data.copyrightApplication.publicationCountry || "",
        };

        // Update local form state
        setFormData(formattedData);
        form.reset(formattedData);

        // Manually set each field
        form.setValue("workTitle", formattedData.workTitle);
        form.setValue("workDescription", formattedData.workDescription);
        form.setValue("creationDate", formattedData.creationDate);
        form.setValue("category", formattedData.category);
        form.setValue("publicationStatus", formattedData.publicationStatus);
        form.setValue("publicationDate", formattedData.publicationDate);
        form.setValue("publicationCountry", formattedData.publicationCountry);

        // Update store
        setCopyrightApplication(formattedData);

        // Success toast
        toast.dismiss();
        toast("Latest data loaded from server", {
          duration: 3000,
          icon: "✅",
          style: {
            backgroundColor: "#f0fdf4",
            borderColor: "#86efac",
            color: "#166534",
          },
        });
      } else {
        // Error toast
        toast.dismiss();
        toast("No copyright data found on server", {
          duration: 3000,
          icon: "❌",
          style: {
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
            color: "#b91c1c",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching from server:", error);
      // Error toast
      toast.dismiss();
      toast("Failed to fetch data from server", {
        duration: 3000,
        icon: "❌",
        style: {
          backgroundColor: "#fef2f2",
          borderColor: "#fecaca",
          color: "#b91c1c",
        },
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Add a component lifecycle logger to help diagnose issues
  useEffect(() => {
    // Log component mount
    console.log("CopyrightApplication component mounted", {
      disclosureId,
      isHydrated,
      initialDataLoaded,
      hasExistingData: !!copyrightApplication,
    });

    // Define a handler for beforeunload event to warn about unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are unsaved changes
      const formValues = form.getValues();
      const formIsDirty = form.formState.isDirty;

      if (formIsDirty && formValues?.workTitle) {
        // If there is a title entered and the form is dirty, show a warning
        const message =
          "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    // Add the event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Return cleanup function
    return () => {
      // Log component unmount
      console.log("CopyrightApplication component unmounting", {
        disclosureId,
        isHydrated,
        initialDataLoaded,
      });

      // Save data one last time before unmounting
      if (isHydrated && !isUpdatingRef.current) {
        try {
          const formValues = form.getValues();

          if (formValues?.workTitle) {
            console.log("Saving copyright data during component cleanup");

            // Add metadata
            const dataToSave = {
              ...formValues,
              _metadata: {
                userEdited: true,
                lastModified: Date.now(),
                source: "component-cleanup",
              },
            };

            // Update both stores synchronously
            setData(dataToSave);
            setCopyrightApplication(dataToSave);

            console.log("Copyright data saved during cleanup");
          }
        } catch (error) {
          console.error("Error saving copyright data during cleanup:", error);
        }
      }

      // Remove the event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Clear any debounce timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    disclosureId,
    isHydrated,
    initialDataLoaded,
    copyrightApplication,
    form,
    setData,
    setCopyrightApplication,
  ]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Copyright Application
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide details about your copyright application and work
            information
          </p>
        </div>
      {/*!! commented as such this is not needed as for that reason the form is already on a dynamic hiding and showing of form upon selecting a type of IP*/}
        {/* <Alert className="border-green-200 bg-green-50 text-green-800">
          <Info className="h-4 w-4 text-green-700" />
          <AlertDescription>
            Skip this section if your application is not related to Copyright.
          </AlertDescription>
        </Alert> */}

        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <FormField
              control={form.control}
              name="workTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Work Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    Description of the Work
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creationDate"
              render={({ field }) => {
                const [month, setMonth] = useState<Date>(
                  field.value ? new Date(field.value) : new Date()
                );
                const [isYearView, setIsYearView] = useState<boolean>(false);
                const years = eachYearOfInterval({
                  start: startOfYear(startDate),
                  end: endOfYear(endDate),
                });

                return (
                  <FormItem>
                    <FormLabel className="text-base">
                      Date of Creation
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                                    year.getFullYear() === month.getFullYear();

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
                                                new Date(
                                                  field.value
                                                ).getMonth() &&
                                              year.getFullYear() ===
                                                new Date(
                                                  field.value
                                                ).getFullYear();

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
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                );
                              }}
                              month={month}
                              onMonthChange={setMonth}
                              className="border-none p-0"
                              classNames={{
                                day_selected:
                                  "bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90",
                                day_today: "bg-slate-100 text-slate-900",
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
          </CardContent>
        </Card>

        <Separator className="bg-green-100" />

        <FormNavigation
          onSave={handleSave}
          onNext={handleNext}
          onPrevious={handlePrevious}
          showNext={true}
          showSubmit={false}
          currentTab={activeTab}
          isSaving={isLoading}
        />

        {/* Hidden form recovery functionality - moved to a small icon in the bottom corner */}
        <div className="flex justify-end mt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">Developer Options</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h4 className="text-sm font-medium">Developer Options</h4>
                <p className="text-xs text-slate-500 mt-1">
                  These options are for developers to troubleshoot form data
                  issues.
                </p>
              </div>
              <div className="p-4 space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReloadFormData}
                  disabled={isResetting}
                  className="w-full justify-start text-xs"
                >
                  {isResetting ? (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                  Restore Local Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchFromServer}
                  disabled={isResetting}
                  className="w-full justify-start text-xs"
                >
                  {isResetting ? (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  )}
                  Fetch from Server
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </form>
    </Form>
  );
}
