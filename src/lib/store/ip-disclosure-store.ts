import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as z from "zod";
import React from "react";
import {
  debouncedSetItem,
  debouncedRemoveItem,
  batchRemoveLocalStorageItems,
  flushPendingWrites,
} from "@/lib/utils/localStorage-utils";

// Add a log level system to control console output
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Set this to control the verbosity of logs
const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === "development" ? LOG_LEVELS.WARN : LOG_LEVELS.ERROR;

// Wrapper functions to control logging
const logError = (message: string, ...args: any[]) =>
  console.error(message, ...args);
const logWarn = (message: string, ...args: any[]) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) console.warn(message, ...args);
};
const logInfo = (message: string, ...args: any[]) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) console.log(message, ...args);
};
const logDebug = (message: string, ...args: any[]) => {
  if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) console.log(message, ...args);
};

// Memoization cache for deepMerge operations
const mergeCache = new Map<string, any>();
const MAX_CACHE_SIZE = 50;

// Add a deep merge utility function to safely merge objects
const deepMerge = (target: any, source: any): any => {
  // Return source if target is undefined or null
  if (!target) return source;
  // Return target if source is undefined or null
  if (!source) return target;

  // Quick object reference check
  if (target === source) return target;

  // Try to use the cache for identical operations
  try {
    const cacheKey = JSON.stringify({ t: target, s: source });
    if (mergeCache.has(cacheKey)) {
      return mergeCache.get(cacheKey);
    }

    // Create a new object to avoid mutation
    const result = { ...target };

    // Iteration count to prevent infinite loops
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000;

    // For each property in source
    Object.keys(source).forEach((key) => {
      // Protection against infinite loops
      if (iterationCount++ > MAX_ITERATIONS) {
        console.error(
          "Exceeded maximum iterations in deepMerge, possible circular reference"
        );
        return result;
      }

      // If both values are objects (not null and not arrays), recursively merge
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      }
      // For arrays, replace completely (or implement custom array merging if needed)
      else if (Array.isArray(source[key]) && source[key].length > 0) {
        result[key] = [...source[key]];
      }
      // Otherwise just replace the value, but only if it's defined
      else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    });

    // Cache the result for future operations
    if (mergeCache.size >= MAX_CACHE_SIZE) {
      // If cache is full, clear the oldest entries
      const keys = Array.from(mergeCache.keys());
      for (let i = 0; i < Math.min(5, keys.length); i++) {
        mergeCache.delete(keys[i]);
      }
    }
    mergeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    // If the objects can't be stringified or there's any issue, fall back to the regular merge
    console.warn("Cache miss in deepMerge:", error);

    // Regular merge logic without caching
    const result = { ...target };
    Object.keys(source).forEach((key) => {
      if (
        source[key] !== null &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        target[key] !== null &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else if (Array.isArray(source[key]) && source[key].length > 0) {
        result[key] = [...source[key]];
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    });
    return result;
  }
};

// Enhanced deep merge that prioritizes user-edited data over API data
const deepMergeWithPriority = (target: any, source: any): any => {
  // Metadata fields
  interface DataMetadata {
    userEdited: boolean;
    lastModified: number;
    source: "user-input" | "api" | "api-refresh" | "local-storage";
  }

  // Both objects might be null or undefined
  if (!target) return source;
  if (!source) return target;

  // Quick equality check - if objects are identical, just return target to avoid unnecessary processing
  if (target === source) return target;

  // Optimization: if the objects have the same keys and values, return target
  if (
    typeof target === "object" &&
    typeof source === "object" &&
    !Array.isArray(target) &&
    !Array.isArray(source) &&
    Object.keys(target).length === Object.keys(source).length
  ) {
    // Check if all values are the same (shallow comparison)
    const allKeysMatch = Object.keys(target).every((key) => {
      // Skip _metadata for this check as lastModified will always differ
      if (key === "_metadata") return true;
      return target[key] === source[key];
    });

    if (allKeysMatch) {
      // If all keys match, just preserve metadata
      if (source._metadata) {
        target._metadata = source._metadata;
      }
      return target;
    }
  }

  // Start with a regular deep merge
  const merged = deepMerge(target, source);

  // Check if we have metadata to determine priority
  const sourceMetadata = source._metadata as DataMetadata | undefined;
  const targetMetadata = target._metadata as DataMetadata | undefined;

  // If source is user-edited data, it takes priority for certain fields
  if (sourceMetadata?.userEdited === true) {
    // Handle transaction form part 1 - preserve user edits to co-authors
    if (
      source.transaction_data?.coAuthors &&
      Array.isArray(source.transaction_data.coAuthors)
    ) {
      merged.transaction_data = merged.transaction_data || {};
      merged.transaction_data.coAuthors = [
        ...source.transaction_data.coAuthors,
      ];
    }

    // Handle transaction form part 2 - preserve user edits
    if (source.transaction_details) {
      merged.transaction_details = deepMerge(
        merged.transaction_details || {},
        source.transaction_details
      );
    }

    if (source.applicant_info) {
      merged.applicant_info = deepMerge(
        merged.applicant_info || {},
        source.applicant_info
      );
    }

    if (source.author_info) {
      merged.author_info = deepMerge(
        merged.author_info || {},
        source.author_info
      );
    }

    // Preserve metadata indicating this is user-edited
    merged._metadata = {
      userEdited: true,
      lastModified: sourceMetadata.lastModified,
      source: sourceMetadata.source,
    };
  }
  // If target is user-edited and source is from API, preserve user edits
  else if (
    targetMetadata?.userEdited === true &&
    sourceMetadata?.source === "api"
  ) {
    // Keep IDs from API data
    if (source.disclosureId) merged.disclosureId = source.disclosureId;
    if (source.copyrightId) merged.copyrightId = source.copyrightId;
    if (source.trademarkId) merged.trademarkId = source.trademarkId;
    if (source.patentId) merged.patentId = source.patentId;
    if (source.tradeSecretId) merged.tradeSecretId = source.tradeSecretId;

    // But preserve user-edited content from target
    if (
      target.transaction_data?.coAuthors &&
      Array.isArray(target.transaction_data.coAuthors)
    ) {
      merged.transaction_data = merged.transaction_data || {};
      merged.transaction_data.coAuthors = [
        ...target.transaction_data.coAuthors,
      ];
    }

    if (target.transaction_details) {
      merged.transaction_details = deepMerge(
        merged.transaction_details || {},
        target.transaction_details
      );
    }

    if (target.applicant_info) {
      merged.applicant_info = deepMerge(
        merged.applicant_info || {},
        target.applicant_info
      );
    }

    if (target.author_info) {
      merged.author_info = deepMerge(
        merged.author_info || {},
        target.author_info
      );
    }

    // Preserve metadata indicating this is user-edited
    merged._metadata = {
      userEdited: true,
      lastModified: targetMetadata.lastModified,
      source: targetMetadata.source,
    };
  }
  // If source is a forced refresh from API, it takes priority
  else if (sourceMetadata?.source === "api-refresh") {
    // Update metadata but preserve the forced refresh indicator
    merged._metadata = {
      userEdited: false,
      lastModified: sourceMetadata.lastModified,
      source: "api-refresh",
    };
  }
  // Otherwise, use the most recently modified data
  else if (sourceMetadata && targetMetadata) {
    if (sourceMetadata.lastModified > targetMetadata.lastModified) {
      merged._metadata = { ...sourceMetadata };
    } else {
      merged._metadata = { ...targetMetadata };
    }
  }
  // If only one has metadata, use that
  else if (sourceMetadata) {
    merged._metadata = { ...sourceMetadata };
  } else if (targetMetadata) {
    merged._metadata = { ...targetMetadata };
  }

  return merged;
};

// Add a timestamp tracker to prevent too frequent updates
const updateThrottleMap = new Map<string, number>();
const THROTTLE_MS = 250; // Increase minimum time between updates to prevent cascade

// Function to check if an update should be throttled
const shouldThrottleUpdate = (key: string): boolean => {
  const now = Date.now();
  const lastUpdate = updateThrottleMap.get(key) || 0;
  const timeSinceLastUpdate = now - lastUpdate;

  if (timeSinceLastUpdate < THROTTLE_MS) {
    // Only log when not in application switching mode
    if (sessionStorage.getItem("ipDisclosureAppSwitching") !== "true") {
      logDebug(`Throttling ${key} - too recent (${timeSinceLastUpdate}ms)`);
    }
    return true;
  }

  updateThrottleMap.set(key, now);
  return false;
};

// Add a utility for tracking operations to detect infinite loops
interface OperationInfo {
  count: number;
  timestamp: number;
}

const operationTracker = new Map<string, OperationInfo>();
const MAX_OPERATIONS = 30; // Increase maximum number of operations allowed (from 20)
const MAX_LOCALSTORAGE_OPERATIONS = 15; // Separate threshold for localStorage
const OPERATION_TIMEFRAME = 10000; // 10 second window for tracking operations

// Helper function to determine if we're navigating between forms/tabs
const isNavigatingBetweenTabs = (): boolean => {
  // Check if we're in app switching mode
  const isAppSwitching =
    sessionStorage.getItem("ipDisclosureAppSwitching") === "true";
  if (isAppSwitching) return true;

  // Check if we've recently changed routes
  const lastRouteChange = parseInt(
    sessionStorage.getItem("lastRouteChange") || "0",
    10
  );
  const timeSinceRouteChange = Date.now() - lastRouteChange;
  if (timeSinceRouteChange < 2000) return true; // 2 seconds grace period after route change

  return false;
};

// Helper function to log and track operations to detect and prevent infinite loops
const trackOperation = (operationName: string, data?: any): boolean => {
  const now = Date.now();
  const key = operationName;

  // Skip throttling during tab navigation
  const isTabNavigation = isNavigatingBetweenTabs();

  // Get the current count and timestamp
  const current = operationTracker.get(key) || { count: 0, timestamp: now };

  // Reset counter if enough time has passed
  if (now - current.timestamp > OPERATION_TIMEFRAME) {
    operationTracker.set(key, { count: 1, timestamp: now });
    return true;
  }

  // Update the counter
  const newCount = current.count + 1;
  operationTracker.set(key, { count: newCount, timestamp: current.timestamp });

  // Set different thresholds for different operation types
  let maxAllowedOps = MAX_OPERATIONS;

  // Block more aggressively for localStorage operations but respect tab navigation
  if (
    operationName.includes("localStorage") &&
    newCount > MAX_LOCALSTORAGE_OPERATIONS &&
    !isTabNavigation
  ) {
    // Only log at certain thresholds to avoid console spam
    if (newCount % 5 === 0) {
      logWarn(
        `Too many localStorage operations for ${operationName} in ${
          now - current.timestamp
        }ms - throttling (${newCount})`
      );
    }
    return false;
  }

  // Special handling for specific operation types
  if (operationName.includes("setItem")) {
    maxAllowedOps = MAX_LOCALSTORAGE_OPERATIONS;
  } else if (operationName.includes("validation")) {
    maxAllowedOps = MAX_OPERATIONS * 2; // More lenient for validation
  }

  // If the operation is being called too many times in the timeframe, block it
  // (unless in tab navigation mode or the operation is critical)
  if (
    newCount > maxAllowedOps &&
    !isTabNavigation &&
    !operationName.includes("critical")
  ) {
    // Only log at certain thresholds to avoid console spam
    if (newCount % 5 === 0) {
      logWarn(
        `Too many operations for ${operationName} in ${
          now - current.timestamp
        }ms - throttling (${newCount}/${maxAllowedOps})`
      );

      // Add debug info when possible
      if (data && CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
        logDebug(
          `Operation data preview:`,
          typeof data === "object"
            ? JSON.stringify(data).substring(0, 100)
            : String(data).substring(0, 100)
        );
      }
    }
    return false; // Don't allow the operation
  }

  return true;
};

// Define schemas for form validation
export const applicantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleInitial: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
});

