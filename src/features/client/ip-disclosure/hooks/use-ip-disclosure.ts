import { useState } from "react";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import type { ApplicantsInfo } from "@/lib/store/ip-disclosure-store";
import { trpc } from "@/trpc/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    _ipDisclosureTimeouts?: NodeJS.Timeout[];
    _clearIpDisclosureTrackers?: () => void;
  }
}

// Add a request cache and throttle mechanism
const API_CACHE = new Map();
const API_TIMESTAMPS = new Map();
const CACHE_EXPIRY = 30000; // 30 seconds
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

/**
 * Main implementation of the IP Disclosure hook that provides methods for
 * managing IP disclosure data with application integration
 */
export function useIpDisclosure() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    disclosureId,
    applicationId,
    fetchInitialData,
    setDisclosureId,
    setApplicantsInfo,
    applicantsInfo,
    setDisclosureConfirmation,
    disclosureConfirmation,
    setCopyrightApplication,
    copyrightApplication,
    setTransactionFormPart1,
    transactionFormPart1,
    setTransactionFormPart2,
    transactionFormPart2,
    setPatentUtilityModelApplication,
    patentUtilityModelApplication,
    setTrademarkApplication,
    trademarkApplication,
    setTradeSecretApplication,
    tradeSecretApplication,
    submitForm,
    resetSubmissionState,
  } = useIpDisclosureStore();

  // Create IP disclosure mutation
  const createIpDisclosureMutation =
    trpc.ipDisclosure.createIpDisclosure.useMutation({
      onSuccess: (data) => {
        console.log("IP disclosure created successfully:", data);
        if (data && typeof data.disclosureId === "string") {
          setDisclosureId(data.disclosureId);
        }
        toast({
          title: "Success",
          description: "IP disclosure created successfully",
        });
      },
      onError: (error) => {
        console.error("Error creating IP disclosure:", error);
        // Log only the error message which is safe
        if (error.message) {
          console.error("Error message:", error.message);
        }
        toast({
          title: "Error",
          description: "Failed to create IP disclosure: " + error.message,
          variant: "destructive",
        });
      },
      onMutate: (variables) => {
        // Ensure the selectedIpTypes field is properly formatted as a JSON-compatible object
        // Convert any nested objects to proper format before the mutation runs
        if (variables.selectedIpTypes) {
          // Make sure all values are explicitly boolean
          const formattedIpTypes = {
            copyright: Boolean(variables.selectedIpTypes.copyright),
            patent: Boolean(variables.selectedIpTypes.patent),
            utilityModel: Boolean(variables.selectedIpTypes.utilityModel),
            industrialDesign: Boolean(
              variables.selectedIpTypes.industrialDesign
            ),
            trademark: Boolean(variables.selectedIpTypes.trademark),
            tradeSecret: Boolean(variables.selectedIpTypes.tradeSecret),
            other: Boolean(variables.selectedIpTypes.other),
            notSure: Boolean(variables.selectedIpTypes.notSure),
          };

          // Log the formatted types for debugging
          console.log("Formatted IP types for mutation:", {
            original: variables.selectedIpTypes,
            formatted: formattedIpTypes,
            asJSON: JSON.stringify(formattedIpTypes),
          });

          // Replace the original object with the formatted one
          variables.selectedIpTypes = formattedIpTypes;
        }

        return variables;
      },
    });

  // Update IP disclosure mutation
  const updateIpDisclosureMutation =
    trpc.ipDisclosure.updateIpDisclosure.useMutation({
      onSuccess: () => {
        console.log("IP disclosure updated successfully");
        toast({
          title: "Success",
          description: "IP disclosure updated successfully",
        });
      },
      onError: (error) => {
        console.error("Error updating IP disclosure:", error);
        toast({
          title: "Error",
          description: "Failed to update IP disclosure: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Get IP disclosure query
  const getIpDisclosureQuery = (id: string) => {
    // Simply return the query result without callbacks
    return trpc.ipDisclosure.getIpDisclosure.useQuery(
      { disclosureId: id },
      {
        enabled: !!id,
      }
    );
  };

  // Save trademark application mutation
  const saveTrademarkMutation =
    trpc.ipDisclosure.saveTrademarkApplication.useMutation({
      onSuccess: (data) => {
        console.log("Trademark application saved successfully:", data);
        toast({
          title: "Success",
          description: "Trademark application saved successfully",
        });
      },
      onError: (error) => {
        console.error("Error saving trademark application:", error);
        toast({
          title: "Error",
          description: "Failed to save trademark application: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Save trade secret application mutation
  const saveTradeSecretMutation =
    trpc.ipDisclosure.saveTradeSecretApplication.useMutation({
      onSuccess: (data) => {
        console.log("Trade secret application saved successfully:", data);
        toast({
          title: "Success",
          description: "Trade secret application saved successfully",
        });
      },
      onError: (error) => {
        console.error("Error saving trade secret application:", error);
        toast({
          title: "Error",
          description:
            "Failed to save trade secret application: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Save copyright application mutation
  const saveCopyrightMutation =
    trpc.ipDisclosure.saveCopyrightApplication.useMutation({
      onSuccess: (data) => {
        console.log("Copyright application saved successfully:", data);
        toast({
          title: "Success",
          description: "Copyright application saved successfully",
        });
      },
      onError: (error) => {
        console.error("Error saving copyright application:", error);
        toast({
          title: "Error",
          description: "Failed to save copyright application: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Save patent/utility model application mutation
  const savePatentUtilityModelMutation =
    trpc.ipDisclosure.savePatentUtilityModelApplication.useMutation({
      onSuccess: (data) => {
        console.log(
          "Patent/utility model application saved successfully:",
          data
        );
        toast({
          title: "Success",
          description: "Patent/utility model application saved successfully",
        });
      },
      onError: (error) => {
        console.error("Error saving patent/utility model application:", error);
        toast({
          title: "Error",
          description:
            "Failed to save patent/utility model application: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Save disclosure confirmation mutation
  const saveDisclosureConfirmationMutation =
    trpc.ipDisclosure.saveDisclosureConfirmation.useMutation({
      onSuccess: (data) => {
        console.log("Disclosure confirmation saved successfully:", data);
        toast({
          title: "Success",
          description: "Disclosure confirmation saved successfully",
        });
      },
      onError: (error) => {
        console.error("Error saving disclosure confirmation:", error);
        toast({
          title: "Error",
          description:
            "Failed to save disclosure confirmation: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Submit IP disclosure mutation
  const submitIpDisclosureMutation =
    trpc.ipDisclosure.submitIpDisclosure.useMutation({
      onSuccess: () => {
        console.log("IP disclosure submitted successfully");
        toast({
          title: "Success",
          description: "IP disclosure submitted successfully",
        });
      },
      onError: (error) => {
        console.error("Error submitting IP disclosure:", error);
        toast({
          title: "Error",
          description: "Failed to submit IP disclosure: " + error.message,
          variant: "destructive",
        });
      },
    });

  // Function to check if a trademark application exists in the database
  const checkTrademarkExists = async (
    disclosureId: string
  ): Promise<boolean> => {
    if (!disclosureId) {
      console.error("No disclosure ID provided to check trademark existence");
      return false;
    }

    try {
      console.log(
        `Checking if trademark exists for disclosure ID: ${disclosureId}`
      );

      // Use a direct fetch approach
      const response = await fetch(
        `/api/trpc/ipDisclosure.checkTrademarkExists?batch=1&input=${encodeURIComponent(
          JSON.stringify({ disclosureId })
        )}`
      );
      const responseData = await response.json();

      if (
        responseData &&
        responseData[0] &&
        responseData[0].result &&
        responseData[0].result.data
      ) {
        const result = responseData[0].result.data;
        console.log(`Trademark check result:`, result);
        return !!result.exists;
      }

      return false;
    } catch (error) {
      console.error("Error checking if trademark exists:", error);
      return false;
    }
  };

  // Function to check if a patent search report exists in the database
  const checkPatentSearchReportExists = async (
    patentId: string
  ): Promise<boolean> => {
    if (!patentId) {
      console.error("No patent ID provided to check search report existence");
      return false;
    }

    try {
      console.log(
        `CLIENT: Checking if patent search report exists for patent ID: ${patentId}`
      );

      // Construct a simpler URL without the batch parameter
      const url = `/api/trpc/ipDisclosure.checkPatentSearchReportExists?input=${encodeURIComponent(
        JSON.stringify({ patentId })
      )}`;

      console.log(`CLIENT: Sending request to URL: ${url}`);

      // Use fetch with proper error handling
      const response = await fetch(url);

      console.log(`CLIENT: Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `CLIENT: HTTP error! status: ${response.status}, response: ${errorText}`
        );
        return false;
      }

      const data = await response.json();
      console.log(`CLIENT: Response data:`, data);

      // Check if the response has the expected structure for non-batched requests
      if (data && data.result && data.result.data) {
        const result = data.result.data;
        console.log(`CLIENT: Patent search report check result:`, result);
        return !!result.exists;
      }

      console.log(`CLIENT: No valid result data in response`);
      return false;
    } catch (error) {
      console.error(
        "CLIENT: Error checking if patent search report exists:",
        error
      );
      if (error instanceof Error) {
        console.error("CLIENT: Error message:", error.message);
        console.error("CLIENT: Error stack:", error.stack);
      }
      // Return false instead of throwing an error to prevent UI disruption
      return false;
    }
  };

  // Add a new function to check for existing IP disclosures by user ID
  const checkExistingDisclosure = async (): Promise<string | null> => {
    // Control verbosity of logging
    const DEBUG = false;

    // Get application ID for verification
    const currentAppId = useIpDisclosureStore.getState().applicationId;

    if (!currentAppId) {
      if (DEBUG) {
        console.warn(
          "No application ID in store, cannot check existing disclosure"
        );
      }
      return null;
    }

    // Try to get the disclosure ID from the store first
    const existingDisclosureId = useIpDisclosureStore.getState().disclosureId;
    if (existingDisclosureId) {
      if (DEBUG) {
        console.log("Found disclosure ID in store:", existingDisclosureId);
      }
      return existingDisclosureId;
    }

    // Track already checked app IDs to avoid redundant API calls
    const checkedAppIdsStr =
      sessionStorage.getItem("checkedDisclosureAppIds") || "[]";
    const checkedAppIds = JSON.parse(checkedAppIdsStr);

    // If this app ID was checked recently (within last 30 seconds) and no disclosure found,
    // don't make redundant API calls
    const lastCheckedTime = parseInt(
      sessionStorage.getItem(`appIdLastChecked_${currentAppId}`) || "0",
      10
    );
    const timeSinceLastCheck = Date.now() - lastCheckedTime;

    if (checkedAppIds.includes(currentAppId) && timeSinceLastCheck < 30000) {
      if (DEBUG) {
        console.log(
          `Skipping API call for recently checked app ID: ${currentAppId} (${timeSinceLastCheck}ms ago)`
        );
      }
      return null;
    }

    // If no disclosure ID in store, check if one exists for the current application
    try {
      if (DEBUG) {
        console.log(
          "Checking for existing disclosure for application ID:",
          currentAppId
        );
      }

      const response = await fetch(
        `/api/ip-disclosure/user-disclosures?applicationId=${currentAppId}`
      );

      // Clone the response to enable multiple reads
      const responseClone = response.clone();

      if (!response.ok) {
        // Check specifically for 404 (not found) - this is an expected case
        if (response.status === 404) {
          // Mark this app ID as checked to avoid redundant checks
          if (!checkedAppIds.includes(currentAppId)) {
            checkedAppIds.push(currentAppId);
            sessionStorage.setItem(
              "checkedDisclosureAppIds",
              JSON.stringify(checkedAppIds)
            );
            sessionStorage.setItem(
              `appIdLastChecked_${currentAppId}`,
              Date.now().toString()
            );
          }

          if (DEBUG) {
            console.log(
              `No existing disclosure found for application ID: ${currentAppId}`
            );
          }
          return null;
        }

        // For other errors, try to parse the error message
        if (DEBUG) {
          console.warn(
            `Error checking existing disclosure for application ID: ${currentAppId}, status: ${response.status}`
          );
        }

        try {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to check existing disclosure"
          );
        } catch (jsonError) {
          // If JSON parsing fails, use the response text
          const errorText = await responseClone.text();
          throw new Error(errorText || "Failed to check existing disclosure");
        }
      }

      // Parse the response
      const data = await response.json();

      // Verify the application ID matches to prevent cross-application data pollution
      if (data.applicationId && data.applicationId !== currentAppId) {
        console.error(
          `Data from API belongs to application ${data.applicationId}, not current application ${currentAppId}.`
        );
        return null;
      }

      // If we have a disclosure ID, return it
      if (data && data.disclosureId) {
        if (DEBUG) {
          console.log("Found existing disclosure ID:", data.disclosureId);
        }

        // Clean up this app ID from the checked list since we found data
        const newCheckedAppIds = checkedAppIds.filter(
          (id: string) => id !== currentAppId
        );
        sessionStorage.setItem(
          "checkedDisclosureAppIds",
          JSON.stringify(newCheckedAppIds)
        );

        return data.disclosureId;
      }

      // Otherwise, no existing disclosure
      if (DEBUG) {
        console.log("No existing disclosure found");
      }

      // Mark this app ID as checked to avoid redundant checks
      if (!checkedAppIds.includes(currentAppId)) {
        checkedAppIds.push(currentAppId);
        sessionStorage.setItem(
          "checkedDisclosureAppIds",
          JSON.stringify(checkedAppIds)
        );
        sessionStorage.setItem(
          `appIdLastChecked_${currentAppId}`,
          Date.now().toString()
        );
      }

      return null;
    } catch (error) {
      console.error("Error checking for existing disclosure:", error);
      return null;
    }
  };

  // Function to fetch initial data from the API
  const fetchDisclosureData = async () => {
    // Get the disclosure ID and application ID from the store
    const { disclosureId, applicationId } = useIpDisclosureStore.getState();

    // Add circuit breaker to prevent excessive calls
    const now = Date.now();
    const lastCallKey = "lastFetchDisclosureData";
    const lastCallTime = parseInt(
      sessionStorage.getItem(lastCallKey) || "0",
      10
    );
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < 300) {
      // 300ms throttle
      console.warn(
        `Throttling fetchDisclosureData - too many calls (${timeSinceLastCall}ms since last call)`
      );
      return null;
    }

    // Update the last call timestamp
    sessionStorage.setItem(lastCallKey, now.toString());

    // Validate parameters
    if (!disclosureId) {
      console.warn("No disclosure ID provided, cannot fetch data");
      return null;
    }

    if (!applicationId) {
      console.warn("No application ID in store, cannot fetch disclosure data");
      return null;
    }

    try {
      console.log(`Fetching disclosure data for ID: ${disclosureId}`);

      // Set loading state
      setIsLoading(true);

      // Fetch the disclosure data
      const response = await fetch(`/api/ip-disclosure/${disclosureId}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch disclosure data: ${response.statusText}`
        );
      }

      // Parse the response
      const data = await response.json();

      // Always verify application ID to prevent cross-application data leakage
      if (data.applicationId && data.applicationId !== applicationId) {
        console.error(
          `Data from API belongs to application ${data.applicationId}, not current application ${applicationId}. Ignoring.`
        );
        setIsLoading(false);
        return null;
      }

      console.log("Received data for disclosure:", {
        disclosureId: data.disclosureId,
        hasApplicantsInfo: !!data.applicantsInfo,
        hasCopyrightApplication: !!data.copyrightApplication,
        hasPatentUtilityModelApplication: !!data.patentUtilityModelApplication,
        hasTrademarkApplication: !!data.trademarkApplication,
        hasTradeSecretApplication: !!data.tradeSecretApplication,
      });

      // Process the data if needed
      const processedData = processApiData(data);

      // Set loading state
      setIsLoading(false);

      // Return the processed data
      return processedData;
    } catch (error) {
      console.error("Error fetching disclosure data:", error);

      // Set loading state
      setIsLoading(false);

      return null;
    }
  };

  // Helper function to create default data
  const createDefaultData = () => {
    return {
      applicantsInfo: {
        email: "",
        ipTypes: {
          copyright: false,
          patent: false,
          utilityModel: false,
          industrialDesign: false,
          trademark: false,
          tradeSecret: false,
          other: false,
          notSure: false,
        },
        isRightfulOwner: false,
        authorizedRepresentative: "",
        otherIpType: "",
        applicants: [
          {
            firstName: "",
            middleInitial: "",
            lastName: "",
          },
        ],
        inventors: [
          {
            firstName: "",
            middleInitial: "",
            lastName: "",
          },
        ],
      },
      // Add empty transaction form data to avoid property not exist errors
      transactionFormPart1: {
        transaction_data: {
          coAuthors: [],
        },
        disclosureId: undefined,
        copyrightId: undefined,
      },
      transactionFormPart2: {
        applicantInfoIsSameAsAuthor: false,
        applicant: {
          name: "",
          address: "",
          citizenship: "",
        },
        author: {
          name: "",
          pseudonym: "",
          citizenship: "",
          yearOfDeath: "",
        },
        work: {
          title: "",
          date: "",
        },
        disclosureId: undefined,
        copyrightId: undefined,
      },
      // Add empty disclosure confirmation data
      disclosureConfirmation: {
        writtenDisclosures: {
          past: false,
          planned: false,
          notApplicable: false,
        },
        oralDisclosures: {
          past: false,
          planned: false,
          notApplicable: false,
        },
        futureWork: "",
        confirmationDeclaration: false,
      },
    };
  };

  // First, adding the function that's missing for processing API data
  const processApiData = (data: any) => {
    // Log the raw data structure to help with debugging
    console.log("[processApiData] Raw API data structure:", {
      keys: Object.keys(data),
      hasDisclosureId: !!data.disclosureId || !!data.disclosure_id,
      hasApplicationId: !!data.applicationId || !!data.application_id,
      hasCopyrightBasicApp: !!data.copyright_basic_application,
      hasCopyrightTransactionPart1: !!data.copyright_transaction_part1,
      hasCopyrightTransactionPart2: !!data.copyright_transaction_part2,
      hasPatentUtilityModelApplication: !!data.patent_utility_model_application,
      hasTrademarkApplication: !!data.trademark_application,
      hasTradeSecretApplication: !!data.trade_secret_application,
      hasDisclosureConfirmation: !!data.disclosure_confirmation,
    });

    // Extract transaction form data
    const transactionPart1 = extractTransactionFormPart1(data);
    const transactionPart2 = extractTransactionFormPart2(data);

    // Extract applicants info, making sure to handle flattened API responses
    const applicantsData = extractApplicantsInfo(data);

    // Extract disclosure confirmation, if present
    const disclosureConfirmation = extractDisclosureConfirmation(data);

    // Extract copyright application data
    const copyrightApplicationData = extractCopyrightApplication(data);

    // Extract patent and utility application data
    const patentUtilityApplicationData = extractPatentUtilityApplication(data);

    // Extract trademark application data
    const trademarkApplicationData = extractTrademarkApplication(data);

    // Extract trade secret application data
    const tradeSecretApplicationData = extractTradeSecretApplication(data);

    console.log(
      "[processApiData] Extracted applicationId:",
      data.applicationId || data.application_id
    );

    // Log the extraction results
    console.log("[processApiData] Extraction results:", {
      hasApplicantsData: !!applicantsData,
      hasDisclosureConfirmation: !!disclosureConfirmation,
      hasCopyrightApplication: !!copyrightApplicationData,
      hasTransactionPart1: !!transactionPart1,
      hasTransactionPart2: !!transactionPart2,
      hasPatentUtilityModel: !!patentUtilityApplicationData,
      hasTrademark: !!trademarkApplicationData,
      hasTradeSecret: !!tradeSecretApplicationData,
    });

    // Create the result object with data from the response
    return {
      disclosureId: data.disclosureId || data.disclosure_id,
      applicationId: data.applicationId || data.application_id,
      applicantsInfo: applicantsData,
      disclosureConfirmation: disclosureConfirmation,
      copyrightApplication: copyrightApplicationData,
      transactionFormPart1: transactionPart1,
      transactionFormPart2: transactionPart2,
      patentUtilityModelApplication: patentUtilityApplicationData,
      trademarkApplication: trademarkApplicationData,
      tradeSecretApplication: tradeSecretApplicationData,
    };
  };

  // Helper functions to extract data from API responses
  const extractTransactionFormPart1 = (data: any) => {
    // Log detailed information about the input data structure
    console.log("[extractTransactionFormPart1] Data input check:", {
      hasData: !!data,
      hasTransactionFormPart1: !!data?.transactionFormPart1,
      hasCopyrightTransactionPart1: !!data?.copyright_transaction_part1,
      transactionDataType: data?.copyright_transaction_part1?.transaction_data
        ? typeof data.copyright_transaction_part1.transaction_data
        : "undefined",
      hasNestedTransactionData:
        !!data?.copyright_transaction_part1?.transaction_data?.transaction_data,
    });

    // Check for direct transactionFormPart1 data
    if (data.transactionFormPart1) {
      console.log(
        "[extractTransactionFormPart1] Found direct transactionFormPart1 data"
      );
      return data.transactionFormPart1;
    }

    // Check for copyright_transaction_part1 data
    if (data.copyright_transaction_part1) {
      console.log(
        "[extractTransactionFormPart1] Found copyright_transaction_part1 data"
      );

      let transactionData = data.copyright_transaction_part1.transaction_data;
      let coAuthors = [];

      // Handle case where transaction_data is a string (from JSONB)
      if (typeof transactionData === "string") {
        try {
          console.log(
            "[extractTransactionFormPart1] Parsing transaction_data string"
          );
          transactionData = JSON.parse(transactionData);
        } catch (error) {
          console.error(
            "[extractTransactionFormPart1] Error parsing transaction_data:",
            error
          );
          transactionData = { coAuthors: [] };
        }
      }

      // Handle double-nested transaction_data structure (as seen in the database example)
      if (transactionData && typeof transactionData === "object") {
        console.log(
          "[extractTransactionFormPart1] Transaction data fields:",
          Object.keys(transactionData)
        );

        // Check if there's a nested transaction_data with coAuthors
        if (
          transactionData.transaction_data &&
          typeof transactionData.transaction_data === "object"
        ) {
          console.log(
            "[extractTransactionFormPart1] Found double-nested transaction_data structure"
          );

          // Extract coAuthors from the nested structure
          coAuthors = transactionData.transaction_data.coAuthors || [];

          // Check if there's metadata we should preserve in the outer object
          const metadata = transactionData._metadata || null;
          const copyrightId = transactionData.copyrightId || null;
          const disclosureId = transactionData.disclosureId || null;

          // Log what we found
          console.log(
            "[extractTransactionFormPart1] Extracted coAuthors from nested structure:",
            Array.isArray(coAuthors)
              ? `Array with ${coAuthors.length} items`
              : typeof coAuthors
          );

          // Build a clean transaction_data without the nesting
          transactionData = {
            coAuthors: coAuthors,
          };

          // Preserve metadata if it existed
          if (metadata) {
            transactionData._metadata = metadata;
          }
        }
      }

      // Ensure coAuthors is always an array
      if (transactionData && !Array.isArray(transactionData.coAuthors)) {
        if (
          transactionData.coAuthors &&
          typeof transactionData.coAuthors === "object"
        ) {
          transactionData.coAuthors = [transactionData.coAuthors];
          console.log(
            "[extractTransactionFormPart1] Converted single coAuthor object to array"
          );
        } else {
          transactionData.coAuthors = [];
          console.log(
            "[extractTransactionFormPart1] Initialized empty coAuthors array"
          );
        }
      }

      // Get IDs from various possible locations
      const copyrightId =
        data.copyright_transaction_part1.copyright_id ||
        data.copyright_transaction_part1.copyrightId ||
        (transactionData && transactionData.copyrightId);

      const disclosureId =
        data.disclosure_id ||
        data.disclosureId ||
        (transactionData && transactionData.disclosureId);

      // Final form with consolidated fields
      const result = {
        disclosureId: disclosureId,
        copyrightId: copyrightId,
        transaction_data: transactionData || { coAuthors: [] },
      };

      console.log("[extractTransactionFormPart1] Final extracted data:", {
        hasDisclosureId: !!result.disclosureId,
        hasCopyrightId: !!result.copyrightId,
        hasCoAuthors: !!result.transaction_data.coAuthors,
        coAuthorsCount: Array.isArray(result.transaction_data.coAuthors)
          ? result.transaction_data.coAuthors.length
          : 0,
      });

      return result;
    }

    // No transaction part 1 data found
    console.log(
      "[extractTransactionFormPart1] No transaction part 1 data found"
    );
    return null;
  };

  const extractTransactionFormPart2 = (data: any) => {
    // Check for direct transactionFormPart2 data
    if (data.transactionFormPart2) {
      console.log(
        "[extractTransactionFormPart2] Found direct transactionFormPart2 data"
      );
      return data.transactionFormPart2;
    }

    // Check for copyright_transaction_part2 data
    if (data.copyright_transaction_part2) {
      console.log(
        "[extractTransactionFormPart2] Found copyright_transaction_part2 data"
      );

      // Format the data consistently
      return {
        disclosureId: data.disclosure_id || data.disclosureId,
        copyrightId: data.copyright_transaction_part2.copyright_id,
        transaction_details:
          data.copyright_transaction_part2.transaction_details || {},
        applicant_info: data.copyright_transaction_part2.applicant_info || {},
        author_info: data.copyright_transaction_part2.author_info || {},
      };
    }

    // No transaction part 2 data found
    console.log(
      "[extractTransactionFormPart2] No transaction part 2 data found"
    );
    return null;
  };

  const extractApplicantsInfo = (data: any) => {
    // Check for direct applicantsInfo
    if (data.applicantsInfo) {
      console.log("[extractApplicantsInfo] Found direct applicantsInfo");
      return data.applicantsInfo;
    }

    // Check for flattened structure
    if (data.email || data.applicants || data.inventors || data.ipTypes) {
      console.log(
        "[extractApplicantsInfo] Found flattened applicants info structure"
      );

      return {
        email: data.email || "",
        ipTypes: data.ipTypes ||
          data.selected_ip_types || {
            copyright: false,
            patent: false,
            utilityModel: false,
            industrialDesign: false,
            trademark: false,
            tradeSecret: false,
            other: false,
            notSure: false,
          },
        isRightfulOwner:
          data.isRightfulOwner || data.is_rightful_owner || false,
        authorizedRepresentative:
          data.authorizedRepresentative || data.authorized_representative || "",
        otherIpType: data.otherIpType || data.other_ip_type || "",
        applicants: Array.isArray(data.applicants)
          ? data.applicants.map((applicant: any) => ({
              firstName: applicant.firstName || applicant.first_name || "",
              middleInitial:
                applicant.middleInitial || applicant.middle_initial || "",
              lastName: applicant.lastName || applicant.last_name || "",
            }))
          : [{ firstName: "", middleInitial: "", lastName: "" }],
        inventors: Array.isArray(data.inventors)
          ? data.inventors.map((inventor: any) => ({
              firstName: inventor.firstName || inventor.first_name || "",
              middleInitial:
                inventor.middleInitial || inventor.middle_initial || "",
              lastName: inventor.lastName || inventor.last_name || "",
            }))
          : [{ firstName: "", middleInitial: "", lastName: "" }],
      };
    }

    // No applicants info found
    console.log("[extractApplicantsInfo] No applicants info found");
    return null;
  };

  const extractDisclosureConfirmation = (data: any) => {
    // Check for direct disclosureConfirmation
    if (data.disclosureConfirmation) {
      console.log(
        "[extractDisclosureConfirmation] Found direct disclosureConfirmation"
      );
      return data.disclosureConfirmation;
    }

    // Check for snake_case disclosure_confirmation data
    if (data.disclosure_confirmation) {
      console.log(
        "[extractDisclosureConfirmation] Found disclosure_confirmation data"
      );
      return {
        disclosureId: data.disclosure_id || data.disclosureId,
        writtenDisclosures: data.disclosure_confirmation
          .written_disclosures || {
          past: false,
          planned: false,
          notApplicable: false,
        },
        oralDisclosures: data.disclosure_confirmation.oral_disclosures || {
          past: false,
          planned: false,
          notApplicable: false,
        },
        futureWork: data.disclosure_confirmation.future_work || "",
        confirmationDeclaration:
          data.disclosure_confirmation.confirmation_declaration || false,
      };
    }

    // No disclosure confirmation found
    console.log(
      "[extractDisclosureConfirmation] No disclosure confirmation found"
    );
    return null;
  };

  const extractCopyrightApplication = (data: any) => {
    // Log detailed info about the data structure
    console.log("[extractCopyrightApplication] Data input check:", {
      hasData: !!data,
      hasCopyrightApplication: !!data?.copyrightApplication,
      hasCopyrightBasicApp: !!data?.copyright_basic_application,
      copyrightBasicAppType: data?.copyright_basic_application
        ? typeof data.copyright_basic_application
        : "undefined",
      isJsonString:
        data?.copyright_basic_application &&
        typeof data.copyright_basic_application === "string" &&
        (data.copyright_basic_application.startsWith("{") ||
          data.copyright_basic_application.startsWith("[")),
    });

    // Check for direct copyrightApplication
    if (data.copyrightApplication) {
      console.log(
        "[extractCopyrightApplication] Found direct copyrightApplication",
        data.copyrightApplication
      );
      return data.copyrightApplication;
    }

    // Check for copyright_basic_application data (snake_case from DB)
    if (data.copyright_basic_application) {
      console.log(
        "[extractCopyrightApplication] Found copyright_basic_application data"
      );

      // Check if the copyright_basic_application is a string (JSONB from PostgreSQL might come as string)
      let copyrightData = data.copyright_basic_application;

      if (typeof copyrightData === "string") {
        console.log(
          "[extractCopyrightApplication] Received copyright_basic_application as string, attempting to parse JSON"
        );
        try {
          copyrightData = JSON.parse(copyrightData);
          console.log(
            "[extractCopyrightApplication] Successfully parsed copyright_basic_application JSON"
          );
        } catch (error) {
          console.error(
            "[extractCopyrightApplication] Failed to parse copyright_basic_application JSON string:",
            error
          );
          console.log(
            "[extractCopyrightApplication] Raw string value:",
            copyrightData
          );
          // Fall back to treating it as a plain string
        }
      }

      // Log actual fields available in the copyright data
      console.log(
        "[extractCopyrightApplication] Available fields in copyright_basic_application:",
        typeof copyrightData === "object"
          ? Object.keys(copyrightData)
          : "Not an object"
      );

      // Create the return object with appropriate field handling
      const result = {
        disclosureId: data.disclosure_id || data.disclosureId,
        workTitle:
          typeof copyrightData === "object"
            ? copyrightData.work_title || copyrightData.workTitle || ""
            : "",
        workDescription:
          typeof copyrightData === "object"
            ? copyrightData.work_description ||
              copyrightData.workDescription ||
              ""
            : "",
        creationDate:
          typeof copyrightData === "object"
            ? copyrightData.creation_date || copyrightData.creationDate || ""
            : "",
        copyrightId:
          typeof copyrightData === "object"
            ? copyrightData.copyright_id || copyrightData.copyrightId
            : undefined,
      };

      console.log("[extractCopyrightApplication] Extracted result:", result);
      return result;
    }

    // No copyright application found
    console.log("[extractCopyrightApplication] No copyright application found");
    return null;
  };

  const extractPatentUtilityApplication = (data: any) => {
    // Check for direct patentUtilityModelApplication
    if (data.patentUtilityModelApplication) {
      console.log(
        "[extractPatentUtilityApplication] Found direct patentUtilityModelApplication"
      );
      return data.patentUtilityModelApplication;
    }

    // Check for snake_case patent_utility_model_application data
    if (data.patent_utility_model_application) {
      console.log(
        "[extractPatentUtilityApplication] Found patent_utility_model_application data"
      );
      return {
        disclosureId: data.disclosure_id || data.disclosureId,
        title: data.patent_utility_model_application.title || "",
        type: data.patent_utility_model_application.type || "",
        technologyType:
          data.patent_utility_model_application.technology_type || {},
        technologyField:
          data.patent_utility_model_application.technology_field || {},
        problem: data.patent_utility_model_application.problem || "",
        solution: data.patent_utility_model_application.solution || "",
        comparison: data.patent_utility_model_application.comparison || "",
        novelty: data.patent_utility_model_application.novelty || "",
        variations: data.patent_utility_model_application.variations || "",
        usage: data.patent_utility_model_application.usage || "",
        references: data.patent_utility_model_application.references || "",
        ownPublications:
          data.patent_utility_model_application.own_publications || "",
        files: data.patent_utility_model_application.files || {},
      };
    }

    // No patent utility application found
    console.log(
      "[extractPatentUtilityApplication] No patent utility application found"
    );
    return null;
  };

  const extractTrademarkApplication = (data: any) => {
    // Check for direct trademarkApplication
    if (data.trademarkApplication) {
      console.log(
        "[extractTrademarkApplication] Found direct trademarkApplication"
      );
      return data.trademarkApplication;
    }

    // Check for snake_case trademark_application data
    if (data.trademark_application) {
      console.log(
        "[extractTrademarkApplication] Found trademark_application data"
      );
      return {
        disclosureId: data.disclosure_id || data.disclosureId,
        trademarkName: data.trademark_application.trademark_name || "",
        description: data.trademark_application.description || "",
        translation: data.trademark_application.translation || "",
        niceClassifications:
          data.trademark_application.nice_classifications || [],
        businessType: data.trademark_application.business_type || {},
        legalName: data.trademark_application.legal_name || "",
      };
    }

    // No trademark application found
    console.log("[extractTrademarkApplication] No trademark application found");
    return null;
  };

  const extractTradeSecretApplication = (data: any) => {
    // Check for direct tradeSecretApplication
    if (data.tradeSecretApplication) {
      console.log(
        "[extractTradeSecretApplication] Found direct tradeSecretApplication"
      );
      return data.tradeSecretApplication;
    }

    // Check for snake_case trade_secret_application data
    if (data.trade_secret_application) {
      console.log(
        "[extractTradeSecretApplication] Found trade_secret_application data"
      );
      return {
        disclosureId: data.disclosure_id || data.disclosureId,
        description: data.trade_secret_application.description || "",
        confidentialityMeasures:
          data.trade_secret_application.confidentiality_measures || "",
      };
    }

    // No trade secret application found
    console.log(
      "[extractTradeSecretApplication] No trade secret application found"
    );
    return null;
  };

  // Modify saveApplicantsInfo to accept applicants data directly and to use the proper API call approach
  const saveApplicantsInfo = async (
    applicantsData?: ApplicantsInfo,
    registerForm: boolean = false
  ) => {
    console.log(
      `Saving applicants information... (registerForm=${registerForm})`
    );

    try {
      // Get the latest user session
      const userSession = await getSession();

      if (!userSession || !userSession.user) {
        console.error("No user session available to save applicants info");
        return null;
      }

      const userId = userSession.user.id;

      if (!userId) {
        console.error("No user ID available to save applicants info");
        return null;
      }

      console.log("User ID for applicants info:", userId);

      // Get data to save - either from parameter or from store
      const dataToSave =
        applicantsData || useIpDisclosureStore.getState().applicantsInfo;

      if (!dataToSave) {
        console.error("No applicants information to save");
        return null;
      }

      // Log raw values coming in from the form to identify issues
      console.log("Raw applicants data IP types:", {
        ipTypes: dataToSave.ipTypes,
        ipTypesType: typeof dataToSave.ipTypes,
        ipTypesStringified: JSON.stringify(dataToSave.ipTypes),
      });

      // Extra validation: Ensure at least one IP type is selected if we have copyright/transaction data
      const hasSelectedIpTypes = Object.values(dataToSave.ipTypes || {}).some(
        (value) => value === true
      );
      const store = useIpDisclosureStore.getState();
      const hasCopyrightData =
        store.copyrightApplication ||
        store.transactionFormPart1 ||
        store.transactionFormPart2;

      if (!hasSelectedIpTypes && hasCopyrightData) {
        console.log(
          "No IP types selected but copyright data exists - setting copyright to true"
        );
        dataToSave.ipTypes = dataToSave.ipTypes || {};
        dataToSave.ipTypes.copyright = true;
      }

      // IMPORTANT: Force explicit boolean values for all IP types to fix the issue
      // Deep copy the ipTypes object to avoid mutation issues
      const ipTypesFormatted = {
        copyright: dataToSave.ipTypes?.copyright === true,
        patent: dataToSave.ipTypes?.patent === true,
        utilityModel: dataToSave.ipTypes?.utilityModel === true,
        industrialDesign: dataToSave.ipTypes?.industrialDesign === true,
        trademark: dataToSave.ipTypes?.trademark === true,
        tradeSecret: dataToSave.ipTypes?.tradeSecret === true,
        other: dataToSave.ipTypes?.other === true,
        notSure: dataToSave.ipTypes?.notSure === true,
      };

      // Log the forced formatting to verify transformation
      console.log("Explicitly formatted IP types:", {
        original: dataToSave.ipTypes,
        formatted: ipTypesFormatted,
        selectedTypes: Object.entries(ipTypesFormatted)
          .filter(([_, isSelected]) => isSelected)
          .map(([typeName]) => typeName),
      });

      // Update the data with the properly formatted IP types
      dataToSave.ipTypes = ipTypesFormatted;

      console.log("Applicants data ready to save:", {
        email: dataToSave.email,
        ipTypes: dataToSave.ipTypes,
        ipTypesFormatted: JSON.stringify(ipTypesFormatted),
        applicants: dataToSave.applicants.length,
        inventors: dataToSave.inventors.length,
      });

      // Get current disclosure ID from store
      const currentDisclosureId = useIpDisclosureStore.getState().disclosureId;
      console.log("Current disclosure ID:", currentDisclosureId);

      // Save the result to return after API calls
      let result = null;

      // If we have a disclosure ID, update the existing record
      if (currentDisclosureId) {
        console.log("Updating existing disclosure:", currentDisclosureId);

        try {
          // Verify if IP types are being correctly formatted before sending
          console.log("IP types being sent to server:", {
            formatted: ipTypesFormatted,
            ipTypesRawStringified: JSON.stringify(dataToSave.ipTypes),
            ipTypesFormattedStringified: JSON.stringify(ipTypesFormatted),
            hasTrue: Object.values(ipTypesFormatted).some((v) => v === true),
            trademark: ipTypesFormatted.trademark,
          });

          // Create the request body with proper formatting
          const requestBody = {
            selected_ip_types: ipTypesFormatted, // Add IP types at top level for API compatibility
            applicantsInfo: {
              ...dataToSave,
              ipTypes: ipTypesFormatted, // Ensure properly formatted IP types are used
            },
            registerForm: registerForm, // Add the registerForm flag
          };

          // Log the exact payload being sent to the server
          console.log(
            "API request body:",
            JSON.stringify(requestBody, null, 2),
            "Top-level selected_ip_types:",
            ipTypesFormatted,
            "registerForm:",
            registerForm
          );

          // Make a PUT request to update the disclosure
          console.log(
            `Making PUT request to /api/ip-disclosure/${currentDisclosureId}`
          );

          const response = await fetch(
            `/api/ip-disclosure/${currentDisclosureId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            }
          );

          // Enhanced error handling for fetch response
          if (!response.ok) {
            // Try to get detailed error message from response
            let errorDetails = "Unknown error";
            try {
              const errorText = await response.text();
              console.error(`API response (${response.status}):`, errorText);

              // Try to parse the error text as JSON if possible
              try {
                const errorJson = JSON.parse(errorText);
                errorDetails =
                  errorJson.details || errorJson.error || errorText;
              } catch {
                // If not JSON, use the raw text
                errorDetails = errorText;
              }
            } catch (parseError) {
              console.error("Error parsing error response:", parseError);
            }

            const errorMessage = `Failed to update disclosure: ${response.status} - ${errorDetails}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
          }

          // Parse successful response
          result = await response.json();
          console.log("Update result:", result);

          if (result.success) {
            console.log("Disclosure updated successfully");

            // Make sure the store has the latest data
            useIpDisclosureStore.getState().setApplicantsInfo(dataToSave);
          } else {
            console.error(
              "Update request succeeded but returned success: false"
            );
            return null;
          }
        } catch (updateError) {
          console.error("Error updating disclosure:", updateError);
          if (updateError instanceof Error) {
            console.error("Error message:", updateError.message);
            console.error("Error stack:", updateError.stack);
          }

          // Propagate the error to be handled by the caller
          throw updateError;
        }
      } else {
        console.log("Creating a new disclosure for user:", userId);

        try {
          // DEBUG: Log the exact data being passed to createIpDisclosureMutation
          console.log("Data for mutation:", {
            clientId: userId,
            selectedIpTypes: dataToSave.ipTypes,
            ipTypesJSON: JSON.stringify(dataToSave.ipTypes),
            email: dataToSave.email,
            isRightfulOwner: dataToSave.isRightfulOwner,
            authorizedRepresentative: dataToSave.authorizedRepresentative || "",
            otherIpType: dataToSave.otherIpType || "",
            applicantsCount: dataToSave.applicants?.length,
            inventorsCount: dataToSave.inventors?.length,
          });

          // Use the createIpDisclosureMutation to create a new record
          const result = await createIpDisclosureMutation.mutateAsync({
            clientId: userId,
            selectedIpTypes: dataToSave.ipTypes,
            email: dataToSave.email,
            isRightfulOwner: dataToSave.isRightfulOwner,
            authorizedRepresentative: dataToSave.authorizedRepresentative || "",
            otherIpType: dataToSave.otherIpType || "",
            applicants: dataToSave.applicants,
            inventors: dataToSave.inventors,
          });

          console.log("Create result:", result);

          if (result && result.disclosureId) {
            console.log("New disclosure created with ID:", result.disclosureId);

            // Set the disclosure ID in the store - convert to string to fix the type error
            const disclosureIdString = String(result.disclosureId);
            useIpDisclosureStore.getState().setDisclosureId(disclosureIdString);

            // Ensure applicants info is also set in store
            useIpDisclosureStore.getState().setApplicantsInfo(dataToSave);

            return {
              success: true,
              disclosureId: disclosureIdString,
            };
          } else {
            throw new Error("Failed to create disclosure: No ID returned");
          }
        } catch (createError) {
          console.error("Error creating disclosure:", createError);
          toast({
            title: "Error",
            description: `Failed to create: ${
              createError instanceof Error
                ? createError.message
                : "Unknown error"
            }`,
            variant: "destructive",
          });
          return null;
        }
      }

      // If registerForm is true, register in form_submission_registry
      if (registerForm) {
        // Get the current disclosure ID either from the result or from the store
        const disclosureIdToUse =
          result?.disclosureId ||
          currentDisclosureId ||
          useIpDisclosureStore.getState().disclosureId;

        if (disclosureIdToUse) {
          console.log(
            "Creating form registry entry for disclosure:",
            disclosureIdToUse
          );

          try {
            // Get application ID
            const applicationId =
              useIpDisclosureStore.getState().applicationId ||
              (result && result.applicationId ? result.applicationId : null);

            // The form_registry API now requires an application ID
            // If no application ID exists yet, create a temporary one that will be updated later
            const tempApplicationId = applicationId || uuidv4();

            if (!applicationId) {
              console.log(
                "No application ID available, using temporary ID:",
                tempApplicationId
              );
            }

            // Prepare title using IP types
            const getTitle = () => {
              const types = [];

              if (ipTypesFormatted.copyright) types.push("Copyright");
              if (ipTypesFormatted.patent) types.push("Patent");
              if (ipTypesFormatted.utilityModel) types.push("Utility Model");
              if (ipTypesFormatted.trademark) types.push("Trademark");
              if (ipTypesFormatted.tradeSecret) types.push("Trade Secret");

              return types.length > 0
                ? `IP Disclosure - ${types.join(", ")}`
                : "IP Disclosure Form";
            };

            // Create registry entry via form-registry API
            const registryResponse = await fetch("/api/form-registry", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sourceType: "ip_disclosure",
                sourceId: disclosureIdToUse,
                ipApplicationId: tempApplicationId,
                status: "draft",
                title: getTitle(),
                description: "IP Disclosure Form - Applicants Information",
              }),
            });

            if (!registryResponse.ok) {
              console.error(
                "Error creating registry entry:",
                await registryResponse.text()
              );
            } else {
              const registryResult = await registryResponse.json();
              console.log("Registry entry created/updated:", registryResult);
            }
          } catch (registryError) {
            console.error("Error registering form:", registryError);
            // Continue execution, don't fail the entire operation
          }
        } else {
          console.error(
            "Cannot create registry - missing disclosure ID. This should not happen."
          );
        }
      } else {
        console.log("Skipping registry creation as registerForm=false");
      }

      return result;
    } catch (error) {
      console.error("Error in saveApplicantsInfo:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return null;
    }
  };

  // Function to save trade secret application
  const saveTradeSecretApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    // Get the latest state from the store
    const {
      tradeSecretApplication: currentTradeSecretApp,
      disclosureId: currentDisclosureId,
    } = useIpDisclosureStore.getState();

    if (!currentTradeSecretApp) {
      console.error("No trade secret application to save");
      return false;
    }

    if (!currentDisclosureId) {
      console.error("No disclosure ID for saving trade secret application");
      return false;
    }

    try {
      console.log(
        `Saving trade secret application (registerForm=${registerForm}):`,
        {
          disclosureId: currentDisclosureId,
          description:
            currentTradeSecretApp.description?.substring(0, 50) + "...",
          confidentialityMeasures:
            currentTradeSecretApp.confidentialityMeasures?.substring(0, 50) +
            "...",
        }
      );

      // Explicitly create the input object to ensure all fields are properly passed
      const tradeSecretInput = {
        disclosureId: currentDisclosureId,
        description: currentTradeSecretApp.description || "",
        confidentialityMeasures:
          currentTradeSecretApp.confidentialityMeasures || "",
        registerForm: registerForm, // Add the registerForm parameter
      };

      console.log(
        "Sending trade secret data to server:",
        JSON.stringify(tradeSecretInput, null, 2)
      );

      const result = await saveTradeSecretMutation.mutateAsync(
        tradeSecretInput
      );
      return result.success;
    } catch (error) {
      console.error("Error saving trade secret application:", error);
      return false;
    }
  };

  // Function to save trademark application
  const saveTrademarkApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    // Get the latest state from the store
    const {
      trademarkApplication: currentTrademarkApp,
      disclosureId: currentDisclosureId,
    } = useIpDisclosureStore.getState();

    console.log(
      `saveTrademarkApplication called with registerForm=${registerForm}:`,
      {
        trademarkApplication: currentTrademarkApp ? "exists" : "null",
        disclosureId: currentDisclosureId,
      }
    );

    if (!currentTrademarkApp) {
      console.error("No trademark application to save");
      return false;
    }

    if (!currentDisclosureId) {
      console.error("No disclosure ID for saving trademark application");
      return false;
    }

    try {
      console.log(
        `Saving trademark application (registerForm=${registerForm}):`,
        {
          disclosureId: currentDisclosureId,
          trademarkName: currentTrademarkApp.trademarkName,
          description:
            currentTrademarkApp.description?.substring(0, 50) + "...",
          niceClassifications: currentTrademarkApp.niceClassifications,
          businessType: currentTrademarkApp.businessType,
          legalName: currentTrademarkApp.legalName,
        }
      );

      // Ensure niceClassifications is an array
      const niceClassifications = Array.isArray(
        currentTrademarkApp.niceClassifications
      )
        ? currentTrademarkApp.niceClassifications
        : [];

      // Ensure businessType is a valid JSON object
      const businessType = currentTrademarkApp.businessType || {
        company: false,
        soleProprietor: false,
      };

      // Explicitly create the input object to ensure all fields are properly passed
      const trademarkInput = {
        disclosureId: currentDisclosureId,
        trademarkName: currentTrademarkApp.trademarkName || "",
        description: currentTrademarkApp.description || "",
        translation: currentTrademarkApp.translation || "",
        niceClassifications: niceClassifications,
        businessType: businessType,
        legalName: currentTrademarkApp.legalName || "",
        registerForm: registerForm, // Add the registerForm parameter
      };

      // Check if we need to denormalize the data (convert from camelCase to snake_case)
      // This is needed if the server expects snake_case field names
      const denormalizedInput = {
        ...trademarkInput,
        // Add any additional transformations if needed for the server
      };

      console.log(
        "Sending trademark data to server:",
        JSON.stringify(denormalizedInput, null, 2)
      );

      const result = await saveTrademarkMutation.mutateAsync(denormalizedInput);
      console.log("Trademark save result:", result);
      return result.success;
    } catch (error) {
      console.error("Error saving trademark application:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return false;
    }
  };

  // Function to save disclosure confirmation
  const saveDisclosureConfirmation = async (confirmationData?: any) => {
    try {
      // Get the latest state from the store
      const {
        disclosureConfirmation: currentConfirmation,
        disclosureId: currentDisclosureId,
        applicantsInfo: currentApplicantsInfo,
      } = useIpDisclosureStore.getState();

      if (!confirmationData && !currentConfirmation) {
        console.error("No disclosure confirmation to save");
        return false;
      }

      // Use provided data or fall back to store data
      const dataToSave = confirmationData || currentConfirmation;

      // If no disclosure ID exists, try to save applicants info first
      if (!currentDisclosureId) {
        console.log(
          "No disclosure ID found, attempting to save applicants info first"
        );

        if (!currentApplicantsInfo) {
          console.error("No applicants information available");
          return false;
        }

        // Save applicants info to create a disclosure record
        const applicantsInfoSaved = await saveApplicantsInfo();
        if (!applicantsInfoSaved) {
          console.error("Failed to save applicants information");
          return false;
        }

        console.log("Applicants information saved successfully");
      }

      // Get the updated disclosure ID after potentially saving applicants info
      const { disclosureId: updatedDisclosureId } =
        useIpDisclosureStore.getState();
      if (!updatedDisclosureId) {
        console.error(
          "No disclosure ID available after saving applicants info"
        );
        return false;
      }

      console.log("Using disclosure ID for confirmation:", updatedDisclosureId);

      // Now save the disclosure confirmation
      console.log("Saving disclosure confirmation:", {
        disclosureId: updatedDisclosureId,
        writtenDisclosures: dataToSave.writtenDisclosures,
        oralDisclosures: dataToSave.oralDisclosures,
        confirmationDeclaration: dataToSave.confirmationDeclaration,
        futureWork: dataToSave.futureWork,
      });

      // Ensure the data is properly formatted
      const confirmationInput = {
        disclosureId: updatedDisclosureId,
        writtenDisclosures: {
          past: dataToSave.writtenDisclosures?.past || false,
          planned: dataToSave.writtenDisclosures?.planned || false,
          notApplicable: dataToSave.writtenDisclosures?.notApplicable || false,
        },
        oralDisclosures: {
          past: dataToSave.oralDisclosures?.past || false,
          planned: dataToSave.oralDisclosures?.planned || false,
          notApplicable: dataToSave.oralDisclosures?.notApplicable || false,
        },
        confirmationDeclaration: dataToSave.confirmationDeclaration || false,
        futureWork: dataToSave.futureWork || "",
      };

      console.log(
        "Sending confirmation data to server:",
        JSON.stringify(confirmationInput, null, 2)
      );

      try {
        const result = await saveDisclosureConfirmationMutation.mutateAsync(
          confirmationInput
        );
        console.log("Save disclosure confirmation result:", result);
        return result.success;
      } catch (mutationError) {
        console.error(
          "Error in saveDisclosureConfirmationMutation:",
          mutationError
        );
        if (mutationError instanceof Error) {
          console.error(
            "Error details:",
            mutationError.message,
            mutationError.stack
          );
        }
        return false;
      }
    } catch (error) {
      console.error("Error saving disclosure confirmation:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return false;
    }
  };

  // Function to submit the entire IP disclosure
  const submitIpDisclosure = async () => {
    // Get the latest state from the store
    const { disclosureId: currentDisclosureId } =
      useIpDisclosureStore.getState();

    if (!currentDisclosureId) {
      console.error("No disclosure ID for submission");
      return false;
    }

    try {
      console.log(
        "Starting IP disclosure submission process for ID:",
        currentDisclosureId
      );

      // Now submit the IP disclosure
      console.log("Submitting IP disclosure with ID:", currentDisclosureId);
      try {
        const result = await submitIpDisclosureMutation.mutateAsync({
          disclosureId: currentDisclosureId,
        });

        console.log(
          "IP disclosure submitted successfully with result:",
          result
        );
        return result.success;
      } catch (submitError) {
        console.error("Error submitting IP disclosure:", submitError);
        if (submitError instanceof Error) {
          console.error(
            "Error details:",
            submitError.message,
            submitError.stack
          );
        }
        return false;
      }
    } catch (error) {
      console.error("Error in submitIpDisclosure function:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return false;
    }
  };

  // Function to create a default trademark application if one doesn't exist
  const createDefaultTrademarkApplication = async () => {
    if (!disclosureId || !applicantsInfo) {
      console.error(
        "No disclosure ID or applicants info for default trademark"
      );
      return false;
    }

    try {
      console.log(
        "Creating default trademark application for disclosure ID:",
        disclosureId
      );

      // Create a complete default trademark object with all required fields
      const defaultTrademarkData = {
        disclosureId,
        trademarkName: "Default Trademark Name",
        description: "Default trademark description created during submission",
        translation: "",
        niceClassifications: ["Class 9"],
        businessType: { company: true, soleProprietor: false },
        legalName:
          applicantsInfo.applicants[0]?.firstName +
            " " +
            applicantsInfo.applicants[0]?.lastName || "Default Legal Name",
      };

      console.log("Default trademark data:", defaultTrademarkData);

      // First, update the store with the default data
      setTrademarkApplication(defaultTrademarkData);

      // Then, explicitly save to the database using a direct mutation call
      try {
        const result = await saveTrademarkMutation.mutateAsync(
          defaultTrademarkData
        );
        console.log(
          "Default trademark application created with result:",
          result
        );

        // Verify the result contains a trademarkId
        if (result && result.trademarkId) {
          console.log(
            "Default trademark created successfully with ID:",
            result.trademarkId
          );
          return true;
        } else {
          console.error(
            "Default trademark creation returned success but no trademarkId"
          );
          return false;
        }
      } catch (mutationError) {
        console.error(
          "Mutation error creating default trademark application:",
          mutationError
        );
        if (mutationError instanceof Error) {
          console.error(
            "Mutation error details:",
            mutationError.message,
            mutationError.stack
          );
        }
        return false;
      }
    } catch (error) {
      console.error("Error creating default trademark application:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return false;
    }
  };

  // Function to save copyright application
  const saveCopyrightApplication = async () => {
    // Get the latest state from the store
    const {
      copyrightApplication: currentCopyrightApp,
      transactionFormPart1: currentTransactionPart1,
      transactionFormPart2: currentTransactionPart2,
      disclosureId: currentDisclosureId,
    } = useIpDisclosureStore.getState();

    if (!currentDisclosureId) {
      console.error("No disclosure ID for saving copyright application");
      return false;
    }

    try {
      console.log(
        "[saveCopyrightApplication] Saving copyright application for disclosure ID:",
        currentDisclosureId,
        "Current data structure:",
        {
          hasCopyrightApp: !!currentCopyrightApp,
          copyrightId: currentCopyrightApp?.copyrightId,
          hasTransactionPart1: !!currentTransactionPart1,
          hasTransactionPart2: !!currentTransactionPart2,
        }
      );

      // Define type for sanitized copyright app to include copyrightId
      type SanitizedCopyrightApp = {
        workTitle: string;
        workDescription: string;
        creationDate: string;
        category: string;
        publicationStatus: string;
        copyrightId?: string;
      };

      // Sanitize the copyright application data before sending to server
      const sanitizedCopyrightApp = currentCopyrightApp
        ? ({
            workTitle:
              currentCopyrightApp.workTitle?.replace(/[^\x20-\x7E]/g, "") ||
              "Untitled Work",
            workDescription:
              currentCopyrightApp.workDescription?.replace(
                /[^\x20-\x7E]/g,
                ""
              ) || "No description provided",
            creationDate:
              currentCopyrightApp.creationDate?.replace(
                /[^\x20-\x7E0-9\-]/g,
                ""
              ) || new Date().toISOString().split("T")[0],
            category: currentCopyrightApp.category || "Literary Work",
            publicationStatus:
              currentCopyrightApp.publicationStatus || "unpublished",
            // Only include these minimal fields needed for the basic copyright application
            copyrightId: currentCopyrightApp.copyrightId,
          } as SanitizedCopyrightApp)
        : null;

      // Deep copy the transaction form data to prevent mutation issues
      let processedTransactionPart1 = null;
      if (currentTransactionPart1) {
        try {
          // Deep copy the object using JSON serialization
          processedTransactionPart1 = JSON.parse(
            JSON.stringify(currentTransactionPart1)
          );

          // Ensure coAuthors is properly formatted as an array
          if (processedTransactionPart1.transaction_data) {
            if (!processedTransactionPart1.transaction_data.coAuthors) {
              processedTransactionPart1.transaction_data.coAuthors = [];
            } else if (
              !Array.isArray(
                processedTransactionPart1.transaction_data.coAuthors
              )
            ) {
              // Convert to array if it's a single object
              processedTransactionPart1.transaction_data.coAuthors = [
                processedTransactionPart1.transaction_data.coAuthors,
              ];
            }
          }

          console.log(
            "[saveCopyrightApplication] Processed transaction part 1:",
            {
              hasTransactionData: !!processedTransactionPart1.transaction_data,
              coAuthorsCount:
                processedTransactionPart1.transaction_data?.coAuthors?.length ||
                0,
            }
          );
        } catch (parseError) {
          console.error(
            "[saveCopyrightApplication] Error serializing transaction part 1:",
            parseError
          );
          console.log(
            "[saveCopyrightApplication] Original transaction part 1 data:",
            currentTransactionPart1
          );
          // Use original data as fallback but still ensure it's usable
          processedTransactionPart1 = { ...currentTransactionPart1 };
        }
      }

      // Define a type for transactionPart2 to fix linter error
      type TransactionPart2 = {
        transaction_details?: {
          transactionType?: {
            copyrightRegistration: boolean;
            anonymousWork: boolean;
            correctionEntry: boolean;
            resaleRights: boolean;
            certifiedCopy: boolean;
            recordation: boolean;
            reconstitution: boolean;
          };
          submissionType?: {
            filingMethod?: {
              electronicFiling: boolean;
              throughIPSO: boolean;
            };
            filingType?: {
              singleFiling: boolean;
              bulkFiling: boolean;
            };
          };
        };
        copyrightId?: string;
        [key: string]: any; // Allow additional properties
      };

      // Process transaction part 2 similarly
      let processedTransactionPart2: TransactionPart2 | null = null;
      let shouldUpdateStore = false;
      let storeUpdates: { [key: string]: any } = {};

      if (currentTransactionPart2) {
        try {
          processedTransactionPart2 = JSON.parse(
            JSON.stringify(currentTransactionPart2)
          ) as TransactionPart2;

          // Check if transaction_details and transactionType exist
          if (processedTransactionPart2?.transaction_details?.transactionType) {
            // Check if any transaction type is selected
            const transactionType =
              processedTransactionPart2.transaction_details.transactionType;
            const hasAnyTransactionTypeSelected = Object.values(
              transactionType
            ).some((value) => value === true);

            // If no transaction type is selected, automatically set copyrightRegistration to true
            if (!hasAnyTransactionTypeSelected && sanitizedCopyrightApp) {
              console.log(
                "[saveCopyrightApplication] No transaction type selected, automatically setting copyrightRegistration to true"
              );
              processedTransactionPart2.transaction_details.transactionType.copyrightRegistration =
                true;

              // Instead of updating the store immediately, mark it for update later
              shouldUpdateStore = true;
            }
          } else if (sanitizedCopyrightApp) {
            // If transaction_details or transactionType doesn't exist, create it
            console.log(
              "[saveCopyrightApplication] Creating transaction_details with default copyrightRegistration=true"
            );
            processedTransactionPart2 = processedTransactionPart2 || {};
            processedTransactionPart2.transaction_details =
              processedTransactionPart2.transaction_details || {};
            processedTransactionPart2.transaction_details.transactionType = {
              copyrightRegistration: true,
              anonymousWork: false,
              correctionEntry: false,
              resaleRights: false,
              certifiedCopy: false,
              recordation: false,
              reconstitution: false,
            };

            // Instead of updating the store immediately, mark it for update later
            shouldUpdateStore = true;
          }

          console.log(
            "[saveCopyrightApplication] Processed transaction part 2 keys:",
            processedTransactionPart2
              ? Object.keys(processedTransactionPart2)
              : "null"
          );
        } catch (parseError) {
          console.error(
            "[saveCopyrightApplication] Error serializing transaction part 2:",
            parseError
          );
          processedTransactionPart2 = {
            ...currentTransactionPart2,
          } as TransactionPart2;
        }
      } else if (sanitizedCopyrightApp) {
        // If transaction part 2 doesn't exist but we have copyright app data,
        // create a minimal transaction part 2 with copyrightRegistration=true
        console.log(
          "[saveCopyrightApplication] Creating minimal transaction part 2 with copyrightRegistration=true"
        );
        processedTransactionPart2 = {
          transaction_details: {
            transactionType: {
              copyrightRegistration: true,
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
          },
        };

        // Instead of updating the store immediately, mark it for update later
        shouldUpdateStore = true;
      }

      // Prepare updates for store - only called once to prevent infinite loops
      if (shouldUpdateStore) {
        storeUpdates = {
          transactionFormPart2: processedTransactionPart2,
        };
      }

      // Explicitly create the input object to ensure all fields are properly passed
      const copyrightInput = {
        disclosureId: currentDisclosureId,
        copyrightApplication: sanitizedCopyrightApp,
        transactionFormPart1: processedTransactionPart1,
        transactionFormPart2: processedTransactionPart2,
      };

      console.log(
        "[saveCopyrightApplication] Sending sanitized copyright data to server:",
        {
          disclosureId: copyrightInput.disclosureId,
          workTitle: sanitizedCopyrightApp?.workTitle,
          workDescription:
            sanitizedCopyrightApp?.workDescription?.substring(0, 50) +
            (sanitizedCopyrightApp?.workDescription?.length > 50 ? "..." : ""),
          creationDate: sanitizedCopyrightApp?.creationDate,
          copyrightId: sanitizedCopyrightApp?.copyrightId || "new record",
        }
      );

      // Call the mutation to save to the database
      const result = await saveCopyrightMutation.mutateAsync(copyrightInput);
      console.log("[saveCopyrightApplication] Server response:", result);

      // If the operation was successful, update the store with any pending changes
      // and the newly received copyright ID
      if (result.success) {
        // Prepare the final store update
        const storeUpdate = { ...storeUpdates };

        if (result.copyrightId) {
          console.log(
            `[saveCopyrightApplication] Update succeeded with copyright ID: ${result.copyrightId}`
          );

          // Update copyright application with the ID if needed
          if (sanitizedCopyrightApp) {
            storeUpdate.copyrightApplication = {
              ...currentCopyrightApp,
              copyrightId: result.copyrightId,
            };
          }

          // Update transaction forms with the copyright ID if they exist
          if (processedTransactionPart1) {
            storeUpdate.transactionFormPart1 = {
              ...processedTransactionPart1,
              copyrightId: result.copyrightId,
            };
          }

          if (processedTransactionPart2) {
            storeUpdate.transactionFormPart2 = {
              ...processedTransactionPart2,
              copyrightId: result.copyrightId,
            };
          }
        }

        // Now update the store once with all changes
        if (Object.keys(storeUpdate).length > 0) {
          useIpDisclosureStore.setState((state) => ({
            ...state,
            ...storeUpdate,
          }));
        }
      }

      return result.success;
    } catch (error) {
      console.error(
        "[saveCopyrightApplication] Error saving copyright application:",
        error
      );
      if (error instanceof Error) {
        console.error(
          "[saveCopyrightApplication] Error details:",
          error.message,
          error.stack
        );
      }

      // Log information about the attempted save to help debugging
      console.error("[saveCopyrightApplication] Failed with data:", {
        disclosureId: currentDisclosureId,
        hasCopyrightApp: !!currentCopyrightApp,
        hasTransactionPart1: !!currentTransactionPart1,
        hasTransactionPart2: !!currentTransactionPart2,
      });

      return false;
    }
  };

  // Function to save patent/utility model application
  const savePatentUtilityModelApplication = async (
    data?: any,
    registerForm: boolean = false
  ) => {
    const currentDisclosureId = useIpDisclosureStore.getState().disclosureId;
    const currentPatentApp =
      useIpDisclosureStore.getState().patentUtilityModelApplication;

    if (!currentPatentApp) {
      console.error("No patent/utility model application data to save");
      return false;
    }

    if (!currentDisclosureId) {
      console.error(
        "No disclosure ID for saving patent/utility model application"
      );
      return false;
    }

    try {
      console.log(
        `Saving patent/utility model application for disclosure ID: ${currentDisclosureId} (registerForm=${registerForm})`
      );

      // Log the current patent application data
      console.log("Current patent application data:", {
        title: currentPatentApp.title,
        description: currentPatentApp.description,
        additionalData: currentPatentApp.additionalData
          ? Object.keys(currentPatentApp.additionalData)
          : "No additionalData",
      });

      // Check if searchReport data exists and log it
      if (currentPatentApp.additionalData?.searchReport) {
        console.log("Search report data exists in additionalData");
        const searchReport = currentPatentApp.additionalData.searchReport;
        console.log("Search report fields:", Object.keys(searchReport));
        console.log("Search report title:", searchReport.title);
        console.log("Search report date:", searchReport.dateCompleted);
        console.log(
          "Search strings count:",
          searchReport.searchStrings?.length || 0
        );
        console.log("Documents count:", searchReport.documents?.length || 0);
      } else {
        console.log("No search report data in additionalData");
      }

      // Check if matrixSample data exists and log it
      if (currentPatentApp.additionalData?.matrixSample) {
        console.log("Matrix sample data exists in additionalData");
        const matrixSample = currentPatentApp.additionalData.matrixSample;
        console.log("Matrix sample fields:", Object.keys(matrixSample));
      } else {
        console.log("No matrix sample data in additionalData");
      }

      // Explicitly create the input object to ensure all fields are properly passed
      const patentInput = {
        disclosureId: currentDisclosureId,
        title: currentPatentApp.title || "Untitled Patent",
        description: currentPatentApp.description || "",
        additionalData:
          typeof currentPatentApp.additionalData === "object"
            ? currentPatentApp.additionalData
            : {},
        registerForm: registerForm, // Add registerForm parameter
      };

      console.log("Sending patent/utility model data to server");
      console.log(
        "Patent input structure:",
        JSON.stringify({
          disclosureId: patentInput.disclosureId,
          title: patentInput.title,
          description: patentInput.description,
          registerForm: patentInput.registerForm,
          additionalData:
            typeof patentInput.additionalData === "object"
              ? Object.keys(patentInput.additionalData)
              : "Invalid additionalData format",
        })
      );

      try {
        const result = await savePatentUtilityModelMutation.mutateAsync(
          patentInput
        );

        console.log("Patent/utility model save result:", result);

        // Update the store with the patent ID if it's available
        if (result.patentId && currentPatentApp) {
          console.log(`Updating store with patent ID: ${result.patentId}`);
          useIpDisclosureStore.setState((state) => ({
            ...state,
            patentUtilityModelApplication: {
              ...state.patentUtilityModelApplication,
              patent_id: result.patentId,
            },
          }));
        }

        // Return both success status and patentId
        return {
          success: result.success,
          patentId: result.patentId,
        };
      } catch (mutationError) {
        console.error("Mutation error:", mutationError);
        if (mutationError instanceof Error) {
          console.error(
            "Error details:",
            mutationError.message,
            mutationError.stack
          );
        }
        throw mutationError;
      }
    } catch (error) {
      console.error("Error saving patent/utility model application:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return { success: false };
    }
  };

  // Helper function to parse database JSON into application format
  const parseDatabaseData = (databaseJson: string): any => {
    try {
      console.log("Parsing database JSON data");

      // Parse the JSON string from the database
      let dbData: any;
      try {
        if (typeof databaseJson === "string") {
          dbData = JSON.parse(databaseJson);
          console.log("Successfully parsed database JSON string");
        } else {
          dbData = databaseJson;
          console.log("Database data is already an object, no parsing needed");
        }
        console.log("Database data structure:", Object.keys(dbData).join(", "));
      } catch (parseError) {
        console.error("Error parsing database JSON:", parseError);
        return null;
      }

      // For copyright_transaction_part1, directly check if it's a string that needs parsing
      let copyrightTransactionPart1 =
        dbData.copyright_transaction_part1 || dbData.transactionFormPart1;
      if (copyrightTransactionPart1) {
        console.log("Found copyright transaction part 1 data");
      }

      return dbData;
    } catch (error) {
      console.error("Error parsing database JSON:", error);
      return null;
    }
  };

  // Function to create a combined function for checking existing disclosure and fetching data
  const checkExistingDisclosureAndFetch = async () => {
    // Control verbosity of logging
    const DEBUG = false;

    // Set loading state
    setIsLoading(true);

    // Get the current application ID
    const currentAppId = useIpDisclosureStore.getState().applicationId;

    if (!currentAppId) {
      console.warn(
        "[checkExistingDisclosureAndFetch] No application ID in store, aborting"
      );
      setIsLoading(false);
      return null;
    }

    // Add a circuit breaker to prevent excessive calls
    const now = Date.now();
    const lastCallKey = "lastCheckExistingDisclosureAndFetch";
    const lastAppIdKey = "lastCheckExistingDisclosureAppId";
    const lastCallTime = parseInt(
      sessionStorage.getItem(lastCallKey) || "0",
      10
    );
    const lastAppId = sessionStorage.getItem(lastAppIdKey);
    const timeSinceLastCall = now - lastCallTime;

    // Get the no-record flag to check if we already determined there's no record
    const noRecordAppIds = JSON.parse(
      sessionStorage.getItem("ipDisclosureNoRecordAppIds") || "[]"
    );

    // Allow bypassing throttle in these cases:
    // 1. Application switching context is active
    // 2. Current application ID is different from the last one checked
    // 3. Not in the known "no record" list of app IDs (to prevent useless retries)
    const isAppSwitchContext =
      sessionStorage.getItem("ipDisclosureAppSwitching") === "true";
    const isDifferentApp = currentAppId !== lastAppId;
    const isKnownNoRecord = noRecordAppIds.includes(currentAppId);

    // Skip throttling if app switching or different app ID
    const shouldBypassThrottle = isAppSwitchContext || isDifferentApp;

    // If this app ID is already known to have no record and it's a repeat call within throttle time, block it
    if (isKnownNoRecord && timeSinceLastCall < 2000 && !isAppSwitchContext) {
      if (DEBUG) {
        console.log(
          `[checkExistingDisclosureAndFetch] Skipping known no-record app ID: ${currentAppId}`
        );
      }
      setIsLoading(false);
      return null;
    }

    // Apply throttle only for same app ID and when not in switching context
    if (timeSinceLastCall < 300 && !shouldBypassThrottle) {
      if (DEBUG) {
        console.warn(
          `Throttling checkExistingDisclosureAndFetch - too many calls (${timeSinceLastCall}ms since last call)`
        );
      }
      setIsLoading(false);
      return null;
    }

    // Update the last call timestamp and app ID
    sessionStorage.setItem(lastCallKey, now.toString());
    sessionStorage.setItem(lastAppIdKey, currentAppId);

    // Clear the app switching flag if it was set
    if (isAppSwitchContext) {
      sessionStorage.removeItem("ipDisclosureAppSwitching");
      if (DEBUG) {
        console.log(
          "Application switching context detected - bypassing throttle"
        );
      }
    }

    // Set a timeout for the entire operation
    const timeoutPromise = new Promise<null>((resolve) => {
      const timeoutId = setTimeout(() => {
        if (DEBUG) {
          console.warn("checkExistingDisclosureAndFetch operation timed out");
        }
        setIsLoading(false);
        resolve(null);
      }, 12000); // 12 second timeout

      // Store timeout ID for cleanup
      if (!window._ipDisclosureTimeouts) window._ipDisclosureTimeouts = [];
      window._ipDisclosureTimeouts.push(timeoutId);
    });

    try {
      if (DEBUG) {
        console.log(
          "[checkExistingDisclosureAndFetch] Checking for existing disclosure..."
        );
      }

      // Get existing disclosure ID with timeout
      const disclosurePromise = checkExistingDisclosure();
      const disclosureIdResult = await Promise.race([
        disclosurePromise,
        timeoutPromise,
      ]);

      if (!disclosureIdResult) {
        if (DEBUG) {
          console.log(
            `[checkExistingDisclosureAndFetch] No disclosure found for app ID: ${currentAppId}`
          );
        }

        // Mark this application ID as having no record
        if (!noRecordAppIds.includes(currentAppId)) {
          noRecordAppIds.push(currentAppId);
          sessionStorage.setItem(
            "ipDisclosureNoRecordAppIds",
            JSON.stringify(noRecordAppIds)
          );
        }

        setIsLoading(false);
        return null;
      }

      // If we found an existing disclosure, continue with normal processing...
      // Rest of the function remains unchanged

      if (DEBUG) {
        console.log(
          "[checkExistingDisclosureAndFetch] Existing disclosure check result:",
          disclosureIdResult
        );
      }

      // If we found an existing disclosure, set it in the store and fetch data
      if (disclosureIdResult) {
        if (DEBUG) {
          console.log(
            "[checkExistingDisclosureAndFetch] Found existing disclosure ID:",
            disclosureIdResult
          );
        }

        // Get current disclosure ID from store to avoid redundant updates
        const currentDisclosureId =
          useIpDisclosureStore.getState().disclosureId;
        if (currentDisclosureId !== disclosureIdResult) {
          // Only set disclosure ID if it's different from what's already in the store
          setDisclosureId(disclosureIdResult);
        }

        // Fetch data for this disclosure with timeout
        const fetchPromise = fetchDisclosureData();
        const data = await Promise.race([fetchPromise, timeoutPromise]);

        if (!data) {
          console.warn(
            "[checkExistingDisclosureAndFetch] Data fetch timed out"
          );
          setIsLoading(false);
          return null;
        }

        if (DEBUG) {
          console.log(
            "[checkExistingDisclosureAndFetch] Fetched data for disclosure:",
            data
          );
        }

        // Verify that the data belongs to the current application
        if (data && data.applicationId && data.applicationId !== currentAppId) {
          console.warn(
            `[checkExistingDisclosureAndFetch] Data belongs to application ${data.applicationId}, not current application ${currentAppId}. Ignoring.`
          );
          setIsLoading(false);
          return null;
        }

        // Process the data if needed
        if (data && data.applicationId) {
          console.log(
            "[checkExistingDisclosureAndFetch] Setting application ID:",
            data.applicationId
          );
          // Only update if different to avoid unnecessary state updates
          const storeAppId = useIpDisclosureStore.getState().applicationId;
          if (storeAppId !== data.applicationId) {
            useIpDisclosureStore
              .getState()
              .setApplicationId(data.applicationId);
          }
        }

        // After successfully validating the data
        // Process the data to ensure consistent structure
        const stateUpdates: any = {};

        if (data.applicantsInfo) {
          stateUpdates.applicantsInfo = data.applicantsInfo;
        }

        if (data.copyrightApplication) {
          stateUpdates.copyrightApplication = data.copyrightApplication;
        }

        if (data.transactionFormPart1) {
          stateUpdates.transactionFormPart1 = data.transactionFormPart1;
        }

        if (data.transactionFormPart2) {
          stateUpdates.transactionFormPart2 = data.transactionFormPart2;
        }

        if (data.patentUtilityModelApplication) {
          stateUpdates.patentUtilityModelApplication =
            data.patentUtilityModelApplication;
        }

        if (data.trademarkApplication) {
          stateUpdates.trademarkApplication = data.trademarkApplication;
        }

        if (data.tradeSecretApplication) {
          stateUpdates.tradeSecretApplication = data.tradeSecretApplication;
        }

        if (data.disclosureConfirmation) {
          stateUpdates.disclosureConfirmation = data.disclosureConfirmation;
        }

        // Apply state updates in batch if needed
        const store = useIpDisclosureStore.getState();
        if (Object.keys(stateUpdates).length > 0) {
          // Set each property individually to ensure proper updates
          if (stateUpdates.applicantsInfo)
            store.setApplicantsInfo(stateUpdates.applicantsInfo);
          if (stateUpdates.copyrightApplication)
            store.setCopyrightApplication(stateUpdates.copyrightApplication);
          if (stateUpdates.transactionFormPart1)
            store.setTransactionFormPart1(stateUpdates.transactionFormPart1);
          if (stateUpdates.transactionFormPart2)
            store.setTransactionFormPart2(stateUpdates.transactionFormPart2);
          if (stateUpdates.patentUtilityModelApplication)
            store.setPatentUtilityModelApplication(
              stateUpdates.patentUtilityModelApplication
            );
          if (stateUpdates.trademarkApplication)
            store.setTrademarkApplication(stateUpdates.trademarkApplication);
          if (stateUpdates.tradeSecretApplication)
            store.setTradeSecretApplication(
              stateUpdates.tradeSecretApplication
            );
          if (stateUpdates.disclosureConfirmation)
            store.setDisclosureConfirmation(
              stateUpdates.disclosureConfirmation
            );
        }

        // Mark that we've loaded data
        if (!store.initialDataFetched) {
          store.setInitialDataFetched(true);
        }

        // Always mark fetch as attempted
        store.setFetchAttempted(true);

        if (DEBUG) {
          console.log(
            "[checkExistingDisclosureAndFetch] Successfully loaded data from existing disclosure"
          );
        }

        // Set loading state to false
        setIsLoading(false);

        // Return the data
        return data;
      }

      // No existing disclosure found - clear all form data and initialize with empty state
      if (DEBUG) {
        console.log(
          "[checkExistingDisclosureAndFetch] No existing disclosure found - initializing empty forms"
        );
      }

      // Get a reference to the IP disclosure store
      const store = useIpDisclosureStore.getState();

      // Clear disclosure ID only if different from current value
      if (store.disclosureId !== null) {
        setDisclosureId(null);
      }

      // Make sure the current application ID is set in the store
      if (store.applicationId !== currentAppId) {
        store.setApplicationId(currentAppId);
      }

      // Reset initialDataFetched and fetchAttempted flags to prevent further loops
      if (!store.initialDataFetched) {
        store.setInitialDataFetched(true);
      }

      // Always mark fetch as attempted to prevent further fetch attempts
      store.setFetchAttempted(true);

      // Log that we're starting with empty forms
      if (DEBUG) {
        console.log(
          "[checkExistingDisclosureAndFetch] Forms initialized with empty state for new application"
        );
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error(
        "[checkExistingDisclosureAndFetch] Error checking existing disclosure:",
        error
      );

      // On error, ensure we set the fetch attempted flag to prevent further loops
      const store = useIpDisclosureStore.getState();

      // Reset disclosure ID if needed
      if (store.disclosureId !== null) {
        setDisclosureId(null);
      }

      // Set flags to prevent further fetch attempts
      store.setInitialDataFetched(true);
      store.setFetchAttempted(true);

      setIsLoading(false);
      return null;
    }
  };

  return {
    isLoading,
    disclosureId,
    applicationId,
    fetchInitialData,
    setDisclosureId,
    setApplicantsInfo,
    applicantsInfo,
    setDisclosureConfirmation,
    disclosureConfirmation,
    setCopyrightApplication,
    copyrightApplication,
    setTransactionFormPart1,
    transactionFormPart1,
    setTransactionFormPart2,
    transactionFormPart2,
    setPatentUtilityModelApplication,
    patentUtilityModelApplication,
    setTrademarkApplication,
    trademarkApplication,
    setTradeSecretApplication,
    tradeSecretApplication,
    submitForm,
    resetSubmissionState,
    createIpDisclosureMutation,
    updateIpDisclosureMutation,
    getIpDisclosureQuery,
    saveTrademarkMutation,
    saveTradeSecretMutation,
    saveCopyrightMutation,
    savePatentUtilityModelMutation,
    saveDisclosureConfirmationMutation,
    submitIpDisclosureMutation,
    checkTrademarkExists,
    checkPatentSearchReportExists,
    checkExistingDisclosure,
    fetchDisclosureData,
    createDefaultData,
    processApiData,
    extractTransactionFormPart1,
    extractTransactionFormPart2,
    extractApplicantsInfo,
    extractDisclosureConfirmation,
    extractCopyrightApplication,
    extractPatentUtilityApplication,
    extractTrademarkApplication,
    extractTradeSecretApplication,
    saveApplicantsInfo,
    saveTrademarkApplication,
    saveTradeSecretApplication,
    saveDisclosureConfirmation,
    submitIpDisclosure,
    createDefaultTrademarkApplication,
    saveCopyrightApplication,
    savePatentUtilityModelApplication,
    parseDatabaseData,
    checkExistingDisclosureAndFetch,
  };
}
