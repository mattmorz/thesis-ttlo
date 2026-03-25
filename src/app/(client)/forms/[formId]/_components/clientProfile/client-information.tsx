"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { safeFetch } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Form schema for client information
 * All fields are optional to allow navigation between tabs without validation errors
 *
 * The schema is divided into four main sections:
 * 1. Personal Information
 * 2. Mailing Address
 * 3. Contact Information
 * 4. Company/Institution or Academic Information
 */

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  gender: z.object({
    value: z
      .string()
      .min(1, "Gender is required")
      .refine(
        (value) => ["male", "female", "prefer_not_to_say"].includes(value),
        "Gender is required"
      ),
  }),
  age: z
    .number({
      required_error: "Age is required",
      invalid_type_error: "Age must be a number",
    })
    .min(1, "Age is required")
    .max(100, "Age must be 100 or less"),
  citizenship: z.object({
    value: z.enum(["filipino", "other"]),
    otherValue: z.string().optional().nullable(),
  }),
  mailingAddress: z.string().min(1, "Mailing address is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  hasCompany: z.boolean().default(true),
  companyName: z.string().optional(),
  companyStreet: z.string().optional(),
  companyBarangay: z.string().optional(),
  companyCityMunicipality: z.string().optional(),
  companyProvince: z.string().optional(),
  companyEmail: z.string().email("Invalid email address").optional(),
  collegeName: z.string().optional(),
  departmentName: z.string().optional(),
  occupation: z.string().min(1, "Occupation is required"),
  affiliationType: z.enum(["company", "academic", "none"], {
    required_error: "Affiliation type is required",
  }),
});

const getLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateAgeFromBirthDate = (
  birthDateValue: string,
): number | undefined => {
  if (!birthDateValue) return undefined;
  const [year, month, day] = birthDateValue.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  if (age < 0) return undefined;
  return Math.min(age, 100);
};

// Add these props to the component
interface ClientInformationProps {
  initialData?: any;
  isDisabled?: boolean;
}

// Add TypeScript declaration for window global methods
declare global {
  interface Window {
    updateIPFormStatus?: (
      formType: string,
      completed: boolean,
      applicationId: string,
    ) => void;
    _apiRequestsInProgress?: Record<string, boolean>;
  }
}

/**
 * ClientInformation Component
 *
 * This component handles the personal information tab of the client profile form.
 * It manages:
 * - Personal details (name, gender, age, citizenship)
 * - Contact information (email, phone)
 * - Mailing address
 * - Company/Institution details
 *
 * Features:
 * - Data persistence using localStorage
 * - Form validation
 * - Error handling
 * - Navigation to next tab
 */