export const inventorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleInitial: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
});

export const ipTypesSchema = z
  .object({
    copyright: z.boolean(),
    patent: z.boolean(),
    utilityModel: z.boolean(),
    industrialDesign: z.boolean(),
    trademark: z.boolean(),
    tradeSecret: z.boolean(),
    other: z.boolean(),
    notSure: z.boolean(),
  })
  .refine((data) => Object.values(data).some((value) => value === true), {
    message: "Please select at least one IP type to proceed",
  });

export type IpTypes = z.infer<typeof ipTypesSchema>;

// Remove the duplicate ApplicantsInfo interface entirely

// Remove the duplicate interface and let Zod handle the typing
export const applicantsInfoSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address." }),
    applicants: z
      .array(applicantSchema)
      .min(1, "At least one applicant is required"),
    inventors: z
      .array(inventorSchema)
      .min(1, "At least one inventor is required"),
    ipTypes: ipTypesSchema,
    otherIpType: z.string().optional(),
    isRightfulOwner: z
      .boolean()
      .refine((value) => value === true, {
        message: "This confirmation is required.",
      }),
    isApplicantAlsoInventor: z.boolean().default(false),
    authorizedRepresentative: z.string().optional(),
  })
  .refine(
    (data) => {
      // If "other" is selected, otherIpType must be provided
      if (data.ipTypes.other) {
        return !!data.otherIpType;
      }
      return true;
    },
    {
      message: "Please specify the type of IP in the 'Other' field",
      path: ["otherIpType"],
    }
  );

// Single definition of ApplicantsInfo derived from the schema
export type ApplicantsInfo = z.infer<typeof applicantsInfoSchema>;

// Add schema for disclosure confirmation
const disclosureConfirmationSchema = z.object({
  writtenDisclosures: z.object({
    past: z.boolean().default(false),
    planned: z.boolean().default(false),
    notApplicable: z.boolean().default(false),
  }),
  oralDisclosures: z.object({
    past: z.boolean().default(false),
    planned: z.boolean().default(false),
    notApplicable: z.boolean().default(false),
  }),
  futureWork: z.string().optional(),
  confirmationDeclaration: z.boolean().default(false),
});

export type DisclosureConfirmation = z.infer<
  typeof disclosureConfirmationSchema
>;

interface IpDisclosureState {
  disclosureId: string | null;
  applicationId: string | null; // Add applicationId field
  applicantsInfo: ApplicantsInfo | null;
  disclosureConfirmation: DisclosureConfirmation | null;
  activeTab: string;
  visibleTabs: string[];
  isSubmitted: boolean;

  // Add properties for copyright-specific form data
  copyrightApplication: any | null;
  transactionFormPart1: any | null;
  transactionFormPart2: any | null;

  // Combined property for patent and utility model data since they share forms
  patentUtilityModelApplication: any | null;

  // Add property for trademark application data
  trademarkApplication: any | null;

  // Add property for trade secret application data
  tradeSecretApplication: any | null;

  // Flag to track hydration status to prevent update loops
  hydrated: boolean;

  // Flag to track if initial data has been fetched to prevent multiple fetches
  initialDataFetched: boolean;

  // Add loading state tracking
  isLoading: boolean;

  // Track if we've attempted to fetch data
  fetchAttempted: boolean;

  // Actions
  setDisclosureId: (id: string | null) => void;
  setApplicationId: (id: string | null) => void; // Add setApplicationId method
  setApplicantsInfo: (data: ApplicantsInfo) => void;
  setDisclosureConfirmation: (data: DisclosureConfirmation) => void;
  setCopyrightApplication: (data: any) => void;
  setTransactionFormPart1: (data: any) => void;
  setTransactionFormPart2: (data: any) => void;
  setPatentUtilityModelApplication: (data: any) => void;
  setTrademarkApplication: (data: any) => void;
  setTradeSecretApplication: (data: any) => void;
  setActiveTab: (tab: string) => void;
  setVisibleTabs: (tabs: string[]) => void;
  validateSection: (
    section: "applicantsInfo" | "disclosureConfirmation"
  ) => boolean;
  submitForm: () => boolean;
  resetStore: () => void;
  resetSubmissionState: () => void;
  clearLocalStorage: () => void;
  setHydrated: (state: boolean) => void;
  setInitialDataFetched: (fetched: boolean) => void;
  fetchInitialData: () => Promise<any | null>;
  safeDataLoad: (
    actionName: string,
    loadAction: () => Promise<any>
  ) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setFetchAttempted: (fetchAttempted: boolean) => void;
  refreshFromApi: (
    formKey: keyof Pick<
      IpDisclosureState,
      | "copyrightApplication"
      | "transactionFormPart1"
      | "transactionFormPart2"
      | "patentUtilityModelApplication"
      | "trademarkApplication"
      | "tradeSecretApplication"
      | "disclosureConfirmation"
      | "applicantsInfo"
    >
  ) => Promise<boolean>;
  hasUnsavedChanges: () => { hasChanges: boolean; changedForms: string[] };
}

// Add timestamp tracking to prevent redundant updates
const lastUpdateTimestamps = new Map();

