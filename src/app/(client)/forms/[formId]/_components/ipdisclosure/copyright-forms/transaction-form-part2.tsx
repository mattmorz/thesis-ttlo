"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Info, ChevronRight, FileText, X, Download } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useCallback, useRef, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import debounce from "lodash/debounce";
import type { DebouncedFunc } from "lodash";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormContext } from "../context/form-context";
import { ApplicantInformationForm } from "./transaction-part2/applicant-information-form";
import { cn } from "@/lib/utils";
import { AuthorCreatorForm } from "./transaction-part2/author-creator-form";
import {
  WorkCreationForm,
  useWorkFormStore,
} from "./transaction-part2/work-creation-form";
import { FileUploader, FileUploaderContent } from "@/components/ui/fileupload";
import { formatFileSize } from "@/lib/utils";
import { SignaturePad } from "@/components/ui/signature-pad";
import { ReferenceTab } from "./reference-tab";
import { ReferenceForm } from "./transaction-part2/reference-form";
import { NotificationForm } from "./transaction-part2/notification-form";
import { IpSettingsForm } from "./transaction-part2/ip-settings-form";
import { TaskSettingsForm } from "./transaction-part2/task-settings-form";
import { SecurityForm } from "./transaction-part2/security-form";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { useApplicantFormStore } from "./transaction-part2/applicant-information-form";
import { useAuthorFormStore } from "./transaction-part2/author-creator-form";
import { FormNavigation } from "../components/form-navigation";

// Define interface for documents submitted checkboxes and files
interface DocumentsSubmittedType {
  electronicCopy: boolean;
  governmentId: boolean;
  deedOfAssignment: boolean;
  marriageCertificate: boolean;
  specialPowerOfAttorney: boolean;
  boardResolution: boolean;
  secretaryCertificate: boolean;
  ipophlCertificate: boolean;
  others: boolean; // Basic boolean type for checkbox
  files?: Record<string, File[]>; // Files mapped to field names
}

// Define interface for signature data
interface SignatureType {
  agree: boolean;
  firstName: string;
  middleInitial: string;
  lastName: string;
  signatureFile?: File[];
}

// Store interface
export interface TransactionFormPart2State {
  data: any;
  currentSubTab: string;
  setData: (data: any) => void;
  setCurrentSubTab: (tab: string) => void;
}

// Export the store
export const useTransactionFormPart2Store = create<TransactionFormPart2State>()(
  persist(
    (set) => ({
      data: null,
      currentSubTab: "transaction-details",
      setData: (data) => set({ data }),
      setCurrentSubTab: (tab) => set({ currentSubTab: tab }),
    }),
    {
      name: "transaction-form-part2-storage",
    }
  )
);

// First, define the paths as constants to ensure type safety
const FIELD_PATHS = {
  // Transaction Details
  TRANSACTION_TYPE: {
    COPYRIGHT_REGISTRATION:
      "transaction_details.transactionType.copyrightRegistration",
    ANONYMOUS_WORK: "transaction_details.transactionType.anonymousWork",
    CORRECTION_ENTRY: "transaction_details.transactionType.correctionEntry",
    RESALE_RIGHTS: "transaction_details.transactionType.resaleRights",
    CERTIFIED_COPY: "transaction_details.transactionType.certifiedCopy",
    RECORDATION: "transaction_details.transactionType.recordation",
    RECONSTITUTION: "transaction_details.transactionType.reconstitution",
  },
  SUBMISSION_TYPE: {
    FILING_METHOD: {
      ELECTRONIC_FILING:
        "transaction_details.submissionType.filingMethod.electronicFiling",
      THROUGH_IPSO:
        "transaction_details.submissionType.filingMethod.throughIPSO",
    },
    FILING_TYPE: {
      SINGLE_FILING:
        "transaction_details.submissionType.filingType.singleFiling",
      BULK_FILING: "transaction_details.submissionType.filingType.bulkFiling",
    },
  },
  IPSO_REGION: "transaction_details.ipsoRegion",
  BULK_FILING_QTY: "transaction_details.bulkFilingQty",
} as const;

