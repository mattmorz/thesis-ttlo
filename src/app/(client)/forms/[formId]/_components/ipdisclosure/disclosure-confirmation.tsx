"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info as InfoIcon } from "lucide-react";
import {
  useIpDisclosureStore,
  useHydratedIpDisclosureStore,
} from "@/lib/store/ip-disclosure-store";
import { FormNavigation } from "./components/form-navigation";
import { useIpDisclosure } from "./hooks/use-ip-disclosure";

const formSchema = z.object({
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
  futureWork: z.string().optional().or(z.literal("")),
  confirmationDeclaration: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration",
  }),
});

export function DisclosureConfirmation() {
  const router = useRouter();

  const [isCSU, setIsCSU] = useState<boolean | null>(null);

  useEffect(() => {
    const value = localStorage.getItem("isCSUAffiliated");
    if (value !== null) {
      setIsCSU(JSON.parse(value));
    }
  }, []);
  const [showCSUModal, setShowCSUModal] = useState(false);

  const {
    applicantsInfo,
    validateSection,
    setDisclosureConfirmation,
    submitForm,
    isSubmitted,
    disclosureConfirmation,
    activeTab,
    setActiveTab,
    copyrightApplication,
    setCopyrightApplication,
    resetSubmissionState,
    patentUtilityModelApplication,
    setPatentUtilityModelApplication,
    trademarkApplication,
    setTrademarkApplication,
    tradeSecretApplication,
    setTradeSecretApplication,
    disclosureId,
    applicationId,
  } = useIpDisclosureStore();

  const { isHydrated } = useHydratedIpDisclosureStore();
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const {
    saveDisclosureConfirmation,
    submitIpDisclosure,
    isSavingConfirmation,
    isSubmitting,
    saveTrademarkApplication,
    saveTradeSecretApplication,
    saveApplicantsInfo,
    checkTrademarkExists,
    createDefaultTrademarkApplication,
    saveCopyrightApplication,
    savePatentUtilityModelApplication,
    fetchInitialData,
    fetchConfirmationData,
  } = useIpDisclosure();

  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const handleSubmissionSuccess = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ipDisclosureFormCompleted", {
          detail: {
            completed: true,
            applicationId,
            disclosureId,
          },
        }),
      );
    }

    // 🔥 CHECK CSU
    if (isCSU === false) {
      setShowCSUModal(true);
      return;
    }

    // ✅ Proceed if CSU
    router.push("/forms?tab=substantial-use");
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
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
  });
  useEffect(() => {
    setTimeout(() => {
      form.trigger();
    }, 100);
  }, [form]);

  const [tab, setTab] = useState<"confirm" | "review" | "success">("confirm");

  // Add progress tracking state
  const [submissionProgress, setSubmissionProgress] = useState({
    step: 0,
    total: 4,
    message: "",
    isComplete: false,
  });

  // Function to update progress
  const updateProgress = (
    step: number,
    message: string,
    isComplete = false,
  ) => {
    setSubmissionProgress({
      step,
      total: 4,
      message,
      isComplete,
    });
  };

  // Add an effect to load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Only attempt to load data if we haven't loaded it yet and the store is hydrated
      if (!isHydrated || initialDataLoaded) {
        return;
      }

      console.log("Loading initial data for confirmation section");

      // First check if we already have data in the store
      if (disclosureConfirmation) {
        console.log("Using existing confirmation data from store");
        form.reset(disclosureConfirmation);
        setInitialDataLoaded(true);
        return;
      }

      if (disclosureId) {
        console.log("Disclosure ID found, fetching data:", disclosureId);

        try {
          // Show loading toast
          const loadingId = toast.loading("Loading confirmation data...");

          // Try to fetch from API
          const data = await fetchInitialData();
          console.log("Raw API response data:", data);

          // If data exists and contains confirmation section, use it
          if (data && data.disclosureConfirmation) {
            console.log(
              "Found confirmation data from API:",
              data.disclosureConfirmation,
            );
            form.reset(data.disclosureConfirmation);
            setDisclosureConfirmation(data.disclosureConfirmation);
            toast.success("Data loaded successfully", { id: loadingId });
            setInitialDataLoaded(true);
          }
          // Check for alternative data structures
          else if (data && data.confirmation) {
            handleConfirmationDataFromAPI(data.confirmation, loadingId);
          }
          // Handle array format
          else if (
            Array.isArray(data) &&
            data.length > 0 &&
            data[0].confirmation_id
          ) {
            const matchingRecord =
              data.find((record) => record.disclosure_id === disclosureId) ||
              data[0];
            handleConfirmationDataFromAPI(matchingRecord, loadingId);
          }
          // If no confirmation data is found in the main response, try to fetch it directly
          else if (data) {
            await fetchConfirmationDirectly(loadingId);
          } else {
            console.log("No data returned from API");
            setInitialDataLoaded(true);
            toast.error("Failed to load data from server", { id: loadingId });
          }
        } catch (error) {
          console.error("Error loading confirmation data:", error);
          setInitialDataLoaded(true);
          toast.error(
            "Error loading data: " +
              (error instanceof Error ? error.message : "Unknown error"),
          );
        }
      } else {
        // Standard behavior for new forms without disclosure ID
        console.log("No disclosure ID found, using defaults");
        setInitialDataLoaded(true);
      }
    };

    // Helper function to handle confirmation data from API in different formats
    const handleConfirmationDataFromAPI = (
      confirmationData: any,
      toastId: string | number,
    ) => {
      // Map database field names to expected form field names
      const mappedData = {
        writtenDisclosures: {
          past: Boolean(confirmationData.written_disclosures?.past),
          planned: Boolean(confirmationData.written_disclosures?.planned),
          notApplicable: Boolean(
            confirmationData.written_disclosures?.notApplicable,
          ),
        },
        oralDisclosures: {
          past: Boolean(confirmationData.oral_disclosures?.past),
          planned: Boolean(confirmationData.oral_disclosures?.planned),
          notApplicable: Boolean(
            confirmationData.oral_disclosures?.notApplicable,
          ),
        },
        futureWork: confirmationData.future_work || "",
        confirmationDeclaration: Boolean(
          confirmationData.confirmation_declaration,
        ),
      };

      console.log("Mapped confirmation data:", mappedData);
      form.reset(mappedData);
      setDisclosureConfirmation(mappedData);
      toast.success("Data loaded successfully", { id: toastId });
      setInitialDataLoaded(true);
    };

    // Helper function to fetch confirmation data directly when not included in the main response
    const fetchConfirmationDirectly = async (toastId: string | number) => {
      try {
        console.log("Trying to fetch confirmation data directly");
        const confirmationData = await fetchConfirmationData(disclosureId);

        if (confirmationData && Object.keys(confirmationData).length > 0) {
          console.log(
            "Retrieved confirmation data directly:",
            confirmationData,
          );

          // Determine data format and map appropriately
          if (
            confirmationData.written_disclosures ||
            confirmationData.oral_disclosures
          ) {
            handleConfirmationDataFromAPI(confirmationData, toastId);
          } else if (
            confirmationData.writtenDisclosures ||
            confirmationData.oralDisclosures
          ) {
            // Data already in frontend format
            form.reset(confirmationData);
            setDisclosureConfirmation(confirmationData);
            toast.success("Confirmation data loaded", { id: toastId });
            setInitialDataLoaded(true);
          } else {
            // Unknown format, use defaults
            console.log(
              "Unknown data format, using defaults:",
              confirmationData,
            );
            const defaultValues = form.getValues();
            setDisclosureConfirmation(defaultValues);
            toast.success("Using default values", { id: toastId });
            setInitialDataLoaded(true);
          }
        } else {
          // No confirmation data found, use defaults
          console.log("No confirmation data found, using defaults");
          const defaultValues = form.getValues();
          setDisclosureConfirmation(defaultValues);
          toast.success("Using default values", { id: toastId });
          setInitialDataLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching confirmation data directly:", error);
        const defaultValues = form.getValues();
        setDisclosureConfirmation(defaultValues);
        toast.error("Error loading data, using defaults", { id: toastId });
        setInitialDataLoaded(true);
      }
    };

    loadInitialData();
  }, [
    isHydrated,
    disclosureId,
    disclosureConfirmation,
    form,
    setDisclosureConfirmation,
    fetchInitialData,
    saveApplicantsInfo,
    initialDataLoaded,
    applicantsInfo,
    fetchConfirmationData,
  ]);

  // Update the saveToDatabase function with better validation and error handling
  const saveToDatabase = async (registerInRegistry = false) => {
    console.log(
      `Starting to save disclosure confirmation to database (registerInRegistry=${registerInRegistry})`,
    );

    // Show loading toast
    const loadingId = toast.loading("Saving disclosure confirmation...");

    if (!isHydrated) {
      console.error("Store is not hydrated yet, cannot save");
      toast.error("Cannot save data at this time, please try again", {
        id: loadingId,
      });
      return false;
    }

    // Validate required data
    if (!applicantsInfo?.email) {
      console.error("Missing required applicants data: email");
      toast.error(
        "Missing required applicant information. Please complete the Applicant's Information tab first.",
        {
          id: loadingId,
        },
      );
      return false;
    }

    const hasAnyCompleteApplicant = (applicantsInfo?.applicants ?? []).some(
      (person) =>
        Boolean(person?.firstName?.trim()) && Boolean(person?.lastName?.trim()),
    );

    const hasAnyCompleteInventor = (applicantsInfo?.inventors ?? []).some(
      (person) =>
        Boolean(person?.firstName?.trim()) && Boolean(person?.lastName?.trim()),
    );

    if (!hasAnyCompleteApplicant) {
      console.error("Missing required applicants data: first/last name");
      toast.error(
        "Missing required applicant name information. Please complete the Applicant's Information tab first.",
        {
          id: loadingId,
        },
      );
      return false;
    }

    if (!hasAnyCompleteInventor) {
      console.error("Missing required inventors data: first/last name");
      toast.error(
        "Missing required inventor information. Please complete the Applicant's Information tab first.",
        {
          id: loadingId,
        },
      );
      return false;
    }

    if (
      !applicantsInfo?.ipTypes ||
      Object.values(applicantsInfo.ipTypes).every((val) => val === false)
    ) {
      console.error("Missing required IP types");
      toast.error(
        "Please select at least one IP type in the Applicant's Information tab.",
        {
          id: loadingId,
        },
      );
      return false;
    }

    // Check if the form has the confidentiality field
    const values = form.getValues();
    console.log("Form values for saving:", values);

    if (values.confirmationDeclaration === false) {
      toast.error("Please accept the confidentiality agreement", {
        id: loadingId,
      });
      return false;
    }

    try {
      setSaving(true);
      setError(null);

      // Step 1: Always ensure latest applicants info is saved first
      console.log("Saving latest applicant information first");
      const appInfoResult = await saveApplicantsInfo(
        applicantsInfo,
        registerInRegistry,
      );

      if (!appInfoResult) {
        throw new Error("Failed to save applicant information");
      }

      console.log("Successfully saved applicant information:", appInfoResult);

      // Step 2: Save confirmation data
      console.log("Now saving confirmation data");

      // Create a full data object that includes all properties explicitly
      const confirmationData = {
        ...values,
        disclosureId: disclosureId, // Use the store's disclosureId
        // Explicitly include the fields to ensure they're sent to the server
        confirmationDeclaration: Boolean(values.confirmationDeclaration),
        futureWork: values.futureWork || "",
        writtenDisclosures: {
          past: Boolean(values.writtenDisclosures?.past),
          planned: Boolean(values.writtenDisclosures?.planned),
          notApplicable: Boolean(values.writtenDisclosures?.notApplicable),
        },
        oralDisclosures: {
          past: Boolean(values.oralDisclosures?.past),
          planned: Boolean(values.oralDisclosures?.planned),
          notApplicable: Boolean(values.oralDisclosures?.notApplicable),
        },
      };

      console.log(
        `Saving disclosure confirmation with data (registerInRegistry=${registerInRegistry}):`,
        confirmationData,
      );

      // Update store first
      setDisclosureConfirmation(confirmationData);

      // Try direct API call for most reliable update
      if (disclosureId) {
        try {
          const response = await fetch(
            `/api/ip-disclosure/${disclosureId}/confirmation`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...confirmationData,
                registerForm: registerInRegistry, // Add registry flag to API call
              }),
            },
          );

          if (!response.ok) {
            console.error("API direct call failed, falling back to mutation");
            throw new Error("API call failed");
          }

          const result = await response.json();
          console.log("Direct API call successful:", result);
          toast.success("Disclosure confirmation saved successfully", {
            id: loadingId,
          });
          return true;
        } catch (apiError) {
          console.warn(
            "Direct API call failed, trying mutation method:",
            apiError,
          );
          // Continue to mutation method as fallback
        }
      }

      // Fallback to mutation method
      const result = await saveDisclosureConfirmation(
        { ...confirmationData, registerForm: registerInRegistry },
        registerInRegistry,
      );

      if (result) {
        console.log("Successfully saved disclosure confirmation");
        toast.success("Disclosure confirmation saved successfully", {
          id: loadingId,
        });
        return true;
      } else {
        throw new Error("Failed to save disclosure confirmation");
      }
    } catch (error) {
      console.error("Error saving disclosure confirmation:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error(
        `Error saving: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          id: loadingId,
        },
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted with values:", values);

    if (tab === "review") {
      console.log("Saving disclosure confirmation to database...");
      try {
        // Format values similar to other functions
        const formattedValues = {
          ...values,
          confirmationDeclaration: Boolean(values.confirmationDeclaration),
          futureWork: values.futureWork || "",
          writtenDisclosures: {
            past: Boolean(values.writtenDisclosures?.past),
            planned: Boolean(values.writtenDisclosures?.planned),
            notApplicable: Boolean(values.writtenDisclosures?.notApplicable),
          },
          oralDisclosures: {
            past: Boolean(values.oralDisclosures?.past),
            planned: Boolean(values.oralDisclosures?.planned),
            notApplicable: Boolean(values.oralDisclosures?.notApplicable),
          },
        };

        // Update the store with the formatted values
        setDisclosureConfirmation(formattedValues);

        const success = await saveToDatabase();
        if (success) {
          setTab("success");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    } else if (tab === "confirm") {
      setTab("review");
    } else if (tab === "success") {
      console.log("Saving disclosure confirmation to database...");
      try {
        await saveToDatabase();
        // Already on success tab, so we just reset the form
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    }
  }

  const handleSave = async () => {
    try {
      // Show loading indicator
      setSaving(true);

      const values = form.getValues();
      console.log("Form values from handleSave:", values);

      // Create a complete data object for store update
      const formattedData = {
        ...values,
        confirmationDeclaration: Boolean(values.confirmationDeclaration),
        futureWork: values.futureWork || "",
        writtenDisclosures: {
          past: Boolean(values.writtenDisclosures?.past),
          planned: Boolean(values.writtenDisclosures?.planned),
          notApplicable: Boolean(values.writtenDisclosures?.notApplicable),
        },
        oralDisclosures: {
          past: Boolean(values.oralDisclosures?.past),
          planned: Boolean(values.oralDisclosures?.planned),
          notApplicable: Boolean(values.oralDisclosures?.notApplicable),
        },
      };

      setDisclosureConfirmation(formattedData);
      console.log("Saving disclosure confirmation to store:", formattedData);

      // First ensure we have a disclosure ID by saving applicants info if needed
      if (!disclosureId) {
        console.log("No disclosure ID found, saving applicants info first");
        try {
          const applicantsInfoSaved = await saveApplicantsInfo(
            applicantsInfo,
            true,
          );
          if (!applicantsInfoSaved) {
            console.error("Failed to save applicants information");
            toast.error("Failed to save applicants information");
            setSaving(false);
            return;
          }
          console.log("Applicants information saved successfully");
        } catch (applicantsError) {
          console.error("Error saving applicants info:", applicantsError);
          toast.error("Error saving applicants information");
          setSaving(false);
          return;
        }
      }

      // Save the disclosure confirmation
      console.log(
        "Saving disclosure confirmation to database with registry...",
      );
      try {
        // Pass true to register in the form_submission_registry
        const success = await saveToDatabase(true);

        if (success) {
          console.log("Disclosure confirmation saved successfully");
          toast.success("Disclosure confirmation saved successfully");
        } else {
          console.error("Failed to save disclosure confirmation");
          toast.error("Failed to save disclosure confirmation");
        }
      } catch (confirmationError) {
        console.error(
          "Error saving disclosure confirmation:",
          confirmationError,
        );
        toast.error("An error occurred while saving disclosure confirmation");
      } finally {
        setSaving(false);
      }
    } catch (error) {
      console.error("Error in handleSave function:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      toast.error("An error occurred while saving disclosure confirmation");
      setSaving(false);
    }
  };

  // Function to get a more descriptive name for each IP type
  const getIpTypeDisplayName = (type: string): string => {
    switch (type) {
      case "copyright":
        return "Copyright";
      case "patent":
        return "Patent";
      case "utilityModel":
        return "Utility Model";
      case "industrialDesign":
        return "Industrial Design";
      case "trademark":
        return "Trademark";
      case "tradeSecret":
        return "Trade Secret";
      case "other":
        return "Other IP Type";
      case "notSure":
        return "Undetermined IP Type";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Enhance the handleSubmitAttempt function
  const handleSubmitAttempt = async () => {
    try {
      // Reset any previous progress
      updateProgress(0, "Preparing submission...");

      // Show loading state
      setIsSubmittingLocal(true);

      // Show a comprehensive toast
      const confirmToastId = toast.loading(
        "Preparing to submit complete IP disclosure form...",
      );

      // Validate the form first
      const values = form.getValues();
      console.log("Form values before submission:", values);

      const validationResult = formSchema.safeParse(values);
      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error);
        toast.error("Please fill in all required fields before submitting", {
          id: confirmToastId,
        });
        setIsSubmittingLocal(false);
        updateProgress(0, "Validation failed", true);
        return;
      }

      // Always save current tab data to store
      setDisclosureConfirmation(values);
      console.log("Saving confirmation data to store:", values);

      // Update toast to show progress on all tabs
      toast.loading("Step 1/4: Validating applicant information...", {
        id: confirmToastId,
      });

      // Update progress state
      updateProgress(1, "Validating applicant information...");

      // First ensure we have a disclosure ID
      if (!disclosureId) {
        console.log("No disclosure ID found, saving applicants info first");
        try {
          // We're submitting, so DO register in the form registry
          const applicantsInfoSaved = await saveApplicantsInfo(
            applicantsInfo,
            true,
          );
          if (!applicantsInfoSaved) {
            console.error("Failed to save applicants information");
            toast.error("Failed to save applicants information", {
              id: confirmToastId,
            });
            setIsSubmittingLocal(false);
            updateProgress(1, "Failed to save applicant information", true);
            return;
          }
          console.log("Applicants information saved successfully");
        } catch (error: unknown) {
          console.error(
            "Error saving applicants info:",
            error instanceof Error ? error.message : "Unknown error",
          );
          toast.error("Error saving applicants information", {
            id: confirmToastId,
          });
          setIsSubmittingLocal(false);
          updateProgress(1, "Error saving applicant information", true);
          return;
        }
      }

      // Verify IP type-specific tabs have been saved
      toast.loading("Step 2/4: Saving IP type-specific data...", {
        id: confirmToastId,
      });

      // Update progress state
      updateProgress(2, "Saving IP type-specific data...");

      // Try to save all IP-specific data before final submission
      const saveAllTabData = async () => {
        // Save applicants info data first - Always register in registry when submitting
        if (applicantsInfo) {
          try {
            console.log(
              "Saving applicant information for submission:",
              applicantsInfo,
            );
            await saveApplicantsInfo(applicantsInfo, true);
          } catch (error: unknown) {
            console.error(
              "Error saving applicant info:",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        }

        // Save copyright application if present - Always register in registry when submitting
        if (applicantsInfo?.ipTypes?.copyright && copyrightApplication) {
          try {
            console.log("Saving copyright application:", copyrightApplication);
            await saveCopyrightApplication(copyrightApplication, true);
          } catch (error: unknown) {
            console.error(
              "Error saving copyright application:",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        }

        // Save patent/utility model application if present
        if (
          (applicantsInfo?.ipTypes?.patent ||
            applicantsInfo?.ipTypes?.utilityModel) &&
          patentUtilityModelApplication
        ) {
          try {
            console.log(
              "Saving patent/utility model application:",
              patentUtilityModelApplication,
            );
            await savePatentUtilityModelApplication(
              patentUtilityModelApplication,
              true,
            );
          } catch (error: unknown) {
            console.error(
              "Error saving patent/utility model application:",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        }

        // Save trademark application if present
        if (applicantsInfo?.ipTypes?.trademark && trademarkApplication) {
          try {
            console.log("Saving trademark application:", trademarkApplication);
            await saveTrademarkApplication(trademarkApplication, true);
          } catch (error: unknown) {
            console.error(
              "Error saving trademark application:",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        }

        // Save trade secret application if present
        if (applicantsInfo?.ipTypes?.tradeSecret && tradeSecretApplication) {
          try {
            console.log(
              "Saving trade secret application:",
              tradeSecretApplication,
            );
            await saveTradeSecretApplication(tradeSecretApplication, true);
          } catch (error: unknown) {
            console.error(
              "Error saving trade secret application:",
              error instanceof Error ? error.message : "Unknown error",
            );
          }
        }
      };

      // First attempt to save all tab data
      await saveAllTabData();

      // Save confirmation data with registry creation
      toast.loading("Step 3/4: Saving disclosure confirmation...", {
        id: confirmToastId,
      });

      // Update progress state
      updateProgress(3, "Saving disclosure confirmation...");

      // Create a complete data object for confirmation
      const confirmationData = {
        ...values,
        disclosureId: useIpDisclosureStore.getState().disclosureId,
        confirmationDeclaration: Boolean(values.confirmationDeclaration),
        futureWork: values.futureWork || "",
        writtenDisclosures: {
          past: Boolean(values.writtenDisclosures?.past),
          planned: Boolean(values.writtenDisclosures?.planned),
          notApplicable: Boolean(values.writtenDisclosures?.notApplicable),
        },
        oralDisclosures: {
          past: Boolean(values.oralDisclosures?.past),
          planned: Boolean(values.oralDisclosures?.planned),
          notApplicable: Boolean(values.oralDisclosures?.notApplicable),
        },
      };

      console.log("Saving confirmation data to database:", confirmationData);
      // Always register in registry when submitting
      const confirmationSaved = await saveDisclosureConfirmation(
        { ...confirmationData, registerForm: true },
        true,
      );

      if (!confirmationSaved) {
        console.error("Failed to save confirmation data");
        toast.error("Failed to save confirmation data", { id: confirmToastId });
        setIsSubmittingLocal(false);
        updateProgress(3, "Failed to save confirmation data", true);
        return;
      }

      // Final submission
      toast.loading("Step 4/4: Finalizing submission...", {
        id: confirmToastId,
      });

      // Update progress state
      updateProgress(4, "Finalizing submission...");

      // Prepare complete data for submission with detailed logging
      const completeFormData = {
        disclosureId: useIpDisclosureStore.getState().disclosureId,
        applicantsInfo,
        disclosureConfirmation: confirmationData,
        copyrightApplication,
        patentUtilityModelApplication,
        trademarkApplication,
        tradeSecretApplication,
        submissionTimestamp: new Date().toISOString(),
      };

      // Log each section of data being submitted
      console.log(
        "SUBMISSION DATA - Disclosure ID:",
        completeFormData.disclosureId,
      );
      console.log(
        "SUBMISSION DATA - Applicants Info:",
        completeFormData.applicantsInfo,
      );
      console.log(
        "SUBMISSION DATA - Confirmation:",
        completeFormData.disclosureConfirmation,
      );

      if (completeFormData.copyrightApplication) {
        console.log(
          "SUBMISSION DATA - Copyright:",
          completeFormData.copyrightApplication,
        );
      }

      if (completeFormData.patentUtilityModelApplication) {
        console.log(
          "SUBMISSION DATA - Patent/Utility Model:",
          completeFormData.patentUtilityModelApplication,
        );
      }

      if (completeFormData.trademarkApplication) {
        console.log(
          "SUBMISSION DATA - Trademark:",
          completeFormData.trademarkApplication,
        );
      }

      if (completeFormData.tradeSecretApplication) {
        console.log(
          "SUBMISSION DATA - Trade Secret:",
          completeFormData.tradeSecretApplication,
        );
      }

      console.log(
        "Submitting complete IP disclosure with ALL tab data:",
        completeFormData,
      );

      // Now submit the IP disclosure with all collected data
      const result = await submitIpDisclosure(completeFormData);

      if (result) {
        console.log("IP disclosure submitted successfully");

        // Update progress to complete
        updateProgress(4, "IP disclosure submitted successfully!", true);

        // Show success message that highlights all tab data was included
        toast.success(
          `Complete IP disclosure submitted successfully including ${Object.entries(
            applicantsInfo?.ipTypes || {},
          )
            .filter(([_, isSelected]) => isSelected)
            .map(([type]) => getIpTypeDisplayName(type))
            .join(", ")} data!`,
          { id: confirmToastId, duration: 5000 },
        );

        // Update submission state
        resetSubmissionState();
        setTimeout(() => {
          // Set the state to submitted to show the success message
          submitForm();
          handleSubmissionSuccess();
        }, 100);
      } else {
        console.error("Failed to submit IP disclosure");

        // Try a direct API fallback as a last resort
        try {
          console.log("Attempting direct API submission as fallback");
          const directUpdateResponse = await fetch(
            `/api/ip-disclosure/${
              useIpDisclosureStore.getState().disclosureId
            }/submit-directly`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                disclosureId: useIpDisclosureStore.getState().disclosureId,
                timestamp: new Date().toISOString(),
              }),
            },
          );

          if (!directUpdateResponse.ok) {
            throw new Error(
              `Direct submission failed: ${directUpdateResponse.status}`,
            );
          }

          const directResult = await directUpdateResponse.json();
          console.log(
            "Direct submission successful via fallback:",
            directResult,
          );

          // Handle success the same way as the normal flow
          updateProgress(
            4,
            "IP disclosure submitted successfully via fallback!",
            true,
          );
          toast.success("IP disclosure submitted successfully!", {
            id: confirmToastId,
          });
          resetSubmissionState();
          setTimeout(() => {
            submitForm();
            handleSubmissionSuccess();
          }, 100);
        } catch (fallbackError) {
          console.error("All submission attempts failed:", fallbackError);
          toast.error("Failed to submit complete IP disclosure form", {
            id: confirmToastId,
          });
          updateProgress(4, "Failed to submit IP disclosure", true);
        }
      }
      setIsSubmittingLocal(false);
    } catch (error) {
      console.error("Error in submit attempt:", error);
      toast.error(
        `An error occurred during submission: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      setIsSubmittingLocal(false);
      updateProgress(0, "Error during submission", true);
    }
  };

  // Helper function to determine the previous tab
  const onPrevious = () => {
    console.log("Navigating from disclosure confirmation to previous tab");

    // Define the tab order according to ip-disclosure-form.tsx
    const tabOrder = [
      "applicants-information",
      "patent-application",
      "matrix-sample",
      "patent-search",
      "copyright-application",
      "trademark-application", // Back-compat alias for the trademark application step
      "trade-secret",
      "confirmation",
    ];

    // Get all visible tabs from the store
    const visibleTabs = useIpDisclosureStore.getState().visibleTabs || [];
    console.log("Currently visible tabs:", visibleTabs);

    // Handle "trademark" vs "trademark-application" naming inconsistency
    // If "trademark" is in visibleTabs, map it to "trademark-application" for proper ordering
    const normalizedVisibleTabs = visibleTabs.map((tab) =>
      tab === "trademark" ? "trademark-application" : tab,
    );
    console.log("Normalized visible tabs:", normalizedVisibleTabs);

    // Filter to only include the tabs that are currently visible
    const orderedVisibleTabs = tabOrder.filter((tab) =>
      normalizedVisibleTabs.includes(tab),
    );
    console.log("Ordered visible tabs:", orderedVisibleTabs);

    // Find the current tab index
    const currentIndex = orderedVisibleTabs.indexOf("confirmation");
    console.log("Current tab index:", currentIndex);

    if (currentIndex <= 0) {
      // If we're at the first tab or can't find the current tab, go to applicants-information
      console.log(
        "At first tab or can't determine index, going to applicants-information",
      );
      useIpDisclosureStore.getState().setActiveTab("applicants-information");
      return;
    }

    // Get the previous tab
    let previousTab = orderedVisibleTabs[currentIndex - 1];
    console.log("Previous tab in sequence:", previousTab);

    // Convert back to "trademark" if that's what's actually in the visible tabs
    if (
      previousTab === "trademark-application" &&
      visibleTabs.includes("trademark") &&
      !visibleTabs.includes("trademark-application")
    ) {
      previousTab = "trademark";
      console.log("Converted previous tab to 'trademark' for compatibility");
    }

    // Navigate to the previous tab
    try {
      useIpDisclosureStore.getState().setActiveTab(previousTab);
      console.log("Navigated to previous tab:", previousTab);
    } catch (error) {
      console.error("Error setting active tab:", error);
      // Fallback
      setActiveTab(previousTab);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Add progress indicator when submitting */}
        {isSubmittingLocal && (
          <div className="my-4">
            <div className="bg-slate-100 rounded-lg p-4 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Submitting IP Disclosure
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {submissionProgress.message}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {submissionProgress.step}/{submissionProgress.total}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (submissionProgress.step / submissionProgress.total) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                {submissionProgress.isComplete && (
                  <p className="text-sm text-slate-500 italic">
                    {submissionProgress.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Disclosure Confirmation
          </h3>
          <p className="text-sm text-muted-foreground">
            Please confirm the details of your disclosure and provide any
            additional information
          </p>
        </div>

        <Alert className="border-green-200 bg-green-50 text-green-800">
          <InfoIcon className="h-4 w-4 text-green-700" />
          <AlertDescription>
            It is important for the University to know if your invention has
            been made public, as this may affect the strength of any patent
            application and the commercial potential.
          </AlertDescription>
        </Alert>
        <div className="space-y-6">
          <Card className="border-green-200">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <FormLabel className="text-base">
                  Written Disclosures<span className="text-red-500"> *</span>
                </FormLabel>
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="writtenDisclosures.past"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Past</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="writtenDisclosures.planned"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Planned</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="writtenDisclosures.notApplicable"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Not Applicable
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormLabel className="text-base">
                  Oral Disclosures<span className="text-red-500"> *</span>
                </FormLabel>
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="oralDisclosures.past"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Past</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oralDisclosures.planned"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Planned</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oralDisclosures.notApplicable"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="text-green-600 border-green-600"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Not Applicable
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="futureWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base after:content-none">
                      Future Work
                    </FormLabel>
                    <FormDescription>
                      Please describe any planned future work or developments
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter details about future work..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="confirmationDeclaration"
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
                        Declaration<span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormDescription>
                        I hereby declare that the information provided in this
                        application is true and accurate to the best of my
                        knowledge.
                      </FormDescription>
                      {!field.value && (
                        <p className="text-sm font-medium text-amber-600 mt-2 p-1 bg-amber-50 rounded border border-amber-200">
                          ⚠️ Please check this box to enable the submit button
                        </p>
                      )}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-green-100" />

        <FormNavigation
          onSave={handleSave}
          showNext={false}
          showSubmit={true}
          isSubmitDisabled={
            !form.watch("confirmationDeclaration") || isSubmittingLocal
          }
          currentTab={activeTab}
          isSubmitting={isSubmittingLocal}
          submissionProgress={submissionProgress}
          onSubmitAttempt={handleSubmitAttempt}
          onPrevious={onPrevious}
        />

        {/* Success message for submitted forms - enhanced to show summary of all saved data */}
        {isSubmitted && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h4 className="font-medium text-green-800">
                {applicantsInfo?.ipTypes &&
                Object.entries(applicantsInfo.ipTypes).some(
                  ([_, isSelected]) => isSelected,
                )
                  ? `IP Disclosure Form Submitted: ${Object.entries(
                      applicantsInfo.ipTypes,
                    )
                      .filter(([_, isSelected]) => isSelected)
                      .map(([type]) => getIpTypeDisplayName(type))
                      .join(", ")}`
                  : "Form Successfully Submitted"}
              </h4>
            </div>
            <p className="mt-2 text-sm text-green-700">
              Your IP disclosure form has been successfully submitted with data
              from all completed tabs.
            </p>

            {/* Display summary of submitted data from various tabs */}
            <div className="mt-3">
              <h5 className="text-sm font-semibold text-green-700 mb-2">
                Submission Summary:
              </h5>

              {/* Applicant Info Section */}
              <div className="bg-white p-3 rounded border border-green-100 mb-2">
                <span className="text-xs font-medium text-green-800 block mb-1">
                  Applicant Information:
                </span>
                {applicantsInfo &&
                  applicantsInfo.applicants &&
                  applicantsInfo.applicants.length > 0 && (
                    <div className="text-xs text-gray-700 ml-2">
                      <span className="block">
                        Primary Applicant:{" "}
                        {applicantsInfo?.applicants[0]?.firstName || "Unknown"}{" "}
                        {applicantsInfo?.applicants[0]?.lastName || ""}
                      </span>
                      <span className="block">
                        Contact Email: {applicantsInfo?.email || "Not provided"}
                      </span>
                      {applicantsInfo?.applicants.length > 1 && (
                        <span className="block">
                          + {applicantsInfo?.applicants.length - 1} additional
                          applicant(s)
                        </span>
                      )}
                    </div>
                  )}
              </div>

              {/* IP Types Section */}
              <div className="mt-2 bg-white p-3 rounded border border-green-100 mb-2">
                <span className="text-xs font-medium text-green-800 block mb-1">
                  IP Types:
                </span>
                <div className="flex flex-wrap gap-1 ml-2">
                  {applicantsInfo?.ipTypes &&
                    Object.entries(applicantsInfo.ipTypes)
                      .filter(([_, isSelected]) => isSelected)
                      .map(([type]) => (
                        <span
                          key={type}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {getIpTypeDisplayName(type)}
                        </span>
                      ))}
                </div>
              </div>

              {/* Show IP Type Specific Data */}
              {applicantsInfo?.ipTypes?.copyright && copyrightApplication && (
                <div className="mt-2 bg-white p-3 rounded border border-green-100 mb-2">
                  <span className="text-xs font-medium text-green-800 block mb-1">
                    Copyright Information:
                  </span>
                  <div className="text-xs text-gray-700 ml-2">
                    <span className="block">
                      Work Title:{" "}
                      {copyrightApplication.workTitle || "Not provided"}
                    </span>
                  </div>
                </div>
              )}

              {(applicantsInfo?.ipTypes?.patent ||
                applicantsInfo?.ipTypes?.utilityModel) &&
                patentUtilityModelApplication && (
                  <div className="mt-2 bg-white p-3 rounded border border-green-100 mb-2">
                    <span className="text-xs font-medium text-green-800 block mb-1">
                      Patent/Utility Model Information:
                    </span>
                    <div className="text-xs text-gray-700 ml-2">
                      <span className="block">
                        Patent/Utility Model Application: Completed
                      </span>
                    </div>
                  </div>
                )}

              {applicantsInfo?.ipTypes?.trademark && trademarkApplication && (
                <div className="mt-2 bg-white p-3 rounded border border-green-100 mb-2">
                  <span className="text-xs font-medium text-green-800 block mb-1">
                    Trademark Information:
                  </span>
                  <div className="text-xs text-gray-700 ml-2">
                    <span className="block">
                      Trademark Application and Disclosure: Completed
                    </span>
                  </div>
                </div>
              )}

              {applicantsInfo?.ipTypes?.tradeSecret &&
                tradeSecretApplication && (
                  <div className="mt-2 bg-white p-3 rounded border border-green-100 mb-2">
                    <span className="text-xs font-medium text-green-800 block mb-1">
                      Trade Secret Information:
                    </span>
                    <div className="text-xs text-gray-700 ml-2">
                      <span className="block">
                        Trade Secret Application: Completed
                      </span>
                    </div>
                  </div>
                )}

              {/* Confirmation Data */}
              <div className="mt-2 bg-white p-3 rounded border border-green-100">
                <span className="text-xs font-medium text-green-800 block mb-1">
                  Disclosure Confirmation:
                </span>
                <div className="text-xs text-gray-700 ml-2">
                  <span className="block">
                    Written Disclosures:{" "}
                    {disclosureConfirmation?.writtenDisclosures?.past
                      ? "Past"
                      : disclosureConfirmation?.writtenDisclosures?.planned
                        ? "Planned"
                        : disclosureConfirmation?.writtenDisclosures
                              ?.notApplicable
                          ? "N/A"
                          : "Not specified"}
                  </span>
                  <span className="block">
                    Oral Disclosures:{" "}
                    {disclosureConfirmation?.oralDisclosures?.past
                      ? "Past"
                      : disclosureConfirmation?.oralDisclosures?.planned
                        ? "Planned"
                        : disclosureConfirmation?.oralDisclosures?.notApplicable
                          ? "N/A"
                          : "Not specified"}
                  </span>
                  {disclosureConfirmation?.futureWork && (
                    <span className="block">
                      Future Work:{" "}
                      {disclosureConfirmation.futureWork.substring(0, 50)}
                      {disclosureConfirmation.futureWork.length > 50
                        ? "..."
                        : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <p className="text-xs text-green-600">
                Last submitted: {new Date().toLocaleString()}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-white text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => window.print()}
              >
                Print Summary
              </Button>
            </div>
          </div>
        )}
      </form>
      {showCSUModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-lg font-semibold text-green-600 mb-2">
              Submission Completed!
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your application has been submitted.
              <br></br>
              However, since you are not affiliated with CSU, you cannot proceed
              to the next step.
              <br></br>
              Please contact the administrator for further assistance.
            </p>
            <button
              onClick={() => setShowCSUModal(false)}
              className="px-4 py-2 bg-[#1B5E20] text-white rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </Form>
  );
}