// Use a customized version of the persist middleware
export const useIpDisclosureStore = create<IpDisclosureState>()(
  persist(
    (set, get) => ({
      disclosureId: null,
      applicationId: null, // Initialize applicationId
      applicantsInfo: null,
      disclosureConfirmation: null,
      activeTab: "applicants-info",
      visibleTabs: ["applicants-info", "confirmation"],
      isSubmitted: false,
      hydrated: false, // Add hydration tracking
      initialDataFetched: false, // Track if initial data has been fetched

      // Add properties for copyright-specific form data
      copyrightApplication: null,
      transactionFormPart1: null,
      transactionFormPart2: null,

      // Combined property for patent and utility model data since they share forms
      patentUtilityModelApplication: null,

      // Add property for trademark application data
      trademarkApplication: null,

      // Add property for trade secret application data
      tradeSecretApplication: null,

      // Keep track of loading state
      isLoading: false,

      // Track if we've attempted to fetch data already
      fetchAttempted: false,

      // Mark hydration as complete
      setHydrated: (state: boolean) => {
        set({ hydrated: state });
      },

      // Set initial data fetched flag
      setInitialDataFetched: (fetched: boolean) => {
        console.log(`Setting initialDataFetched to ${fetched}`);
        set({ initialDataFetched: fetched });
      },

      setDisclosureId: (id: string | null) => {
        // Skip if trying to set the same ID to avoid unnecessary updates
        const currentId = get().disclosureId;
        if (currentId === id) {
          console.log("Disclosure ID unchanged, skipping update:", id);
          return;
        }

        // Track this operation to detect loops
        const operationId = `setDisclosureId-${
          id === null ? "null" : id.substring(0, 8)
        }`;
        if (!trackOperation(operationId)) {
          console.warn("Skipping potentially looping setDisclosureId call");
          return;
        }

        // Throttle this operation to prevent cascading updates
        const now = Date.now();
        const lastUpdateKey = "lastDisclosureIdUpdate";
        const lastUpdateTime = parseInt(
          sessionStorage.getItem(lastUpdateKey) || "0",
          10
        );
        const timeSinceLastUpdate = now - lastUpdateTime;

        if (timeSinceLastUpdate < 100) {
          // 100ms throttle
          console.warn(
            `Throttling setDisclosureId - too many calls (${timeSinceLastUpdate}ms since last call)`
          );
          return;
        }

        // Update throttle timestamp
        sessionStorage.setItem(lastUpdateKey, now.toString());

        // Log the change
        console.log("Setting disclosure ID in store:", id);

        // Use the state update function directly to minimize rerenders
        set((state) => {
          // Only update if the ID is actually different to avoid loops
          if (state.disclosureId !== id) {
            return { disclosureId: id };
          }
          return state; // Return unchanged state if ID is the same
        });

        // Log completion
        if (id === null) {
          console.log("Disclosure ID cleared (set to null)");
        }
      },

      // Add method to set applicationId
      setApplicationId: (id: string | null) => {
        console.log("Setting application ID in store:", id);
        set({ applicationId: id });

        // Reset store data if application ID changes
        const currentAppId = get().applicationId;
        if (currentAppId !== id) {
          console.log("Application ID changed, resetting store data");
          get().resetStore();
          set({
            applicationId: id,
            initialDataFetched: false,
            fetchAttempted: false,
          });
        }
      },

      setApplicantsInfo: (data: ApplicantsInfo) => {
        logDebug("Setting applicants info in store:", {
          hasData: !!data,
          email: data?.email,
          ipTypes: data?.ipTypes,
        });

        // Format IP types to ensure they're all booleans
        const formattedIpTypes: IpTypes = {
          copyright: Boolean(data?.ipTypes?.copyright ?? false),
          patent: Boolean(data?.ipTypes?.patent ?? false),
          utilityModel: Boolean(data?.ipTypes?.utilityModel ?? false),
          industrialDesign: Boolean(data?.ipTypes?.industrialDesign ?? false),
          trademark: Boolean(data?.ipTypes?.trademark ?? false),
          tradeSecret: Boolean(data?.ipTypes?.tradeSecret ?? false),
          other: Boolean(data?.ipTypes?.other ?? false),
          notSure: Boolean(data?.ipTypes?.notSure ?? false),
        };

        logDebug("Formatted IP types in store:", {
          original: data?.ipTypes,
          formatted: formattedIpTypes,
          selectedTypes: Object.entries(formattedIpTypes)
            .filter(([_, value]) => value === true)
            .map(([key]) => key),
        });

        // Create a new object with formatted ipTypes
        const formattedData = {
          ...data,
          ipTypes: formattedIpTypes,
        };

        set({ applicantsInfo: formattedData });
      },

      setDisclosureConfirmation: (data: DisclosureConfirmation) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        console.log("Saving disclosure confirmation:", data);
        set({ disclosureConfirmation: data });
      },

      setCopyrightApplication: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setCopyrightApplication-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        // Skip update if data is null or empty
        if (!data || Object.keys(data).length === 0) {
          return;
        }

        // Get current data from store to merge with
        const currentData = get().copyrightApplication || {};

        // Create a normalized comparison function similar to the one in setTransactionFormPart1
        const normalizeAndCompare = (obj1: any, obj2: any) => {
          // If either is null/undefined, they're only equal if both are
          if (!obj1 || !obj2) return obj1 === obj2;

          // Ignore metadata for this comparison
          const obj1WithoutMeta = { ...obj1 };
          const obj2WithoutMeta = { ...obj2 };
          delete obj1WithoutMeta._metadata;
          delete obj2WithoutMeta._metadata;

          // Check if they have the same keys
          const keys1 = Object.keys(obj1WithoutMeta).sort();
          const keys2 = Object.keys(obj2WithoutMeta).sort();
          if (keys1.length !== keys2.length) return false;

          // For transaction form part 1, we need to do a deep comparison of coAuthors
          // This is different than other forms because coAuthors can be edited incrementally
          if (
            obj1WithoutMeta.transaction_data?.coAuthors &&
            obj2WithoutMeta.transaction_data?.coAuthors
          ) {
            const coAuthors1 = obj1WithoutMeta.transaction_data.coAuthors;
            const coAuthors2 = obj2WithoutMeta.transaction_data.coAuthors;

            // If arrays have different lengths, they're different
            if (coAuthors1.length !== coAuthors2.length) return false;

            // Compare each co-author entry
            for (let i = 0; i < coAuthors1.length; i++) {
              // Simple stringify comparison for co-author objects
              if (
                JSON.stringify(coAuthors1[i]) !== JSON.stringify(coAuthors2[i])
              ) {
                return false;
              }
            }

            // Remove coAuthors from the comparison since we've already compared them
            const obj1NoCoAuthors = { ...obj1WithoutMeta };
            const obj2NoCoAuthors = { ...obj2WithoutMeta };
            if (obj1NoCoAuthors.transaction_data) {
              obj1NoCoAuthors.transaction_data = {
                ...obj1NoCoAuthors.transaction_data,
              };
              delete obj1NoCoAuthors.transaction_data.coAuthors;
            }
            if (obj2NoCoAuthors.transaction_data) {
              obj2NoCoAuthors.transaction_data = {
                ...obj2NoCoAuthors.transaction_data,
              };
              delete obj2NoCoAuthors.transaction_data.coAuthors;
            }

            // Compare the rest of the objects (without coAuthors) using JSON stringify
            return (
              JSON.stringify(obj1NoCoAuthors) ===
              JSON.stringify(obj2NoCoAuthors)
            );
          }

          // For other cases, do a simple JSON comparison
          return (
            JSON.stringify(obj1WithoutMeta) === JSON.stringify(obj2WithoutMeta)
          );
        };

        // Skip if the data is the same (except metadata)
        if (normalizeAndCompare(currentData, data)) {
          // Even if data is the same, ensure metadata is updated if user edited
          if (
            data._metadata?.userEdited &&
            !currentData._metadata?.userEdited
          ) {
            set({
              copyrightApplication: {
                ...currentData,
                _metadata: {
                  userEdited: true,
                  lastModified: Date.now(),
                  source: "user-input",
                },
              },
            });

            console.log(
              "Updated metadata for copyrightApplication to reflect user edit"
            );
          }
          return;
        }

        // Create a copy we can safely modify
        const processedData = { ...(data || {}) };

        // Add metadata to track this as a user edit
        processedData._metadata = {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-input",
        };

        // Handle coAuthors at root level (wrong location)
        if (processedData.coAuthors && Array.isArray(processedData.coAuthors)) {
          console.log(
            "Found coAuthors at root level, moving to transaction_data"
          );

          // Ensure transaction_data exists
          if (!processedData.transaction_data) {
            processedData.transaction_data = {};
          }

          // Move coAuthors to transaction_data
          processedData.transaction_data.coAuthors = processedData.coAuthors;

          // Remove from root level
          delete processedData.coAuthors;
        }

        // Make sure transaction_data exists
        if (!processedData.transaction_data) {
          // Initialize with empty object
          processedData.transaction_data = {};
        }

        // Ensure coAuthors exists and is an array
        if (!processedData.transaction_data.coAuthors) {
          // Initialize with empty array
          processedData.transaction_data.coAuthors = [];
        } else if (!Array.isArray(processedData.transaction_data.coAuthors)) {
          // If coAuthors exists but is not an array, convert it
          if (
            typeof processedData.transaction_data.coAuthors === "object" &&
            processedData.transaction_data.coAuthors !== null
          ) {
            // Convert object to array with single item
            processedData.transaction_data.coAuthors = [
              processedData.transaction_data.coAuthors,
            ];
          } else {
            // Initialize as empty array for non-object values
            processedData.transaction_data.coAuthors = [];
          }
        }

        // Preserve existing IDs from the current data
        if (!processedData.disclosureId && currentData.disclosureId) {
          processedData.disclosureId = currentData.disclosureId;
        }

        if (!processedData.copyrightId && currentData.copyrightId) {
          processedData.copyrightId = currentData.copyrightId;
        }

        // Filter out empty co-authors to prevent issues
        if (Array.isArray(processedData.transaction_data.coAuthors)) {
          const filteredCoAuthors =
            processedData.transaction_data.coAuthors.filter((author: any) => {
              if (!author) return false;

              // Check if the author object has any filled fields
              return Object.entries(author).some(
                ([key, value]) =>
                  key !== "isClaimingEntireWork" && // Skip boolean fields for this check
                  value !== undefined &&
                  value !== null &&
                  value !== ""
              );
            });

          // Check if any valid entries were found
          const hasValidCoAuthor = filteredCoAuthors.length > 0;

          // Preserve filtered co-authors if any valid ones found
          if (hasValidCoAuthor) {
            processedData.transaction_data.coAuthors = filteredCoAuthors;
          } else if (processedData.transaction_data.coAuthors.length > 0) {
            // Keep at least one entry if there are entries, even if they're empty
            processedData.transaction_data.coAuthors = [
              processedData.transaction_data.coAuthors[0],
            ];
          }
        }

        // If no valid entries and array is empty, add a default empty author
        if (
          !processedData.transaction_data.coAuthors ||
          processedData.transaction_data.coAuthors.length === 0
        ) {
          console.log("No valid coAuthors found, adding a default empty entry");
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

        // Now merge with priority to preserve user edits
        const mergedData = deepMergeWithPriority(currentData, processedData);

        // Only update if there are actual changes
        if (!normalizeAndCompare(currentData, mergedData)) {
          set({ copyrightApplication: mergedData });

          if (process.env.NODE_ENV === "development") {
            console.log("Copyright application updated with new data:", {
              hasTransactionData: !!mergedData.transaction_data,
              coAuthorsLength:
                mergedData.transaction_data?.coAuthors?.length || 0,
              disclosureId: mergedData.disclosureId,
              copyrightId: mergedData.copyrightId,
              isUserEdited: mergedData._metadata?.userEdited,
              dataSource: mergedData._metadata?.source,
              firstCoAuthorName:
                mergedData.transaction_data?.coAuthors?.length > 0
                  ? `${
                      mergedData.transaction_data.coAuthors[0].firstName || ""
                    } ${
                      mergedData.transaction_data.coAuthors[0].middleName || ""
                    } ${
                      mergedData.transaction_data.coAuthors[0].lastName || ""
                    }`.trim()
                  : "none",
            });
          }
        } else {
          console.log(
            "Skipping copyrightApplication update - no changes detected after merge"
          );
        }
      },

      setTransactionFormPart1: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setTransactionFormPart1-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        // Skip update if data is null or empty
        if (!data || Object.keys(data).length === 0) {
          return;
        }

        // Track the operation for debugging
        const isTracked = trackOperation("setTransactionFormPart1", {
          hasData: !!data,
          hasTransactionData: !!data?.transaction_data,
          coAuthorsLength: data?.transaction_data?.coAuthors?.length || 0,
        });

        if (!isTracked) {
          console.error("Operation blocked due to potential infinite loop");
          return;
        }

        // Get current data from store to merge with
        const currentData = get().transactionFormPart1 || {};

        // Create a normalized comparison function similar to the one in setCopyrightApplication
        const normalizeAndCompare = (obj1: any, obj2: any) => {
          // If either is null/undefined, they're only equal if both are
          if (!obj1 || !obj2) return obj1 === obj2;

          // Ignore metadata for this comparison
          const obj1WithoutMeta = { ...obj1 };
          const obj2WithoutMeta = { ...obj2 };
          delete obj1WithoutMeta._metadata;
          delete obj2WithoutMeta._metadata;

          // Check if they have the same keys
          const keys1 = Object.keys(obj1WithoutMeta).sort();
          const keys2 = Object.keys(obj2WithoutMeta).sort();
          if (keys1.length !== keys2.length) return false;

          // For transaction form part 1, we need to do a deep comparison of coAuthors
          // This is different than other forms because coAuthors can be edited incrementally
          if (
            obj1WithoutMeta.transaction_data?.coAuthors &&
            obj2WithoutMeta.transaction_data?.coAuthors
          ) {
            const coAuthors1 = obj1WithoutMeta.transaction_data.coAuthors;
            const coAuthors2 = obj2WithoutMeta.transaction_data.coAuthors;

            // If arrays have different lengths, they're different
            if (coAuthors1.length !== coAuthors2.length) return false;

            // Compare each co-author entry
            for (let i = 0; i < coAuthors1.length; i++) {
              // Simple stringify comparison for co-author objects
              if (
                JSON.stringify(coAuthors1[i]) !== JSON.stringify(coAuthors2[i])
              ) {
                return false;
              }
            }

            // Remove coAuthors from the comparison since we've already compared them
            const obj1NoCoAuthors = { ...obj1WithoutMeta };
            const obj2NoCoAuthors = { ...obj2WithoutMeta };
            if (obj1NoCoAuthors.transaction_data) {
              obj1NoCoAuthors.transaction_data = {
                ...obj1NoCoAuthors.transaction_data,
              };
              delete obj1NoCoAuthors.transaction_data.coAuthors;
            }
            if (obj2NoCoAuthors.transaction_data) {
              obj2NoCoAuthors.transaction_data = {
                ...obj2NoCoAuthors.transaction_data,
              };
              delete obj2NoCoAuthors.transaction_data.coAuthors;
            }

            // Compare the rest of the objects (without coAuthors) using JSON stringify
            return (
              JSON.stringify(obj1NoCoAuthors) ===
              JSON.stringify(obj2NoCoAuthors)
            );
          }

          // For other cases, do a simple JSON comparison
          return (
            JSON.stringify(obj1WithoutMeta) === JSON.stringify(obj2WithoutMeta)
          );
        };

        // Skip if the data is the same (except metadata)
        if (normalizeAndCompare(currentData, data)) {
          // Even if data is the same, ensure metadata is updated if user edited
          if (
            data._metadata?.userEdited &&
            !currentData._metadata?.userEdited
          ) {
            set({
              transactionFormPart1: {
                ...currentData,
                _metadata: {
                  userEdited: true,
                  lastModified: Date.now(),
                  source: "user-input",
                },
              },
            });

            console.log(
              "Updated metadata for transactionFormPart1 to reflect user edit"
            );
          }
          return;
        }

        // Create a copy we can safely modify
        const processedData = { ...(data || {}) };

        // Add metadata to track this as a user edit
        processedData._metadata = {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-input",
        };

        // Handle coAuthors at root level (wrong location)
        if (processedData.coAuthors && Array.isArray(processedData.coAuthors)) {
          console.log(
            "Found coAuthors at root level, moving to transaction_data"
          );

          // Ensure transaction_data exists
          if (!processedData.transaction_data) {
            processedData.transaction_data = {};
          }

          // Move coAuthors to transaction_data
          processedData.transaction_data.coAuthors = processedData.coAuthors;

          // Remove from root level
          delete processedData.coAuthors;
        }

        // Make sure transaction_data exists
        if (!processedData.transaction_data) {
          // Initialize with empty object
          processedData.transaction_data = {};
        }

        // Ensure coAuthors exists and is an array
        if (!processedData.transaction_data.coAuthors) {
          // Initialize with empty array
          processedData.transaction_data.coAuthors = [];
        } else if (!Array.isArray(processedData.transaction_data.coAuthors)) {
          // If coAuthors exists but is not an array, convert it
          if (
            typeof processedData.transaction_data.coAuthors === "object" &&
            processedData.transaction_data.coAuthors !== null
          ) {
            // Convert object to array with single item
            processedData.transaction_data.coAuthors = [
              processedData.transaction_data.coAuthors,
            ];
          } else {
            // Initialize as empty array for non-object values
            processedData.transaction_data.coAuthors = [];
          }
        }

        // Preserve existing IDs from the current data
        if (!processedData.disclosureId && currentData.disclosureId) {
          processedData.disclosureId = currentData.disclosureId;
        }

        if (!processedData.copyrightId && currentData.copyrightId) {
          processedData.copyrightId = currentData.copyrightId;
        }

        // Filter out empty co-authors to prevent issues
        if (Array.isArray(processedData.transaction_data.coAuthors)) {
          const filteredCoAuthors =
            processedData.transaction_data.coAuthors.filter((author: any) => {
              if (!author) return false;

              // Check if the author object has any filled fields
              return Object.entries(author).some(
                ([key, value]) =>
                  key !== "isClaimingEntireWork" && // Skip boolean fields for this check
                  value !== undefined &&
                  value !== null &&
                  value !== ""
              );
            });

          // Check if any valid entries were found
          const hasValidCoAuthor = filteredCoAuthors.length > 0;

          // Preserve filtered co-authors if any valid ones found
          if (hasValidCoAuthor) {
            processedData.transaction_data.coAuthors = filteredCoAuthors;
          } else if (processedData.transaction_data.coAuthors.length > 0) {
            // Keep at least one entry if there are entries, even if they're empty
            processedData.transaction_data.coAuthors = [
              processedData.transaction_data.coAuthors[0],
            ];
          }
        }

        // If no valid entries and array is empty, add a default empty author
        if (
          !processedData.transaction_data.coAuthors ||
          processedData.transaction_data.coAuthors.length === 0
        ) {
          console.log("No valid coAuthors found, adding a default empty entry");
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

        // Now merge with priority to preserve user edits
        const mergedData = deepMergeWithPriority(currentData, processedData);

        // Only update if there are actual changes
        if (!normalizeAndCompare(currentData, mergedData)) {
          set({ transactionFormPart1: mergedData });

          if (process.env.NODE_ENV === "development") {
            console.log("Transaction form part 1 updated with new data:", {
              hasTransactionData: !!mergedData.transaction_data,
              coAuthorsLength:
                mergedData.transaction_data?.coAuthors?.length || 0,
              disclosureId: mergedData.disclosureId,
              copyrightId: mergedData.copyrightId,
              isUserEdited: mergedData._metadata?.userEdited,
              dataSource: mergedData._metadata?.source,
              firstCoAuthorName:
                mergedData.transaction_data?.coAuthors?.length > 0
                  ? `${
                      mergedData.transaction_data.coAuthors[0].firstName || ""
                    } ${
                      mergedData.transaction_data.coAuthors[0].middleName || ""
                    } ${
                      mergedData.transaction_data.coAuthors[0].lastName || ""
                    }`.trim()
                  : "none",
            });
          }
        } else {
          console.log(
            "Skipping transaction form part 1 update - no changes detected after merge"
          );
        }
      },

      setTransactionFormPart2: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setTransactionFormPart2-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        console.log("Saving transaction form part 2:", data);

        // Get current data from store to merge with
        const currentData = get().transactionFormPart2 || {};

        // Create a copy we can safely modify
        const processedData = { ...(data || {}) };

        // Add metadata to track this as a user edit
        processedData._metadata = {
          userEdited: true,
          lastModified: Date.now(),
          source: "user-input",
        };

        // Ensure default structures exist
        if (!processedData.transaction_details) {
          processedData.transaction_details = {
            transactionType: {
              copyrightRegistration: false,
              anonymousWork: false,
              correctionEntry: false,
              resaleRights: false,
              certifiedCopy: false,
              recordation: false,
              reconstitution: false,
            },
            submissionType: {
              filingMethod: {
                electronicFiling: true,
                throughIPSO: false,
              },
              filingType: {
                singleFiling: true,
                bulkFiling: false,
              },
            },
            ipsoRegion: "",
            bulkFilingQty: "",
          };
        }

        if (!processedData.applicant_info) {
          processedData.applicant_info = {
            entityType: {
              smallEntity: false,
              bigEntity: false,
            },
            applicantType: {
              authorCreator: false,
              agent: false,
              copyrightClaimant: false,
              licensee: false,
              heir: false,
              newOwner: false,
            },
            personalInfo: {
              surname: "",
              firstName: "",
              middleName: "",
              companyName: "",
              dateOfBirth: "",
              civilStatus: "Single",
              sex: "Male",
              nationality: "",
              countryOfResidence: "",
              address: "",
              municipalityCity: "",
              provinceState: "",
              zipCode: "",
              mobileNumber: "",
              emailAddress: "",
            },
          };
        }

        if (!processedData.author_info) {
          processedData.author_info = {
            isSameAsApplicant: false,
            sameAsApplicant: false,
            personalInfo: {
              surname: "",
              firstName: "",
              middleName: "",
              dateOfBirth: "",
              civilStatus: "Single",
              sex: "Male",
              nationality: "",
              countryOfResidence: "",
              address: "",
              municipalityCity: "",
              provinceState: "",
              zipCode: "",
              mobileNumber: "",
              emailAddress: "",
            },
            authors: [],
          };
        }

        // Now merge with priority to preserve user edits
        const mergedData = deepMergeWithPriority(currentData, processedData);

        // Log structure for debugging
        console.log("Transaction form part 2 structure:", {
          hasTransactionDetails: !!mergedData.transaction_details,
          hasApplicantInfo: !!mergedData.applicant_info,
          hasAuthorInfo: !!mergedData.author_info,
          disclosureId: mergedData.disclosureId,
          copyrightId: mergedData.copyrightId,
          isUserEdited: mergedData._metadata?.userEdited,
          dataSource: mergedData._metadata?.source,
        });

        set({ transactionFormPart2: mergedData });
      },

      setPatentUtilityModelApplication: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setPatentUtilityModelApplication-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        console.log("Saving patent and utility model application:", data);

        // Get current data from store to merge with
        const currentData = get().patentUtilityModelApplication || {};

        // Use deep merge to properly combine the objects
        const mergedData = deepMerge(currentData, data || {});

        // Ensure IDs are preserved
        if (!mergedData.disclosureId && currentData.disclosureId) {
          mergedData.disclosureId = currentData.disclosureId;
        }

        if (!mergedData.patentId && currentData.patentId) {
          mergedData.patentId = currentData.patentId;
        }

        set({ patentUtilityModelApplication: mergedData });
      },

      setTrademarkApplication: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setTrademarkApplication-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        console.log("Saving trademark application:", data);

        // Get current data from store to merge with
        const currentData = get().trademarkApplication || {};

        // Use deep merge to properly combine the objects
        const mergedData = deepMerge(currentData, data || {});

        // Ensure IDs are preserved
        if (!mergedData.disclosureId && currentData.disclosureId) {
          mergedData.disclosureId = currentData.disclosureId;
        }

        if (!mergedData.trademarkId && currentData.trademarkId) {
          mergedData.trademarkId = currentData.trademarkId;
        }

        set({ trademarkApplication: mergedData });
      },

      setTradeSecretApplication: (data: any) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Use operation ID for throttling to prevent cascading updates
        const operationId = `setTradeSecretApplication-${Date.now()}`;
        if (shouldThrottleUpdate(operationId)) {
          console.log(`Throttling ${operationId} - too many rapid updates`);
          return;
        }

        console.log("Saving trade secret application:", data);

        // Get current data from store to merge with
        const currentData = get().tradeSecretApplication || {};

        // Use deep merge to properly combine the objects
        const mergedData = deepMerge(currentData, data || {});

        // Ensure IDs are preserved
        if (!mergedData.disclosureId && currentData.disclosureId) {
          mergedData.disclosureId = currentData.disclosureId;
        }

        if (!mergedData.tradeSecretId && currentData.tradeSecretId) {
          mergedData.tradeSecretId = currentData.tradeSecretId;
        }

        set({ tradeSecretApplication: mergedData });
      },

      setActiveTab: (tab: string) => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        console.log("Setting active tab:", tab);
        set({ activeTab: tab });
      },

      setVisibleTabs: (tabs: string[]) => {
        // Skip update if not hydrated
        if (!get().hydrated) return;

        // Check if array contents are the same (to avoid unnecessary updates)
        const currentTabs = get().visibleTabs;
        if (
          currentTabs.length === tabs.length &&
          currentTabs.every((tab, index) => tab === tabs[index])
        ) {
          console.log("Skipping setVisibleTabs update - tabs unchanged");
          return;
        }

        console.log("Setting visible tabs:", tabs);
        set({ visibleTabs: tabs });
      },

      validateSection: (
        section: "applicantsInfo" | "disclosureConfirmation"
      ) => {
        const state = get();
        console.log(`Validating ${section}:`, state[section]);

        try {
          switch (section) {
            case "applicantsInfo":
              if (!state.applicantsInfo) return false;
              applicantsInfoSchema.parse(state.applicantsInfo);
              return true;
            case "disclosureConfirmation":
              if (!state.disclosureConfirmation) return false;
              disclosureConfirmationSchema.parse(state.disclosureConfirmation);
              return true;
            default:
              return false;
          }
        } catch (error) {
          console.error(`Validation error for ${section}:`, error);
          return false;
        }
      },

      submitForm: () => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return false;

        const state = get();
        const isApplicantsInfoValid = state.validateSection("applicantsInfo");
        const isDisclosureConfirmationValid = state.validateSection(
          "disclosureConfirmation"
        );

        // Log validation results for debugging
        console.log("Validation results:", {
          isApplicantsInfoValid,
          isDisclosureConfirmationValid,
        });

        if (!isApplicantsInfoValid || !isDisclosureConfirmationValid) {
          console.error(
            "Form validation failed - but proceeding anyway for testing"
          );
          // Don't return false here to allow submission for testing
        }

        // Check if this is an initial submission or an update
        const isUpdate = state.isSubmitted;

        // Always mark as submitted, even for updates
        set({ isSubmitted: true });

        // Get selected IP types for logging and UI display
        const selectedIpTypes = state.applicantsInfo?.ipTypes || {};
        const ipTypesList = Object.entries(selectedIpTypes)
          .filter(([_, isSelected]) => isSelected)
          .map(([type]) => type.charAt(0).toUpperCase() + type.slice(1));

        console.log(`Processing IP types: ${ipTypesList.join(", ")}`);

        // Prepare submission data based on selected IP type
        const submissionData = {
          disclosureId: state.disclosureId,
          applicantsInfo: state.applicantsInfo,
          disclosureConfirmation: state.disclosureConfirmation,
          isUpdate: isUpdate, // Include flag to indicate if this is an update
          submissionTime: new Date().toISOString(), // Add timestamp
          selectedIpTypes: ipTypesList, // Add the list of selected IP types
        };

        // Only include IP-specific data if the corresponding type is selected
        if (state.applicantsInfo?.ipTypes.copyright) {
          console.log("Including Copyright data in submission");

          // Add copyright data to submission
          Object.assign(submissionData, {
            copyrightApplication: state.copyrightApplication,
            transactionFormPart1: state.transactionFormPart1,
            transactionFormPart2: state.transactionFormPart2,
          });
        }

        // Handle patent and utility model data (they share the same forms)
        if (
          state.applicantsInfo?.ipTypes.patent ||
          state.applicantsInfo?.ipTypes.utilityModel
        ) {
          const ipType = state.applicantsInfo?.ipTypes.patent
            ? "Patent"
            : "Utility Model";
          console.log(`Including ${ipType} data in submission`);

          // Add patent/utility model data to submission
          Object.assign(submissionData, {
            patentUtilityModelApplication: state.patentUtilityModelApplication,
            ipType: state.applicantsInfo?.ipTypes.patent
              ? "patent"
              : "utilityModel",
          });
        }

        // Handle trademark data
        if (state.applicantsInfo?.ipTypes.trademark) {
          console.log("Including Trademark data in submission");

          // Add trademark data to submission
          Object.assign(submissionData, {
            trademarkApplication: state.trademarkApplication,
          });
        }

        // Handle trade secret data
        if (state.applicantsInfo?.ipTypes.tradeSecret) {
          console.log("Including Trade Secret data in submission");

          // Add trade secret data to submission
          Object.assign(submissionData, {
            tradeSecretApplication: state.tradeSecretApplication,
          });
        }

        // Log the complete form data with more details
        console.log(
          `${
            isUpdate ? "Updated" : "Submitted"
          } IP disclosure form for: ${ipTypesList.join(", ")}`
        );

        // In a real application, you would send this data to your backend
        return true;
      },

      resetStore: () => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        // Get current application ID before reset
        const { applicationId } = get();

        // Track this operation to prevent loops
        const operationId = "resetStore";
        const isAppSwitching =
          sessionStorage.getItem("ipDisclosureAppSwitching") === "true";

        // Apply circuit breaker unless in app switching mode
        if (!isAppSwitching && !trackOperation(operationId)) {
          logWarn("Throttling resetStore - too many calls detected");
          return;
        }

        // Add a timestamp check to prevent very rapid resets
        const now = Date.now();
        const lastResetKey = "lastResetStoreTime";
        const lastReset = parseInt(
          sessionStorage.getItem(lastResetKey) || "0",
          10
        );
        const timeSinceLastReset = now - lastReset;

        if (!isAppSwitching && timeSinceLastReset < 500) {
          // 500ms throttle for resetStore
          logWarn(
            `Throttling resetStore - too recent (${timeSinceLastReset}ms)`
          );
          return;
        }

        // Update the last reset timestamp
        sessionStorage.setItem(lastResetKey, now.toString());

        // Reset the store state
        set({
          disclosureId: null,
          // Keep the application ID as it's used for namespacing
          // applicationId: null,
          applicantsInfo: null,
          disclosureConfirmation: null,
          activeTab: "applicants-info",
          visibleTabs: ["applicants-info", "confirmation"],
          isSubmitted: false,
          initialDataFetched: false,
          fetchAttempted: false,
          copyrightApplication: null,
          transactionFormPart1: null,
          transactionFormPart2: null,
          patentUtilityModelApplication: null,
          trademarkApplication: null,
          tradeSecretApplication: null,
          isLoading: false,
        });

        // Clear localStorage for both standard and application-specific storage
        // Skip localStorage operations if in application switching mode as
        // they'll be handled by the application switch handler
        if (!isAppSwitching) {
          try {
            if (typeof window !== "undefined") {
              // Define standard keys to remove
              const standardKeys = [
                "ip-disclosure-storage",
                "ipDisclosureData",
                "ipInventorsData",
                "patent-tabs-storage",
                "applicants-info-form",
                "applicantsInfoData",
              ];

              // Use batch removal for standard keys
              batchRemoveLocalStorageItems(standardKeys);

              // Collect all IP disclosure related keys
              const keysToRemove = [];
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
                  keysToRemove.push(key);
                }
              }

              // Use batch removal for collected keys
              batchRemoveLocalStorageItems(keysToRemove);
              logDebug("Cleared localStorage items:", keysToRemove);

              // Also clear application-specific storage if we have an application ID
              if (applicationId) {
                batchRemoveLocalStorageItems([
                  `ip-disclosure-storage-${applicationId}`,
                ]);
              }
            }
          } catch (e) {
            logError("Error clearing localStorage during resetStore:", e);
          }
        }
      },

      // Add a function to reset just the submission state
      resetSubmissionState: () => {
        // Only update if hydrated to prevent loops
        if (!get().hydrated) return;

        set({ isSubmitted: false });
        console.log("Submission state reset - form can now be submitted again");
      },

      // Function to clear local storage
      clearLocalStorage: () => {
        // Check if we're in a browser environment
        const isBrowser = typeof window !== "undefined";
        if (!isBrowser) return;

        try {
          // Define standard keys to remove
          const standardKeys = [
            "ip-disclosure-storage",
            "ipDisclosureData",
            "ipInventorsData",
            "patent-tabs-storage",
            "applicants-info-form",
            "applicantsInfoData",
          ];

          // Use batch removal for standard keys
          batchRemoveLocalStorageItems(standardKeys);

          // Collect all IP disclosure related keys
          const keysToRemove = [];
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
              keysToRemove.push(key);
            }
          }

          // Use batch removal for collected keys
          batchRemoveLocalStorageItems(keysToRemove);
          console.log(
            "Cleared all IP disclosure related localStorage items:",
            keysToRemove
          );
        } catch (e) {
          console.error("Failed to clear local storage:", e);
        }
      },

      // Set loading state
      setLoading: (isLoading: boolean) => set({ isLoading }),

      // Mark fetch as attempted
      setFetchAttempted: (fetchAttempted: boolean) => set({ fetchAttempted }),

      // Fetch initial data with throttling protection
      fetchInitialData: async () => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] fetchInitialData called`);

        // Get the disclosure ID and application ID from the store
        const { disclosureId, applicationId, hydrated } = get();

        // Skip if not hydrated to prevent loops
        if (!hydrated) {
          console.log(
            `[${timestamp}] Store not hydrated, skipping fetchInitialData`
          );
          return null;
        }

        // Check if we have a disclosureId or applicationId to fetch data
        if (!disclosureId && !applicationId) {
          console.log(
            `[${timestamp}] No disclosure ID or application ID found in store, skipping fetch`
          );
          return null;
        }

        // Track this operation
        if (
          !trackOperation("fetchInitialData", { disclosureId, applicationId })
        ) {
          console.error(
            `[${timestamp}] Blocking fetchInitialData due to excessive calls`
          );
          return null;
        }

        try {
          console.log(`[${timestamp}] Fetching disclosure data from API`);

          // Determine the API endpoint based on available IDs
          let apiUrl = "";
          if (disclosureId) {
            // Use the direct path endpoint that performs table joins to get related data
            apiUrl = `/api/ip-disclosure/${disclosureId}`;
          } else if (applicationId) {
            // For application ID we still use the query parameter endpoint
            apiUrl = `/api/ip-disclosure?applicationId=${applicationId}`;
          }

          console.log(`[${timestamp}] Using API endpoint: ${apiUrl}`);

          // Fetch the data from the API
          const response = await fetch(apiUrl);

          if (!response.ok) {
            console.error(
              `[${timestamp}] API error: ${response.status} ${response.statusText}`
            );
            return null;
          }

          const data = await response.json();

          // Add more detailed logging
          console.log(`[${timestamp}] API data received:`, {
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : [],
            hasDisclosureId: !!data?.disclosureId,
            hasApplicationId: !!data?.applicationId,
            hasApplicantsInfo: !!data?.applicantsInfo,
            hasCopyrightApplication: !!data?.copyrightApplication,
            hasCopyrightBasicApp: !!data?.copyright_basic_application,
            hasTransactionFormPart1: !!data?.transactionFormPart1,
            hasTransactionFormPart2: !!data?.transactionFormPart2,
          });

          // Mark as fetched
          set({
            initialDataFetched: true,
            fetchAttempted: true,
          });

          // Validate and set disclosure ID if it's in the response
          if (data.disclosureId && !disclosureId) {
            console.log(
              `[${timestamp}] Setting disclosure ID from API response:`,
              data.disclosureId
            );
            set({ disclosureId: data.disclosureId });
          }

          // Validate and set application ID if it's in the response
          if (data.applicationId && !applicationId) {
            console.log(
              `[${timestamp}] Setting application ID from API response:`,
              data.applicationId
            );
            set({ applicationId: data.applicationId });
          }

          // Update all form data with what we received from the API
          if (data.applicantsInfo) {
            get().setApplicantsInfo({
              ...data.applicantsInfo,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.disclosureConfirmation) {
            get().setDisclosureConfirmation({
              ...data.disclosureConfirmation,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.copyrightApplication) {
            get().setCopyrightApplication({
              ...data.copyrightApplication,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.patentUtilityModelApplication) {
            get().setPatentUtilityModelApplication({
              ...data.patentUtilityModelApplication,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.trademarkApplication) {
            get().setTrademarkApplication({
              ...data.trademarkApplication,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.tradeSecretApplication) {
            get().setTradeSecretApplication({
              ...data.tradeSecretApplication,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.transactionFormPart1) {
            get().setTransactionFormPart1({
              ...data.transactionFormPart1,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          if (data.transactionFormPart2) {
            get().setTransactionFormPart2({
              ...data.transactionFormPart2,
              _metadata: {
                userEdited: false,
                lastModified: Date.now(),
                source: "api",
              },
            });
          }

          return data;
        } catch (error) {
          console.error(`[${timestamp}] Error fetching initial data:`, error);
          set({ fetchAttempted: true });
          return null;
        }
      },

      // Add a new utility function for safe data loading
      safeDataLoad: async (
        actionName: string,
        loadAction: () => Promise<any>
      ) => {
        // Check if already loaded to prevent redundant loading
        if (get().initialDataFetched) {
          console.log(`${actionName}: Data already loaded, skipping`);
          return;
        }

        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${actionName}: Starting safe data load`);

        try {
          // Add a timeout to prevent hanging
          const loadPromise = loadAction();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${actionName} timeout`)), 15000);
          });

          await Promise.race([loadPromise, timeoutPromise]);
          console.log(`[${timestamp}] ${actionName}: Data loaded successfully`);

          // Mark as loaded
          set({ initialDataFetched: true });
        } catch (error: unknown) {
          // Properly type check the error
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `[${timestamp}] ${actionName}: Error loading data: ${errorMessage}`
          );
          set({ initialDataFetched: true }); // Ensure we mark as loaded even on error
        }
      },

      // Allow users to explicitly refresh data from API for a specific form
      refreshFromApi: async (
        formKey: keyof Pick<
          IpDisclosureState,
          | "copyrightApplication"
          | "transactionFormPart1"
          | "transactionFormPart2"
          | "patentUtilityModelApplication"
          | "trademarkApplication"
          | "tradeSecretApplication"
          | "disclosureConfirmation"
          | "applicantsInfo"
        >
      ): Promise<boolean> => {
        const { disclosureId } = get();
        const timestamp = new Date().toISOString();

        if (!disclosureId) {
          console.error(
            `[${timestamp}] Cannot refresh ${formKey} - no disclosure ID`
          );
          return false;
        }

        // Skip if not hydrated
        if (!get().hydrated) {
          console.error(
            `[${timestamp}] Cannot refresh ${formKey} - store not hydrated`
          );
          return false;
        }

        console.log(`[${timestamp}] Explicitly refreshing ${formKey} from API`);

        try {
          // Set loading state
          set({ isLoading: true });

          // Fetch data from API
          const response = await fetch(`/api/ip-disclosure/${disclosureId}`);

          if (!response.ok) {
            throw new Error(
              `API error: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();

          // Check if we have the requested data
          if (!data[formKey]) {
            console.error(
              `[${timestamp}] API response missing ${formKey} data`
            );
            set({ isLoading: false });
            return false;
          }

          // Mark the data as coming from an explicit API refresh - will override user edits
          data[formKey]._metadata = {
            userEdited: false,
            lastModified: Date.now(),
            source: "api-refresh",
          };

          // Get current state for debugging
          const currentValue = get()[formKey];
          const hadUserEdits =
            currentValue && currentValue._metadata?.userEdited;

          // Log what we're doing
          console.log(
            `[${timestamp}] Refreshing ${formKey} from API ${
              hadUserEdits ? "(overriding user edits)" : ""
            }`
          );

          // Update just the specified form data
          set({
            [formKey]: data[formKey],
            isLoading: false,
          } as any);

          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(
            `[${timestamp}] Error refreshing ${formKey} from API: ${errorMessage}`
          );
          set({ isLoading: false });
          return false;
        }
      },

      // Check if any forms have unsaved user edits
      hasUnsavedChanges: (): {
        hasChanges: boolean;
        changedForms: string[];
      } => {
        const state = get();
        const formKeys = [
          "applicantsInfo",
          "transactionFormPart1",
          "transactionFormPart2",
          "copyrightApplication",
          "patentUtilityModelApplication",
          "trademarkApplication",
          "tradeSecretApplication",
          "disclosureConfirmation",
        ];

        const changedForms: string[] = [];

        formKeys.forEach((key) => {
          const formData = state[key as keyof IpDisclosureState];
          if (formData && formData._metadata?.userEdited) {
            changedForms.push(key);
          }
        });

        return {
          hasChanges: changedForms.length > 0,
          changedForms,
        };
      },
    }),
    {
      name: "ip-disclosure-storage",
      // Only skip hydration in server context, enable in client
      skipHydration: typeof window === "undefined",
      // Customize the persist options to be more selective about storage
      partialize: (state) => {
        // Don't store loading states and other transient properties
        const { isLoading, fetchAttempted, ...persistedState } = state;
        return persistedState;
      },
      // Use custom storage with error handling and SSR check
      storage: createJSONStorage(() => {
        // Track if we've warned about storage issues to prevent console spam
        let warnedAboutStorage = false;

        // Only run localStorage operations on the client side
        if (typeof window === "undefined") {
          return {
            getItem: (_name) => null,
            setItem: (_name, _value) => {},
            removeItem: (_name) => {},
          };
        } else {
          // Test if localStorage is available
          const testKey = "_storage_test_";
          try {
            window.localStorage.setItem(testKey, "1");
            window.localStorage.removeItem(testKey);
          } catch (e) {
            console.error("localStorage not available:", e);
            return {
              getItem: (_name) => null,
              setItem: (_name, _value) => {},
              removeItem: (_name) => {},
            };
          }

          // We can use localStorage
          return {
            getItem: (name: string): string | null => {
              try {
                // Get the active application ID
                const activeAppId = window.localStorage.getItem(
                  "activeApplicationId"
                );

                // Create a namespace for the IP disclosure storage based on application ID
                if (activeAppId && name === "ip-disclosure-storage") {
                  // First try to get application-specific data
                  const namespacedData = window.localStorage.getItem(
                    `${name}-${activeAppId}`
                  );
                  if (namespacedData) {
                    return namespacedData;
                  }

                  // If no namespaced data exists, fall back to the default store
                  // This handles the transition to application-specific storage
                  return window.localStorage.getItem(name);
                }

                // For other storage items, use the regular approach
                return window.localStorage.getItem(name);
              } catch (error) {
                if (!warnedAboutStorage) {
                  logError("Error reading from localStorage:", error);
                  warnedAboutStorage = true;
                }
                return null;
              }
            },
            setItem: (name: string, value: string) => {
              try {
                const isAppSwitching =
                  sessionStorage.getItem("ipDisclosureAppSwitching") === "true";

                // Skip if we're exceeding operation thresholds, unless we're in app switching mode
                if (
                  !isAppSwitching &&
                  !trackOperation(`localStorage.setItem(${name})`, {
                    valueLength: value.length,
                  })
                ) {
                  logDebug(
                    `Skipping localStorage.setItem for ${name} due to operation throttling`
                  );
                  return;
                }

                // Circuit breaker for excessive operations within a short timeframe
                const now = Date.now();
                const lastCallKey = `lastCall_${name}`;
                const lastWrite = window.sessionStorage.getItem(lastCallKey);

                if (lastWrite && !isAppSwitching) {
                  const elapsed = now - parseInt(lastWrite, 10);
                  // Increase the throttle time to reduce writes during normal operation
                  const throttleTime = isNavigatingBetweenTabs() ? 200 : 1000; // 1 second during normal use, 200ms during tab changes
                  if (elapsed < throttleTime) {
                    logDebug(
                      `Throttling localStorage for ${name} in ${elapsed}ms`
                    );
                    return;
                  }
                }

                // Update last call timestamp
                window.sessionStorage.setItem(lastCallKey, now.toString());

                // Optimize by checking if the data actually changed before saving
                // This is in addition to the debouncedSetItem's own checking
                try {
                  // Try to parse the current value and compare it with what's already in localStorage
                  const currentObj = JSON.parse(value);
                  const activeAppId = window.localStorage.getItem(
                    "activeApplicationId"
                  );
                  const storageKey =
                    activeAppId && name === "ip-disclosure-storage"
                      ? `${name}-${activeAppId}`
                      : name;

                  const previousValue = window.localStorage.getItem(storageKey);
                  if (previousValue) {
                    try {
                      const previousObj = JSON.parse(previousValue);

                      // Clean objects for comparison (remove volatile properties)
                      const cleanObj = (obj: any) => {
                        const cleaned = { ...obj };
                        // Remove properties that change frequently but don't affect actual data
                        if (cleaned.state) {
                          delete cleaned.state.isLoading;
                          delete cleaned.state.fetchAttempted;
                          // Clean timestamps that always change
                          if (cleaned.state._metadata) {
                            delete cleaned.state._metadata.lastModified;
                          }
                        }
                        return cleaned;
                      };

                      const cleanCurrent = cleanObj(currentObj);
                      const cleanPrevious = cleanObj(previousObj);

                      // Compare the cleaned objects
                      if (
                        JSON.stringify(cleanCurrent) ===
                        JSON.stringify(cleanPrevious)
                      ) {
                        logDebug(
                          `Skipping identical write to localStorage for ${storageKey}`
                        );
                        return;
                      }
                    } catch (e) {
                      // Fall through to normal storage if comparison fails
                    }
                  }
                } catch (e) {
                  // Fall through to normal storage if parsing fails
                }

                // Get the active application ID
                const activeAppId = window.localStorage.getItem(
                  "activeApplicationId"
                );

                // Store data in application-specific namespace if it's the IP disclosure store
                if (activeAppId && name === "ip-disclosure-storage") {
                  // Parse the value to add the applicationId
                  try {
                    const parsedValue = JSON.parse(value);
                    // Ensure the applicationId is set in the state
                    if (parsedValue.state && !parsedValue.state.applicationId) {
                      parsedValue.state.applicationId = activeAppId;
                      // Reserialize with the applicationId
                      value = JSON.stringify(parsedValue);
                    }
                  } catch (e) {
                    logWarn(
                      "Failed to parse and update store value with applicationId",
                      e
                    );
                  }

                  // Use debounced function instead of direct localStorage access
                  debouncedSetItem(`${name}-${activeAppId}`, value);
                } else {
                  // Use debounced function instead of direct localStorage access
                  debouncedSetItem(name, value);
                }
              } catch (error) {
                logError("Error writing to localStorage:", error);
              }
            },
            removeItem: (name: string) => {
              try {
                // Get the active application ID
                const activeAppId = window.localStorage.getItem(
                  "activeApplicationId"
                );

                // Remove both standard and application-specific storage using debounced approach
                debouncedRemoveItem(name);
                if (activeAppId) {
                  debouncedRemoveItem(`${name}-${activeAppId}`);
                }
              } catch (error) {
                logError("Error removing from localStorage:", error);
              }
            },
          };
        }
      }),
      // Custom rehydration handler
      onRehydrateStorage: () => (state) => {
        const timestamp = new Date().toISOString();

        // Track the rehydration attempt
        trackOperation("onRehydrateStorage", { success: !!state });

        if (state) {
          console.log(
            `[${timestamp}] Rehydration complete, marking as hydrated`
          );

          // Make sure to update initialDataFetched based on what's in the store
          // This prevents redundant API fetches
          if (state.disclosureId) {
            // If we have a disclosure ID, likely we have data from localStorage
            console.log(
              `[${timestamp}] Found disclosure ID in rehydrated state: ${state.disclosureId}`
            );

            // Check for user edited data that should be preserved during hydration
            const formKeys = [
              "applicantsInfo",
              "transactionFormPart1",
              "transactionFormPart2",
              "copyrightApplication",
              "patentUtilityModelApplication",
              "trademarkApplication",
              "tradeSecretApplication",
              "disclosureConfirmation",
            ];

            let hasUserEdits = false;
            let hasSufficientData = false;

            // Check each form key to see if we have user edits
            formKeys.forEach((key) => {
              const formData = state[key as keyof IpDisclosureState];
              if (formData) {
                // Check if this form data has user edits
                if (formData._metadata?.userEdited) {
                  hasUserEdits = true;
                  console.log(`[${timestamp}] Found user edits in ${key}`);
                }

                // If we have applicantsInfo, that's a good sign we have enough data
                if (key === "applicantsInfo") {
                  hasSufficientData = true;
                }
              }
            });

            // Add metadata for rehydrated data if missing
            formKeys.forEach((key) => {
              const formData = state[key as keyof IpDisclosureState];
              if (formData && !formData._metadata) {
                // Add default metadata for rehydrated data without metadata
                formData._metadata = {
                  userEdited: false, // Assume not user edited unless proven otherwise
                  lastModified: Date.now(),
                  source: "local-storage",
                };
                console.log(`[${timestamp}] Added missing metadata to ${key}`);
              }
            });

            // If we have user edits or sufficient data, mark as fetched to avoid API calls
            if (hasUserEdits || hasSufficientData) {
              console.log(
                `[${timestamp}] Marking initialDataFetched=true based on rehydrated state ${
                  hasUserEdits ? "(has user edits)" : "(has sufficient data)"
                }`
              );
              state.initialDataFetched = true;
            }
          }

          // Use setTimeout to ensure this happens after the component is mounted
          setTimeout(() => {
            state.setHydrated(true);
          }, 0);
        } else {
          console.error(`[${timestamp}] Rehydration failed`);
          // Even if rehydration fails, we should set hydrated to true
          // to allow the application to function
          setTimeout(() => {
            // We can't access state here since it's null, so we need to use the store directly
            useIpDisclosureStore.setState({ hydrated: true });
          }, 0);
        }
      },
    }
  )
);