export function ClientInformation({
  initialData,
  isDisabled = false,
}: ClientInformationProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "personal";
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [selectedCitizenship, setSelectedCitizenship] = useState<string | null>(
    null,
  );
  const [birthDate, setBirthDate] = useState<string>("");

  // Get active application for registry integration
  const { activeApplicationId } = useActiveApplication();

  // Initialize form submission hook for registry
  const { registerForm } = useFormSubmission({
    showToasts: false, // We'll handle toasts ourselves
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      gender: { value: "" },
      age: undefined,
      citizenship: { value: "filipino", otherValue: null },
      mailingAddress: "",
      contactNumber: "",
      email: "",
      hasCompany: true,
      companyName: "",
      companyStreet: "",
      companyBarangay: "",
      companyCityMunicipality: "",
      companyProvince: "",
      companyEmail: "",
      collegeName: "",
      departmentName: "",
      occupation: "",
      affiliationType: "company",
    },
  });

  // Watch the hasCompany field to respond to changes
  const hasCompany = form.watch("hasCompany");

  // Watch required fields to disable the "Next" button
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const mailingAddress = form.watch("mailingAddress");
  const contactNumber = form.watch("contactNumber");
  const email = form.watch("email");
  const occupation = form.watch("occupation");
  const affiliationType = form.watch("affiliationType");
  const companyName = form.watch("companyName");
  const companyStreet = form.watch("companyStreet");
  const companyBarangay = form.watch("companyBarangay");
  const companyCityMunicipality = form.watch("companyCityMunicipality");
  const companyProvince = form.watch("companyProvince");
  const companyEmail = form.watch("companyEmail");
  const collegeName = form.watch("collegeName");
  const departmentName = form.watch("departmentName");

  let isNextDisabled =
    !firstName?.trim() ||
    !lastName?.trim() ||
    !mailingAddress?.trim() ||
    !contactNumber?.trim() ||
    !email?.trim() ||
    !occupation?.trim() ||
    !affiliationType;

  if (affiliationType === "company") {
    isNextDisabled =
      isNextDisabled ||
      !companyName?.trim() ||
      !companyStreet?.trim() ||
      !companyBarangay?.trim() ||
      !companyCityMunicipality?.trim() ||
      !companyProvince?.trim() ||
      !companyEmail?.trim();
  }

  if (affiliationType === "academic") {
    isNextDisabled =
      isNextDisabled || !collegeName?.trim() || !departmentName?.trim();
  }

  // Add effect to respond to hasCompany changes
  useEffect(() => {
    if (hasCompany === false) {
      console.log(
        "[ClientInformation] Toggle is now off (academic institution)",
      );
    } else {
      console.log("[ClientInformation] Toggle is now on (company/institution)");
    }
  }, [hasCompany]);

  // Load initial data or saved data on component mount
  useEffect(() => {
    try {
      console.log("[ClientInformation] Loading form data...");
      console.log("[ClientInformation] InitialData from server:", initialData);
      console.log(
        "[ClientInformation] Current applicationId:",
        activeApplicationId,
      );

      // Use applicationId as key in localStorage to prevent cross-application data leakage
      const storageKey = activeApplicationId
        ? `clientInformationData-${activeApplicationId}`
        : "clientInformationData";

      // For backward compatibility, check both keys
      let savedData = localStorage.getItem(storageKey);
      if (!savedData && activeApplicationId) {
        // Try the legacy key
        const legacyData = localStorage.getItem("clientInformationData");
        if (legacyData) {
          console.log(
            "[ClientInformation] Found data in legacy localStorage key, migrating...",
          );
          // Migrate to new application-specific key
          localStorage.setItem(storageKey, legacyData);
          // Remove from legacy key to prevent cross-contamination
          localStorage.removeItem("clientInformationData");
          savedData = legacyData;
        }
      }

      let formattedData;

      // Initialize with initialData as base
      if (initialData) {
        console.log("[ClientInformation] Starting with initialData as base");

        formattedData = {
          ...initialData,
          gender:
            typeof initialData.gender === "object" &&
            initialData.gender !== null
              ? initialData.gender
              : {
                  value:
                    typeof initialData.gender === "string"
                      ? initialData.gender
                      : "",
                },
          citizenship: initialData.citizenship || {
            value: "filipino",
            otherValue: null,
          },
        };
      } else {
        // No initial data, start with empty form
        console.log(
          "[ClientInformation] No initial data provided, using empty form",
        );
        formattedData = {
          firstName: "",
          lastName: "",
          middleName: "",
          gender: { value: "" },
          age: undefined,
          citizenship: { value: "filipino", otherValue: null },
          mailingAddress: "",
          contactNumber: "",
          email: "",
          hasCompany: true,
          companyName: "",
          companyStreet: "",
          companyBarangay: "",
          companyCityMunicipality: "",
          companyProvince: "",
          companyEmail: "",
          collegeName: "",
          departmentName: "",
          occupation: "",
          affiliationType: "company",
        };
      }

      // Only use localStorage data if it's for the current application
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(
          "[ClientInformation] Found saved data in localStorage:",
          parsedData,
        );

        // Override initialData with localStorage data
        formattedData = {
          ...formattedData, // Base from initialData
          ...parsedData, // Override with localStorage values

          // Ensure specific objects are properly merged
          gender: {
            value: parsedData.gender?.value || formattedData.gender?.value || "",
          },

          citizenship: {
            value:
              parsedData.citizenship?.value ||
              formattedData.citizenship?.value ||
              "filipino",
            otherValue:
              parsedData.citizenship?.value === "other"
                ? parsedData.citizenship.otherValue
                : null,
          },
        };

        console.log(
          "[ClientInformation] Final merged data (localStorage prioritized):",
          formattedData,
        );
      }

      // Make sure gender has a valid value
      if (!formattedData.gender || typeof formattedData.gender !== "object") {
        formattedData.gender = { value: "" };
      } else if (
        !formattedData.gender.value ||
        typeof formattedData.gender.value !== "string"
      ) {
        formattedData.gender.value = "";
      } else if (
        !["male", "female", "prefer_not_to_say"].includes(
          formattedData.gender.value,
        )
      ) {
        formattedData.gender.value = "";
      }

      // Fix citizenship data
      if (formattedData.citizenship) {
        // Make sure we have a valid value
        const hasValidValue =
          formattedData.citizenship.value === "filipino" ||
          formattedData.citizenship.value === "other";

        if (!hasValidValue) {
          // Default to filipino if invalid
          formattedData.citizenship.value = "filipino";
          formattedData.citizenship.otherValue = null;
        }

        // Ensure proper otherValue based on citizenship type
        if (formattedData.citizenship.value === "filipino") {
          formattedData.citizenship.otherValue = null;
        } else if (
          formattedData.citizenship.value === "other" &&
          !formattedData.citizenship.otherValue
        ) {
          formattedData.citizenship.otherValue = "";
        }
      }

      // Now always save the merged data back to localStorage to keep it in sync
      // Only save if we have an active application
      if (activeApplicationId) {
        // Ensure formattedData has proper values for hasCompany and related fields
        if (formattedData.hasCompany === undefined) {
          // Check if college/department fields have values
          const hasCollegeData =
            (formattedData.collegeName &&
              formattedData.collegeName.trim() !== "") ||
            (formattedData.departmentName &&
              formattedData.departmentName.trim() !== "");

          // Check if company fields have values
          const hasCompanyData =
            (formattedData.companyName &&
              formattedData.companyName.trim() !== "") ||
            (formattedData.companyEmail &&
              formattedData.companyEmail.trim() !== "") ||
            (formattedData.companyStreet &&
              formattedData.companyStreet.trim() !== "") ||
            (formattedData.companyBarangay &&
              formattedData.companyBarangay.trim() !== "") ||
            (formattedData.companyCityMunicipality &&
              formattedData.companyCityMunicipality.trim() !== "") ||
            (formattedData.companyProvince &&
              formattedData.companyProvince.trim() !== "");

          // Prioritize college data if it exists
          if (hasCollegeData) {
            formattedData.hasCompany = false;
            console.log(
              "[ClientInformation] Detected college data, setting hasCompany to false",
            );
          } else if (hasCompanyData) {
            formattedData.hasCompany = true;
            console.log(
              "[ClientInformation] Detected company data, setting hasCompany to true",
            );
          } else {
            // Default to company if no data is present
            formattedData.hasCompany = true;
            console.log(
              "[ClientInformation] No affiliation data detected, defaulting to company",
            );
          }
        }

        localStorage.setItem(storageKey, JSON.stringify(formattedData));
      }

      // If we have data from either source, use it
      if (formattedData) {
        console.log(
          "[ClientInformation] Setting form with data:",
          formattedData,
        );

        // Ensure the form is reset with the correct data
        setTimeout(() => {
          form.reset(formattedData);
          setFormData(formattedData);
          form.trigger(undefined, { shouldFocus: false });

          // Explicitly update selectedCitizenship to match the loaded data
          if (formattedData.citizenship && formattedData.citizenship.value) {
            setSelectedCitizenship(formattedData.citizenship.value);
            console.log(
              "[ClientInformation] Updated citizenship selection:",
              formattedData.citizenship,
            );
          }
        }, 0);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error("[ClientInformation] Error loading saved data:", errorObj);
      setError(errorObj);
    } finally {
      setIsFormLoaded(true);
    }
  }, [initialData, form, activeApplicationId]);

  // Add tab change detection for better data persistence
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    // Add event listener for tab changes
    const handleTabChange = () => {
      if (isFormLoaded) {
        // Save current form state to localStorage
        const values = form.getValues();

        // Ensure gender data is properly formatted
        const formattedValues = {
          ...values,
          gender: {
            value: values.gender?.value || "",
          },
        };

        // Use application-specific key
        const storageKey = activeApplicationId
          ? `clientInformationData-${activeApplicationId}`
          : "clientInformationData";

        console.log(
          "[ClientInformation] Tab change detected, saving form state:",
          formattedValues,
        );
        localStorage.setItem(storageKey, JSON.stringify(formattedValues));
      }
    };

    // Also listen for URL changes that don't trigger popstate
    const handleBeforeUnload = () => {
      if (isFormLoaded) {
        const values = form.getValues();

        // Ensure gender data is properly formatted
        const formattedValues = {
          ...values,
          gender: {
            value: values.gender?.value || "",
          },
        };

        // Use application-specific key
        const storageKey = activeApplicationId
          ? `clientInformationData-${activeApplicationId}`
          : "clientInformationData";

        console.log(
          "[ClientInformation] Page unload detected, saving form state",
        );
        localStorage.setItem(storageKey, JSON.stringify(formattedValues));
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

        // Ensure gender data is properly formatted
        const formattedValues = {
          ...values,
          gender: {
            value: values.gender?.value || "",
          },
        };

        console.log(
          "[ClientInformation] Component unmounting, saving form state",
        );
        localStorage.setItem(
          "clientInformationData",
          JSON.stringify(formattedValues),
        );
      }

      // Remove event listeners
      window.removeEventListener("popstate", handleTabChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [form, isFormLoaded]);

  // Save state when leaving the personal tab
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // or when the currentTab changes
      if (currentTab !== "personal" && isFormLoaded) {
        // Save current form state to localStorage before unmounting
        try {
          const values = form.getValues();

          // Format values for localStorage
          const formattedValues = {
            ...values,
            gender: {
              value: values.gender?.value || "",
            },
            citizenship: {
              value: values.citizenship?.value || "filipino",
              otherValue:
                values.citizenship?.value === "other"
                  ? values.citizenship.otherValue
                  : null,
            },
          };

          // Use application-specific key
          const storageKey = activeApplicationId
            ? `clientInformationData-${activeApplicationId}`
            : "clientInformationData";

          localStorage.setItem(storageKey, JSON.stringify(formattedValues));
          console.log(
            "[ClientInformation] Saved personal information data on tab change:",
            formattedValues,
          );
        } catch (error) {
          console.error(
            "[ClientInformation] Error saving personal data:",
            error,
          );
        }
      }
    };
  }, [currentTab, form, isFormLoaded]);

  // Add a effect to update UI based on form data
  useEffect(() => {
    // When form data changes, make sure UI reflects current state
    if (formData) {
      // Detect if we should be showing company or college fields based on the data
      const hasCollegeData = formData.collegeName || formData.departmentName;
      const hasCompanyData =
        formData.companyName ||
        formData.companyEmail ||
        formData.companyStreet ||
        formData.companyBarangay ||
        formData.companyCityMunicipality ||
        formData.companyProvince;

      // If hasCompany is not explicitly set but we have college data, update the toggle
      if (hasCollegeData && !hasCompanyData && formData.hasCompany === true) {
        form.setValue("hasCompany", false);
      }

      // If hasCompany is not explicitly set but we have company data, update the toggle
      if (hasCompanyData && !hasCollegeData && formData.hasCompany === false) {
        form.setValue("hasCompany", true);
      }
    }
  }, [formData, form]);

  // Handle form submission with API call
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (isDisabled) {
      toast.error("Form is currently locked and cannot be submitted");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the active application ID for submission
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsSubmitting(false);
        return;
      }

      // Format and validate the data before saving
      const formattedValues = {
        ...values,
        // Ensure hasCompany is properly set
        hasCompany:
          values.hasCompany !== undefined
            ? values.hasCompany
            : (values.collegeName && values.collegeName.trim() !== "") ||
                (values.departmentName && values.departmentName.trim() !== "")
              ? false
              : true,
        // Explicitly ensure no fields are accidentally cleared
        companyName: values.companyName || undefined,
        companyEmail: values.companyEmail || undefined,
        companyStreet: values.companyStreet || undefined,
        companyBarangay: values.companyBarangay || undefined,
        companyCityMunicipality: values.companyCityMunicipality || undefined,
        companyProvince: values.companyProvince || undefined,
        collegeName: values.collegeName || undefined,
        departmentName: values.departmentName || undefined,
        // Fix citizenship data
        citizenship: {
          value: values.citizenship?.value || "filipino",
          otherValue:
            values.citizenship?.value === "filipino"
              ? undefined
              : values.citizenship?.otherValue || "",
        },
        // Ensure gender is properly formatted
        gender: {
          value:
            !values.gender?.value ||
            !["male", "female", "prefer_not_to_say"].includes(
              values.gender.value,
            )
              ? "male"
              : values.gender.value,
        },
      };

      // Store form data in localStorage for persistence
      const storageKey = activeApplicationId
        ? `clientInformationData-${activeApplicationId}`
        : "clientInformationData";

      localStorage.setItem(storageKey, JSON.stringify(formattedValues));
      setFormData(formattedValues);

      // Show loading toast
      const toastId = toast.loading("Submitting Form", {
        description: "Please wait while we process your submission...",
      });

      // Ensure hasCompany is always treated as a boolean
      const ensureBoolean = (value: any): boolean => {
        if (typeof value === "boolean") return value;
        if (value === "false") return false;
        if (value === "true") return true;
        return Boolean(value);
      };

      // Get explicit boolean value for hasCompany
      const hasCompanyValue = ensureBoolean(formattedValues.hasCompany);

      // Log the real hasCompany value before API submission
      console.log("[ClientInformation] PRE-API hasCompany value:", {
        rawValue: formattedValues.hasCompany,
        processedValue: hasCompanyValue,
      });

      // Create a clean API data object based on hasCompany value
      const personalInfoData = hasCompanyValue
        ? {
            // Company affiliation - only include company fields
            firstName: formattedValues.firstName,
            lastName: formattedValues.lastName,
            middleName: formattedValues.middleName,
            gender: formattedValues.gender,
            age: formattedValues.age,
            citizenship: formattedValues.citizenship,
            mailingAddress: formattedValues.mailingAddress,
            contactNumber: formattedValues.contactNumber,
            email: formattedValues.email,
            occupation: formattedValues.occupation,
            hasCompany: true,
            // Company fields
            companyName: formattedValues.companyName || "",
            companyStreet: formattedValues.companyStreet || "",
            companyBarangay: formattedValues.companyBarangay || "",
            companyCityMunicipality:
              formattedValues.companyCityMunicipality || "",
            companyProvince: formattedValues.companyProvince || "",
            companyEmail: formattedValues.companyEmail || "",
            // Explicitly set college fields to empty strings
            collegeName: "",
            departmentName: "",
          }
        : {
            // Academic affiliation - only include college fields
            firstName: formattedValues.firstName,
            lastName: formattedValues.lastName,
            middleName: formattedValues.middleName,
            gender: formattedValues.gender,
            age: formattedValues.age,
            citizenship: formattedValues.citizenship,
            mailingAddress: formattedValues.mailingAddress,
            contactNumber: formattedValues.contactNumber,
            email: formattedValues.email,
            occupation: formattedValues.occupation,
            hasCompany: false,
            // Explicitly set company fields to empty strings
            companyName: "",
            companyStreet: "",
            companyBarangay: "",
            companyCityMunicipality: "",
            companyProvince: "",
            companyEmail: "",
            // College fields
            collegeName: formattedValues.collegeName || "",
            departmentName: formattedValues.departmentName || "",
          };

      // Format data for API submission
      const apiData = {
        personalInfo: personalInfoData,
        educationalBackground: {},
        backgroundIP: {},
        status: "draft",
        applicationId: applicationId, // Include the application ID for registry tracking
        registerForm: true, // Explicitly set to register in form submission registry,
        _affiliationType: hasCompanyValue ? "company" : "academic",
      };

      console.log(
        "[ClientInformation] Submitting API data with hasCompany=",
        formattedValues.hasCompany,
      );
      console.log("[ClientInformation] College data:", {
        collegeName: apiData.personalInfo.collegeName,
        departmentName: apiData.personalInfo.departmentName,
      });

      // Detailed logging to understand what's being sent
      console.log("[ClientInformation] FINAL API REQUEST:", {
        affiliationType: hasCompanyValue ? "company" : "academic",
        hasCompany: apiData.personalInfo.hasCompany,
        companyFields: {
          companyName: apiData.personalInfo.companyName,
          companyEmail: apiData.personalInfo.companyEmail,
        },
        collegeFields: {
          collegeName: apiData.personalInfo.collegeName,
          departmentName: apiData.personalInfo.departmentName,
        },
      });

      // Log the stringified version for reference
      console.log(
        "[ClientInformation] API DATA RAW:",
        JSON.stringify(apiData.personalInfo, null, 2),
      );

      // Log the boolean value explicitly for clarity
      console.log(
        "[ClientInformation] hasCompany raw value:",
        personalInfoData.hasCompany,
        "type:",
        typeof personalInfoData.hasCompany,
      );

      // Create a cache key for this request to prevent duplicates
      const cacheKey = `client-profile-exists-check-${applicationId}`;

      // Check if we have a request in progress for this application
      if (
        window._apiRequestsInProgress &&
        window._apiRequestsInProgress[cacheKey]
      ) {
        console.log(
          `Request already in progress for ${applicationId}, waiting...`,
        );
        // Wait for the existing request to complete
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (
              !window._apiRequestsInProgress ||
              !window._apiRequestsInProgress[cacheKey]
            ) {
              clearInterval(checkInterval);
              resolve(null);
            }
          }, 100);
        });
      }

      // Create or update the global request tracking object
      if (!window._apiRequestsInProgress) {
        window._apiRequestsInProgress = {};
      }

      // Mark this request as in progress
      window._apiRequestsInProgress[cacheKey] = true;

      try {
        // First, check if a profile already exists for this application
        console.log(
          `Checking if profile exists for application: ${applicationId}`,
        );
        const checkResponse = await safeFetch(
          `/api/client-profile/exists/${applicationId}`,
          {},
          `client-info-exists-${applicationId}`, // Unique cache key
        );

        // Handle 404 or other error status codes gracefully
        if (checkResponse.status === 404) {
          console.log(
            `Profile not found for application: ${applicationId}, will create new profile`,
          );
          // Use POST method if the application doesn't exist
          const method = "POST";

          // Continue with submission
          await submitProfileData(apiData, method, toastId, applicationId);
          return;
        }

        if (!checkResponse.ok) {
          throw new Error(
            `Failed to check profile existence: ${checkResponse.statusText}`,
          );
        }

        // Clone the response to prevent body stream already read errors
        const checkResponseClone = checkResponse.clone();
        let checkData;

        try {
          checkData = await checkResponse.json();
        } catch (error) {
          console.error("Error parsing exists response:", error);
          // Try with the clone if parsing fails
          checkData = await checkResponseClone.json();
        }

        // Determine whether to use POST (create) or PUT (update)
        const exists =
          checkData && typeof checkData.exists === "boolean"
            ? checkData.exists
            : false;
        const method = exists ? "PUT" : "POST";

        console.log(
          `Using ${method} method for client profile. Profile exists: ${exists}`,
        );

        await submitProfileData(apiData, method, toastId, applicationId);
      } catch (error) {
        // Handle error
        console.error("Error submitting form:", error);
        toast.error("Failed to save personal information", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        toast.dismiss(toastId);
      } finally {
        // Clear the in-progress flag to allow future requests
        if (window._apiRequestsInProgress) {
          delete window._apiRequestsInProgress[cacheKey];
        }
        setIsSubmitting(false);
        setClickedButton(null);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving your data",
      );
    }
  }

  // Helper function to dispatch form submission events
  async function dispatchFormEvents(
    clientProfileId: string,
    registryId?: string | null,
  ) {
    if (typeof window === "undefined" || !activeApplicationId) return;

    console.log(
      "[ClientInformation] Dispatching client profile submission events",
      {
        clientProfileId,
        registryId,
        applicationId: activeApplicationId,
      },
    );

    // If no registryId provided, try to register directly
    if (!registryId && form && activeApplicationId) {
      try {
        // Get current personal info from form for registry
        const personalValues = form.getValues();
        const formattedPersonalInfo = formatData(personalValues);

        // Try to register in form registry
        const registryResult = await registerInFormRegistry(
          clientProfileId,
          activeApplicationId,
          formattedPersonalInfo,
        );

        if (registryResult?.registryId) {
          console.log(
            "[ClientInformation] Successfully registered form in registry:",
            registryResult,
          );
          // Update registryId with the one we just created
          registryId = registryResult.registryId;
        }
      } catch (regError) {
        console.error("[ClientInformation] Error registering form:", regError);
      }
    }

    // Create a custom event for other parts of the app to know data was submitted
    const submissionEvent = new CustomEvent("clientProfileSubmitted", {
      detail: {
        applicationId: activeApplicationId,
        clientProfileId: clientProfileId,
        registryId: registryId || null,
      },
    });
    window.dispatchEvent(submissionEvent);

    // Also dispatch a generic form completed event
    const formCompletedEvent = new CustomEvent("form_completed", {
      detail: {
        formType: "client_profile",
        completed: true,
        applicationId: activeApplicationId,
        clientProfileId: clientProfileId,
        registryId: registryId || null,
      },
    });
    window.dispatchEvent(formCompletedEvent);

    // Also update the global form status if available
    if (window.updateIPFormStatus) {
      window.updateIPFormStatus("client_profile", true, activeApplicationId);
    }

    console.log("[ClientInformation] Form submission events dispatched");
  }

  // Helper function to submit profile data
  async function submitProfileData(
    apiData: any,
    method: string,
    toastId: string | number,
    applicationId: string,
  ) {
    try {
      // Ensure the registerForm flag is set to true to explicitly request form registration
      apiData.registerForm = true;

      console.log(
        `📝 Submitting client profile with registerForm=${apiData.registerForm} for application ${applicationId} using ${method}`,
      );

      // Submit to API
      const response = await safeFetch(
        "/api/client-profile",
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        },
        `client-info-submit-${applicationId}-${method}`, // Unique cache key
      );

      // Clone the response to prevent body stream already read errors
      const responseClone = response.clone();

      if (!response.ok) {
        let errorMessage = `Failed to submit form: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          try {
            // Try with the clone if parsing fails
            const errorText = await responseClone.text();
            errorMessage = `Failed to submit form: ${
              errorText || response.statusText
            }`;
          } catch (textError) {
            console.error("Error getting response text:", textError);
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      // Try to parse the response and check if it contains the expected data
      try {
        const result = await response.json();

        // Validate the server response to ensure it matches our input
        if (result && result.data) {
          const responseData = result.data;
          const ensureBool = (value: any): boolean => {
            if (typeof value === "boolean") return value;
            if (value === "false") return false;
            if (value === "true") return true;
            return Boolean(value);
          };

          // Use the current value of hasCompany from the form
          const expectedHasCompany = ensureBool(
            apiData.personalInfo.hasCompany,
          );
          const actualHasCompany = responseData.hasCompany;

          // Check if hasCompany in response matches what we sent
          if (expectedHasCompany !== actualHasCompany) {
            console.error(
              "[ClientInformation] Server response hasCompany mismatch:",
              {
                expected: expectedHasCompany,
                actual: actualHasCompany,
              },
            );

            // If we're sending academic institution data (hasCompany=false) but it's not saved
            if (
              expectedHasCompany === false &&
              (!responseData.collegeName || !responseData.departmentName)
            ) {
              console.error(
                "[ClientInformation] College data not saved correctly:",
                {
                  expected: {
                    collegeName: apiData.personalInfo.collegeName,
                    departmentName: apiData.personalInfo.departmentName,
                  },
                  actual: {
                    collegeName: responseData.collegeName,
                    departmentName: responseData.departmentName,
                  },
                },
              );

              // Show error about college data not saving
              toast.error("College data not saved correctly", {
                description:
                  "Your academic institution information was not saved correctly. Please try again.",
              });
            }
          }

          // Get the clientId and registryId from the response
          const clientProfileId = responseData.clientId;
          // Check for registry information in the new format
          const registryId =
            responseData.registryId ||
            (result.registry && result.registry.success
              ? result.registry.registryId
              : null);

          console.log("[ClientInformation] Form submission results:", {
            clientProfileId,
            registryId,
            registrySuccess: result.registry?.success,
          });

          // If registryId is still null but we have a clientProfileId, try direct form-registry API call
          if (!registryId && clientProfileId) {
            try {
              console.log(
                "[ClientInformation] Attempting direct form registry API call as fallback",
                {
                  sourceType: "client_profile",
                  sourceId: clientProfileId,
                  ipApplicationId: applicationId,
                  formData: {
                    name: `${apiData.personalInfo.firstName} ${apiData.personalInfo.lastName}`,
                    email: apiData.personalInfo.email,
                  },
                },
              );

              // Try up to 3 times with exponential backoff
              let attemptCount = 0;
              let registrySuccess = false;

              while (attemptCount < 3 && !registrySuccess) {
                attemptCount++;

                if (attemptCount > 1) {
                  console.log(
                    `[ClientInformation] Registry API retry attempt ${attemptCount}`,
                  );
                  // Wait with exponential backoff: 1s, 2s, 4s
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.pow(2, attemptCount - 1) * 500),
                  );
                }

                const directRegistryResponse = await fetch(
                  "/api/form-registry",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Registry-Fallback": "true", // Add a custom header to track fallback attempts
                    },
                    body: JSON.stringify({
                      sourceType: "client_profile",
                      sourceId: clientProfileId,
                      ipApplicationId: applicationId,
                      status: "submitted",
                      title: `Client Profile - ${apiData.personalInfo.firstName} ${apiData.personalInfo.lastName}`,
                      description: "Client Profile form submission",
                      inventorsCreators: [
                        {
                          name: `${apiData.personalInfo.firstName} ${apiData.personalInfo.lastName}`,
                          role: "Applicant",
                        },
                      ],
                    }),
                  },
                );

                if (directRegistryResponse.ok) {
                  const directRegistryResult =
                    await directRegistryResponse.json();
                  if (directRegistryResult?.data?.registryId) {
                    console.log(
                      "[ClientInformation] Direct registry API call successful:",
                      directRegistryResult,
                    );

                    // Dispatch form events with the new registry ID
                    dispatchFormEvents(
                      clientProfileId,
                      directRegistryResult.data.registryId,
                    );
                    registrySuccess = true;
                    break;
                  } else {
                    console.warn(
                      "[ClientInformation] Registry API returned success but no registry ID",
                    );
                  }
                } else {
                  console.error(
                    `[ClientInformation] Direct registry API call failed (attempt ${attemptCount}):`,
                    {
                      status: directRegistryResponse.status,
                      statusText: directRegistryResponse.statusText,
                    },
                  );

                  // Try to get error details
                  try {
                    const errorData = await directRegistryResponse.json();
                    console.error(
                      "[ClientInformation] Registry error details:",
                      errorData,
                    );
                  } catch (parseError) {
                    // Ignore parse errors
                  }
                }
              }

              // If all retries failed, still continue with form submission
              if (!registrySuccess) {
                console.error(
                  "[ClientInformation] All registry API attempts failed",
                );
                // Still dispatch events but without registry ID
                dispatchFormEvents(clientProfileId, null);
              }
            } catch (regError) {
              console.error(
                "[ClientInformation] Error in direct registry API call:",
                regError,
              );
              // Still dispatch events without registry ID
              dispatchFormEvents(clientProfileId, null);
            }
          } else {
            // Normal dispatch with available IDs
            dispatchFormEvents(clientProfileId, registryId);
          }
        }

        // Update the client profile form status
        if (window.updateIPFormStatus) {
          window.updateIPFormStatus("clientProfile", true, applicationId);
        }

        // Dismiss loading toast
        toast.dismiss(toastId);

        // Show success toast
        if (method === "POST") {
          toast.success("Personal Information Saved", {
            description:
              "Your personal information has been saved successfully.",
          });
        } else {
          toast.success("Personal Information Updated", {
            description:
              "Your personal information has been updated successfully.",
          });
        }

        // Show registry success separately
        if (result.registry?.success) {
          toast.success("Form Registered Successfully", {
            description: "Your form has been registered in the system.",
          });
        } else if (result.data?.clientId && !result.data?.registryId) {
          toast.warning("Form Registry Pending", {
            description:
              "Your form data was saved but registry may be pending.",
          });
        }

        // If it's next button, navigate to next tab
        if (clickedButton === "next") {
          handleNextClick();
        }
      } catch (parseError) {
        console.error("Error parsing response data:", parseError);
        toast.dismiss(toastId);
        toast.error("Error parsing server response", {
          description: "The server returned an unexpected response format.",
        });
      }
    } catch (error) {
      console.error("Error in submitProfileData:", error);
      throw error; // Rethrow for the caller to handle
    }
  }

  // Handle update without submission
  async function handleUpdate() {
    try {
      setIsUpdating(true);

      // Get the active application ID for submission
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsUpdating(false);
        return;
      }

      // Get form values from current tab
      const values = form.getValues();

      // Format and validate the data before saving
      const formattedValues = {
        ...values,
        // Ensure hasCompany is properly set
        hasCompany:
          values.hasCompany !== undefined
            ? values.hasCompany
            : (values.collegeName && values.collegeName.trim() !== "") ||
                (values.departmentName && values.departmentName.trim() !== "")
              ? false
              : true,
        // Explicitly ensure no fields are accidentally cleared
        companyName: values.companyName || undefined,
        companyEmail: values.companyEmail || undefined,
        companyStreet: values.companyStreet || undefined,
        companyBarangay: values.companyBarangay || undefined,
        companyCityMunicipality: values.companyCityMunicipality || undefined,
        companyProvince: values.companyProvince || undefined,
        collegeName: values.collegeName || undefined,
        departmentName: values.departmentName || undefined,
        // Fix citizenship data
        citizenship: {
          value: values.citizenship?.value || "filipino",
          otherValue:
            values.citizenship?.value === "filipino"
              ? undefined
              : values.citizenship?.otherValue || "",
        },
        // Ensure gender is properly formatted
        gender: {
          value:
            !values.gender?.value ||
            !["male", "female", "prefer_not_to_say"].includes(
              values.gender.value,
            )
              ? "male"
              : values.gender.value,
        },
      };

      // Store form data in localStorage
      const storageKey = activeApplicationId
        ? `clientInformationData-${activeApplicationId}`
        : "clientInformationData";

      localStorage.setItem(storageKey, JSON.stringify(formattedValues));
      setFormData(formattedValues);

      // Load data from all tabs via localStorage
      let educationalBackground: any = {};
      let backgroundIP: any = {};

      try {
        // Get educational background data
        const educationData = localStorage.getItem("educationalBackgroundData");
        if (educationData) {
          try {
            educationalBackground = JSON.parse(educationData);
            console.log(
              "Loaded educational background data for update:",
              educationalBackground,
            );
          } catch (parseError) {
            console.error("Failed to parse education data:", parseError);
          }
        }

        // Get background IP data
        const backgroundData = localStorage.getItem("clientBackgroundIPData");
        if (backgroundData) {
          try {
            backgroundIP = JSON.parse(backgroundData);
            console.log("Loaded background IP data for update:", backgroundIP);
          } catch (parseError) {
            console.error("Failed to parse background IP data:", parseError);
          }
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
        `Checking if profile exists for application: ${applicationId}`,
      );
      const checkResponse = await safeFetch(
        `/api/client-profile/exists/${applicationId}`,
        {},
        `client-info-exists-${applicationId}`, // Unique cache key
      );

      // Handle 404 or other error status codes gracefully
      if (checkResponse.status === 404) {
        console.log(
          `Profile not found for application: ${applicationId}, will create new profile`,
        );
        // Use POST method if the application doesn't exist
        const method = "POST";

        // Continue with update
        await updateProfileData(
          formattedValues,
          method,
          applicationId,
          educationalBackground,
          backgroundIP,
        );
        return;
      }

      if (!checkResponse.ok) {
        throw new Error(
          `Failed to check profile existence: ${checkResponse.statusText}`,
        );
      }

      // Clone the response to prevent body stream already read errors
      const checkResponseClone = checkResponse.clone();
      let checkData;

      try {
        checkData = await checkResponse.json();
      } catch (error) {
        console.error("Error parsing exists response:", error);
        // Try with the clone if parsing fails
        checkData = await checkResponseClone.json();
      }

      // Determine whether to use POST (create) or PUT (update)
      const exists =
        checkData && typeof checkData.exists === "boolean"
          ? checkData.exists
          : false;
      const method = exists ? "PUT" : "POST";

      console.log(
        `Using ${method} method for complete profile update. Profile exists: ${exists}`,
      );

      await updateProfileData(
        formattedValues,
        method,
        applicationId,
        educationalBackground,
        backgroundIP,
      );
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

  // Helper function to update profile data
  async function updateProfileData(
    personalInfo: any,
    method: string,
    applicationId: string,
    educationalBackground: any = {},
    backgroundIP: any = {},
  ) {
    try {
      // Ensure hasCompany is always treated as a boolean
      const ensureBoolean = (value: any): boolean => {
        if (typeof value === "boolean") return value;
        if (value === "false") return false;
        if (value === "true") return true;
        return Boolean(value);
      };

      // Get explicit boolean value for hasCompany
      const hasCompanyValue = ensureBoolean(personalInfo.hasCompany);

      // Log the real hasCompany value before API submission
      console.log("[ClientInformation] PRE-API hasCompany value:", {
        rawValue: personalInfo.hasCompany,
        processedValue: hasCompanyValue,
      });

      // Create a clean API data object based on hasCompany value
      const personalInfoData = hasCompanyValue
        ? {
            // Company affiliation - only include company fields
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            middleName: personalInfo.middleName,
            gender: personalInfo.gender,
            age: personalInfo.age,
            citizenship: personalInfo.citizenship,
            mailingAddress: personalInfo.mailingAddress,
            contactNumber: personalInfo.contactNumber,
            email: personalInfo.email,
            occupation: personalInfo.occupation,
            hasCompany: true,
            // Company fields
            companyName: personalInfo.companyName || "",
            companyStreet: personalInfo.companyStreet || "",
            companyBarangay: personalInfo.companyBarangay || "",
            companyCityMunicipality: personalInfo.companyCityMunicipality || "",
            companyProvince: personalInfo.companyProvince || "",
            companyEmail: personalInfo.companyEmail || "",
            // Explicitly set college fields to empty strings
            collegeName: "",
            departmentName: "",
          }
        : {
            // Academic affiliation - only include college fields
            firstName: personalInfo.firstName,
            lastName: personalInfo.lastName,
            middleName: personalInfo.middleName,
            gender: personalInfo.gender,
            age: personalInfo.age,
            citizenship: personalInfo.citizenship,
            mailingAddress: personalInfo.mailingAddress,
            contactNumber: personalInfo.contactNumber,
            email: personalInfo.email,
            occupation: personalInfo.occupation,
            hasCompany: false,
            // Explicitly set company fields to empty strings
            companyName: "",
            companyStreet: "",
            companyBarangay: "",
            companyCityMunicipality: "",
            companyProvince: "",
            companyEmail: "",
            // College fields
            collegeName: personalInfo.collegeName || "",
            departmentName: personalInfo.departmentName || "",
          };

      // Format data for API submission
      const apiData = {
        personalInfo: personalInfoData,
        educationalBackground: educationalBackground,
        backgroundIP: backgroundIP,
        status: "draft",
        applicationId: applicationId, // Include the application ID for registry tracking
        registerForm: true, // Explicitly set to register in form submission registry,
        _affiliationType: hasCompanyValue ? "company" : "academic",
      };

      console.log(
        "[ClientInformation] Updating API data with hasCompany=",
        personalInfo.hasCompany,
      );
      console.log("[ClientInformation] College data:", {
        collegeName: apiData.personalInfo.collegeName,
        departmentName: apiData.personalInfo.departmentName,
      });

      // Detailed logging to understand what's being sent
      console.log("[ClientInformation] FINAL API REQUEST:", {
        affiliationType: hasCompanyValue ? "company" : "academic",
        hasCompany: apiData.personalInfo.hasCompany,
        companyFields: {
          companyName: apiData.personalInfo.companyName,
          companyEmail: apiData.personalInfo.companyEmail,
        },
        collegeFields: {
          collegeName: apiData.personalInfo.collegeName,
          departmentName: apiData.personalInfo.departmentName,
        },
      });

      // Log the stringified version for reference
      console.log(
        "[ClientInformation] API DATA RAW:",
        JSON.stringify(apiData.personalInfo, null, 2),
      );

      // Log the boolean value explicitly for clarity
      console.log(
        "[ClientInformation] hasCompany raw value:",
        personalInfoData.hasCompany,
        "type:",
        typeof personalInfoData.hasCompany,
      );

      // Submit to API for update
      const response = await safeFetch(
        "/api/client-profile",
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        },
        `client-info-submit-${applicationId}-${method}`, // Unique cache key
      );

      // Clone the response to prevent body stream already read errors
      const responseClone = response.clone();

      if (!response.ok) {
        let errorMessage = `Failed to update form: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
          try {
            // Try with the clone if parsing fails
            const errorText = await responseClone.text();
            errorMessage = `Failed to update form: ${
              errorText || response.statusText
            }`;
          } catch (textError) {
            console.error("Error getting response text:", textError);
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Error parsing success response:", jsonError);
        try {
          // Try with the clone if parsing fails
          result = await responseClone.json();
        } catch (cloneError) {
          console.error("Error parsing cloned response:", cloneError);
          // Continue with null result - not critical for this function
          result = null;
        }
      }

      // Try to parse the response and check if it contains the expected data
      try {
        const responseData = result && result.data;

        // Use the current value of hasCompany from the form
        const expectedHasCompany = ensureBoolean(personalInfo.hasCompany);
        const actualHasCompany = responseData.hasCompany;

        // Check if hasCompany in response matches what we sent
        if (expectedHasCompany !== actualHasCompany) {
          console.error(
            "[ClientInformation] Server response hasCompany mismatch:",
            {
              expected: expectedHasCompany,
              actual: actualHasCompany,
            },
          );

          // If we're sending academic institution data (hasCompany=false) but it's not saved
          if (
            expectedHasCompany === false &&
            (!responseData.collegeName || !responseData.departmentName)
          ) {
            console.error(
              "[ClientInformation] College data not saved correctly:",
              {
                expected: {
                  collegeName: apiData.personalInfo.collegeName,
                  departmentName: apiData.personalInfo.departmentName,
                },
                actual: {
                  collegeName: responseData.collegeName,
                  departmentName: responseData.departmentName,
                },
              },
            );

            // Show error about college data not saving
            toast.error("College data not saved correctly", {
              description:
                "Your academic institution information was not saved correctly. Please try again.",
            });
          }
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
        toast.dismiss();

        // Show success toast
        toast.success("All Profile Data Updated", {
          description: "Your changes for all tabs have been saved.",
        });

        console.log("Form updated successfully:", result);
      } catch (error) {
        console.error("Error parsing server response:", error);
        // Continue with normal flow if there's an error during validation

        // Update the client profile form status
        if (window.updateIPFormStatus) {
          window.updateIPFormStatus("clientProfile", true, applicationId);
        }

        // Dismiss loading toast
        toast.dismiss();

        // Show success toast
        toast.success("Profile data updated", {
          description: "Your changes have been saved.",
        });
      }
    } catch (error) {
      console.error("Error in updateProfileData:", error);
      throw error; // Rethrow for the caller to handle
    }
  }

  // Handle Next button click with data saving
  const handleNextClick = () => {
    try {
      // Get the current form values
      const values = form.getValues();

      // Format and validate the data before saving
      const formattedValues = {
        ...values,
        // Ensure hasCompany is properly set
        hasCompany:
          values.hasCompany !== undefined
            ? values.hasCompany
            : (values.collegeName && values.collegeName.trim() !== "") ||
                (values.departmentName && values.departmentName.trim() !== "")
              ? false
              : true,
        // Explicitly ensure no fields are accidentally cleared
        companyName: values.companyName || undefined,
        companyEmail: values.companyEmail || undefined,
        companyStreet: values.companyStreet || undefined,
        companyBarangay: values.companyBarangay || undefined,
        companyCityMunicipality: values.companyCityMunicipality || undefined,
        companyProvince: values.companyProvince || undefined,
        collegeName: values.collegeName || undefined,
        departmentName: values.departmentName || undefined,
        // Fix citizenship data
        citizenship: {
          value: values.citizenship?.value || "filipino",
          otherValue:
            values.citizenship?.value === "filipino"
              ? undefined
              : values.citizenship?.otherValue || "",
        },
        // Ensure gender is properly formatted
        gender: {
          value:
            !values.gender?.value ||
            !["male", "female", "prefer_not_to_say"].includes(
              values.gender.value,
            )
              ? "male"
              : values.gender.value,
        },
      };

      // Make sure we explicitly keep all field values even when switching views
      const enhancedValues = {
        ...formattedValues,
        hasCompany: formattedValues.hasCompany,
        // Always include both sets of fields in localStorage for completeness
        collegeName: formattedValues.collegeName || "",
        departmentName: formattedValues.departmentName || "",
        companyName: formattedValues.companyName || "",
        companyEmail: formattedValues.companyEmail || "",
        companyStreet: formattedValues.companyStreet || "",
        companyBarangay: formattedValues.companyBarangay || "",
        companyCityMunicipality: formattedValues.companyCityMunicipality || "",
        companyProvince: formattedValues.companyProvince || "",
      };

      // Save to localStorage without making an API call
      const storageKey = activeApplicationId
        ? `clientInformationData-${activeApplicationId}`
        : "clientInformationData";

      localStorage.setItem(storageKey, JSON.stringify(enhancedValues));
      console.log(
        "[ClientInformation] Personal information saved to localStorage:",
        enhancedValues,
      );

      // If we have an active application, update the form status silently
      if (activeApplicationId && window.updateIPFormStatus) {
        console.log(
          "[ClientInformation] Updating form status visually only (no registry)",
        );

        // Instead of calling updateIPFormStatus directly, dispatch a visual-only event
        const event = new CustomEvent("clientProfileFormVisualUpdate", {
          detail: { completed: true, applicationId: activeApplicationId },
        });
        window.dispatchEvent(event);
      }

      // Navigate to the next tab by updating URL params
      const url = new URL(window.location.href);
      url.searchParams.set("clientTab", "education");
      window.history.pushState({}, "", url);

      // Trigger a navigation event to ensure the UI updates
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      console.error(
        "[ClientInformation] Error saving form data or navigating:",
        error,
      );
    }
  };

  // If there's an error, log it
  if (error) {
    console.error("ClientInformation component error:", error);
  }

  const formatData = (values: any) => {
    // Create a deep copy to avoid mutating the original
    const formattedData: any = JSON.parse(JSON.stringify(values));

    // Ensure gender has the correct structure
    if (typeof formattedData.gender === "string") {
      formattedData.gender = {
        value: formattedData.gender as "male" | "female" | "prefer_not_to_say",
      };
    } else if (
      formattedData.gender &&
      typeof formattedData.gender.value === "string"
    ) {
      // Ensure gender.value is one of the allowed values
      if (
        !["male", "female", "prefer_not_to_say"].includes(
          formattedData.gender.value,
        )
      ) {
        formattedData.gender.value = "";
      }
    }

    // Ensure citizenship has the correct structure
    if (typeof formattedData.citizenship === "string") {
      formattedData.citizenship = {
        value: formattedData.citizenship as "filipino" | "other",
        otherValue: formattedData.citizenship === "filipino" ? null : "",
      };
    } else if (
      formattedData.citizenship &&
      typeof formattedData.citizenship.value === "string"
    ) {
      // Ensure citizenship.value is one of the allowed values
      if (!["filipino", "other"].includes(formattedData.citizenship.value)) {
        formattedData.citizenship.value = "filipino";
      }
    }

    return formattedData;
  };

  // Add form submission hook for registry integration
  const formSubmission = useFormSubmission({
    onSuccess: (data) => {
      console.log("[ClientInformation] Form registry successful:", data);
    },
    onError: (error) => {
      console.error("[ClientInformation] Form registry error:", error);
    },
  });

  // Helper function to register in form submission registry
  const registerInFormRegistry = async (
    clientProfileId: string,
    applicationId: string,
    personalInfo: any,
  ) => {
    try {
      console.log("[ClientInformation] Registering in form registry:", {
        clientProfileId,
        applicationId,
      });

      // Use the hook to register
      const result = await formSubmission.registerFormDirect({
        sourceType: "client_profile",
        sourceId: clientProfileId,
        ipApplicationId: applicationId,
        title: `Client Profile - ${personalInfo.firstName} ${personalInfo.lastName}`,
        description: "Client profile form submission",
        status: "submitted",
        inventorsCreators: [
          {
            name: `${personalInfo.firstName} ${personalInfo.lastName}`,
            role: "Applicant",
          },
        ],
      });

      console.log("[ClientInformation] Registry result:", result);
      return result;
    } catch (error) {
      console.error(
        "[ClientInformation] Error registering in form registry:",
        error,
      );
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Display error message if there is one */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>An error occurred: {error.message}</p>
            </div>
          )}

          {/* Personal Information Section */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Personal Information
              </CardTitle>
              <CardDescription>
                Please provide your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* First row: First Name, Middle Name, Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter middle name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second row: Gender, Age, Citizenship */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gender.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gender <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="prefer_not_to_say">
                            Prefer not to say
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Birth date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          max={getLocalDateInputValue(new Date())}
                          placeholder="Select birth date"
                          value={birthDate}
                          onChange={(e) => {
                            const next = e.target.value;
                            setBirthDate(next);
                            const age = calculateAgeFromBirthDate(next);
                            field.onChange(age);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value !== undefined
                          ? `Calculated age: ${field.value}`
                          : "Age will be calculated from the birth date."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Citizenship container in the third column */}
                <div
                  className={`${
                    selectedCitizenship === "other"
                      ? "p-3 bg-slate-50/50 rounded-md border border-slate-100"
                      : ""
                  }`}
                >
                  <FormField
                    control={form.control}
                    name="citizenship.value"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>
                          Citizenship <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);

                            // Update the selected citizenship for conditional rendering
                            if (value === "other") {
                              setSelectedCitizenship("other");
                            } else {
                              setSelectedCitizenship(null);
                            }
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {field.value === "other" &&
                              form.getValues("citizenship.otherValue") ? (
                                <div className="flex items-center gap-1">
                                  <span>Other:</span>
                                  <span className="font-medium">
                                    {form.getValues("citizenship.otherValue")}
                                  </span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Select citizenship" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="filipino">Filipino</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCitizenship === "other" && (
                    <FormField
                      control={form.control}
                      name="citizenship.otherValue"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel className="text-sm text-gray-600">
                            Specify Citizenship
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your citizenship"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                // Set the value directly to ensure it's captured
                                field.onChange(e.target.value);
                              }}
                              className="border-[#1B5E20]/50 focus:border-[#1B5E20] focus:ring-[#1B5E20]/30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Section */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Contact Information
              </CardTitle>
              <CardDescription>
                Please provide your contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="Enter email address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Contact Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter contact number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mailing Address Section */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Mailing Address
              </CardTitle>
              <CardDescription>
                Please provide your current mailing address
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="mailingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mailing Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter complete mailing address"
                        {...field}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Occupation <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">-- Select one --</option>
                        <optgroup label="Healthcare Practitioners and Technical Occupations">
                          <option value="Chiropractor">Chiropractor</option>
                          <option value="Dentist">Dentist</option>
                          <option value="Dietitian or Nutritionist">
                            Dietitian or Nutritionist
                          </option>
                          <option value="Optometrist">Optometrist</option>
                          <option value="Pharmacist">Pharmacist</option>
                          <option value="Physician">Physician</option>
                          <option value="Physician Assistant">
                            Physician Assistant
                          </option>
                          <option value="Podiatrist">Podiatrist</option>
                          <option value="Registered Nurse">
                            Registered Nurse
                          </option>
                          <option value="Therapist">Therapist</option>
                          <option value="Veterinarian">Veterinarian</option>
                          <option value="Health Technologist or Technician">
                            Health Technologist or Technician
                          </option>
                          <option value="Other Healthcare Practitioner">
                            Other Healthcare Practitioner
                          </option>
                        </optgroup>
                        <optgroup label="Healthcare Support Occupations">
                          <option value="Nursing Aide">
                            Nursing / Home Health Aide
                          </option>
                          <option value="Therapy Assistant">
                            Occupational / Physical Therapy Assistant
                          </option>
                          <option value="Other Healthcare Support">
                            Other Healthcare Support Occupation
                          </option>
                        </optgroup>
                        <optgroup label="Business and Management Occupations">
                          <option value="Chief Executive">Chief Executive</option>
                          <option value="Operations Manager">
                            General / Operations Manager
                          </option>
                          <option value="Marketing Manager">
                            Marketing / Sales Manager
                          </option>
                          <option value="IT Manager">IT / HR Manager</option>
                          <option value="Accountant">Accountant / Auditor</option>
                          <option value="Business Owner">Business Owner</option>
                          <option value="Other Business Occupation">
                            Other Business Occupation
                          </option>
                        </optgroup>
                        <optgroup label="Education Occupations">
                          <option value="College Professor">
                            College Professor
                          </option>
                          <option value="School Teacher">
                            Primary / Secondary Teacher
                          </option>
                          <option value="Other Teacher">Other Teacher</option>
                        </optgroup>
                        <optgroup label="Other Occupations">
                          <option value="Military">Military</option>
                          <option value="Homemaker">Homemaker</option>
                          <option value="Student">Student</option>
                          <option value="Dont Know">Don't Know</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </optgroup>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Select your occupation. Scroll to see more options.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Affiliation Information
              </CardTitle>
              <CardDescription>
                Please provide details about your organization or academic
                affiliation
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* AFFILIATION TYPE DROPDOWN */}
              <FormField
                control={form.control}
                name="affiliationType"
                render={({ field }) => (
                  <FormItem className="rounded-md border p-4 shadow-sm space-y-2">
                    <FormLabel>Affiliation Type <span className="text-red-500">*</span></FormLabel>

                    <Select
                      value={field.value}
                      onValueChange={(
                        value: "company" | "academic" | "none",
                      ) => {
                        field.onChange(value);

                        if (activeApplicationId) {
                          const currentValues = form.getValues();
                          const storageKey = `clientInformationData-${activeApplicationId}`;
                          localStorage.setItem(
                            storageKey,
                            JSON.stringify({
                              ...currentValues,
                              affiliationType: value,
                            }),
                          );
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select affiliation" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="company">
                          Company / Institution
                        </SelectItem>
                        <SelectItem value="academic">
                          Academic Institution
                        </SelectItem>
                        <SelectItem value="none">No Application</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormDescription>
                      {field.value === "company" &&
                        "Provide information about your company or institution"}

                      {field.value === "academic" &&
                        "Provide information about your college and department"}

                      {field.value === "none" &&
                        "No affiliation details are required"}
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              /> 

              {/* COMPANY / INSTITUTION FIELDS */}
              {form.watch("affiliationType") === "company" && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company / Institution Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter company or institution name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[80px]"
                              placeholder="Enter street address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyBarangay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barangay</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[80px]"
                              placeholder="Enter barangay"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyCityMunicipality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / Municipality</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[80px]"
                              placeholder="Enter city or municipality"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyProvince"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[80px]"
                              placeholder="Enter province"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* ACADEMIC FIELDS */}
              {form.watch("affiliationType") === "academic" && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="collegeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your college name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departmentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your department"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="my-6" />

          <div className="flex justify-end gap-4">
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
            <Button
              type="button"
              onClick={handleNextClick}
              disabled={isNextDisabled}
              className="bg-[#1B5E20] hover:bg-[#1B5E20]/90"
            >
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
