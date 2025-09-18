"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  Plus,
  X,
  Info as InfoIcon,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { useFormContext } from "../context/form-context";
import { FormNavigation } from "../components/form-navigation";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

// Define the type for API response data to avoid TypeScript errors
interface ApiResponseData {
  applicantsInfo?: {
    email: string;
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
    // Other applicantsInfo fields
    [key: string]: any;
  };
  transactionFormPart1?: any;
  transactionFormPart2?: any;
  copyrightApplication?: any;
  patentUtilityModelApplication?: any;
  trademarkApplication?: any;
  tradeSecretApplication?: any;
  disclosureConfirmation?: any;
  // Optional properties that might be directly at the root in some responses
  disclosureId?: string;
  clientId?: string;
  applicationId?: string;
  transaction_data?: any;
  copyright_transaction_part1?: any;
  [key: string]: any;
}

// Define the type for co-author objects to use throughout the component
type CoAuthor = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  sex?: string;
  nationality?: string;
  countryOfResidence?: string;
  address?: string;
  municipality?: string;
  provinceState?: string;
  zipCode?: string;
  mobileNumber?: string;
  emailAddress?: string;
  isClaimingEntireWork: boolean;
  claimDetails?: string;
  [key: string]: any; // For any other properties
};

const coAuthorSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  civilStatus: z.string().optional(),
  sex: z.string().optional(),
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
  address: z.string().optional(),
  municipality: z.string().optional(),
  provinceState: z.string().optional(),
  zipCode: z.string().optional(),
  mobileNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  isClaimingEntireWork: z.boolean().default(false),
  claimDetails: z.string().optional(),
});

const formSchema = z.object({
  transaction_data: z.object({
    coAuthors: z.array(coAuthorSchema),
  }),
  disclosureId: z.string().uuid().optional(),
  copyrightId: z.string().uuid().optional(),
});

// Create a store for transaction form part 1 data
interface TransactionFormPart1State {
  data: z.infer<typeof formSchema> | null;
  setData: (data: z.infer<typeof formSchema>) => void;
}

const useTransactionFormPart1Store = create<TransactionFormPart1State>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "transaction-form-part1-storage",
    }
  )
);

// Define starting and ending dates for the calendar picker
const now = new Date();
const startDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
const endDate = new Date(now.getFullYear(), 11, 31); // Current year

