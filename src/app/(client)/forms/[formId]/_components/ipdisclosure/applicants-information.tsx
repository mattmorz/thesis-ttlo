"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Plus, X, AlertTriangle } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useIpDisclosure } from "./hooks/use-ip-disclosure";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormNavigation } from "./components/form-navigation";
import {
  applicantsInfoSchema,
  ApplicantsInfo,
  IpTypes,
} from "@/lib/store/ip-disclosure-store";
import { useFormContext } from "./context/form-context";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import {
  deriveIpTypesFromApplicationIpType,
  hasSelectedIpTypes,
  getNextVisibleIpDisclosureTab,
  normalizeIpTypes,
} from "./utils/ip-type";

// Global logging control
const DEBUG = false;

// Define the form schema here to avoid missing module errors
const nameSchema = z.string().trim().min(1, "This field is required");
const ApplicantsInfoFormSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address"),
    applicants: z
      .array(
        z.object({
          firstName: nameSchema,
          middleInitial: z.string().trim().optional(),
          lastName: nameSchema,
        })
      )
      .min(1, "At least one applicant is required"),
    inventors: z
      .array(
        z.object({
          firstName: nameSchema,
          middleInitial: z.string().trim().optional(),
          lastName: nameSchema,
        })
      )
      .min(1, "At least one inventor is required"),
    ipTypes: z.object({
      copyright: z.boolean().default(false),
      patent: z.boolean().default(false),
      utilityModel: z.boolean().default(false),
      industrialDesign: z.boolean().default(false),
      trademark: z.boolean().default(false),
      tradeSecret: z.boolean().default(false),
      other: z.boolean().default(false),
      notSure: z.boolean().default(false),
    }),
    otherIpType: z.string().trim().optional(),
    isRightfulOwner: z
      .boolean()
      .refine((value) => value === true, {
        message: "This confirmation is required.",
      }),
    isApplicantAlsoInventor: z.boolean().default(false),
    authorizedRepresentative: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const hasIpTypeSelected = Object.values(data.ipTypes).some(
      (value) => value === true
    );

    if (!hasIpTypeSelected) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one IP type.",
        path: ["ipTypes"],
      });
    }

    if (data.ipTypes.other && !data.otherIpType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the type of IP in the 'Other' field.",
        path: ["otherIpType"],
      });
    }
  });

// Define type based on the schema
type ApplicantsInfoFormType = z.infer<typeof ApplicantsInfoFormSchema>;

type TabVisibility = {
  copyright: boolean;
  patent: boolean;
  trademark: boolean;
  tradeSecret: boolean;
};

type IpTypeKeys = keyof IpTypes;

const createEmptyApplicantsInfoForm = (): ApplicantsInfoFormType => ({
  email: "",
  applicants: [{ firstName: "", middleInitial: "", lastName: "" }],
  inventors: [{ firstName: "", middleInitial: "", lastName: "" }],
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
  otherIpType: "",
  isRightfulOwner: false,
  isApplicantAlsoInventor: false,
  authorizedRepresentative: "",
});

const hasMeaningfulApplicantsData = (
  data: Partial<ApplicantsInfoFormType> | ApplicantsInfo | null | undefined
) => {
  if (!data) return false;

  const hasText = (value?: string | null) => Boolean(value?.trim());
  const hasPeople = (
    people?: Array<{
      firstName?: string;
      middleInitial?: string;
      lastName?: string;
    }>
  ) =>
    Array.isArray(people) &&
    people.some(
      (person) =>
        hasText(person?.firstName) ||
        hasText(person?.middleInitial) ||
        hasText(person?.lastName)
    );

  return (
    hasText(data.email) ||
    hasText(data.otherIpType) ||
    hasText(data.authorizedRepresentative) ||
    data.isRightfulOwner === true ||
    data.isApplicantAlsoInventor === true ||
    hasPeople(data.applicants) ||
    hasPeople(data.inventors) ||
    Boolean(data.ipTypes) &&
      Object.values(data.ipTypes).some((value) => value === true)
  );
};

// Define interfaces for person types
interface PersonInfo {
  firstName: string;
  middleInitial?: string;
  lastName: string;
}

interface ApplicantsInformationProps {
  onIpTypeSelect: (ipTypes: IpTypes) => void;
}