// Form schema
const formSchema = z.object({
  disclosureId: z.string().uuid().optional(),
  copyrightId: z.string().uuid().optional(),
  transaction_details: z.object({
    transactionType: z
      .object({
        copyrightRegistration: z.boolean().default(false),
        anonymousWork: z.boolean().default(false),
        correctionEntry: z.boolean().default(false),
        resaleRights: z.boolean().default(false),
        certifiedCopy: z.boolean().default(false),
        recordation: z.boolean().default(false),
        reconstitution: z.boolean().default(false),
      })
      .refine((data) => {
        // At least one of the database-required transaction types must be true
        // OR copyrightRegistration must be true (we'll map it in the transform)
        return (
          data.anonymousWork ||
          data.correctionEntry ||
          data.resaleRights ||
          data.certifiedCopy ||
          data.recordation ||
          data.reconstitution ||
          data.copyrightRegistration
        );
      }, "Please select at least one transaction type"),
    otherCertifications: z.string().optional(),
    numberOfCertificates: z.string().optional(),
    submissionType: z.object({
      filingMethod: z
        .object({
          electronicFiling: z.boolean().default(false),
          throughIPSO: z.boolean().default(false),
        })
        .refine(
          (data) => data.electronicFiling || data.throughIPSO,
          "Please select a filing method"
        ),
      filingType: z
        .object({
          singleFiling: z.boolean().default(false),
          bulkFiling: z.boolean().default(false),
        })
        .refine(
          (data) => data.singleFiling || data.bulkFiling,
          "Please select a filing type"
        ),
    }),
    ipsoRegion: z.string().optional(),
    bulkFilingQty: z.string().optional(),
    workCreationForm: z.record(z.any()).optional(),
  }),
  applicant_info: z.object({
    entityType: z.string().optional(),
    applicantType: z
      .object({
        authorCreator: z.boolean().default(false),
        agent: z.boolean().default(false),
        copyrightClaimant: z.boolean().default(false),
        licensee: z.boolean().default(false),
        heir: z.boolean().default(false),
        newOwner: z.boolean().default(false),
      })
      .refine(
        (data) => {
          // At least one applicant type must be selected
          return (
            data.authorCreator ||
            data.agent ||
            data.copyrightClaimant ||
            data.licensee ||
            data.heir ||
            data.newOwner
          );
        },
        {
          message: "Please select at least one applicant type",
        }
      ),
    personalInfo: z.object({
      surname: z.string().min(1, "Surname is required"),
      firstName: z.string().min(1, "First name is required"),
      middleName: z.string().optional(),
      companyName: z.string().optional(),
      dateOfBirth: z.string().nullable().optional(),
      civilStatus: z.string().nullable().optional(),
      sex: z.string().nullable().optional(),
      nationality: z.string().min(1, "Nationality is required"),
      countryOfResidence: z.string().optional(),
      address: z.string().min(1, "Address is required"),
      municipalityCity: z.string().min(1, "Municipality/City is required"),
      provinceState: z.string().min(1, "Province/State is required"),
      zipCode: z.string().min(1, "ZIP Code is required"),
      mobileNumber: z.string().min(1, "Mobile number is required"),
      emailAddress: z
        .string()
        .min(1, "Email address is required")
        .email("Invalid email format"),
    }),
  }),
  author_info: z.object({
    isSameAsApplicant: z.boolean().default(false),
    sameAsApplicant: z.boolean().default(false),
    personalInfo: z.object({
      surname: z.string().optional(),
      firstName: z.string().optional(),
      middleName: z.string().optional(),
      dateOfBirth: z.string().nullable().optional(),
      civilStatus: z.string().nullable().optional(),
      sex: z.string().nullable().optional(),
      nationality: z.string().optional(),
      countryOfResidence: z.string().optional(),
      address: z.string().optional(),
      municipalityCity: z.string().optional(),
      provinceState: z.string().optional(),
      zipCode: z.string().optional(),
      mobileNumber: z.string().optional(),
      emailAddress: z.string().optional(),
    }),
    authors: z.array(z.any()).optional(),
  }),
  workCreationForm: z
    .object({
      title: z.string().optional(),
      dateOfCreation: z.string().optional(),
      placeOfCreation: z.string().optional(),
      classificationOfWork: z.string().optional(),
      submissionType: z
        .object({
          isLocal: z.boolean().default(true),
          isForeign: z.boolean().default(false),
        })
        .optional(),
      registrationStatus: z
        .object({
          isRegistered: z.boolean().default(false),
          registrationOffice: z
            .object({
              withIPOPHL: z.boolean().default(false),
              withNLP: z.boolean().default(false),
            })
            .optional(),
        })
        .optional(),
      publicationStatus: z
        .object({
          isPublished: z.string().optional(),
          publisherInfo: z.string().optional(),
        })
        .optional(),
      derivativeWork: z
        .object({
          isDerivative: z.string().optional(),
          originalWorkInfo: z.string().optional(),
        })
        .optional(),
      indigenousKnowledge: z
        .object({
          isIndigenous: z.string().optional(),
          sourceInfo: z.string().optional(),
        })
        .optional(),
      governmentFunded: z
        .object({
          isFunded: z.string().optional(),
          fundingAgency: z.string().optional(),
        })
        .optional(),
      regularDuties: z
        .object({
          isRegularDuty: z.string().optional(),
          employer: z.string().optional(),
        })
        .optional(),
      rightsClaim: z
        .object({
          isClaimingEntireWork: z.string().optional(),
          partialRights: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  documentsSubmitted: z
    .object({
      electronicCopy: z.boolean().default(false),
      governmentId: z.boolean().default(false),
      deedOfAssignment: z.boolean().default(false),
      marriageCertificate: z.boolean().default(false),
      specialPowerOfAttorney: z.boolean().default(false),
      boardResolution: z.boolean().default(false),
      secretaryCertificate: z.boolean().default(false),
      ipophlCertificate: z.boolean().default(false),
      others: z.boolean().default(false),
      files: z.record(z.array(z.any())).optional(),
    })
    .optional(),
  signature: z
    .object({
      agree: z.boolean().refine((value) => value === true, {
        message: "You must agree to the privacy statement",
      }),
      firstName: z.string().min(1, "First name is required"),
      middleInitial: z.string().optional(),
      lastName: z.string().min(1, "Last name is required"),
      signatureFile: z.array(z.any()).optional(),
    })
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Add type for transaction type fields
type TransactionTypeField =
  keyof FormValues["transaction_details"]["transactionType"];

// Fix the DocumentFieldName type to handle non-nullable access
type DocumentFieldName =
  | "electronicCopy"
  | "governmentId"
  | "deedOfAssignment"
  | "marriageCertificate"
  | "specialPowerOfAttorney"
  | "boardResolution"
  | "secretaryCertificate"
  | "ipophlCertificate"
  | "others";

// Define proper types for applicant_info structure
interface PersonalInfo {
  surname: string;
  firstName: string;
  middleName?: string;
  companyName?: string;
  dateOfBirth?: string | null;
  civilStatus?: string | null;
  sex?: string | null;
  nationality: string;
  countryOfResidence?: string;
  address: string;
  municipalityCity: string;
  provinceState: string;
  zipCode: string;
  mobileNumber: string;
  emailAddress: string;
}

interface ApplicantType {
  authorCreator: boolean;
  agent: boolean;
  copyrightClaimant: boolean;
  licensee: boolean;
  heir: boolean;
  newOwner: boolean;
}

interface ApplicantInfo {
  personalInfo: PersonalInfo;
  applicantType: ApplicantType;
  entityType?: string;
  [key: string]: any; // Allow other properties
}

// Helper function to create a default applicant info structure
const createDefaultApplicantInfo = (): ApplicantInfo => ({
  personalInfo: {
    surname: "",
    firstName: "",
    middleName: "",
    companyName: "",
    dateOfBirth: null,
    civilStatus: null,
    sex: null,
    nationality: "",
    countryOfResidence: "",
    address: "",
    municipalityCity: "",
    provinceState: "",
    zipCode: "",
    mobileNumber: "",
    emailAddress: "",
  },
  applicantType: {
    authorCreator: false,
    agent: false,
    copyrightClaimant: false,
    licensee: false,
    heir: false,
    newOwner: false,
  },
  entityType: "",
});

// Helper function to create a valid default transaction_details object
const createDefaultTransactionDetails = () => {
  return {
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
    ipsoRegion: "",
    bulkFilingQty: "",
    documentsSubmitted: {
      electronicCopy: false,
      governmentId: false,
      deedOfAssignment: false,
      marriageCertificate: false,
      specialPowerOfAttorney: false,
      boardResolution: false,
      secretaryCertificate: false,
      ipophlCertificate: false,
      others: false,
      files: {},
    } as DocumentsSubmittedType,
    signature: {
      agree: false,
      firstName: "",
      middleInitial: "",
      lastName: "",
      signatureFile: [],
    } as SignatureType,
    workCreationForm: {},
  };
};

const SubTabNavigation = ({
  currentSubTab,
  onPrevious,
  onNext,
  subtabs,
}: {
  currentSubTab: string;
  onPrevious: () => void;
  onNext: () => void;
  subtabs: string[];
}) => {
  const currentIndex = subtabs.indexOf(currentSubTab);
  const isFirstTab = currentIndex === 0;
  const isLastTab = currentIndex === subtabs.length - 1;

  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstTab}
      >
        Previous
      </Button>
      <div className="text-sm text-muted-foreground">
        Step {currentIndex + 1} of {subtabs.length}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onNext}
        disabled={isLastTab}
      >
        Next
      </Button>
    </div>
  );
};

export function TransactionFormPart2() {
  const {
    activeTab,
    setActiveTab,
    transactionFormPart2,
    setTransactionFormPart2,
    disclosureId,
    visibleTabs,
  } = useIpDisclosureStore();
  const { setCurrentTransactionSubTab, currentTransactionSubTab, isHydrated } =
    useFormContext();
  const { setData, data } = useTransactionFormPart2Store();
  const { saveCopyrightApplication, fetchInitialData } = useIpDisclosure();

  // Get the copyright ID from the transaction form directly (if it exists)
  const copyrightId = transactionFormPart2?.copyrightId;

  // Add a state to track if we should watch for field changes
  // Add a state to track if we should watch for field changes
  const [shouldWatchChanges, setShouldWatchChanges] = useState(false);
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  // Add loading state to prevent multiple loading attempts
  const [isLoading, setIsLoading] = useState(false);
  // Add a state to track if data was already loaded
  const [dataLoaded, setDataLoaded] = useState(false);
  // Add refs to track initialization
  const hasInitialized = useRef(false);
  const hasSetTabRef = useRef(false);

  // Helper to check if value is an object
  const isObject = (item: any): boolean => {
    return item && typeof item === "object" && !Array.isArray(item);
  };

  // Helper function to deep merge objects
  const deepMerge = (target: any, source: any): any => {
    // Use spread operator for shallow copy
    const output = { ...target };

    // If both are objects, merge them
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        // If property is an object, recursively merge
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = deepMerge(target[key], source[key]);
          }
        } else if (source[key] !== undefined) {
          // Only copy defined values
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  };

  // Define the subtabs array here so it's available throughout the component
  const subtabs = [
    "transaction-details",
    "work-info",
    "applicant-info",
    "author-info",
    "documents",
    "signature",
    "reference",
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: transactionFormPart2 || {
      disclosureId: undefined,
      copyrightId: undefined,
      transaction_details: createDefaultTransactionDetails(),
      applicant_info: {
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
          dateOfBirth: null,
          civilStatus: null,
          sex: null,
          nationality: "",
          countryOfResidence: "",
          address: "",
          municipalityCity: "",
          provinceState: "",
          zipCode: "",
          mobileNumber: "",
          emailAddress: "",
        },
      },
      author_info: {
        isSameAsApplicant: false,
        personalInfo: {
          surname: "",
          firstName: "",
          middleName: "",
          dateOfBirth: null,
          civilStatus: null,
          sex: null,
          nationality: "",
          countryOfResidence: "",
          address: "",
          municipalityCity: "",
          provinceState: "",
          zipCode: "",
          mobileNumber: "",
          emailAddress: "",
        },
      },
      documentsSubmitted: {
        electronicCopy: false,
        governmentId: false,
        deedOfAssignment: false,
        marriageCertificate: false,
        specialPowerOfAttorney: false,
        boardResolution: false,
        secretaryCertificate: false,
        ipophlCertificate: false,
        others: false,
        files: [],
      },
      signature: {
        agree: false,
        signatureType: "upload",
        signatureData: "",
        firstName: "",
        middleInitial: "",
        lastName: "",
        signatureFile: [],
      },
    },
  });

  // We need to define these with proper type assertions or use direct path access
  const isBulkFiling = form.watch(
    FIELD_PATHS.SUBMISSION_TYPE.FILING_TYPE.BULK_FILING
  ) as boolean;
  const isIPSO = form.watch(
    FIELD_PATHS.SUBMISSION_TYPE.FILING_METHOD.THROUGH_IPSO
  ) as boolean;

  // Type-safe field renderer for filing method
  const renderFilingMethodField = (
    id: "electronicFiling" | "throughIPSO",
    label: string
  ) => {
    const fieldPath =
      id === "electronicFiling"
        ? FIELD_PATHS.SUBMISSION_TYPE.FILING_METHOD.ELECTRONIC_FILING
        : FIELD_PATHS.SUBMISSION_TYPE.FILING_METHOD.THROUGH_IPSO;

    return (
      <FormField
        key={id}
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex items-start space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={(checked) => {
                  // Don't update if attempting to uncheck the only selected option
                  const otherOption =
                    id === "electronicFiling"
                      ? "throughIPSO"
                      : "electronicFiling";

                  const otherFieldPath =
                    id === "electronicFiling"
                      ? FIELD_PATHS.SUBMISSION_TYPE.FILING_METHOD.THROUGH_IPSO
                      : FIELD_PATHS.SUBMISSION_TYPE.FILING_METHOD
                          .ELECTRONIC_FILING;

                  const otherFieldValue = form.getValues(otherFieldPath);

                  if (!checked && !otherFieldValue) {
                    // Prevent unchecking if it's the only one checked
                    return;
                  }

                  // Update the field without triggering unnecessary rerenders
                  field.onChange(checked);
                }}
                className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal text-black">{label}</FormLabel>
            </div>
          </FormItem>
        )}
      />
    );
  };

  // Type-safe field renderer for filing type
  const renderFilingTypeField = (
    id: "singleFiling" | "bulkFiling",
    label: string
  ) => {
    const fieldPath =
      id === "singleFiling"
        ? FIELD_PATHS.SUBMISSION_TYPE.FILING_TYPE.SINGLE_FILING
        : FIELD_PATHS.SUBMISSION_TYPE.FILING_TYPE.BULK_FILING;

    const otherFieldPath =
      id === "singleFiling"
        ? FIELD_PATHS.SUBMISSION_TYPE.FILING_TYPE.BULK_FILING
        : FIELD_PATHS.SUBMISSION_TYPE.FILING_TYPE.SINGLE_FILING;

    return (
      <FormField
        key={id}
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex items-start space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={(checked) => {
                  // Handle like a radio button group for filing type
                  if (checked) {
                    // Uncheck the other option first without triggering watch
                    form.setValue(otherFieldPath, false, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: false,
                    });

                    // Then set this one
                    field.onChange(true);
                  } else {
                    // Don't allow unchecking if it would leave both unchecked
                    const otherValue = form.getValues(otherFieldPath);
                    if (otherValue) {
                      field.onChange(false);
                    }
                    // Otherwise do nothing - keep it checked
                  }
                }}
                className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal text-black">{label}</FormLabel>
            </div>
          </FormItem>
        )}
      />
    );
  };

  const renderApplicantTypeField = (
    id: keyof FormValues["applicant_info"]["applicantType"],
    label: string
  ) => {
    const fieldPath = `applicant_info.applicantType.${id}`;
    return (
      <FormField
        key={id}
        control={form.control}
        name={fieldPath as any}
        render={({ field }) => (
          <FormItem className="flex items-start space-x-2 py-1">
            <FormControl>
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
                className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal text-black text-sm cursor-pointer">
                {label}
              </FormLabel>
            </div>
          </FormItem>
        )}
      />
    );
  };

  const renderTransactionTypeField = (
    id: keyof FormValues["transaction_details"]["transactionType"],
    label: string
  ) => {
    const fieldPath = `transaction_details.transactionType.${id}`;
    return (
      <FormField
        key={id.toString()}
        control={form.control}
        name={fieldPath as any}
        render={({ field }) => (
          <FormItem className="flex items-start space-x-2">
            <FormControl>
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
                className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal text-black">{label}</FormLabel>
            </div>
          </FormItem>
        )}
      />
    );
  };

  // Function to handle direct navigation to next tab without form validation
  const navigateToNext = () => {
    try {
      // Show loading toast for user feedback
      const toastId = toast.loading("Preparing to navigate...");

      console.log("Navigating to confirmation tab");

      // Get current form values
      const values = form.getValues();

      // Merge with data from all sub-tabs to ensure complete state
      const mergedData = mergeAllSubTabData(values);

      // Save to in-memory stores only (no database save)
      setData(mergedData);
      setTransactionFormPart2(mergedData);

      // Success message
      toast.success("Data saved in memory", { id: toastId });

      // Directly set the active tab in the global store
      useIpDisclosureStore.setState((state) => ({
        ...state,
        activeTab: "confirmation",
      }));

      console.log("Set active tab to: confirmation");
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("An error occurred during navigation");

      // Force navigation even if there was an error
      useIpDisclosureStore.setState((state) => ({
        ...state,
        activeTab: "confirmation",
      }));
    }
  };

  // Maintain handleNext for backward compatibility
  const handleNext = () => {
    // Just call the navigateToNext function
    navigateToNext();
  };

  const handlePrevious = () => {
    try {
      // Show loading toast for user feedback
      const toastId = toast.loading("Saving current state...");

      // Get current form values to preserve them
      const values = form.getValues();

      // Merge with data from all sub-tabs
      const mergedData = mergeAllSubTabData(values);

      // Save to in-memory stores only (no database save)
      setData(mergedData);
      setTransactionFormPart2(mergedData);

      // Success message
      toast.success("Form state preserved", { id: toastId });
    } catch (error) {
      console.error("Error preserving form state during navigation:", error);
      toast.error("Could not save form state");
    }

    // Navigate to previous tab
    setActiveTab("transaction-form-1");
  };

  const handleSave = async () => {
    try {
      // Show loading toast
      const toastId = toast.loading("Saving transaction details...");

      // Get current form values
      const values = form.getValues();

      // Merge with data from all sub-tabs
      const mergedData = mergeAllSubTabData(values);

      // Save to stores
      setData(mergedData);
      setTransactionFormPart2(mergedData);

      // Save to database via the copyright application endpoint
      const result = await saveCopyrightApplication();
      if (result) {
        toast.success("Transaction details saved successfully", {
          id: toastId,
        });
      } else {
        toast.error("Failed to save transaction details", { id: toastId });
      }
    } catch (error) {
      console.error("Error saving form data:", error);
      toast.error("An error occurred while saving form data");
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Show loading toast
      const toastId = toast.loading("Submitting form data...");

      console.log("Form submitted with data:", data);

      // Ensure data is properly structured with all sub-tab data
      const mergedData = mergeAllSubTabData(data);

      // Save the form data to the store
      setData(mergedData);
      setTransactionFormPart2(mergedData);

      // Submit to database
      const result = await saveCopyrightApplication();
      if (result) {
        toast.success("Form submitted successfully!", { id: toastId });

        // Check current active tab before changing
        const currentTab = useIpDisclosureStore.getState().activeTab;
        console.log("Current active tab before navigation:", currentTab);

        // Navigate to the next tab using the more reliable method
        useIpDisclosureStore.setState((state) => ({
          ...state,
          activeTab: "disclosure-confirmation",
        }));

        // Verify the tab was actually changed
        setTimeout(() => {
          const newTab = useIpDisclosureStore.getState().activeTab;
          console.log("New active tab after navigation:", newTab);

          if (newTab !== "disclosure-confirmation") {
            console.error(
              "Failed to set active tab to disclosure-confirmation, forcing navigation"
            );
            // Force set again if it didn't take the first time
            useIpDisclosureStore.setState((state) => ({
              ...state,
              activeTab: "disclosure-confirmation",
            }));
          }
        }, 0);
      } else {
        toast.error("Failed to save form data", { id: toastId });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred while submitting the form");
    }
  };

  // Helper function to merge data from all sub-tabs
  const mergeAllSubTabData = (formValues: any) => {
    // Start with the current form values
    const mergedData = { ...formValues };

    // Get data from work-info tab
    const workFormData = useWorkFormStore.getState().data;
    if (workFormData) {
      console.log("Merging work form data:", workFormData);

      // Store workCreationForm inside transaction_details
      // Make sure transaction_details exists
      if (!mergedData.transaction_details) {
        mergedData.transaction_details = createDefaultTransactionDetails();
      }

      // Add workCreationForm to transaction_details to match our database structure
      mergedData.transaction_details.workCreationForm = workFormData;

      // Create simplified work info at root level for easier access
      mergedData.work = {
        title: workFormData.title || "",
        date: workFormData.dateOfCreation || "",
        placeOfCreation: workFormData.placeOfCreation || "",
        classificationOfWork: workFormData.classificationOfWork || "",
        isPublished: workFormData.publicationStatus?.isPublished === "YES",
      };

      // Store original workCreationForm at root level too for backwards compatibility
      mergedData.workCreationForm = workFormData;
    } else {
      console.log("No work form data found to merge");

      // If no work form data but we have existing work data in the form values,
      // make sure we don't lose it - preserve it in the merged result
      if (formValues.work) {
        mergedData.work = formValues.work;
      }

      if (formValues.workCreationForm) {
        mergedData.workCreationForm = formValues.workCreationForm;

        // If transaction_details exists, also preserve workCreationForm there
        if (mergedData.transaction_details) {
          mergedData.transaction_details.workCreationForm =
            formValues.workCreationForm;
        }
      }
    }

    // Get data from applicant-info tab
    const applicantFormData = useApplicantFormStore.getState().data;
    if (applicantFormData) {
      // Ensure applicant_info exists with default structure
      if (!mergedData.applicant_info) {
        mergedData.applicant_info = createDefaultApplicantInfo();
      }

      // Create or ensure personalInfo object with default structure
      if (!mergedData.applicant_info.personalInfo) {
        mergedData.applicant_info.personalInfo =
          createDefaultApplicantInfo().personalInfo;
      }

      // Personal info fields that should be in the personalInfo object
      const personalInfoFields = [
        "surname",
        "firstName",
        "middleName",
        "companyName",
        "dateOfBirth",
        "civilStatus",
        "sex",
        "nationality",
        "countryOfResidence",
        "address",
        "municipalityCity",
        "provinceState",
        "zipCode",
        "mobileNumber",
        "emailAddress",
      ] as const;

      // Copy non-personal info fields directly
      for (const key in applicantFormData) {
        if (!personalInfoFields.includes(key as any)) {
          // Use type assertion since we're working with a dynamic object
          (mergedData.applicant_info as any)[key] = applicantFormData[key];
        }
      }

      // Copy personal info fields to personalInfo object
      for (const field of personalInfoFields) {
        if (
          field in applicantFormData &&
          applicantFormData[field] !== undefined
        ) {
          // Use type assertion for safety with known fields
          (mergedData.applicant_info.personalInfo as any)[field] =
            applicantFormData[field];

          // Remove any duplicated fields at the root level
          if (field in mergedData.applicant_info) {
            delete (mergedData.applicant_info as any)[field];
          }
        }
      }

      // If personalInfo already exists in the applicantFormData, merge it with our personalInfo
      if (applicantFormData.personalInfo) {
        for (const field in applicantFormData.personalInfo) {
          if (applicantFormData.personalInfo[field] !== undefined) {
            // Use type assertion for dynamic access
            (mergedData.applicant_info.personalInfo as any)[field] =
              applicantFormData.personalInfo[field];
          }
        }
      }
    }

    // Get data from author-info tab
    const authorFormData = useAuthorFormStore.getState().data;
    if (authorFormData) {
      // Ensure we maintain any data set in the main form's author_info
      mergedData.author_info = {
        ...mergedData.author_info,
        ...authorFormData,
      };

      // Ensure author_info.personalInfo is properly structured
      if (
        !mergedData.author_info.personalInfo ||
        Object.keys(mergedData.author_info.personalInfo).length === 0
      ) {
        // If sameAsApplicant is checked, copy data from applicant_info
        if (
          mergedData.author_info.sameAsApplicant ||
          mergedData.author_info.isSameAsApplicant
        ) {
          if (
            mergedData.applicant_info &&
            mergedData.applicant_info.personalInfo
          ) {
            mergedData.author_info.personalInfo = {
              ...mergedData.applicant_info.personalInfo,
            };
            console.log(
              "Copied applicant personalInfo to author because sameAsApplicant is true"
            );
          }
        }
        // If we have authors array with at least one entry, use the first author's data for personalInfo
        else if (
          mergedData.author_info.authors &&
          mergedData.author_info.authors.length > 0
        ) {
          const firstAuthor = mergedData.author_info.authors[0];
          mergedData.author_info.personalInfo = {
            sex: firstAuthor.sex || null,
            address: firstAuthor.address || "",
            surname: firstAuthor.surname || "",
            zipCode: firstAuthor.zipCode || "",
            firstName: firstAuthor.firstName || "",
            middleName: firstAuthor.middleName || "",
            civilStatus: firstAuthor.civilStatus || null,
            dateOfBirth: firstAuthor.dateOfBirth || null,
            nationality: firstAuthor.nationality || "",
            emailAddress: firstAuthor.emailAddress || "",
            mobileNumber: firstAuthor.mobileNumber || "",
            provinceState: firstAuthor.provinceState || "",
            municipalityCity: firstAuthor.municipalityCity || "",
            countryOfResidence: firstAuthor.countryOfResidence || "",
          };
        } else {
          // No authors data, use default empty structure
          mergedData.author_info.personalInfo = {
            sex: null,
            address: "",
            surname: "",
            zipCode: "",
            firstName: "",
            middleName: "",
            civilStatus: null,
            dateOfBirth: null,
            nationality: "",
            emailAddress: "",
            mobileNumber: "",
            provinceState: "",
            municipalityCity: "",
            countryOfResidence: "",
          };
        }
      }
    }

    // Ensure documentsSubmitted is properly structured
    if (mergedData.documentsSubmitted) {
      // Make sure files object exists
      if (!mergedData.documentsSubmitted.files) {
        mergedData.documentsSubmitted.files = {};
      }

      // Make sure transaction_details exists
      if (!mergedData.transaction_details) {
        mergedData.transaction_details = createDefaultTransactionDetails();
      }

      // Store documentsSubmitted in transaction_details
      mergedData.transaction_details.documentsSubmitted =
        mergedData.documentsSubmitted;
    }

    // Ensure signature is stored in transaction_details
    if (mergedData.signature) {
      // Make sure transaction_details exists
      if (!mergedData.transaction_details) {
        mergedData.transaction_details = createDefaultTransactionDetails();
      }

      // Store signature in transaction_details
      mergedData.transaction_details.signature = mergedData.signature;
    }

    return mergedData;
  };

  const handleFileUpload = (files: File[], fieldName: DocumentFieldName) => {
    // Fix string conversion using literals since we know the exact field names
    form.setValue(`documentsSubmitted.files.${fieldName}` as const, files);
  };

  // Helper component for document upload fields
  const DocumentUploadField = ({
    name,
    label,
    description,
  }: {
    name: DocumentFieldName;
    label: string;
    description: string;
  }) => {
    // Use a safer approach to get files
    const filesPath = `documentsSubmitted.files.${name}` as const;
    const files = (form.watch(filesPath) as File[]) || [];

    return (
      <div className="w-full">
        <FormField
          control={form.control}
          // Use a proper type assertion for the field name
          name={`documentsSubmitted.${name}` as any}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                    className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                  />
                </FormControl>
                <div className="flex-1 space-y-2">
                  <FormLabel className="font-normal text-black">
                    {label}
                  </FormLabel>
                  {field.value === true && (
                    <>
                      <FileUploader
                        onValueChange={(files) => handleFileUpload(files, name)}
                        value={files}
                        multiple={false}
                      >
                        <FileUploaderContent>
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        </FileUploaderContent>
                      </FileUploader>

                      {/* File List */}
                      {(() => {
                        return files.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            {files.map((file: File, index: number) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <FileText className="h-4 w-4 text-[#1B5E20]" />
                                <span className="flex-1 truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs">
                                  ({formatFileSize(file.size)})
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-[#1B5E20] hover:text-[#1B5E20]/80 hover:bg-green-50"
                                  onClick={() => {
                                    const newFiles = [...files];
                                    newFiles.splice(index, 1);
                                    handleFileUpload(newFiles, name);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  };

  // Sub-tab navigation functions
  const handleSubTabNext = () => {
    const currentIndex = subtabs.indexOf(currentTransactionSubTab);
    if (currentIndex < subtabs.length - 1) {
      // Save current form data before switching tabs
      const values = form.getValues();

      // Get and merge data from specific sub-tabs
      let updatedValues = { ...values };

      if (currentTransactionSubTab === "work-info") {
        const workFormData = useWorkFormStore.getState().data;
        if (workFormData) {
          // Merge the work form data with the main form data
          updatedValues = { ...updatedValues, workCreationForm: workFormData };
          console.log("Merged work creation form data:", workFormData);

          // Also store in transaction_details
          if (!updatedValues.transaction_details) {
            updatedValues.transaction_details =
              createDefaultTransactionDetails();
          } else {
            // Ensure workCreationForm exists in transaction_details
            updatedValues.transaction_details.workCreationForm = {
              ...updatedValues.transaction_details.workCreationForm,
              ...workFormData,
            };
          }
        }
      } else if (currentTransactionSubTab === "applicant-info") {
        const applicantFormData = useApplicantFormStore.getState().data;
        if (applicantFormData) {
          // Ensure applicant_info exists with default structure
          if (!updatedValues.applicant_info) {
            updatedValues.applicant_info = createDefaultApplicantInfo();
          }

          // Create or ensure personalInfo object
          if (!updatedValues.applicant_info.personalInfo) {
            updatedValues.applicant_info.personalInfo =
              createDefaultApplicantInfo().personalInfo;
          }

          // Personal info fields that should be in the personalInfo object
          const personalInfoFields = [
            "surname",
            "firstName",
            "middleName",
            "companyName",
            "dateOfBirth",
            "civilStatus",
            "sex",
            "nationality",
            "countryOfResidence",
            "address",
            "municipalityCity",
            "provinceState",
            "zipCode",
            "mobileNumber",
            "emailAddress",
          ] as const;

          // Copy non-personal info fields directly
          for (const key in applicantFormData) {
            if (!personalInfoFields.includes(key as any)) {
              // Use type assertion since we're working with a dynamic object
              (updatedValues.applicant_info as any)[key] =
                applicantFormData[key];
            }
          }

          // Copy personal info fields to personalInfo object
          for (const field of personalInfoFields) {
            if (
              field in applicantFormData &&
              applicantFormData[field] !== undefined
            ) {
              // Use type assertion for safety with known fields
              (updatedValues.applicant_info.personalInfo as any)[field] =
                applicantFormData[field];

              // Remove any duplicated fields at the root level
              if (field in updatedValues.applicant_info) {
                delete (updatedValues.applicant_info as any)[field];
              }
            }
          }

          // If personalInfo already exists in the applicantFormData, merge it with our personalInfo
          if (applicantFormData.personalInfo) {
            for (const field in applicantFormData.personalInfo) {
              if (applicantFormData.personalInfo[field] !== undefined) {
                // Use type assertion for dynamic access
                (updatedValues.applicant_info.personalInfo as any)[field] =
                  applicantFormData.personalInfo[field];
              }
            }
          }
        }
      } else if (currentTransactionSubTab === "author-info") {
        const authorFormData = useAuthorFormStore.getState().data;
        if (authorFormData) {
          // Update the entire author_info object instead of individual fields
          const currentAuthorInfo = form.getValues("author_info") || {};
          form.setValue("author_info", {
            ...currentAuthorInfo,
            ...authorFormData,
          });
        }
      }

      // Save the merged data to the store (memory only, no database save)
      setData(updatedValues);
      setTransactionFormPart2(updatedValues);
      console.log("Updated transaction form part 2 data:", updatedValues);

      // Navigate to the next sub-tab
      const nextTab = subtabs[currentIndex + 1];
      setCurrentTransactionSubTab(nextTab);
    }
  };

  const handleSubTabPrevious = () => {
    const currentIndex = subtabs.indexOf(currentTransactionSubTab);
    if (currentIndex > 0) {
      // Save current form data before switching tabs (memory only)
      const values = form.getValues();

      // Get and merge data from specific sub-tabs
      let updatedValues = { ...values };

      if (currentTransactionSubTab === "work-info") {
        const workFormData = useWorkFormStore.getState().data;
        if (workFormData) {
          // Merge the work form data with the main form data
          updatedValues = { ...updatedValues, workCreationForm: workFormData };

          // Also store in transaction_details
          if (!updatedValues.transaction_details) {
            updatedValues.transaction_details =
              createDefaultTransactionDetails();
          } else {
            // Ensure workCreationForm exists in transaction_details
            updatedValues.transaction_details.workCreationForm = {
              ...updatedValues.transaction_details.workCreationForm,
              ...workFormData,
            };
          }
        }
      } else if (currentTransactionSubTab === "applicant-info") {
        const applicantFormData = useApplicantFormStore.getState().data;
        if (applicantFormData) {
          // Update the entire applicant_info object instead of individual fields
          const currentApplicantInfo = form.getValues("applicant_info") || {};
          form.setValue("applicant_info", {
            ...currentApplicantInfo,
            ...applicantFormData,
          });
        }
      } else if (currentTransactionSubTab === "author-info") {
        const authorFormData = useAuthorFormStore.getState().data;
        if (authorFormData) {
          // Update the entire author_info object instead of individual fields
          const currentAuthorInfo = form.getValues("author_info") || {};
          form.setValue("author_info", {
            ...currentAuthorInfo,
            ...authorFormData,
          });
        }
      }

      // Save the merged data to the store (memory only)
      setData(updatedValues);
      setTransactionFormPart2(updatedValues);

      // Then navigate to the previous tab
      const prevTab = subtabs[currentIndex - 1];
      setCurrentTransactionSubTab(prevTab);
    }
  };

  // Add a ref for tracking previous values
  const previousValuesRef = useRef<any>(null);

  // Update the form watch effect to use debounce and prevent unnecessary updates
  useEffect(() => {
    // Skip if initialization hasn't happened yet
    if (!isHydrated || hasInitialized.current === false) {
      return;
    }

    // Create a true debounced function
    const debouncedUpdate = debounce((formValues) => {
      // Only update if values have changed significantly
      if (
        JSON.stringify(formValues) !== JSON.stringify(previousValuesRef.current)
      ) {
        console.log("Debounced form update triggered");
        setData(formValues);
        previousValuesRef.current = formValues;
      }
    }, 1000);

    const subscription = form.watch((value) => {
      if (value && Object.keys(value).length > 0) {
        const currentValues = form.getValues();
        debouncedUpdate(currentValues);
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedUpdate.cancel(); // Cancel any pending debounce calls
    };
  }, [form, setData, isHydrated]);

  // Add useEffect to initialize with clean data on first load - Fix infinite loop potential
  useEffect(() => {
    // Skip if already initialized or not ready
    if (isFormInitialized || !isHydrated || hasInitialized.current) {
      return;
    }

    console.log("Running one-time form initialization");

    // Mark as initialized to prevent re-runs
    setIsFormInitialized(true);
    hasInitialized.current = true;

    // Check if we have any existing data in the store
    const { transactionFormPart2: existingData } =
      useIpDisclosureStore.getState();

    if (
      existingData &&
      existingData.transaction_details &&
      (existingData.transaction_details.transactionType ||
        existingData.applicant_info?.applicantType)
    ) {
      // If we have existing data with transaction types, use it
      console.log(
        "Loading existing transaction form part 2 data:",
        existingData
      );
      form.reset(existingData);
      setData(existingData);

      // Also make sure the sub-tab is initialized
      if (currentTransactionSubTab) {
        setCurrentTransactionSubTab(currentTransactionSubTab);
        console.log("Setting current sub-tab to:", currentTransactionSubTab);
      }
    } else {
      // If we don't have existing data, initialize with empty default data
      console.log(
        "No existing transaction form part 2 data, initializing with empty form"
      );
      const emptyFormData = {
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
        disclosureId: disclosureId || undefined,
        copyrightId: undefined,
      };
      form.reset(emptyFormData);
      setData(emptyFormData);
      setTransactionFormPart2(emptyFormData);
    }

    // Enable watching for changes after initialization
    setShouldWatchChanges(true);
  }, [isHydrated, disclosureId]);

  // Sync with copyright application data for IDs
  useEffect(() => {
    // Get the current form values
    const currentValues = form.getValues();

    // Get the parent form data from the store
    const { copyrightApplication } = useIpDisclosureStore.getState();

    // Only update if necessary
    if (copyrightApplication) {
      const shouldUpdate =
        ((!currentValues.disclosureId || currentValues.disclosureId === "") &&
          copyrightApplication.disclosureId) ||
        ((!currentValues.copyrightId || currentValues.copyrightId === "") &&
          copyrightApplication.copyrightId);

      if (shouldUpdate) {
        console.log("Updating transaction form part 2 with parent IDs:", {
          copyrightId: copyrightApplication.copyrightId,
          disclosureId: copyrightApplication.disclosureId,
        });

        // Update the form with the parent IDs
        const updatedValues = {
          ...currentValues,
          disclosureId: copyrightApplication.disclosureId,
          copyrightId: copyrightApplication.copyrightId,
        };

        // Update the form
        form.setValue("disclosureId", copyrightApplication.disclosureId);
        form.setValue("copyrightId", copyrightApplication.copyrightId);

        // Save to store
        setData(updatedValues);
        setTransactionFormPart2(updatedValues);
        previousValuesRef.current = updatedValues;
      }
    }
  }, [form, setTransactionFormPart2, setData]);

  // Add effect to initialize the currentTransactionSubTab - Fix potential infinite loop
  useEffect(() => {
    // Only run this once after hydration
    if (
      isHydrated &&
      !hasSetTabRef.current &&
      !subtabs.includes(currentTransactionSubTab)
    ) {
      console.log("Setting default tab to transaction-details");
      hasSetTabRef.current = true;
      setCurrentTransactionSubTab("transaction-details");
    }
  }, [
    isHydrated,
    currentTransactionSubTab,
    subtabs,
    setCurrentTransactionSubTab,
  ]);

  // Add useEffect to handle sub-tab data synchronization - Fix infinite loop
  useEffect(() => {
    // Skip if initialization hasn't happened yet
    if (!isHydrated || !hasInitialized.current) {
      return;
    }

    // Skip if we shouldn't be watching changes
    if (!shouldWatchChanges) {
      console.log("Skipping sub-tab data sync (watching disabled)");
      return;
    }

    // Use a single update flag to prevent recursive updates
    const currentTab = currentTransactionSubTab;
    console.log(`Syncing data for sub-tab: ${currentTab}`);

    // Use an immediate function to handle the sync
    const syncSubTabData = () => {
      if (currentTab === "work-info") {
        // Update work form data if available
        const workFormData = useWorkFormStore.getState().data;
        if (workFormData) {
          // Avoid rerenders by using these options
          form.setValue("workCreationForm", workFormData, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }
      } else if (currentTab === "applicant-info") {
        // Update applicant form data if available
        const applicantFormData = useApplicantFormStore.getState().data;
        if (applicantFormData) {
          const currentApplicantInfo = form.getValues("applicant_info") || {};
          form.setValue(
            "applicant_info",
            {
              ...currentApplicantInfo,
              ...applicantFormData,
            },
            {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            }
          );
        }
      } else if (currentTab === "author-info") {
        // Update author form data if available
        const authorFormData = useAuthorFormStore.getState().data;
        if (authorFormData) {
          const currentAuthorInfo = form.getValues("author_info") || {};
          form.setValue(
            "author_info",
            {
              ...currentAuthorInfo,
              ...authorFormData,
            },
            {
              shouldDirty: false,
              shouldTouch: false,
              shouldValidate: false,
            }
          );
        }
      }
    };

    // Execute the sync once - don't use refs that reset with timeouts as they can cause race conditions
    syncSubTabData();
  }, [currentTransactionSubTab, shouldWatchChanges, form, isHydrated]);

  // In the main component add these effects

  // Effect to listen for work form data updates
  useEffect(() => {
    const handleWorkFormUpdate = (event: CustomEvent) => {
      const workData = event.detail;
      if (workData) {
        console.log(
          "[TransactionFormPart2] Received work form update:",
          workData
        );

        // Get current data
        const currentData = data || {};

        // Create/update the work object at the root level
        const updatedData = {
          ...currentData,
          work: {
            title: workData.title || "",
            date: workData.dateOfCreation || "",
            placeOfCreation: workData.placeOfCreation || "",
            classificationOfWork: workData.classificationOfWork || "",
            isPublished: workData.publicationStatus?.isPublished === "YES",
          },
          // Store full workCreationForm data for reference
          workCreationForm: workData,
        };

        // Update transaction_details if it exists
        if (updatedData.transaction_details) {
          updatedData.transaction_details.workCreationForm = workData;
        } else {
          updatedData.transaction_details = {
            ...createDefaultTransactionDetails(),
            workCreationForm: workData,
          };
        }

        // Update the state
        setData(updatedData);
      }
    };

    // Listen for both event types
    window.addEventListener(
      "work-form-data-updated",
      handleWorkFormUpdate as EventListener
    );
    window.addEventListener(
      "work-form-submitted",
      handleWorkFormUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "work-form-data-updated",
        handleWorkFormUpdate as EventListener
      );
      window.removeEventListener(
        "work-form-submitted",
        handleWorkFormUpdate as EventListener
      );
    };
  }, [setData, data]);

  // Update the initialization logic to check for existing workFormData - Fix infinite loop
  useEffect(() => {
    // Skip if already initialized
    if (!data || hasInitialized.current) {
      return;
    }

    console.log("Running workFormData initialization once");

    // Get work form data
    const workFormData = useWorkFormStore.getState().data;
    if (workFormData) {
      console.log(
        "[TransactionFormPart2] Initializing with work form data:",
        workFormData
      );

      // Pre-populate work data in our store
      const updatedData = { ...data };
      updatedData.workCreationForm = workFormData;
      updatedData.work = {
        title: workFormData.title || "",
        date: workFormData.dateOfCreation || "",
        placeOfCreation: workFormData.placeOfCreation || "",
        classificationOfWork: workFormData.classificationOfWork || "",
        isPublished: workFormData.publicationStatus?.isPublished === "YES",
      };

      if (updatedData.transaction_details) {
        updatedData.transaction_details.workCreationForm = workFormData;
      }

      setData(updatedData);
    }

    // Mark that we've run the initialization
    hasInitialized.current = true;
  }, [data, setData]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Transaction Details
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide details about the transaction and related information
          </p>
        </div>

        {/* Main content */}
        <Card className="border-green-200">
          <CardContent className="pt-6">
            <Tabs
              value={
                subtabs.includes(currentTransactionSubTab)
                  ? currentTransactionSubTab
                  : "transaction-details"
              }
              defaultValue="transaction-details"
              className="w-full"
              onValueChange={(value) => {
                setCurrentTransactionSubTab(value);
                // Save current form data before switching tabs
                const values = form.getValues();
                setData(values);
              }}
            >
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 h-auto bg-transparent p-0 mb-6">
                {subtabs.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="w-full text-black data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#1B5E20] data-[state=active]:border-[#1B5E20] data-[state=active]:border-b-2 data-[state=active]:shadow-none hover:text-[#1B5E20] hover:bg-[#E8F5E9]/50 whitespace-nowrap text-sm py-2 px-4"
                  >
                    {tab
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={currentTransactionSubTab} className="mt-6">
                <div>
                  {currentTransactionSubTab === "transaction-details" && (
                    <div className="space-y-6">
                      {/* Transaction Type Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-medium text-black">
                            Type of Transaction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTransactionTypeField(
                              "copyrightRegistration",
                              "Copyright Registration"
                            )}
                            {renderTransactionTypeField(
                              "anonymousWork",
                              "Anonymous Work (Exemption of Oath)"
                            )}
                            {renderTransactionTypeField(
                              "correctionEntry",
                              "Correction of Entry"
                            )}
                            {renderTransactionTypeField(
                              "resaleRights",
                              "Resale Rights Notice"
                            )}
                            {renderTransactionTypeField(
                              "certifiedCopy",
                              "Certified Copy of Certificate/Document"
                            )}
                            {renderTransactionTypeField(
                              "recordation",
                              "Recordation of Instruments Affecting Copyright"
                            )}
                            {renderTransactionTypeField(
                              "reconstitution",
                              "Reconstitution of Records"
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Filing Method and Filing Type Combined in one card as Submission Type */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-medium text-black">
                            Submission Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Filing Method */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-black">
                                Filing Method
                              </h4>
                              <div className="space-y-3">
                                {renderFilingMethodField(
                                  "electronicFiling",
                                  "Electronic Filing"
                                )}
                                {renderFilingMethodField(
                                  "throughIPSO",
                                  "Through IPSO (Intellectual Property Satellite Office)"
                                )}

                                {/* Always show IPSO Region but disable it when "Through IPSO" is not selected */}
                                <div className="mt-4 pl-7">
                                  <FormField
                                    control={form.control}
                                    name={FIELD_PATHS.IPSO_REGION}
                                    render={({ field }) => (
                                      <FormItem className="w-full">
                                        <FormLabel className="text-black">
                                          IPSO Region
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value}
                                          disabled={!isIPSO}
                                        >
                                          <FormControl>
                                            <SelectTrigger
                                              className={`w-full ${
                                                !isIPSO ? "opacity-70" : ""
                                              }`}
                                            >
                                              <SelectValue placeholder="Select IPSO Region" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="max-h-[200px] overflow-y-auto">
                                            <SelectItem value="NCR">
                                              NCR
                                            </SelectItem>
                                            <SelectItem value="CAR - IPSO Baguio">
                                              CAR - IPSO Baguio
                                            </SelectItem>
                                            <SelectItem value="Region 1 - IPSO Vigan">
                                              Region 1 - IPSO Vigan
                                            </SelectItem>
                                            <SelectItem value="Region 2 - IPSO Tuguegarao">
                                              Region 2 - IPSO Tuguegarao
                                            </SelectItem>
                                            <SelectItem value="Region 3 - IPSO Pampanga">
                                              Region 3 - IPSO Pampanga
                                            </SelectItem>
                                            <SelectItem value="Region 5 - IPSO Legaspi">
                                              Region 5 - IPSO Legaspi
                                            </SelectItem>
                                            <SelectItem value="Region 5 - IPSO Naga">
                                              Region 5 - IPSO Naga
                                            </SelectItem>
                                            <SelectItem value="Region 6 - IPSO Iloilo">
                                              Region 6 - IPSO Iloilo
                                            </SelectItem>
                                            <SelectItem value="Region 7 - IPSO Cebu">
                                              Region 7 - IPSO Cebu
                                            </SelectItem>
                                            <SelectItem value="Region 7 - IPSO Dumaguete">
                                              Region 7 - IPSO Dumaguete
                                            </SelectItem>
                                            <SelectItem value="Region 8 - IPSO Tacloban">
                                              Region 8 - IPSO Tacloban
                                            </SelectItem>
                                            <SelectItem value="Region 9 - IPSO Zamboanga">
                                              Region 9 - IPSO Zamboanga
                                            </SelectItem>
                                            <SelectItem value="Region 10 - IPSO Cagayan de Oro">
                                              Region 10 - IPSO Cagayan de Oro
                                            </SelectItem>
                                            <SelectItem value="Region 11 - IPSO Davao">
                                              Region 11 - IPSO Davao
                                            </SelectItem>
                                            <SelectItem value="Region 12 - IPSO General Santos">
                                              Region 12 - IPSO General Santos
                                            </SelectItem>
                                            <SelectItem value="Region 13 - IPSO Caraga">
                                              Region 13 - IPSO Caraga
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Filing Type */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-black">
                                Filing Type
                              </h4>
                              <div className="space-y-3">
                                {renderFilingTypeField(
                                  "singleFiling",
                                  "Single Filing"
                                )}
                                {renderFilingTypeField(
                                  "bulkFiling",
                                  "Bulk Filing"
                                )}

                                {/* Always show Bulk Filing Quantity but disable it when "Bulk Filing" is not selected */}
                                <div className="mt-4 pl-7">
                                  <FormField
                                    control={form.control}
                                    name={FIELD_PATHS.BULK_FILING_QTY}
                                    render={({ field }) => (
                                      <FormItem className="w-full">
                                        <FormLabel className="text-black">
                                          Quantity (Minimum of 10)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="10"
                                            placeholder="Enter quantity"
                                            className={`w-full ${
                                              !isBulkFiling ? "opacity-70" : ""
                                            }`}
                                            disabled={!isBulkFiling}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Applicant Type Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-medium text-black">
                            Applicant Type
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderApplicantTypeField(
                              "authorCreator",
                              "Author/Creator"
                            )}
                            {renderApplicantTypeField("agent", "Agent")}
                            {renderApplicantTypeField(
                              "copyrightClaimant",
                              "Copyright Claimant"
                            )}
                            {renderApplicantTypeField("licensee", "Licensee")}
                            {renderApplicantTypeField("heir", "Heir")}
                            {renderApplicantTypeField("newOwner", "New Owner")}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {currentTransactionSubTab === "applicant-info" && (
                    <div className="space-y-6">
                      {/* Ensure applicant_info is properly structured before passing it to ApplicantInformationForm */}
                      <ApplicantInformationForm
                        parentData={{
                          applicant_info: form.getValues().applicant_info
                            ? {
                                ...form.getValues().applicant_info,
                                // Ensure we have a valid personalInfo structure
                                personalInfo: form.getValues().applicant_info
                                  .personalInfo || {
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
                                // Ensure entityType is defined
                                entityType: form.getValues().applicant_info
                                  .entityType || {
                                  smallEntity: false,
                                  bigEntity: false,
                                },
                              }
                            : {
                                // Default structure if applicant_info is not defined
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
                              },
                        }}
                      />
                    </div>
                  )}
                  {currentTransactionSubTab === "author-info" && (
                    <AuthorCreatorForm />
                  )}
                  {currentTransactionSubTab === "work-info" && (
                    <WorkCreationForm />
                  )}
                  {currentTransactionSubTab === "documents" && (
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        <Alert className="bg-amber-50 border-amber-100">
                          <AlertDescription>
                            Required supporting documents vary depending on the
                            type of transaction. Please see the reference tab
                            for requirements.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          <FormLabel className="text-base font-medium text-black">
                            Documentation
                          </FormLabel>
                          <div className="space-y-4">
                            <DocumentUploadField
                              name="electronicCopy"
                              label="Electronic Copy of the Work"
                              description="Upload a digital copy of your work (PDF, JPG, MP3, MP4, etc.)"
                            />

                            <DocumentUploadField
                              name="governmentId"
                              label="Government-issued ID"
                              description="Upload a valid government-issued ID (e.g., Passport, Driver's License)"
                            />

                            <DocumentUploadField
                              name="deedOfAssignment"
                              label="Deed of Assignment/Transfer"
                              description="Upload deed of assignment or transfer documents"
                            />

                            <DocumentUploadField
                              name="marriageCertificate"
                              label="Marriage Certificate"
                              description="Required if applicant is a spouse of the author/creator"
                            />

                            <DocumentUploadField
                              name="specialPowerOfAttorney"
                              label="Special Power of Attorney"
                              description="Required for agents representing the author/creator"
                            />

                            <DocumentUploadField
                              name="boardResolution"
                              label="Board Resolution"
                              description="Required for corporate entities"
                            />

                            <DocumentUploadField
                              name="secretaryCertificate"
                              label="Secretary's Certificate"
                              description="Required for corporate entities"
                            />

                            <DocumentUploadField
                              name="ipophlCertificate"
                              label="IPOPHL Certificate"
                              description="Upload previous IPOPHL certificate if applicable"
                            />

                            <div className="w-full">
                              <FormField
                                control={form.control}
                                name="documentsSubmitted.others"
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-start gap-3">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value === true}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked === true);
                                          }}
                                          className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                                        />
                                      </FormControl>
                                      <div className="flex-1 space-y-2">
                                        <FormLabel className="font-normal text-black">
                                          Others
                                        </FormLabel>
                                        {field.value === true && (
                                          <>
                                            <FileUploader
                                              onValueChange={(files) => {
                                                handleFileUpload(
                                                  files,
                                                  "others"
                                                );
                                              }}
                                              value={
                                                Array.isArray(
                                                  form.watch(
                                                    "documentsSubmitted.files.others"
                                                  )
                                                )
                                                  ? form.watch(
                                                      "documentsSubmitted.files.others"
                                                    )
                                                  : []
                                              }
                                              multiple={true}
                                            >
                                              <FileUploaderContent>
                                                <p className="text-sm text-muted-foreground">
                                                  Upload other supporting
                                                  documents (PDF or image
                                                  format)
                                                </p>
                                              </FileUploaderContent>
                                            </FileUploader>

                                            {/* File List */}
                                            {(() => {
                                              const files =
                                                (form.watch(
                                                  "documentsSubmitted.files.others"
                                                ) as File[]) || [];
                                              return files.length > 0 ? (
                                                <div className="mt-2 space-y-1">
                                                  {files.map(
                                                    (
                                                      file: File,
                                                      index: number
                                                    ) => (
                                                      <div
                                                        key={index}
                                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                                      >
                                                        <FileText className="h-4 w-4 text-[#1B5E20]" />
                                                        <span className="flex-1 truncate">
                                                          {file.name}
                                                        </span>
                                                        <span className="text-xs">
                                                          (
                                                          {formatFileSize(
                                                            file.size
                                                          )}
                                                          )
                                                        </span>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-8 w-8 p-0 text-[#1B5E20] hover:text-[#1B5E20]/80 hover:bg-green-50"
                                                          onClick={() => {
                                                            const newFiles = [
                                                              ...files,
                                                            ];
                                                            newFiles.splice(
                                                              index,
                                                              1
                                                            );
                                                            handleFileUpload(
                                                              newFiles,
                                                              "others"
                                                            );
                                                          }}
                                                        >
                                                          <X className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              ) : null;
                                            })()}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {currentTransactionSubTab === "signature" && (
                    <Card>
                      <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="signature.agree"
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1 border-[#1B5E20] data-[state=checked]:bg-[#1B5E20] data-[state=checked]:text-white"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="font-medium text-black">
                                    Privacy Statement
                                  </FormLabel>
                                  <FormDescription>
                                    I agree to the collection and processing of
                                    my personal information for the purpose of
                                    this copyright application in accordance
                                    with the Data Privacy Act of 2012.
                                  </FormDescription>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          {form.watch("signature.agree") && (
                            <div className="space-y-6 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="signature.firstName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-black">
                                        First Name
                                      </FormLabel>
                                      <FormControl>
                                        <Input {...field} className="w-full" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="signature.middleInitial"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-black">
                                        Middle Initial
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          maxLength={1}
                                          className="w-full"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="signature.lastName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-black">
                                        Last Name
                                      </FormLabel>
                                      <FormControl>
                                        <Input {...field} className="w-full" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="pt-4">
                                <FormLabel className="block mb-2 text-black">
                                  Signature Files
                                </FormLabel>
                                <Alert className="bg-amber-50 border-amber-100 mb-4">
                                  <AlertDescription>
                                    Electronic signatures are not allowed.
                                    Please download the signature form, sign it
                                    physically, and upload the scanned copy.
                                  </AlertDescription>
                                </Alert>
                                <div className="flex flex-col gap-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full md:w-auto flex items-center gap-2 text-[#1B5E20] border-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
                                    onClick={() => {
                                      // This would typically download a signature form template
                                      toast.info(
                                        "Signature form template download started"
                                      );
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download Signature Form
                                  </Button>

                                  <FileUploader
                                    onValueChange={(files) => {
                                      form.setValue(
                                        "signature.signatureFile",
                                        files
                                      );
                                    }}
                                    value={
                                      Array.isArray(
                                        form.watch("signature.signatureFile")
                                      )
                                        ? form.watch("signature.signatureFile")
                                        : []
                                    }
                                    multiple={false}
                                  >
                                    <FileUploaderContent>
                                      <p className="text-sm text-muted-foreground">
                                        Upload your signed signature form (PDF
                                        or image format)
                                      </p>
                                    </FileUploaderContent>
                                  </FileUploader>

                                  {/* File List for Signature - Using a safer approach with IIFE */}
                                  {(() => {
                                    const files = form.watch(
                                      "signature.signatureFile"
                                    );
                                    return Array.isArray(files) &&
                                      files.length > 0 ? (
                                      <div className="mt-2 space-y-1">
                                        {files.map(
                                          (file: File, index: number) => (
                                            <div
                                              key={index}
                                              className="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                              <FileText className="h-4 w-4 text-[#1B5E20]" />
                                              <span className="flex-1 truncate">
                                                {file.name}
                                              </span>
                                              <span className="text-xs">
                                                ({formatFileSize(file.size)})
                                              </span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-[#1B5E20] hover:text-[#1B5E20]/80 hover:bg-green-50"
                                                onClick={() => {
                                                  form.setValue(
                                                    "signature.signatureFile",
                                                    []
                                                  );
                                                }}
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {currentTransactionSubTab === "reference" && (
                    <ReferenceForm />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Add SubTab Navigation */}
        <Card>
          <CardContent className="py-4">
            <SubTabNavigation
              currentSubTab={currentTransactionSubTab}
              onPrevious={handleSubTabPrevious}
              onNext={handleSubTabNext}
              subtabs={subtabs}
            />
          </CardContent>
        </Card>

        <Separator className="bg-green-100" />

        {/* Add warning message about navigation */}
        <Alert className="mt-6 mb-4 bg-amber-50 border-amber-200">
          <AlertDescription className="flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-500" />
            <span>
              You can navigate to other tabs while preserving your progress.
              However, please complete all sub-tabs before final submission.
            </span>
          </AlertDescription>
        </Alert>

        {/* Navigation controls */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
          >
            Previous
          </Button>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
            >
              Update Form
            </Button>

            {/* Direct navigation button with no form validation */}
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigateToNext();
              }}
              className="bg-[#1B5E20] text-white hover:bg-[#0A3A10]"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Hidden submit button that can be triggered programmatically */}
        <Button
          type="submit"
          className="hidden"
          onClick={form.handleSubmit(onSubmit)}
        >
          Submit Form
        </Button>
      </form>
    </Form>
  );
}