export function TransactionFormPart1() {
  const {
    setTransactionFormPart1,
    transactionFormPart1,
    setActiveTab,
    activeTab,
    disclosureId,
    copyrightApplication, // Add this to get copyrightApplication from the store
  } = useIpDisclosureStore();
  const { data, setData } = useTransactionFormPart1Store();
  const {
    saveCopyrightApplication,
    isLoading: apiIsLoading,
    fetchInitialData,
  } = useIpDisclosure();
  const { isHydrated } = useFormContext();

  // Track last API call timestamp to prevent redundant calls
  const lastApiCallRef = useRef<number>(0);

  // Track previous hydration state to detect changes
  const prevHydratedRef = useRef<boolean>(isHydrated);

  // Define constants used throughout the component
  const DEBOUNCE_TIMEOUT = 1000;
  const MAX_LOAD_ATTEMPTS = 3;
  const MIN_API_CALL_INTERVAL = 5000; // 5 seconds

  // Add loading state to prevent multiple loading attempts
  const [isLoading, setIsLoading] = useState(false);
  // Add a state to track if data was already loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  // Add a counter to track loading attempts
  const [loadAttempts, setLoadAttempts] = useState(0);
  // Add a state to track loading errors
  const [loadError, setLoadError] = useState<string | null>(null);
  // Add a state to track if we should watch for field changes
  const [shouldWatchChanges, setShouldWatchChanges] = useState(false);

  // Create memoized default values for the form
  const defaultFormValues = useMemo(() => {
    return (
      data ||
      transactionFormPart1 || {
        transaction_data: {
          coAuthors: [],
        },
        disclosureId: undefined,
        copyrightId: undefined,
      }
    );
  }, [data, transactionFormPart1]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "transaction_data.coAuthors",
  });

  // Add ref for tracking updates
  const isUpdatingRef = useRef(false);
  const previousValuesRef = useRef(data);
  // Add a debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Add an error tracking ref
  const errorTrackingRef = useRef<{ count: number; lastError?: Error }>({
    count: 0,
  });

  // Track performance metrics
  const performanceMetrics = useRef<{
    lastUpdateTime: number;
    updateCount: number;
    avgUpdateTime: number;
  }>({
    lastUpdateTime: 0,
    updateCount: 0,
    avgUpdateTime: 0,
  });

  // Add loop detection
  const updateCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());

  // Function to detect potential infinite loops
  const checkForLoops = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // If updates are happening very rapidly, it might be a loop
    if (timeSinceLastUpdate < 100) {
      updateCountRef.current++;

      // If we've had many rapid updates, it might be a loop
      if (updateCountRef.current > 10) {
        console.error(
          "Potential infinite loop detected in transaction-form-part1"
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

  // Define a function to safely throttle API calls
  const safeApiCall = useCallback(
    async <T,>(
      apiFunction: () => Promise<T>,
      errorMessage: string
    ): Promise<T | null> => {
      // Check if we've called the API too recently
      const now = Date.now();
      if (now - lastApiCallRef.current < MIN_API_CALL_INTERVAL) {
        console.log("API call throttled - too many requests");
        return null;
      }

      // Update the last API call timestamp
      lastApiCallRef.current = now;

      try {
        return await apiFunction();
      } catch (error) {
        console.error(errorMessage, error);
        setLoadError(error instanceof Error ? error.message : errorMessage);

        // Track error for debugging
        errorTrackingRef.current.count++;
        if (error instanceof Error) {
          errorTrackingRef.current.lastError = error;
        }

        return null;
      }
    },
    []
  );

  // Modify the debounce function to use loop detection
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
        // Performance tracking - start time
        const startTime = performance.now();

        // Use a more careful comparison that focuses on coAuthors
        const currentValues = previousValuesRef.current;

        // Helper function to check if coAuthors are different
        const hasCoAuthorChanges = () => {
          // If we have no previous values, always save
          if (!currentValues || !currentValues.transaction_data) return true;

          // If co-authors don't exist in either object, no changes
          if (
            !currentValues.transaction_data.coAuthors &&
            !formValues.transaction_data?.coAuthors
          )
            return false;

          // If co-authors exist in one but not the other, there are changes
          if (
            !currentValues.transaction_data.coAuthors ||
            !formValues.transaction_data?.coAuthors
          )
            return true;

          // If arrays have different lengths, there are changes
          if (
            currentValues.transaction_data.coAuthors.length !==
            formValues.transaction_data.coAuthors.length
          )
            return true;

          // Compare each co-author's fields individually
          return formValues.transaction_data.coAuthors.some(
            (author: any, index: number) => {
              const prevAuthor =
                currentValues.transaction_data.coAuthors[index];
              if (!prevAuthor) return true; // New author

              // Check if any fields have changed - use type-safe approach
              return Object.keys(author).some((key) => {
                // Only compare if both have the property
                if (key in author && key in prevAuthor) {
                  // Use type assertions for TypeScript
                  const authorValue = (author as any)[key];
                  const prevAuthorValue = (prevAuthor as any)[key];
                  return (
                    JSON.stringify(authorValue) !==
                    JSON.stringify(prevAuthorValue)
                  );
                }
                // If one has the property and the other doesn't, they're different
                return true;
              });
            }
          );
        };

        // Check for changes in a way that detects small modifications to co-authors
        const hasChanges =
          !currentValues ||
          hasCoAuthorChanges() ||
          formValues.disclosureId !== currentValues.disclosureId ||
          formValues.copyrightId !== currentValues.copyrightId;

        if (!hasChanges) {
          console.log(
            "Skipping update - no meaningful changes detected in transaction form part 1"
          );
          return;
        }

        // Log what we're doing
        console.log(
          "Debounced update: saving transaction form part 1 values to stores"
        );

        // Ensure transaction_data and coAuthors exist with proper structure
        const sanitizedValues = { ...formValues };
        if (!sanitizedValues.transaction_data) {
          sanitizedValues.transaction_data = { coAuthors: [] };
        }
        if (!sanitizedValues.transaction_data.coAuthors) {
          sanitizedValues.transaction_data.coAuthors = [];
        }

        // Add metadata to indicate this is a user edit
        sanitizedValues._metadata = {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-input",
        };

        // Update the stores (only if not already updating)
        if (!isUpdatingRef.current) {
          // Set updating flag to prevent concurrent updates
          isUpdatingRef.current = true;

          try {
            setData(sanitizedValues);
            setTransactionFormPart1(sanitizedValues);
            previousValuesRef.current = { ...sanitizedValues };

            // Log the data saved to the store for debugging
            console.log("Updated form data:", {
              hasTransactionData: !!sanitizedValues.transaction_data,
              coAuthorsLength:
                sanitizedValues.transaction_data?.coAuthors?.length || 0,
              firstAuthor: sanitizedValues.transaction_data?.coAuthors?.[0]
                ? `${
                    sanitizedValues.transaction_data.coAuthors[0].firstName ||
                    ""
                  } ${
                    sanitizedValues.transaction_data.coAuthors[0].lastName || ""
                  }`.trim()
                : "none",
              disclosureId: sanitizedValues.disclosureId,
              copyrightId: sanitizedValues.copyrightId,
            });
          } finally {
            // Clear the updating flag
            isUpdatingRef.current = false;
          }
        }

        // Clear the timer ref
        debounceTimerRef.current = null;

        // Track performance metrics
        const endTime = performance.now();
        const updateTime = endTime - startTime;
        performanceMetrics.current.updateCount++;
        performanceMetrics.current.lastUpdateTime = updateTime;
        performanceMetrics.current.avgUpdateTime =
          (performanceMetrics.current.avgUpdateTime *
            (performanceMetrics.current.updateCount - 1) +
            updateTime) /
          performanceMetrics.current.updateCount;

        if (updateTime > 200) {
          console.warn(
            `Store update took ${updateTime.toFixed(2)}ms, which is slow`
          );
        }
      }, DEBOUNCE_TIMEOUT);
    },
    [setData, setTransactionFormPart1, checkForLoops]
  );

  // Cleanup effect - This should be defined first as it's simple and has no dependencies
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Ensure at least one co-author field is available
  useEffect(() => {
    if (fields.length === 0) {
      console.log("No co-author fields found, adding default empty field");
      append({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        civilStatus: "",
        sex: "",
        nationality: "",
        countryOfResidence: "",
        address: "",
        municipality: "",
        provinceState: "",
        zipCode: "",
        mobileNumber: "",
        emailAddress: "",
        isClaimingEntireWork: false,
        claimDetails: "",
      });
    }
  }, [fields.length, append]);

  // Update watch for form changes to prevent it from being disabled incorrectly
  useEffect(() => {
    // Don't watch for changes if the component isn't ready
    if (!shouldWatchChanges) {
      console.log(
        "Not watching form changes because shouldWatchChanges is false"
      );
      return;
    }

    // Skip if we're already updating
    if (isUpdatingRef.current) {
      console.log("Not watching form changes because an update is in progress");
      return;
    }

    console.log(
      "Setting up form change watcher (hydration state:",
      isHydrated,
      ")"
    );

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
        console.log("Skipping form watch update - operation in progress");
        return;
      }

      // Rate limit updates
      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
        console.log(
          `Throttling update - too soon since last update (${
            now - lastUpdateTime
          }ms)`
        );
        return;
      }

      // Only process meaningful changes when they occur
      if (value && Object.keys(value).length > 0) {
        console.log(`Form field "${name}" changed with type "${type}"`);

        // Update last update time
        lastUpdateTime = now;

        // Get the full form values
        const formValues = form.getValues();

        // Use the debounced update function
        debouncedUpdateStore(formValues);
      }
    });

    return () => {
      console.log("Cleaning up form change watcher");
      subscription.unsubscribe();
    };
  }, [shouldWatchChanges, form, debouncedUpdateStore, isHydrated]);

  // Update the initial data loading logic to prevent infinite loops
  useEffect(() => {
    // Only proceed if the store is hydrated and we haven't loaded data yet
    if (!isHydrated || dataLoaded || isLoading) {
      console.log("Skipping initial data load because:", {
        isHydrated,
        dataLoaded,
        isLoading,
      });
      return;
    }

    // Limit loading attempts to prevent infinite loops
    if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
      console.warn(
        `Maximum load attempts (${MAX_LOAD_ATTEMPTS}) reached, using default data`
      );
      setDataLoaded(true);
      setIsLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      console.log("Transaction Form Part 1 - Starting to load initial data");

      try {
        // First check if we have data in local storage
        const localData = data || transactionFormPart1;
        if (localData) {
          console.log(
            "Using existing transaction form part 1 data:",
            localData
          );
          form.reset(localData);
          setDataLoaded(true);
          setLoadAttempts((prev) => prev + 1);
          return true;
        }

        // If we have a disclosure ID, try to fetch from API
        if (disclosureId) {
          console.log(`Fetching data for disclosure ID: ${disclosureId}`);

          // Try the main fetchInitialData function first
          const apiData = await fetchInitialData();
          console.log("API response:", apiData);

          // Check if we got transaction form part 1 data
          if (apiData && apiData.transactionFormPart1) {
            console.log(
              "Found transaction form part 1 data in API response:",
              apiData.transactionFormPart1
            );
            form.reset(apiData.transactionFormPart1);
            setTransactionFormPart1(apiData.transactionFormPart1);
            setDataLoaded(true);
            setLoadAttempts((prev) => prev + 1);
            return true;
          }

          // If no transaction form part 1 data in main API response, try direct API endpoint
          console.log(
            "No transaction form part 1 data in main API response, trying direct endpoint"
          );

          try {
            // Try fetching directly from the transaction-part1 endpoint
            const response = await fetch(
              `/api/ip-disclosure/${disclosureId}/transaction-part1`
            );

            if (response.ok) {
              const directData = await response.json();
              console.log("Direct API response:", directData);

              if (directData && directData.data) {
                // Process the data to ensure it has the correct structure
                const processedData = {
                  disclosureId: disclosureId,
                  copyrightId:
                    directData.data.copyrightId ||
                    apiData?.copyrightApplication?.copyrightId,
                  transaction_data: {
                    coAuthors: Array.isArray(
                      directData.data.transaction_data?.coAuthors
                    )
                      ? directData.data.transaction_data.coAuthors
                      : [],
                  },
                };

                console.log(
                  "Processed transaction form part 1 data:",
                  processedData
                );

                // If the coAuthors array is empty or undefined, add a default empty entry
                if (
                  !processedData.transaction_data.coAuthors ||
                  processedData.transaction_data.coAuthors.length === 0
                ) {
                  console.log(
                    "No valid coAuthors found, adding a default empty entry"
                  );
                  processedData.transaction_data.coAuthors = [
                    {
                      firstName: "",
                      middleName: "",
                      lastName: "",
                      dateOfBirth: "",
                      civilStatus: "",
                      sex: "",
                      nationality: "",
                      countryOfResidence: "",
                      address: "",
                      municipality: "",
                      provinceState: "",
                      zipCode: "",
                      mobileNumber: "",
                      emailAddress: "",
                      isClaimingEntireWork: false,
                      claimDetails: "",
                    },
                  ];
                }

                form.reset(processedData);
                setTransactionFormPart1(processedData);
                setDataLoaded(true);
                setLoadAttempts((prev) => prev + 1);
                return true;
              }
            }
          } catch (directError) {
            console.error("Error fetching from direct endpoint:", directError);
          }

          // If all API calls failed, initialize with empty data
          console.log("All API calls failed, initializing with empty data");
          const emptyData = {
            disclosureId: disclosureId,
            copyrightId: apiData?.copyrightApplication?.copyrightId,
            transaction_data: {
              coAuthors: [
                {
                  firstName: "",
                  middleName: "",
                  lastName: "",
                  dateOfBirth: "",
                  civilStatus: "",
                  sex: "",
                  nationality: "",
                  countryOfResidence: "",
                  address: "",
                  municipality: "",
                  provinceState: "",
                  zipCode: "",
                  mobileNumber: "",
                  emailAddress: "",
                  isClaimingEntireWork: false,
                  claimDetails: "",
                },
              ],
            },
          };

          form.reset(emptyData);
          setTransactionFormPart1(emptyData);
          setDataLoaded(true);
          setLoadAttempts((prev) => prev + 1);
          return true;
        }

        // If we have no disclosure ID, we can't fetch data
        console.log("No disclosure ID available, cannot fetch data");
        setDataLoaded(true);
        return false;
      } catch (error) {
        console.error("Error loading initial data:", error);
        setLoadError(
          error instanceof Error ? error.message : "Unknown error loading data"
        );
        setDataLoaded(true);
        setLoadAttempts((prev) => prev + 1);
        return false;
      } finally {
        setIsLoading(false);
        setShouldWatchChanges(true);
      }
    };

    loadInitialData();
  }, [
    isHydrated,
    disclosureId,
    form,
    fetchInitialData,
    dataLoaded,
    isLoading,
    loadAttempts,
    setData,
    setTransactionFormPart1,
    setShouldWatchChanges,
  ]);

  // Handle errors by showing a recovery button with detailed error info
  const RecoveryButton = () => {
    if (!loadError) return null;

    // Get error details for display
    const errorDetails = errorTrackingRef.current.lastError
      ? `${errorTrackingRef.current.lastError.message} (${errorTrackingRef.current.count} errors total)`
      : loadError;

    return (
      <div className="p-4 mb-6 border border-red-200 bg-red-50 rounded-md">
        <p className="text-red-700 mb-2">Error loading data: {errorDetails}</p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            // Reset loading state
            setIsLoading(false);
            setDataLoaded(false);
            setLoadAttempts(0);
            setLoadError(null);

            // Show loading message
            toast.info("Retrying data load...");
          }}
        >
          Retry Loading Data
        </Button>
      </div>
    );
  };

  // Loading indicator component
  const LoadingIndicator = () => {
    if (!isLoading) return null;

    return (
      <div className="p-4 mb-6 border border-blue-200 bg-blue-50 rounded-md">
        <div className="flex items-center">
          <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-blue-700 border-r-2 rounded-full"></div>
          <p className="text-blue-700">
            Loading co-author data... (attempt {loadAttempts} of{" "}
            {MAX_LOAD_ATTEMPTS})
          </p>
        </div>
      </div>
    );
  };

  // Add a function to manually persist form data after field changes
  const persistFormData = useCallback(() => {
    // Log detailed state information for debugging
    console.log("persistFormData called with state:", {
      isHydrated,
      isUpdating: isUpdatingRef.current,
      hasForm: !!form,
      formIsDirty: form?.formState?.isDirty,
      hasExistingData: !!transactionFormPart1,
    });

    // Check form state instead of just isHydrated flag
    if (isUpdatingRef.current) {
      console.log("Cannot persist data: update operation in progress");
      return null;
    }

    try {
      // Get current form values - this should work regardless of hydration state
      const formValues = form.getValues();

      // Verify we have meaningful data to save
      if (!formValues || typeof formValues !== "object") {
        console.log("Cannot persist data: form values not available");
        return null;
      }

      console.log("Manually persisting form data");

      // Ensure transaction_data and coAuthors exist with proper structure
      const sanitizedValues = { ...formValues };
      if (!sanitizedValues.transaction_data) {
        sanitizedValues.transaction_data = { coAuthors: [] };
      }
      if (!sanitizedValues.transaction_data.coAuthors) {
        sanitizedValues.transaction_data.coAuthors = [];
      }

      // Make sure we preserve the disclosureId if it exists in the current data
      if (!sanitizedValues.disclosureId && disclosureId) {
        sanitizedValues.disclosureId = disclosureId;
      }

      // Add metadata
      const dataToSave = {
        ...sanitizedValues,
        _metadata: {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-input",
        },
      };

      // Update both stores - use a try/catch to handle any potential errors
      try {
        // First try to update the local component store which doesn't depend on hydration
        setData(dataToSave);

        // Then try to update the global store, which might fail if not hydrated
        if (setTransactionFormPart1) {
          setTransactionFormPart1(dataToSave);
        }

        // Update the previous values reference
        previousValuesRef.current = { ...dataToSave };

        // Log a summary of what we're persisting
        console.log("Successfully persisted data:", {
          hasTransactionData: true,
          coAuthorsCount: dataToSave.transaction_data.coAuthors.length,
          disclosureId: dataToSave.disclosureId,
          copyrightId: dataToSave.copyrightId,
        });

        return dataToSave;
      } catch (error) {
        console.error("Error while saving to stores:", error);
        // Return the data anyway since we might be able to use it
        return dataToSave;
      }
    } catch (error) {
      console.error("Error in persistFormData:", error);
      return null;
    }
  }, [
    form,
    disclosureId,
    isHydrated,
    setData,
    setTransactionFormPart1,
    transactionFormPart1,
  ]);

  // Add a function to reset updating state if it gets stuck
  const resetUpdatingState = useCallback(() => {
    if (isUpdatingRef.current) {
      console.log("Resetting stuck updating state");
      isUpdatingRef.current = false;
      return true;
    }
    return false;
  }, []);

  // Modify the handleNext and handlePrevious functions to use the persistence method
  const handleNext = async () => {
    try {
      // Show loading toast for user feedback
      const toastId = toast.loading("Validating form...");

      // Always get the form values first, before any validation
      const formValues = form.getValues();

      // Check if we have valid data to work with
      if (
        !formValues ||
        !formValues.transaction_data ||
        !Array.isArray(formValues.transaction_data.coAuthors)
      ) {
        console.error(
          "Invalid form structure - ensuring proper data structure"
        );

        // Try to fix the structure
        const fixedValues = {
          ...formValues,
          transaction_data: {
            ...(formValues?.transaction_data || {}),
            coAuthors: Array.isArray(formValues?.transaction_data?.coAuthors)
              ? formValues.transaction_data.coAuthors
              : [],
          },
          disclosureId: formValues?.disclosureId || disclosureId || undefined,
        };

        // Update the form with fixed structure
        form.reset(fixedValues);
      }

      // Validate form data before navigating
      const isValid = await form.trigger();
      if (!isValid) {
        console.error("Form validation failed");
        toast.error("Please fill in all required fields", { id: toastId });
        return;
      }

      // Set a flag to prevent multiple operations
      if (isUpdatingRef.current) {
        console.log("Update already in progress, waiting...");
        toast.error("Another operation is in progress", { id: toastId });
        return;
      }

      // Set the updating flag to prevent concurrent operations
      isUpdatingRef.current = true;

      try {
        // First try to persist with the regular method
        let savedData = persistFormData();

        // If that fails, try a direct approach
        if (!savedData) {
          console.warn("Primary persistence method failed, using fallback");

          // Get fresh form values
          const directFormValues = form.getValues();

          // Create sanitized data structure
          savedData = {
            ...directFormValues,
            transaction_data: {
              ...(directFormValues.transaction_data || {}),
              coAuthors: Array.isArray(
                directFormValues.transaction_data?.coAuthors
              )
                ? directFormValues.transaction_data.coAuthors
                : [],
            },
            disclosureId:
              directFormValues.disclosureId || disclosureId || undefined,
            _metadata: {
              userEdited: true,
              lastModified: Date.now(),
              source: "fallback-save",
            },
          };

          // Try direct store updates
          try {
            setData(savedData);
            setTransactionFormPart1(savedData);
            console.log("Used fallback persistence method");
          } catch (error) {
            console.error("Even fallback persistence failed:", error);
            toast.error("Could not save form data", { id: toastId });
            return;
          }
        }

        // Success message
        toast.success("Data saved in memory", { id: toastId });

        console.log("Navigating to next tab with data:", {
          hasTransactionData: true,
          coAuthorsLength: savedData?.transaction_data?.coAuthors?.length || 0,
        });

        // Navigate to the next tab after a short delay
        setTimeout(() => {
          setActiveTab("transaction-form-2");
        }, 100);
      } finally {
        // Always clear the updating flag
        isUpdatingRef.current = false;
      }
    } catch (error) {
      // Clear the updating flag on error
      isUpdatingRef.current = false;

      console.error("Error navigating to next tab:", error);
      toast.error("An error occurred during navigation");

      // Try emergency navigation if all else fails
      try {
        setTimeout(() => {
          setActiveTab("transaction-form-2");
        }, 500);
      } catch (navError) {
        console.error("Even emergency navigation failed:", navError);
      }
    }
  };

  const handlePrevious = () => {
    try {
      // Always get the form values first
      const formValues = form.getValues();

      // Check if we have valid data to work with
      if (
        !formValues ||
        !formValues.transaction_data ||
        !Array.isArray(formValues.transaction_data.coAuthors)
      ) {
        console.warn(
          "Invalid form structure when navigating back - using empty structure"
        );
      }

      // Set a flag to prevent multiple operations
      if (isUpdatingRef.current) {
        console.log("Update already in progress, waiting...");
        toast.error("Another operation is in progress");
        return;
      }

      // Set the updating flag to prevent concurrent operations
      isUpdatingRef.current = true;

      try {
        // First try to persist with the regular method
        let savedData = persistFormData();

        // If that fails, try a direct approach
        if (!savedData) {
          console.warn("Primary persistence method failed, using fallback");

          // Get fresh form values
          const directFormValues = form.getValues();

          // Create sanitized data structure
          savedData = {
            ...directFormValues,
            transaction_data: {
              ...(directFormValues.transaction_data || {}),
              coAuthors: Array.isArray(
                directFormValues.transaction_data?.coAuthors
              )
                ? directFormValues.transaction_data.coAuthors
                : [],
            },
            disclosureId:
              directFormValues.disclosureId || disclosureId || undefined,
            _metadata: {
              userEdited: true,
              lastModified: Date.now(),
              source: "fallback-save",
            },
          };

          // Try direct store updates
          try {
            setData(savedData);
            setTransactionFormPart1(savedData);
            console.log("Used fallback persistence method");
          } catch (error) {
            console.error("Even fallback persistence failed:", error);
            // Proceed with navigation anyway
          }
        }

        // Provide user feedback
        toast.success("Data saved in memory");

        console.log("Navigating to previous tab with data:", {
          hasTransactionData: true,
          coAuthorsLength: savedData?.transaction_data?.coAuthors?.length || 0,
        });

        // Navigate to the previous tab immediately - we're going back so data preservation is less critical
        setActiveTab("copyright-application");
      } finally {
        // Always clear the updating flag
        isUpdatingRef.current = false;
      }
    } catch (error) {
      // Clear the updating flag on error
      isUpdatingRef.current = false;

      console.error("Error navigating to previous tab:", error);
      toast.error("An error occurred during navigation");

      // Navigate anyway to prevent user from being stuck
      setActiveTab("copyright-application");
    }
  };

  // Modify the handleSave function to use the persistence method
  const handleSave = async () => {
    try {
      // Start loading state
      isUpdatingRef.current = true; // Fix: change setIsUpdatingRef to isUpdatingRef

      // Get current values from the form
      const currentValues = form.getValues();

      console.log("Saving transaction form part 1 data:", currentValues);

      // Make sure we have required IDs
      if (!currentValues.disclosureId && disclosureId) {
        currentValues.disclosureId = disclosureId;
      }

      if (!currentValues.copyrightId && copyrightApplication?.copyrightId) {
        currentValues.copyrightId = copyrightApplication.copyrightId;
      }

      // Update local store first
      setTransactionFormPart1(currentValues);
      setData(currentValues);

      // Save to database via direct API call for most reliable update
      const apiResponse = await fetch(
        `/api/ip-disclosure/${currentValues.disclosureId}/transaction-part1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disclosureId: currentValues.disclosureId,
            copyrightId: currentValues.copyrightId,
            data: currentValues,
          }),
        }
      );

      if (!apiResponse.ok) {
        throw new Error(
          `Failed to save: ${apiResponse.status} ${apiResponse.statusText}`
        );
      }

      const result = await apiResponse.json();

      // Show success message
      toast.success("Transaction data saved successfully");
      console.log("Transaction form part 1 saved successfully:", result);

      return true;
    } catch (error) {
      console.error("Error saving transaction form:", error);
      toast.error(
        "Error saving transaction data: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      return false;
    } finally {
      // End loading state
      isUpdatingRef.current = false; // Fix: change setIsUpdatingRef to isUpdatingRef
    }
  };

  // Add a useEffect to log form values whenever they change
  useEffect(() => {
    if (!shouldWatchChanges) return;

    const formValues = form.getValues();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Current form values:`, {
      hasTransactionData: !!formValues.transaction_data,
      coAuthorsLength: formValues.transaction_data?.coAuthors?.length || 0,
      coAuthorsData: formValues.transaction_data?.coAuthors,
      disclosureId: formValues.disclosureId,
    });
  }, [form, shouldWatchChanges]);

  // Add debugging for the form fields
  useEffect(() => {
    // Check the structure of the data in the store
    const storeData = useIpDisclosureStore.getState().transactionFormPart1;
    console.log("Store data structure:", {
      hasData: !!storeData,
      hasTransactionData: !!storeData?.transaction_data,
      coAuthorsLength: storeData?.transaction_data?.coAuthors?.length || 0,
      firstCoAuthorName: storeData?.transaction_data?.coAuthors?.[0]
        ? `${storeData.transaction_data.coAuthors[0].firstName || ""} ${
            storeData.transaction_data.coAuthors[0].lastName || ""
          }`.trim() || "empty"
        : "none",
    });

    // Check the values in the form
    const formValues = form.getValues();
    console.log("Form values:", {
      hasTransactionData: !!formValues.transaction_data,
      coAuthorsLength: formValues.transaction_data?.coAuthors?.length || 0,
      firstCoAuthorName: formValues.transaction_data?.coAuthors?.[0]
        ? `${formValues.transaction_data.coAuthors[0].firstName || ""} ${
            formValues.transaction_data.coAuthors[0].lastName || ""
          }`.trim() || "empty"
        : "none",
    });
  }, [form]);

  // Add a component lifecycle logger to help diagnose issues
  useEffect(() => {
    // Log component mount
    console.log("TransactionFormPart1 component mounted", {
      disclosureId,
      isHydrated,
      dataLoaded,
      hasExistingData: !!transactionFormPart1,
    });

    // Define a handler for beforeunload event to warn about unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are unsaved changes
      const formValues = form.getValues();
      const formIsDirty = form.formState.isDirty;

      if (formIsDirty && formValues?.transaction_data?.coAuthors?.length > 0) {
        // If there are co-authors and the form is dirty, show a warning
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
      console.log("TransactionFormPart1 component unmounting", {
        disclosureId,
        isHydrated,
        dataLoaded,
      });

      // Save data one last time before unmounting
      if (isHydrated && !isUpdatingRef.current) {
        try {
          const formValues = form.getValues();

          if (formValues?.transaction_data?.coAuthors?.length > 0) {
            console.log("Saving data during component cleanup");

            // Add metadata
            const dataToSave = {
              ...formValues,
              _metadata: {
                userEdited: true,
                lastModified: Date.now(),
                source: "user-input-cleanup",
              },
            };

            // Update both stores synchronously
            setData(dataToSave);
            setTransactionFormPart1(dataToSave);

            console.log("Data saved during cleanup");
          }
        } catch (error) {
          console.error("Error saving data during cleanup:", error);
        }
      }

      // Remove the event listener
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    disclosureId,
    isHydrated,
    dataLoaded,
    transactionFormPart1,
    form,
    setData,
    setTransactionFormPart1,
  ]);

  // Add a special effect to monitor and fix hydration if needed
  useEffect(() => {
    // Update hydration reference anytime it changes
    if (prevHydratedRef.current !== isHydrated) {
      // If hydration was lost, this might need fixing
      if (prevHydratedRef.current && !isHydrated) {
        console.warn("Hydration state was lost, attempting recovery");

        // Try to get data from the local component state first
        const localData = data || transactionFormPart1;

        if (localData) {
          console.log(
            "Restoring form data from local state during hydration loss"
          );

          // Reset the form with the local data to preserve user changes
          form.reset(localData);
        } else {
          console.warn("No local data available for hydration recovery");
        }
      }

      // If we've regained hydration, make sure the form has the latest data
      if (!prevHydratedRef.current && isHydrated) {
        console.log("Hydration state was restored");

        // Check which data source to use
        const storeData = useIpDisclosureStore.getState().transactionFormPart1;
        if (storeData) {
          console.log(
            "Restoring form data from store after hydration restored"
          );
          form.reset(storeData);
        }
      }

      // Update the previous hydration state
      prevHydratedRef.current = isHydrated;
    }

    // Return cleanup function
    return () => {
      console.log("Hydration monitoring effect cleaned up");
    };
  }, [isHydrated, form, data, transactionFormPart1]);

  // Add this state to track if we're currently processing API data
  const [isProcessingApi, setIsProcessingApi] = useState(false);

  // Create a ref to track previous runs - moved outside the useEffect
  const hasRunRef = useRef(false);
  const previousTabRef = useRef<string | null>(null);

  // Modify the useEffect to use the handler and to include the appropriate dependencies
  useEffect(() => {
    // Only run if the tab changed to our tab
    if (
      activeTab === "transaction-form-1" &&
      previousTabRef.current !== activeTab &&
      !isProcessingApi
    ) {
      console.log("Transaction form part 1 tab activated, checking data");
      previousTabRef.current = activeTab;

      // Only run once for this tab activation
      if (hasRunRef.current) {
        console.log(
          "Skipping data load - already processed for this tab activation"
        );
        return;
      }

      hasRunRef.current = true;

      // Check if form already has data with actual values
      const formData = form.getValues();

      // Check if there's actual content in the coAuthors array
      const hasRealData = formData?.transaction_data?.coAuthors?.some(
        (author: CoAuthor) =>
          author.firstName || author.lastName || author.nationality
      );

      console.log("Form data check on tab activation:", {
        hasCoAuthorsArray: !!formData?.transaction_data?.coAuthors,
        coAuthorsLength: formData?.transaction_data?.coAuthors?.length || 0,
        hasRealData,
        firstCoAuthorFirstName:
          formData?.transaction_data?.coAuthors?.[0]?.firstName || "empty",
      });

      // Always check the store data in case it's newer
      const storeData = useIpDisclosureStore.getState().transactionFormPart1;

      // Check if store has real data
      const storeHasRealData = storeData?.transaction_data?.coAuthors?.some(
        (author: CoAuthor) =>
          author.firstName || author.lastName || author.nationality
      );

      console.log("Store data check on tab activation:", {
        hasStoreData: !!storeData,
        storeCoAuthorsLength:
          storeData?.transaction_data?.coAuthors?.length || 0,
        storeHasRealData,
        storeFirstCoAuthorFirstName:
          storeData?.transaction_data?.coAuthors?.[0]?.firstName || "empty",
      });

      // If the form doesn't have real data, or the store has newer data, reload from the store
      if (!hasRealData || (storeHasRealData && storeData)) {
        console.log(
          "Form lacks real data or store has real data, attempting to reload"
        );

        // Try getting fresh data - forcing a reload if we don't see real author data
        if (storeData && storeHasRealData) {
          console.log("Restoring real form data from store on tab activation");
          form.reset(storeData);
          // Also update the local data store for consistency
          setData(storeData);

          // Reset the run flag after a delay to allow processing on next activation
          setTimeout(() => {
            hasRunRef.current = false;
          }, 500);
        } else if (!isLoading && loadAttempts < MAX_LOAD_ATTEMPTS) {
          console.log(
            "Store lacks real data, attempting to fetch fresh data from API"
          );

          // Mark that we're processing API data to prevent re-renders
          setIsProcessingApi(true);

          // Force a fetch from the API to try and get the latest data
          fetchInitialData()
            .then((apiResponse) => {
              if (!apiResponse) {
                console.log("API returned null or undefined response");
                setIsProcessingApi(false);
                // Reset the run flag to allow processing on next activation
                hasRunRef.current = false;
                return;
              }

              // Type cast the apiResponse to our expected type
              const apiData = apiResponse as unknown as ApiResponseData;

              console.log("Fetched fresh data from API:", {
                hasApiData: !!apiData,
                apiDataKeys: apiData ? Object.keys(apiData) : [],
                hasTransactionFormPart1: !!apiData?.transactionFormPart1,
                hasCopyrightTransactionPart1:
                  !!apiData?.copyright_transaction_part1,
              });

              // If we got valid data, manually extract and process it
              if (
                apiData &&
                (apiData.transactionFormPart1 ||
                  apiData.copyright_transaction_part1)
              ) {
                // Get the transaction data from the API
                let transactionData =
                  apiData.transactionFormPart1 ||
                  apiData.copyright_transaction_part1;

                // Check if there's a double-nested structure
                if (
                  transactionData?.transaction_data?.transaction_data?.coAuthors
                ) {
                  console.log(
                    "Found nested transaction_data structure, fixing it"
                  );
                  // Fix the structure
                  transactionData = {
                    ...transactionData,
                    transaction_data: {
                      coAuthors:
                        transactionData.transaction_data.transaction_data
                          .coAuthors,
                    },
                  };
                }

                // Check if API returned data has real content
                const apiDataHasRealContent =
                  transactionData?.transaction_data?.coAuthors?.some(
                    (author: CoAuthor) =>
                      author.firstName || author.lastName || author.nationality
                  );

                console.log("API data real content check:", {
                  apiDataHasRealContent,
                  firstAuthorFirstName:
                    transactionData?.transaction_data?.coAuthors?.[0]
                      ?.firstName || "empty",
                });

                // Only update if we have real data to avoid unnecessary rerenders
                if (apiDataHasRealContent) {
                  // Update the form and stores with the processed data
                  form.reset(transactionData);
                  setData(transactionData);
                  setTransactionFormPart1(transactionData);
                  console.log(
                    "Successfully loaded fresh data from API with real content"
                  );
                } else {
                  console.log(
                    "API data doesn't have real content, keeping current form state"
                  );
                }
              }

              // Reset processing flag when done
              setIsProcessingApi(false);

              // Reset the run flag to allow processing on next activation
              hasRunRef.current = false;
            })
            .catch((error: Error) => {
              console.error("Error fetching fresh data:", error);

              // Reset processing flag on error
              setIsProcessingApi(false);

              // Reset the run flag to allow processing on next activation
              hasRunRef.current = false;
            });
        } else {
          if (isLoading) {
            console.log("Skipping API fetch: already loading data");
          } else if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
            console.log(
              `Skipping API fetch: reached max attempts (${MAX_LOAD_ATTEMPTS})`
            );
          }

          // Reset the run flag to allow processing on next activation
          setTimeout(() => {
            hasRunRef.current = false;
          }, 500);
        }
      } else if (
        activeTab !== "transaction-form-1" &&
        previousTabRef.current === "transaction-form-1"
      ) {
        // Reset when leaving our tab
        previousTabRef.current = activeTab;
        hasRunRef.current = false;
        console.log(
          "Reset tab activation flag - left transaction form part 1 tab"
        );
      }
    }
  }, [
    activeTab,
    form,
    isProcessingApi,
    isLoading,
    loadAttempts,
    setData,
    setTransactionFormPart1,
    fetchInitialData,
  ]);

  // Add this debug useEffect to help track component renders and state changes
  useEffect(() => {
    console.log("TransactionFormPart1 component rendered");
    return () => {
      console.log("TransactionFormPart1 component cleanup");
    };
  }, []);

  // Reset refs when the component unmounts
  useEffect(() => {
    return () => {
      hasRunRef.current = false;
      previousTabRef.current = null;
    };
  }, []);

  // Make a small change to make sure we properly check for both null and different values
  useEffect(() => {
    const isInitialTabActivation =
      activeTab === "transaction-form-1" &&
      (previousTabRef.current === null || previousTabRef.current !== activeTab);

    if (isInitialTabActivation && !isProcessingApi) {
      // Rest of the effect remains the same
      console.log("Initial tab activation, checking data");
      previousTabRef.current = activeTab;
      hasRunRef.current = true;

      // Check if form already has data with actual values
      const formData = form.getValues();

      // Check if there's actual content in the coAuthors array
      const hasRealData = formData?.transaction_data?.coAuthors?.some(
        (author: CoAuthor) =>
          author.firstName || author.lastName || author.nationality
      );

      console.log("Form data check on initial tab activation:", {
        hasCoAuthorsArray: !!formData?.transaction_data?.coAuthors,
        coAuthorsLength: formData?.transaction_data?.coAuthors?.length || 0,
        hasRealData,
        firstCoAuthorFirstName:
          formData?.transaction_data?.coAuthors?.[0]?.firstName || "empty",
      });

      // Always check the store data in case it's newer
      const storeData = useIpDisclosureStore.getState().transactionFormPart1;

      // Check if store has real data
      const storeHasRealData = storeData?.transaction_data?.coAuthors?.some(
        (author: CoAuthor) =>
          author.firstName || author.lastName || author.nationality
      );

      console.log("Store data check on initial tab activation:", {
        hasStoreData: !!storeData,
        storeCoAuthorsLength:
          storeData?.transaction_data?.coAuthors?.length || 0,
        storeHasRealData,
        storeFirstCoAuthorFirstName:
          storeData?.transaction_data?.coAuthors?.[0]?.firstName || "empty",
      });

      // If the form doesn't have real data, or the store has newer data, reload from the store
      if (!hasRealData || (storeHasRealData && storeData)) {
        console.log(
          "Form lacks real data or store has real data, attempting to reload"
        );

        // Try getting fresh data - forcing a reload if we don't see real author data
        if (storeData && storeHasRealData) {
          console.log(
            "Restoring real form data from store on initial tab activation"
          );
          form.reset(storeData);
          // Also update the local data store for consistency
          setData(storeData);

          // Reset the run flag after a delay to allow processing on next activation
          setTimeout(() => {
            hasRunRef.current = false;
          }, 500);
        } else if (!isLoading && loadAttempts < MAX_LOAD_ATTEMPTS) {
          console.log(
            "Store lacks real data, attempting to fetch fresh data from API"
          );

          // Mark that we're processing API data to prevent re-renders
          setIsProcessingApi(true);

          // Force a fetch from the API to try and get the latest data
          fetchInitialData()
            .then((apiResponse) => {
              if (!apiResponse) {
                console.log("API returned null or undefined response");
                setIsProcessingApi(false);
                // Reset the run flag to allow processing on next activation
                hasRunRef.current = false;
                return;
              }

              // Type cast the apiResponse to our expected type
              const apiData = apiResponse as unknown as ApiResponseData;

              console.log("Fetched fresh data from API:", {
                hasApiData: !!apiData,
                apiDataKeys: apiData ? Object.keys(apiData) : [],
                hasTransactionFormPart1: !!apiData?.transactionFormPart1,
                hasCopyrightTransactionPart1:
                  !!apiData?.copyright_transaction_part1,
              });

              // If we got valid data, manually extract and process it
              if (
                apiData &&
                (apiData.transactionFormPart1 ||
                  apiData.copyright_transaction_part1)
              ) {
                // Get the transaction data from the API
                let transactionData =
                  apiData.transactionFormPart1 ||
                  apiData.copyright_transaction_part1;

                // Check if there's a double-nested structure
                if (
                  transactionData?.transaction_data?.transaction_data?.coAuthors
                ) {
                  console.log(
                    "Found nested transaction_data structure, fixing it"
                  );
                  // Fix the structure
                  transactionData = {
                    ...transactionData,
                    transaction_data: {
                      coAuthors:
                        transactionData.transaction_data.transaction_data
                          .coAuthors,
                    },
                  };
                }

                // Check if API returned data has real content
                const apiDataHasRealContent =
                  transactionData?.transaction_data?.coAuthors?.some(
                    (author: CoAuthor) =>
                      author.firstName || author.lastName || author.nationality
                  );

                console.log("API data real content check:", {
                  apiDataHasRealContent,
                  firstAuthorFirstName:
                    transactionData?.transaction_data?.coAuthors?.[0]
                      ?.firstName || "empty",
                });

                // Only update if we have real data to avoid unnecessary rerenders
                if (apiDataHasRealContent) {
                  // Update the form and stores with the processed data
                  form.reset(transactionData);
                  setData(transactionData);
                  setTransactionFormPart1(transactionData);
                  console.log(
                    "Successfully loaded fresh data from API with real content"
                  );
                } else {
                  console.log(
                    "API data doesn't have real content, keeping current form state"
                  );
                }
              }

              // Reset processing flag when done
              setIsProcessingApi(false);

              // Reset the run flag to allow processing on next activation
              hasRunRef.current = false;
            })
            .catch((error: Error) => {
              console.error("Error fetching fresh data:", error);

              // Reset processing flag on error
              setIsProcessingApi(false);

              // Reset the run flag to allow processing on next activation
              hasRunRef.current = false;
            });
        } else {
          if (isLoading) {
            console.log("Skipping API fetch: already loading data");
          } else if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
            console.log(
              `Skipping API fetch: reached max attempts (${MAX_LOAD_ATTEMPTS})`
            );
          }

          // Reset the run flag to allow processing on next activation
          setTimeout(() => {
            hasRunRef.current = false;
          }, 500);
        }
      } else {
        console.log(
          "Form already has valid real data on initial tab activation"
        );

        // Reset the run flag to allow processing on next activation
        setTimeout(() => {
          hasRunRef.current = false;
        }, 500);
      }
    }
  }, [
    activeTab,
    form,
    isProcessingApi,
    isLoading,
    loadAttempts,
    setData,
    setTransactionFormPart1,
    fetchInitialData,
  ]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Transaction Form
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide information about all co-authors or creators involved
            in the work
          </p>
        </div>

        {/* Show loading indicator if data is being loaded */}
        <LoadingIndicator />

        {/* Show recovery button if there was an error */}
        <RecoveryButton />

        <Alert className="border-green-200 bg-green-50 text-green-800">
          <InfoIcon className="h-4 w-4 text-green-700" />
          <AlertDescription>
            Please provide information about all co-authors or creators involved
            in the work.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="border-green-200">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-black">
                    Co-Author/Creator {index + 1}
                  </h3>
                  {index > 0 && (
                    <Button
                      type="button"
                      onClick={() => {
                        // Remove from form
                        remove(index);

                        // Get the current values
                        const currentValues = form.getValues();

                        // Filter out the removed item and update local storage
                        const updatedValues = {
                          ...currentValues,
                          transaction_data: {
                            ...currentValues.transaction_data,
                            coAuthors:
                              currentValues.transaction_data.coAuthors.filter(
                                (_, idx) => idx !== index
                              ),
                          },
                        };

                        // Update local stores
                        setData(updatedValues);
                        setTransactionFormPart1(updatedValues);
                      }}
                      variant="ghost"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.middleName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.dateOfBirth`}
                    render={({ field }) => {
                      const [month, setMonth] = useState<Date>(
                        field.value ? new Date(field.value) : new Date()
                      );
                      const [isYearView, setIsYearView] =
                        useState<boolean>(false);
                      const years = eachYearOfInterval({
                        start: startOfYear(startDate),
                        end: endOfYear(endDate),
                      });

                      return (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
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
                                      field.value
                                        ? new Date(field.value)
                                        : undefined
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
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.civilStatus`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Civil Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="separated">Separated</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.sex`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.nationality`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.countryOfResidence`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Residence</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`transaction_data.coAuthors.${index}.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home/Office Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.municipality`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Municipality/City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.provinceState`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province/State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.zipCode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zip Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.mobileNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.emailAddress`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`transaction_data.coAuthors.${index}.isClaimingEntireWork`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="text-green-600 border-green-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          This co-author is claiming the entire work
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch(
                  `transaction_data.coAuthors.${index}.isClaimingEntireWork`
                ) === false && (
                  <FormField
                    control={form.control}
                    name={`transaction_data.coAuthors.${index}.claimDetails`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indicate part(s)/role(s)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          ))}

          {fields.length === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6 space-y-4 text-center">
                <p className="text-gray-600">
                  No co-authors or creators added yet. Click the button below to
                  add one.
                </p>
              </CardContent>
            </Card>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Add a new empty co-author
              append({
                firstName: "",
                middleName: "",
                lastName: "",
                dateOfBirth: "",
                civilStatus: "",
                sex: "",
                nationality: "",
                countryOfResidence: "",
                address: "",
                municipality: "",
                provinceState: "",
                zipCode: "",
                mobileNumber: "",
                emailAddress: "",
                isClaimingEntireWork: false,
                claimDetails: "",
              });

              // Get current form state
              const currentValues = form.getValues();

              // Update local storage to include the new empty co-author
              // This is needed to persist the empty form between sessions
              setData(currentValues);
              setTransactionFormPart1(currentValues);

              // Scroll to the newly added form
              setTimeout(() => {
                const cards = document.querySelectorAll(".border-green-200");
                if (cards.length > 0) {
                  const lastCard = cards[cards.length - 1];
                  lastCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }, 100);
            }}
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Co-Author/Creator
          </Button>
        </div>

        <Separator className="bg-green-100" />

        <FormNavigation
          onSave={handleSave}
          onNext={handleNext}
          showNext={true}
          showSubmit={false}
          currentTab={activeTab}
          isSaving={isUpdatingRef.current} // Add this to show saving state
        />
      </form>
    </Form>
  );
}