export function ApplicantsInformation() {

   const getCreatorLabel = () => {
  if (derivedIpTypesResult.ipTypes.patent || derivedIpTypesResult.ipTypes.utilityModel) {
    return "Inventor";
  } else if (derivedIpTypesResult.ipTypes.copyright) {
    return "Author";
  } else {
    return "Creator";
  }
};
  const { setSelectedIpTypes, isHydrated } = useFormContext();
  const { activeApplication } = useActiveApplication();
  const {
    setApplicantsInfo,
    setActiveTab,
    applicantsInfo,
    activeTab,
    disclosureId,
    applicationId,
  } = useIpDisclosureStore();

  const {
    saveApplicantsInfo,
    isLoading,
    fetchInitialData,
    checkExistingDisclosureAndFetch,
  } = useIpDisclosure();

  // Track whether initial data load has happened
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Create local state for form values
  const [formData, setFormData] = useState<ApplicantsInfoFormType>({
    email: "",
    applicants: [{ firstName: "", middleInitial: "", lastName: "" }],
    inventors: [{ firstName: "", middleInitial: "", lastName: "" }],
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
    otherIpType: "",
    isRightfulOwner: false,
    isApplicantAlsoInventor: false,
    authorizedRepresentative: "",
  });

  // Initialize form with the local state
  const form = useForm<ApplicantsInfoFormType>({
    resolver: zodResolver(ApplicantsInfoFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: formData,
  });
  const derivedIpTypesResult = React.useMemo(
    () => {
      if (activeApplication?.selectedIpTypes) {
        return {
          ipTypes: normalizeIpTypes(activeApplication.selectedIpTypes),
          otherIpType: "",
        };
      }

      return deriveIpTypesFromApplicationIpType(
        activeApplication?.ipType ?? undefined
      );
    },
    [activeApplication?.ipType, activeApplication?.selectedIpTypes]
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (
      applicantsInfo?.ipTypes &&
      hasSelectedIpTypes(applicantsInfo.ipTypes)
    ) {
      return;
    }
    if (!hasSelectedIpTypes(derivedIpTypesResult.ipTypes)) return;

    const ipTypes = normalizeIpTypes(derivedIpTypesResult.ipTypes);
    const { otherIpType } = derivedIpTypesResult;
    form.setValue("ipTypes", ipTypes, { shouldValidate: true });
    form.setValue("otherIpType", otherIpType, { shouldValidate: true });

    setFormData((prev) => ({
      ...prev,
      ipTypes,
      otherIpType,
    }));

    setSelectedIpTypes(ipTypes);
    setApplicantsInfo({
      ...form.getValues(),
      ipTypes,
      otherIpType,
    });
  }, [
    activeApplication?.ipType,
    derivedIpTypesResult,
    form,
    isHydrated,
    setApplicantsInfo,
    setSelectedIpTypes,
  ]);
  // Avoid resetting the form on every formData change.

  const {
    fields: applicantFields,
    append: appendApplicant,
    remove: removeApplicant,
  } = useFieldArray({
    control: form.control,
    name: "applicants",
  });

  const {
    fields: inventorFields,
    append: appendInventor,
    remove: removeInventor,
  } = useFieldArray({
    control: form.control,
    name: "inventors",
  });

  // Add a ref to track if we've already started loading data
  const initialLoadAttemptedRef = useRef(false);

  // Add these state variables at the beginning of the component near other useState declarations
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const applicantsSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevActiveTabRef = useRef<string | null>(null);

  // Simplified function to load data from disclosure or existing data
  useEffect(() => {
    // Only attempt to load data if:
    // 1. The store is hydrated
    // 2. We haven't loaded data yet
    // 3. We haven't already attempted to load data (prevents duplicate loads)
    if (isHydrated && !initialDataLoaded && !initialLoadAttemptedRef.current) {
      const currentAppId =
        applicationId || useIpDisclosureStore.getState().applicationId;

      if (!currentAppId) {
        console.log(
          "Waiting for application ID before loading applicants information"
        );
        return;
      }

      // Mark that we've attempted to load data only after we know the app context
      initialLoadAttemptedRef.current = true;

      console.log("Component is hydrated, checking for existing data");

      const loadData = async () => {
        try {
          let loadedData = null;
          let sourceOfData = "none";

          console.log("Current application ID:", currentAppId);

          // First, check if we have disclosure ID in the store
          if (disclosureId) {
            console.log("Disclosure ID found in store:", disclosureId);
            try {
              // Fetch data using the disclosure ID
              const data = await fetchInitialData();
              console.log("Raw data returned from fetchInitialData:", data);

              // Verify application ID match
              if (
                currentAppId &&
                data &&
                data.applicationId &&
                data.applicationId !== currentAppId
              ) {
                console.warn(
                  `Data from fetchInitialData belongs to application ${data.applicationId}, not current application ${currentAppId}. Ignoring.`
                );
              } else if (data && data.applicantsInfo) {
                loadedData = data;
                sourceOfData = "fetchInitialData";
                console.log("Data loaded from fetchInitialData:", data);
              }
            } catch (fetchError) {
              console.error("Error fetching data for disclosure:", fetchError);
            }
          }

          // If we couldn't get data from disclosure ID, try checking for existing disclosures
          if (!loadedData) {
            try {
              const existingData = await checkExistingDisclosureAndFetch();
              console.log(
                "Raw data returned from checkExistingDisclosureAndFetch:",
                existingData
              );

              // Verify application ID match
              if (
                currentAppId &&
                existingData &&
                existingData.applicationId &&
                existingData.applicationId !== currentAppId
              ) {
                console.warn(
                  `Data from checkExistingDisclosureAndFetch belongs to application ${existingData.applicationId}, not current application ${currentAppId}. Ignoring.`
                );
              } else if (existingData && existingData.applicantsInfo) {
                loadedData = existingData;
                sourceOfData = "checkExistingDisclosureAndFetch";
                console.log(
                  "Data loaded from checkExistingDisclosureAndFetch:",
                  existingData
                );
              }
            } catch (existingError) {
              console.error(
                "Error checking for existing disclosures:",
                existingError
              );
            }
          }

          // Last resort: Check if we have data in the store that wasn't included in the API responses
          if (!loadedData) {
            const storeData = {
              applicantsInfo: useIpDisclosureStore.getState().applicantsInfo,
              disclosureId: useIpDisclosureStore.getState().disclosureId,
              applicationId: useIpDisclosureStore.getState().applicationId,
              copyrightApplication:
                useIpDisclosureStore.getState().copyrightApplication,
            };

            if (hasMeaningfulApplicantsData(storeData.applicantsInfo)) {
              // Before using store data, verify it belongs to the current application
              if (
                currentAppId &&
                storeData.applicationId !== currentAppId
              ) {
                console.log(
                  `Store data belongs to application ${storeData.applicationId}, not current application ${currentAppId}. Ignoring.`
                );
              } else {
                loadedData = storeData;
                sourceOfData = "store";
                console.log("Using existing data from store:", storeData);
              }
            }
          }

          // If we have data, set it to our form state
          if (loadedData && loadedData.applicantsInfo) {
            console.log(`Using data from ${sourceOfData} to populate form`);

            // Double check application ID match one more time
            if (
              loadedData.applicationId &&
              loadedData.applicationId !== currentAppId
            ) {
              console.warn(
                `Final check: Data belongs to application ${loadedData.applicationId}, not current application ${currentAppId}. Using defaults instead.`
              );
              initializeWithDefaults();
              return;
            }

            // Ensure IP types are properly formatted as booleans
            const formattedIpTypes = {
              copyright: Boolean(loadedData.applicantsInfo.ipTypes?.copyright),
              patent: Boolean(loadedData.applicantsInfo.ipTypes?.patent),
              utilityModel: Boolean(
                loadedData.applicantsInfo.ipTypes?.utilityModel
              ),
              industrialDesign: Boolean(
                loadedData.applicantsInfo.ipTypes?.industrialDesign
              ),
              trademark: Boolean(loadedData.applicantsInfo.ipTypes?.trademark),
              tradeSecret: Boolean(
                loadedData.applicantsInfo.ipTypes?.tradeSecret
              ),
              other: Boolean(loadedData.applicantsInfo.ipTypes?.other),
              notSure: Boolean(loadedData.applicantsInfo.ipTypes?.notSure),
            };

            // Check if we have IP types data but all values are false, while we have other form data
            const hasAllFalseIpTypes = Object.values(formattedIpTypes).every(
              (value) => value === false
            );
            const hasCopyrightApp =
              loadedData.copyrightApplication &&
              loadedData.copyrightApplication.workTitle;

            // If we have all false IP types but have a copyright application, set copyright to true
            if (hasAllFalseIpTypes && hasCopyrightApp) {
              console.log(
                "Detected all-false IP types with copyright application - fixing IP types"
              );
              formattedIpTypes.copyright = true;
            }

            // Format the data for our form
            const formattedData = {
              email: loadedData.applicantsInfo.email || "",
              applicants:
                loadedData.applicantsInfo.applicants &&
                loadedData.applicantsInfo.applicants.length > 0
                  ? loadedData.applicantsInfo.applicants
                  : [{ firstName: "", middleInitial: "", lastName: "" }],
              inventors:
                loadedData.applicantsInfo.inventors &&
                loadedData.applicantsInfo.inventors.length > 0
                  ? loadedData.applicantsInfo.inventors
                  : [{ firstName: "", middleInitial: "", lastName: "" }],
              ipTypes: formattedIpTypes,
              otherIpType: loadedData.applicantsInfo.otherIpType || "",
              isRightfulOwner: Boolean(
                loadedData.applicantsInfo.isRightfulOwner
              ),
              isApplicantAlsoInventor: Boolean(
                loadedData.applicantsInfo.isApplicantAlsoInventor
              ),
              authorizedRepresentative:
                loadedData.applicantsInfo.authorizedRepresentative || "",
            };

            // Update our local state
            console.log("Setting form data:", formattedData);
            setFormData(formattedData);

            // Also update the form context for IP types
            setSelectedIpTypes(formattedIpTypes);
            if (DEBUG) {
              console.log("Updated form context IP types:", formattedIpTypes);
            }

            // Directly apply values to the form - use setTimeout to ensure the form is ready
            setTimeout(() => {
              try {
                // First reset the form to clear any existing values
                form.reset(formattedData);

                // Then manually set each field to be extra sure
                form.setValue("email", formattedData.email);
                form.setValue("isRightfulOwner", formattedData.isRightfulOwner);
                form.setValue(
                  "isApplicantAlsoInventor",
                  formattedData.isApplicantAlsoInventor
                );
                form.setValue(
                  "authorizedRepresentative",
                  formattedData.authorizedRepresentative
                );
                form.setValue("otherIpType", formattedData.otherIpType);

                // Manually set applicants
                if (
                  formattedData.applicants &&
                  formattedData.applicants.length > 0
                ) {
                  form.setValue("applicants", formattedData.applicants);
                }

                // Manually set inventors
                if (
                  formattedData.inventors &&
                  formattedData.inventors.length > 0
                ) {
                  form.setValue("inventors", formattedData.inventors);
                }

                // Manually set checkboxes
                Object.entries(formattedIpTypes).forEach(([key, value]) => {
                  const typedKey = key as keyof IpTypes;
                  form.setValue(`ipTypes.${typedKey}`, Boolean(value));
                });
              } catch (formError) {
                console.error("Error setting form values:", formError);
              }
            }, 0);
          } else {
            console.log("No valid data found, initializing with defaults");
            initializeWithDefaults();
          }
        } catch (error) {
          console.error("Error in loadData function:", error);
          // In case of any error, initialize with defaults
          initializeWithDefaults();
        } finally {
          setInitialDataLoaded(true);
        }
      };

      // Helper function to initialize the form with default values
      const initializeWithDefaults = () => {
        console.log(
          "Initializing with default empty values for new application"
        );
          const defaultValues = {
          ...createEmptyApplicantsInfoForm(),
        };
        setFormData(defaultValues);
        setSelectedIpTypes(defaultValues.ipTypes);
        form.reset(defaultValues);
      };

      loadData();
    }
  }, [
    isHydrated,
    disclosureId,
    fetchInitialData,
    form,
    setSelectedIpTypes,
    initialDataLoaded,
    checkExistingDisclosureAndFetch,
    applicationId,
  ]);

  // Add a new effect to handle when navigating back to the applicants tab
  useEffect(() => {
    const wasOnDifferentTab = prevActiveTabRef.current !== activeTab;
    prevActiveTabRef.current = activeTab;

    // Only refresh when we navigate back to this tab (avoid resetting while typing)
    if (
    wasOnDifferentTab &&
      activeTab === "applicants-information" &&
      hasMeaningfulApplicantsData(applicantsInfo) &&
      isHydrated &&
      initialDataLoaded
    ) {
      console.log(
        "Back on applicants tab, refreshing display with store data:",
        applicantsInfo
      );

      // Format the ipTypes as booleans
      const formattedIpTypes = {
        copyright: Boolean(applicantsInfo.ipTypes?.copyright),
        patent: Boolean(applicantsInfo.ipTypes?.patent),
        utilityModel: Boolean(applicantsInfo.ipTypes?.utilityModel),
        industrialDesign: Boolean(applicantsInfo.ipTypes?.industrialDesign),
        trademark: Boolean(applicantsInfo.ipTypes?.trademark),
        tradeSecret: Boolean(applicantsInfo.ipTypes?.tradeSecret),
        other: Boolean(applicantsInfo.ipTypes?.other),
        notSure: Boolean(applicantsInfo.ipTypes?.notSure),
      };

      // Create formatted data for the form
      const formattedData = {
        email: applicantsInfo.email || "",
        applicants:
          applicantsInfo.applicants && applicantsInfo.applicants.length > 0
            ? applicantsInfo.applicants
            : [{ firstName: "", middleInitial: "", lastName: "" }],
        inventors:
          applicantsInfo.inventors && applicantsInfo.inventors.length > 0
            ? applicantsInfo.inventors
            : [{ firstName: "", middleInitial: "", lastName: "" }],
        ipTypes: formattedIpTypes,
        otherIpType: applicantsInfo.otherIpType || "",
        isRightfulOwner: Boolean(applicantsInfo.isRightfulOwner),
        isApplicantAlsoInventor: Boolean(
          applicantsInfo.isApplicantAlsoInventor
        ),
        authorizedRepresentative: applicantsInfo.authorizedRepresentative || "",
      };

      // Update local state
      setFormData(formattedData);

      // Update form context for IP types
      setSelectedIpTypes(formattedIpTypes);
      if (DEBUG) {
        console.log("Updated form context IP types:", formattedIpTypes);
      }

      // Apply values to form with a small delay to ensure component is ready
      setTimeout(() => {
        form.reset(formattedData);

        // Manually set each field to be extra sure
        form.setValue("email", formattedData.email);
        form.setValue("isRightfulOwner", formattedData.isRightfulOwner);
        form.setValue(
          "isApplicantAlsoInventor",
          formattedData.isApplicantAlsoInventor
        );
        form.setValue(
          "authorizedRepresentative",
          formattedData.authorizedRepresentative
        );

        // Set IP type checkboxes
        Object.entries(formattedIpTypes).forEach(([key, value]) => {
          const typedKey = key as keyof IpTypes;
          form.setValue(`ipTypes.${typedKey}`, Boolean(value));
        });

        console.log("Form values refreshed on tab return:", form.getValues());
      }, 50);
    }
  }, [
    activeTab,
    applicantsInfo,
    isHydrated,
    form,
    setSelectedIpTypes,
    initialDataLoaded,
  ]);

  // Redesigned form recovery and debugging component
  const FormRecoveryPanel = () => {
    const [recoveryExpanded, setRecoveryExpanded] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleReloadFormData = async () => {
      try {
        setIsResetting(true);

        // Loading toast
        toast("Restoring form data...", {
          duration: Infinity, // Prevent auto-dismiss
          icon: "⏳",
        });

        if (applicantsInfo) {
          console.log("Reloading form with stored data:", applicantsInfo);

          const resetData = {
            ...applicantsInfo,
            // Ensure applicants/inventors arrays exist
            applicants: applicantsInfo.applicants || [
              { firstName: "", middleInitial: "", lastName: "" },
            ],
            inventors: applicantsInfo.inventors || [
              { firstName: "", middleInitial: "", lastName: "" },
            ],
            // Ensure IP types are properly formatted
            ipTypes: {
              copyright: Boolean(applicantsInfo.ipTypes?.copyright),
              patent: Boolean(applicantsInfo.ipTypes?.patent),
              utilityModel: Boolean(applicantsInfo.ipTypes?.utilityModel),
              industrialDesign: Boolean(
                applicantsInfo.ipTypes?.industrialDesign
              ),
              trademark: Boolean(applicantsInfo.ipTypes?.trademark),
              tradeSecret: Boolean(applicantsInfo.ipTypes?.tradeSecret),
              other: Boolean(applicantsInfo.ipTypes?.other),
              notSure: Boolean(applicantsInfo.ipTypes?.notSure),
            },
          };

          // Update local state and form
          setFormData(resetData);
          form.reset(resetData);

          // Manually set each field as needed
          form.setValue("email", applicantsInfo.email || "");
          form.setValue(
            "isRightfulOwner",
            Boolean(applicantsInfo.isRightfulOwner)
          );
          form.setValue(
            "isApplicantAlsoInventor",
            Boolean(applicantsInfo.isApplicantAlsoInventor)
          );
          form.setValue(
            "authorizedRepresentative",
            applicantsInfo.authorizedRepresentative || ""
          );

          // Manually set checkboxes
          Object.entries(applicantsInfo.ipTypes || {}).forEach(
            ([key, value]) => {
              if (value === true) {
                const typedKey = key as keyof IpTypes;
                form.setValue(`ipTypes.${typedKey}`, true);
              }
            }
          );

          // Update context
          setSelectedIpTypes(resetData.ipTypes);
          if (DEBUG) {
            console.log("Updated form context IP types:", resetData.ipTypes);
          }

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

          // Hide the recovery panel
          setRecoveryExpanded(false);
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

        if (data && data.applicantsInfo) {
          console.log("Retrieved data from server:", data.applicantsInfo);

          // Format the data
          const formattedData = {
            email: data.applicantsInfo.email || "",
            applicants:
              data.applicantsInfo.applicants &&
              data.applicantsInfo.applicants.length > 0
                ? data.applicantsInfo.applicants
                : [{ firstName: "", middleInitial: "", lastName: "" }],
            inventors:
              data.applicantsInfo.inventors &&
              data.applicantsInfo.inventors.length > 0
                ? data.applicantsInfo.inventors
                : [{ firstName: "", middleInitial: "", lastName: "" }],
            ipTypes: {
              copyright: Boolean(data.applicantsInfo.ipTypes?.copyright),
              patent: Boolean(data.applicantsInfo.ipTypes?.patent),
              utilityModel: Boolean(data.applicantsInfo.ipTypes?.utilityModel),
              industrialDesign: Boolean(
                data.applicantsInfo.ipTypes?.industrialDesign
              ),
              trademark: Boolean(data.applicantsInfo.ipTypes?.trademark),
              tradeSecret: Boolean(data.applicantsInfo.ipTypes?.tradeSecret),
              other: Boolean(data.applicantsInfo.ipTypes?.other),
              notSure: Boolean(data.applicantsInfo.ipTypes?.notSure),
            },
            otherIpType: data.applicantsInfo.otherIpType || "",
            isRightfulOwner: Boolean(data.applicantsInfo.isRightfulOwner),
            isApplicantAlsoInventor: Boolean(
              data.applicantsInfo.isApplicantAlsoInventor
            ),
            authorizedRepresentative:
              data.applicantsInfo.authorizedRepresentative || "",
          };

          // Update local form state
          setFormData(formattedData);
          form.reset(formattedData);

          // Update context
          setSelectedIpTypes(formattedData.ipTypes);
          if (DEBUG) {
            console.log(
              "Updated form context IP types:",
              formattedData.ipTypes
            );
          }

          // Update store
          setApplicantsInfo(data.applicantsInfo);

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

          // Hide the recovery panel
          setRecoveryExpanded(false);
        } else {
          // Error toast
          toast.dismiss();
          toast("No data found on server", {
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

  const handleNext = async (e?: React.FormEvent) => {
    // If called from form submission, prevent default
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true); // 🔥 START loading
    const { ipTypes: resolvedIpTypes, otherIpType } = derivedIpTypesResult;
    form.setValue("ipTypes", resolvedIpTypes, { shouldValidate: true });
    form.setValue("otherIpType", otherIpType, { shouldValidate: true });

    // Validate the form
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("Form validation failed");
      toast("Please fill in all required fields", {
        icon: "❌",
        style: {
          backgroundColor: "#fef2f2",
          borderColor: "#fecaca",
          color: "#b91c1c",
        },
      });
      setIsSubmitting(false);
      return;
    }
    try {
      // Get form values
      const values = form.getValues();
      values.ipTypes = resolvedIpTypes;
      values.otherIpType = otherIpType;

      // Log the values for debugging
      console.log("Form values before saving:", {
        ipTypes: values.ipTypes,
        ipTypesJSON: JSON.stringify(values.ipTypes),
        ipTypesSelected: Object.entries(values.ipTypes)
          .filter(([_, selected]) => selected)
          .map(([key]) => key),
        otherIpType: values.otherIpType,
        rawValues: {
          copyright: values.ipTypes.copyright,
          trademark: values.ipTypes.trademark,
        },
        typeofCheck: {
          copyright: typeof values.ipTypes.copyright,
          trademark: typeof values.ipTypes.trademark,
        },
      });

      const ipTypesFormatted = resolvedIpTypes;

      // Create a data object with the formatted ipTypes
      const dataToSave = {
        ...values,
        ipTypes: ipTypesFormatted,
      };

      // Update our local state to ensure consistency
      setFormData(dataToSave);

      // Update the context for IP types
      setSelectedIpTypes(ipTypesFormatted);
      if (DEBUG) {
        console.log("Updated form context IP types:", ipTypesFormatted);
      }

      // Save form data to the store
      setApplicantsInfo(dataToSave);
      console.log("Saving applicants information with formatted ipTypes:", {
        ipTypes: dataToSave.ipTypes,
        ipTypesJSON: JSON.stringify(dataToSave.ipTypes),
        hasTrueValue: Object.values(dataToSave.ipTypes).some((v) => v === true),
      });

      // Save to the database WITHOUT registering in form_submission_registry
      // This avoids automatic registry entries when just navigating
      console.log(
        "Saving applicants information to database without registry creation..."
      );
      const success = await saveApplicantsInfo(dataToSave, false);

      if (success) {
        console.log(
          "Applicants information saved successfully to database (without registry)"
        );
        toast("Applicants information saved successfully", {
          icon: "✅",
          style: {
            backgroundColor: "#f0fdf4",
            borderColor: "#86efac",
            color: "#166534",
          },
        });
      } else {
        console.error("Failed to save applicants information to database");
        toast("Failed to save applicants information", {
          icon: "❌",
          style: {
            backgroundColor: "#fef2f2",
            borderColor: "#fecaca",
            color: "#b91c1c",
          },
        });
        return;
      }

      // Determine the next tab using the same visible-tab order used by the form layout
      const nextTab = getNextVisibleIpDisclosureTab(
        resolvedIpTypes,
        "applicants-information"
      );

      // Navigate to the next tab
      console.log("Navigating to tab:", nextTab);
      setActiveTab(nextTab);
    } catch (error) {
      console.error("Error saving applicants information:", error);
      toast(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      return;
    } finally {
      setIsSubmitting(false); // 🔥 STOP loading
    }
  };

  // Add an effect to update the form context when IP types change in the form
  useEffect(() => {
    // Control logging verbosity
    const DEBUG = false;

    // Add debouncing to prevent excessive updates
    let updateTimeout: NodeJS.Timeout | null = null;

    // Watch for changes to IP types in the form
    const subscription = form.watch((value, { name }) => {
      // Only update if an ipTypes field changed
      if (name && name.startsWith("ipTypes.")) {
        // Clear any existing timeout to debounce rapid changes
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        // Debounce the update to prevent multiple rapid changes
        updateTimeout = setTimeout(() => {
          const ipTypesValues = form.getValues("ipTypes");
          const formattedTypes = {
            copyright: Boolean(ipTypesValues.copyright),
            patent: Boolean(ipTypesValues.patent),
            utilityModel: Boolean(ipTypesValues.utilityModel),
            industrialDesign: Boolean(ipTypesValues.industrialDesign),
            trademark: Boolean(ipTypesValues.trademark),
            tradeSecret: Boolean(ipTypesValues.tradeSecret),
            other: Boolean(ipTypesValues.other),
            notSure: Boolean(ipTypesValues.notSure),
          };

          // Only log when DEBUG is true
          if (DEBUG) {
            console.log("Updating form context with IP types:", formattedTypes);
          }

          setSelectedIpTypes(formattedTypes);
        }, 100); // Debounce for 100ms
      }
    });

    // Cleanup subscription and any pending timeout on unmount
    return () => {
      subscription.unsubscribe();
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [form, setSelectedIpTypes]);

  const isApplicantAlsoInventor = form.watch("isApplicantAlsoInventor");
  const watchedApplicants = form.watch("applicants");
  const watchedIpTypes = form.watch("ipTypes");
  const watchedInventors = form.watch("inventors");
  const watchedEmail = form.watch("email");
  const watchedIsRightfulOwner = form.watch("isRightfulOwner");
  const hasSelectedIpType = hasSelectedIpTypes(watchedIpTypes);
  const hasApplicantNames =
    (watchedApplicants?.length ?? 0) > 0 &&
    watchedApplicants.every(
      (applicant) =>
        Boolean(applicant?.firstName?.trim()) &&
        Boolean(applicant?.lastName?.trim())
    );

  const hasInventorNames =
    (watchedInventors?.length ?? 0) > 0 &&
    watchedInventors.every(
      (inventor) =>
        Boolean(inventor?.firstName?.trim()) &&
        Boolean(inventor?.lastName?.trim())
    );

  const hasEmail = Boolean(watchedEmail?.trim());
  const isNextDisabled =
    !hasEmail ||
    !hasApplicantNames ||
    !hasInventorNames ||
    !hasSelectedIpType ||
    !watchedIsRightfulOwner;

  useEffect(() => {
    if (!hasSelectedIpType) {
      form.setError("ipTypes", {
        type: "manual",
        message: "Please select at least one IP type.",
      });
    }
  }, [form, hasSelectedIpType]);

  const goToIpTab = (type: IpTypeKeys) => {
    switch (type) {
      case "copyright":
        setActiveTab("copyright-application");
        break;
      case "patent":
      case "utilityModel":
        setActiveTab("patent-application");
        break;
      case "trademark":
        setActiveTab("trademark");
        break;
      case "tradeSecret":
        setActiveTab("trade-secret");
        break;
      default:
        break;
    }
  };

  const syncApplicantsAndInventors = () => {
    const nextValues = form.getValues();
    setFormData((prev) => ({
      ...prev,
      applicants: nextValues.applicants,
      inventors: nextValues.inventors,
    }));
    setApplicantsInfo(nextValues);
  };

  const scheduleApplicantsSync = () => {
    if (applicantsSyncTimeoutRef.current) {
      clearTimeout(applicantsSyncTimeoutRef.current);
    }
    applicantsSyncTimeoutRef.current = setTimeout(() => {
      syncApplicantsAndInventors();
    }, 150);
  };

  useEffect(() => {
    if (!isApplicantAlsoInventor) return;
    if (!watchedApplicants || watchedApplicants.length === 0) return;

    const normalizedApplicants = watchedApplicants.map((applicant) => ({
      firstName: applicant?.firstName || "",
      middleInitial: applicant?.middleInitial || "",
      lastName: applicant?.lastName || "",
    }));

    const currentInventors = form.getValues("inventors") || [];
    const isSame =
      currentInventors.length === normalizedApplicants.length &&
      currentInventors.every((inventor, index) => {
        const applicant = normalizedApplicants[index];
        return (
          inventor?.firstName === applicant.firstName &&
          inventor?.middleInitial === applicant.middleInitial &&
          inventor?.lastName === applicant.lastName
        );
      });

    if (!isSame) {
      form.setValue("inventors", normalizedApplicants, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, isApplicantAlsoInventor, watchedApplicants]);

  useEffect(() => {
    let updateTimeout: NodeJS.Timeout | null = null;

    const subscription = form.watch((_, { name }) => {
      if (!name) return;
      if (name.startsWith("applicants.") || name.startsWith("inventors.")) {
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        updateTimeout = setTimeout(() => {
          const nextValues = form.getValues();
          setFormData((prev) => ({
            ...prev,
            applicants: nextValues.applicants,
            inventors: nextValues.inventors,
          }));
          setApplicantsInfo(nextValues);
        }, 200);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [form, setApplicantsInfo]);

  useEffect(() => {
    return () => {
      if (applicantsSyncTimeoutRef.current) {
        clearTimeout(applicantsSyncTimeoutRef.current);
      }
    };
  }, []);

  // Fix the handleSaveToDatabase function to use these state variables
  const handleSaveToDatabase = async () => {
    console.log(
      "Attempting to save applicants info to database with registry creation"
    );

    // Get form values
    const formValues: ApplicantsInfo = form.getValues();
    console.log("Form values:", formValues);

    try {
      setIsSaving(true);

      // We're explicitly saving via the Update/Save button, so we should register in form_submission_registry
      // by passing the registerForm=true flag
      const result = await saveApplicantsInfo(formValues, true);

      if (result) {
        console.log("Successfully saved applicants info");
        toast.success("Applicants information saved successfully");
      } else {
        console.error("Failed to save applicants info");
        toast.error("Failed to save applicants information");
      }
    } catch (error) {
      console.error("Error saving applicants info:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save data"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Then fix the FormNavigation component to use the correct function
  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={handleNext} className="space-y-8">
          <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
            <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
              Applicant's Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Please provide information about the applicants and intellectual
              property type
            </p>
            {!hasSelectedIpType && (
              <p className="text-sm text-red-600">
                Please select an IP type in Application Title before continuing.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-6">
              <Card className="border-green-200">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-base">
                      Name of Applicant(s)<span className="text-red-500"> *</span>
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendApplicant({
                          firstName: "",
                          middleInitial: "",
                          lastName: "",
                        })
                      }
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Applicant
                    </Button>
                  </div>
                  {applicantFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1 flex gap-2">
                        <FormField
                          control={form.control}
                          name={`applicants.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="First Name"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
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
                              <FormControl>
                                <Input
                                  placeholder="M.I."
                                  maxLength={2}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
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
                              <FormControl>
                                <Input
                                  placeholder="Last Name"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeApplicant(index)}
                          className="text-green-700 hover:bg-green-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Email Address<span className="text-red-500"> *</span>
                        </FormLabel>
                        <FormDescription>
                          Enter the primary contact email address
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-base">
                      Name of Author/Inventor/Creator<span className="text-red-500"> *</span>
                    </FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendInventor({
                          firstName: "",
                          middleInitial: "",
                          lastName: "",
                        })
                      }
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add {getCreatorLabel()}
                    </Button>
                  </div>
                  {/* <FormField
                    control={form.control}
                    name="isApplicantAlsoInventor"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            Applicant is also the Author/Inventor/Creator
                          </FormLabel>
                          <FormDescription>
                            This will copy the applicant name(s) below
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  /> */}
                  {inventorFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="flex-1 flex gap-2">
                        <FormField
                          control={form.control}
                          name={`inventors.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="First Name"
                                  {...field}
                                  readOnly={isApplicantAlsoInventor}
                                  aria-readonly={isApplicantAlsoInventor}
                                  className={
                                    isApplicantAlsoInventor
                                      ? "bg-slate-100 text-slate-500"
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`inventors.${index}.middleInitial`}
                          render={({ field }) => (
                            <FormItem className="w-20">
                              <FormControl>
                                <Input
                                  placeholder="M.I."
                                  maxLength={2}
                                  {...field}
                                  readOnly={isApplicantAlsoInventor}
                                  aria-readonly={isApplicantAlsoInventor}
                                  className={
                                    isApplicantAlsoInventor
                                      ? "bg-slate-100 text-slate-500"
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`inventors.${index}.lastName`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Last Name"
                                  {...field}
                                  readOnly={isApplicantAlsoInventor}
                                  aria-readonly={isApplicantAlsoInventor}
                                  className={
                                    isApplicantAlsoInventor
                                      ? "bg-slate-100 text-slate-500"
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  onInput={scheduleApplicantsSync}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInventor(index)}
                          className="text-green-700 hover:bg-green-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
{/*}
           <div className="space-y-6">
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Email Address<span className="text-red-500"> *</span>
                        </FormLabel>
                        <FormDescription>
                          Enter the primary contact email address
                        </FormDescription>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>*/}
          </div>
          

          <Card className="col-span-2 border-green-200">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="isRightfulOwner"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          id="isRightfulOwner"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <label
                        htmlFor="isRightfulOwner"
                        className="space-y-1 leading-none cursor-pointer"
                      >
                        <FormDescription className="font-semibold text-foreground">
                          Applicant&apos;s Right and Ownership
                          <span className="ml-2 text-red-600">*</span>
                          <br />I confirm that I am the rightful applicant or
                          authorized representative
                        </FormDescription>
                        <FormLabel className="text-sm text-muted-foreground" />
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          <FormNavigation
            onSave={handleSaveToDatabase}
            onNext={handleNext}
            showNext={true}
            isSaving={isSaving}
            isSubmitting={isSubmitting}
            isNextDisabled={isNextDisabled}
          />

          {/* Form Recovery Panel positioned after FormNavigation */}
          <div className="flex justify-center mt-4">
            <FormRecoveryPanel />
          </div>
        </form>
      </Form>
    </div>
  );
}