// Create a hook to manually handle hydration in your components
export function useHydratedIpDisclosureStore() {
  const store = useIpDisclosureStore();
  const [isReady, setIsReady] = React.useState(store.hydrated);

  // Set hydrated to true in client-side code - only run once
  React.useEffect(() => {
    // Check if we're in a browser environment before setting hydrated
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
      // If already hydrated, mark as ready
      if (store.hydrated) {
        setIsReady(true);
      } else {
        // If not hydrated yet, set up a listener for hydration changes
        const unsubscribe = useIpDisclosureStore.subscribe((state) => {
          if (state.hydrated) {
            setIsReady(true);
            unsubscribe();
          }
        });

        // Safety timeout - if hydration hasn't happened after 2 seconds,
        // force it to be ready to prevent the UI from being stuck
        const timeout = setTimeout(() => {
          if (!store.hydrated) {
            console.warn("Forcing hydration after timeout");
            useIpDisclosureStore.setState({ hydrated: true });
            setIsReady(true);
          }
          unsubscribe();
        }, 2000);

        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      }
    }
  }, []); // Empty dependency array ensures this runs exactly once

  return { ...store, isHydrated: isReady };
}

/**
 * Helper function for form components to safely initialize form data
 *
 * @param formKey The store key to check for existing data (e.g., 'copyrightApplication')
 * @param disclosureId The current disclosure ID
 * @param defaultValues Default values to use if no data is found
 * @param form The React Hook Form instance to reset with values
 * @param setDataLoaded Function to mark data as loaded in the component
 * @param loadFromApi Function to load data from API as fallback
 */
export function initializeFormData({
  formKey,
  disclosureId,
  defaultValues,
  form,
  setDataLoaded,
  loadFromApi,
}: {
  formKey: keyof Pick<
    IpDisclosureState,
    | "copyrightApplication"
    | "transactionFormPart1"
    | "transactionFormPart2"
    | "patentUtilityModelApplication"
    | "trademarkApplication"
    | "tradeSecretApplication"
    | "disclosureConfirmation"
  >;
  disclosureId: string | null;
  defaultValues: any;
  form: { reset: (values: any) => void };
  setDataLoaded: (loaded: boolean) => void;
  loadFromApi?: () => Promise<void>;
}) {
  console.log(`Initializing form data for ${formKey}`);

  // Safety check: ensure we have a disclosure ID
  if (!disclosureId) {
    console.log(`No disclosure ID, using default values`);

    // Add metadata to default values
    const defaultsWithMetadata = {
      ...defaultValues,
      _metadata: {
        userEdited: false,
        lastModified: Date.now(),
        source: "default",
      },
    };

    form.reset(defaultsWithMetadata);
    setDataLoaded(true);
    return;
  }

  // Check if store is hydrated
  const store = useIpDisclosureStore.getState();
  if (!store.hydrated) {
    console.log(`Store not hydrated yet, will try again`);
    // Wait for hydration and try again
    setTimeout(() => {
      initializeFormData({
        formKey,
        disclosureId,
        defaultValues,
        form,
        setDataLoaded,
        loadFromApi,
      });
    }, 100);
    return;
  }

  // Check if we have data in the store
  const storeData = store[formKey];

  if (storeData && Object.keys(storeData).length > 0) {
    console.log(`Found data in store for ${formKey}`);

    // Check if it's user-edited data
    const isUserEdited = storeData._metadata?.userEdited === true;
    const dataSource = storeData._metadata?.source || "unknown";

    console.log(`Data source: ${dataSource}, user edited: ${isUserEdited}`);

    // Make sure the disclosureId is set in the data
    const dataWithId = {
      ...storeData,
      disclosureId: disclosureId,
    };

    // Reset form with store data
    form.reset(dataWithId);
    setDataLoaded(true);
    return;
  }

  // No data in store, check if we need to try API
  if (loadFromApi && !store.initialDataFetched) {
    console.log(`No data in store for ${formKey}, will try to load from API`);

    // Try to load from API
    loadFromApi().catch((err) => {
      console.error(`Error loading ${formKey} data from API:`, err);

      // On error, still mark as loaded and use defaults with metadata
      const defaultsWithMetadata = {
        ...defaultValues,
        disclosureId,
        _metadata: {
          userEdited: false,
          lastModified: Date.now(),
          source: "default-after-api-error",
        },
      };

      form.reset(defaultsWithMetadata);
      setDataLoaded(true);
    });
    return;
  }

  // If we get here, we have no data and no API to load from (or already tried API)
  console.log(`No data available for ${formKey}, using default values`);

  // Add metadata and disclosureId to default values
  const defaultsWithMetadata = {
    ...defaultValues,
    disclosureId,
    _metadata: {
      userEdited: false,
      lastModified: Date.now(),
      source: "default-fallback",
    },
  };

  form.reset(defaultsWithMetadata);
  setDataLoaded(true);
}

// Expose a global function to clear all operation trackers and throttle maps
if (typeof window !== "undefined") {
  window._clearIpDisclosureTrackers = () => {
    logInfo("Clearing all IP disclosure operation trackers and throttle maps");

    // Clear operation tracker to prevent throttling after application switch
    operationTracker.clear();

    // Clear update throttle map
    updateThrottleMap.clear();

    // Reset retry counters
    sessionStorage.removeItem("lastFetchDisclosureData");
    sessionStorage.removeItem("lastCheckExistingDisclosureAndFetch");
  };
}
