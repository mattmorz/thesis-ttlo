"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Upload,
  CheckCircle,
  Loader2,
  CalendarIcon,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import {
  eachYearOfInterval,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
  format,
  addYears,
  subYears,
} from "date-fns";

import { DeedOfAssignmentPDFComponent } from "./deed-of-assignment-pdf";
import { useDeedAssignmentStore } from "@/lib/store/deed-assignment-store";
import { X } from "lucide-react";

interface SignatorySectionProps {
  initialData?: any;
  isDisabled?: boolean;
  formStatus?: string;
  onDataUpdate?: () => void;
  useStore?: boolean;
}

interface Creator {
  firstName: string;
  middleInitial: string;
  lastName: string;
}

const formSchema = z.object({
  day: z.string().trim().min(1, "Day is required"),
  month: z.string().trim().min(1, "Month is required"),
  year: z.string().trim().min(1, "Year is required"),
  assigneeId: z.string().trim().min(1, "Assignee ID is required"),
  assigneeDate: z.string().trim().min(1, "Assignee date is required"),
  assigneePlace: z.string().trim().min(1, "Assignee place is required"),
  assignorId: z.string().optional(),
  assignorIds: z.array(z.string().trim().min(1, "ID No. is required")).optional(),
  assignorDate: z.string().trim().min(1, "Assignor date is required"),
  assignorPlace: z.string().trim().min(1, "Assignor place is required"),
  notarizedDocumentPath: z.string().optional(),
  docNumber: z.string().optional(),
  pageNumber: z.string().optional(),
  bookNumber: z.string().optional(),
  seriesYear: z.string().optional(),
});

export function SignatorySection({
  initialData,
  isDisabled = false,
  formStatus = "draft",
  onDataUpdate,
  useStore = false,
}: SignatorySectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isYearView, setIsYearView] = useState<boolean>(false);
  const [month, setMonth] = useState<Date>(new Date());
  const startDate = subYears(new Date(), 10);
  const endDate = addYears(new Date(), 10);

  // Add refs for component lifecycle management
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  // Get active application ID
  const { activeApplicationId } = useActiveApplication();
  const formSubmission = useFormSubmission();

  // Get form ID from URL if available
  const formId = searchParams.get("formId") || undefined;

  // Get store functions
  const { updateSignatoryData, deed: storeDeedData } = useDeedAssignmentStore();

  // Function to get application-specific localStorage key
  const getLocalStorageKey = useCallback(
    (baseKey: string) => {
      return activeApplicationId
        ? `${baseKey}_${activeApplicationId}`
        : baseKey;
    },
    [activeApplicationId]
  );

  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      day: "",
      month: "",
      year: "",
      assigneeId: "M98 – 009",
      assigneeDate: "",
      assigneePlace: "Butuan City",
      assignorId: "",
      assignorIds: [],
      assignorDate: "",
      assignorPlace: "Butuan City",
      docNumber: "",
      pageNumber: "",
      bookNumber: "",
      seriesYear: "",
    },
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Set isMounted flag on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load saved data when component mounts or active application changes
  useEffect(() => {
    if (!isMountedRef.current || isInitializedRef.current) return;

    const loadData = () => {
      // If we have initialData from props, use it as our primary source
      if (initialData && Object.keys(initialData).length > 0) {
        // Convert single assignorId to assignorIds array if needed for backward compatibility
        const updatedInitialData = {
          ...initialData,
          assignorIds:
            initialData.assignorIds ||
            (initialData.assignorId
              ? initialData.assignorId.split(",").map((id: string) => id.trim())
              : []),
        };

        form.reset(updatedInitialData);

        // Get creators from store or deed data
        if (useStore && storeDeedData) {
          setCreators(storeDeedData.creators || []);
        }

        // Also save to localStorage for persistence
        localStorage.setItem(
          getLocalStorageKey("signatoryData"),
          JSON.stringify(updatedInitialData)
        );
        return;
      }

      // Otherwise, try to load from localStorage
      const savedData = localStorage.getItem(
        getLocalStorageKey("signatoryData")
      );
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);

          // Convert single assignorId to assignorIds array if needed for backward compatibility
          const updatedData = {
            ...parsedData,
            assignorIds:
              parsedData.assignorIds ||
              (parsedData.assignorId
                ? parsedData.assignorId
                    .split(",")
                    .map((id: string) => id.trim())
                : []),
          };

          form.reset(updatedData);
        } catch (err) {
          console.error("[SignatorySection] Error loading saved data:", err);
          // Initialize with default empty values
          const defaultData = {
            day: "",
            month: "",
            year: "",
            assigneeId: "M98 – 009",
            assigneeDate: "",
            assigneePlace: "Butuan City",
            assignorId: "",
            assignorIds: Array(creators.length || 1).fill(""), // Initialize proper length array
            assignorDate: "",
            assignorPlace: "Butuan City",
            docNumber: "",
            pageNumber: "",
            bookNumber: "",
            seriesYear: "",
            notarizedDocumentPath: "",
          };
          form.reset(defaultData);
        }
      }

      // Get creators from deed data in localStorage
      const deedData = localStorage.getItem(
        getLocalStorageKey("deedAssignmentData")
      );
      if (deedData) {
        try {
          const parsedDeedData = JSON.parse(deedData);
          if (
            parsedDeedData.creators &&
            Array.isArray(parsedDeedData.creators)
          ) {
            setCreators(parsedDeedData.creators);
          }
        } catch (err) {
          console.error("[SignatorySection] Error loading deed data:", err);
        }
      }
    };

    loadData();
    isInitializedRef.current = true;
  }, [
    form,
    initialData,
    activeApplicationId,
    getLocalStorageKey,
    storeDeedData,
    useStore,
  ]);

  // Check if initialData exists and log it for debugging
  useEffect(() => {
    console.log(
      "[SignatorySection] Checking initialData on mount:",
      initialData
    );
    // If we have initialData with dates, log them for debugging
    if (initialData) {
      if (initialData.assigneeDate) {
        console.log(
          "[SignatorySection] Initial assigneeDate:",
          initialData.assigneeDate
        );
        console.log(
          "[SignatorySection] Parsed date:",
          new Date(initialData.assigneeDate)
        );
      }
      if (initialData.assignorDate) {
        console.log(
          "[SignatorySection] Initial assignorDate:",
          initialData.assignorDate
        );
        console.log(
          "[SignatorySection] Parsed date:",
          new Date(initialData.assignorDate)
        );
      }
    }
  }, [initialData]);

  console.log(
    "[SignatorySection] Form initialized with values:",
    form.getValues()
  );

  // Save form state to localStorage when unmounting
  useEffect(() => {
    return () => {
      if (!isMountedRef.current) return;

      console.log("[SignatorySection] Component unmounting, saving data");
      try {
        const values = form.getValues();
        localStorage.setItem(
          getLocalStorageKey("signatoryData"),
          JSON.stringify(values)
        );
      } catch (error) {
        console.error(
          "[SignatorySection] Error saving data on unmount:",
          error
        );
      }
    };
  }, [form, activeApplicationId]);

  // Show validation errors immediately on load and keep them updated
  useEffect(() => {
    form.trigger();
  }, [form]);

  // Update with data from the deed component when it changes
  useEffect(() => {
    if (!storeDeedData) return;

    console.log(
      "[SignatorySection] Deed data changed, updating creators:",
      storeDeedData.creators
    );

    if (storeDeedData.creators && Array.isArray(storeDeedData.creators)) {
      const validCreators = storeDeedData.creators.filter(
        (creator: Creator) =>
          creator.firstName?.trim() ||
          creator.middleInitial?.trim() ||
          creator.lastName?.trim()
      );
      setCreators(validCreators);
    }
  }, [storeDeedData]);

  // Update the useEffect that loads creators to also initialize the assignorIds with the correct length
  useEffect(() => {
    if (useStore && storeDeedData) {
      const newCreators = storeDeedData.creators || [];
      setCreators(newCreators);

      // Initialize assignorIds array with empty strings for each creator
      // but only if the field hasn't been set yet
      const currentAssignorIds = form.getValues("assignorIds") || [];
      if (
        newCreators.length > 0 &&
        (!currentAssignorIds || currentAssignorIds.length === 0)
      ) {
        // Get the legacy assignorId value for backward compatibility
        const legacyAssignorId = form.getValues("assignorId") || "";
        const legacyIdArray = legacyAssignorId
          ? legacyAssignorId.split(",").map((id: string) => id.trim())
          : [];

        // Create an array of the right length, using legacy values if available
        const newAssignorIds = Array(newCreators.length).fill("");
        legacyIdArray.forEach((id, index) => {
          if (index < newAssignorIds.length) {
            newAssignorIds[index] = id;
          }
        });

        form.setValue("assignorIds", newAssignorIds);

        // Also update the legacy field for backward compatibility
        form.setValue("assignorId", newAssignorIds.join(", "));
      }
    }
  }, [storeDeedData, useStore, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeApplicationId) {
      toast.error("No application selected", {
        description: "Please select or create an IP application first.",
        duration: 3000,
      });
      return;
    }

    console.log("[SignatorySection] Form submitted with values:", values);
    setIsSubmitting(true);

    try {
      // Update values with creators and ensure assignorIds is properly formatted
      let assignorIdsArray = values.assignorIds || [];

      // If we have a legacy assignorId value but no assignorIds array, use it
      if (
        values.assignorId &&
        (!assignorIdsArray || assignorIdsArray.length === 0)
      ) {
        assignorIdsArray = values.assignorId
          .split(",")
          .map((id: string) => id.trim());
      }

      // Make sure we have enough ID entries for all creators
      while (assignorIdsArray.length < creators.length) {
        assignorIdsArray.push("");
      }

      // Truncate if we have more IDs than creators
      if (assignorIdsArray.length > creators.length && creators.length > 0) {
        assignorIdsArray = assignorIdsArray.slice(0, creators.length);
      }

      const submitData = {
        ...values,
        creators, // Include creators for reference
        assignorIds: assignorIdsArray,
        // For backward compatibility, store as comma-separated string too
        assignorId: assignorIdsArray.join(", "),
      };

      console.log("[SignatorySection] Submitting data:", submitData);

      // Update store state if enabled
      if (useStore) {
        updateSignatoryData(submitData);
      }

      // For backward compatibility with older code
      if (onDataUpdate) onDataUpdate();

      // Save to localStorage for persistence
      localStorage.setItem(
        getLocalStorageKey("signatoryData"),
        JSON.stringify(submitData)
      );

      // Dispatch an event to notify other components of the data update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("signatory-data-updated"));
      }

      // Display loading toast
      const loadingToastId = "submitting-deed-assignment";
      toast.loading("Submitting deed of assignment...", { id: loadingToastId });

      // Get deed assignment data
      let deedData;
      if (storeDeedData) {
        deedData = storeDeedData;
      } else {
        const deedDataStr = localStorage.getItem(
          getLocalStorageKey("deedAssignmentData")
        );
        if (!deedDataStr) {
          throw new Error("Deed assignment data is missing");
        }
        deedData = JSON.parse(deedDataStr);
      }

      // Check if deed of assignment already exists for this application
      console.log(
        "[SignatorySection] Checking if deed of assignment exists for application:",
        activeApplicationId
      );
      const checkResponse = await fetch(
        `/api/deed-of-assignment?applicationId=${activeApplicationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      let apiMethod = "POST"; // Default to POST for new deeds
      if (checkResponse.ok) {
        apiMethod = "PUT"; // Use PUT for existing deeds
      }

      // Format API data combining both deed data and signatory data
      const apiData = {
        // Basic data
        researchTitle: deedData.researchTitle || "",
        creators: deedData.creators || [],
        creatorAddress: deedData.creatorAddress || "",
        assigneeName: deedData.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          deedData.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",

        // Signatory data
        day: submitData.day || "",
        month: submitData.month || "",
        year: submitData.year || "",
        assigneeId: submitData.assigneeId || "M98 – 009",
        assigneeDate: submitData.assigneeDate || "",
        assigneePlace: submitData.assigneePlace || "Butuan City",
        assignorId: submitData.assignorId || "",
        assignorDate: submitData.assignorDate || "",
        assignorPlace: submitData.assignorPlace || "Butuan City",
        docNumber: submitData.docNumber || "",
        pageNumber: submitData.pageNumber || "",
        bookNumber: submitData.bookNumber || "",
        seriesYear: submitData.seriesYear || "",
        notarizedDocumentPath: submitData.notarizedDocumentPath || "",

        // Status
        status: "submitted",

        // Application ID
        applicationId: activeApplicationId,
      };

      console.log(`[SignatorySection] Sending ${apiMethod} request:`, apiData);

      // Submit to the API
      const response = await fetch("/api/deed-of-assignment", {
        method: apiMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SignatorySection] API error:", errorData);
        throw new Error(
          errorData.error || "Failed to submit deed of assignment"
        );
      }

      const result = await response.json();
      console.log("[SignatorySection] API response:", result);

      console.log("✅ SUCCESS NA, MO OPEN ANG MODAL");
toast.success("Deed of assignment submitted", {
  id: loadingToastId,
  description: "Your deed of assignment has been successfully submitted.",
  duration: 3000,
});
setShowCompleteModal(true);
      // Optionally register with the form submission system
      try {
        if (
          formSubmission &&
          formSubmission.registerForm &&
          activeApplicationId
        ) {
          await formSubmission.registerForm(
            result.data?.deedId || result.data?.deed_id || "unknown",
            "deed_of_assignment",
            result.data?.deedId || result.data?.deed_id || "unknown",
            {
              title: deedData.researchTitle,
              applicationId: activeApplicationId,
              inventorsCreators: deedData.creators.map((creator: Creator) => ({
                name: `${creator.firstName} ${
                  creator.middleInitial ? creator.middleInitial + "." : ""
                } ${creator.lastName}`.trim(),
                role: "Creator",
              })),
            }
          );

          // Dispatch form_completed event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("form_completed", {
                detail: {
                  formId: "deed-assignment",
                  completed: true,
                  applicationId: activeApplicationId,
                },
              })
            );

            // Update global form status if the function exists
            if (window.updateIPFormStatus) {
              window.updateIPFormStatus(
                "deedOfAssignment",
                true,
                activeApplicationId
              );
            }
          }
        }
      } catch (registerError) {
        console.error(
          "[SignatorySection] Form registration error:",
          registerError
        );
        // Non-blocking error - don't throw
      }

      // Navigate back to deed details tab instead of forms overview
      const mainTab = searchParams.get("tab") || "deed-assignment";
    //  router.push(`?tab=${mainTab}&subTab=deed`, { scroll: false });
    } catch (err) {
      console.error("[SignatorySection] Error submitting form:", err);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      toast.error("Failed to submit deed of assignment", {
        description:
          "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(): Promise<void> {
    if (!activeApplicationId) {
      toast.error("No application selected", {
        description: "Please select or create an IP application first.",
        duration: 3000,
      });
      return;
    }

    try {
      setIsUpdating(true);
      const formValues = form.getValues();
      console.log("[SignatorySection] Updating form:", formValues);

      // Display loading toast
      const loadingToastId = "updating-signatory-section";
      toast.loading("Updating signatory information...", {
        id: loadingToastId,
      });

      // Include creators in the update
      const updateData = {
        ...formValues,
        creators, // Include creators for reference
      };

      // Update store state if enabled
      if (useStore) {
        updateSignatoryData(updateData);
      }

      // Save to localStorage for persistence
      localStorage.setItem(
        getLocalStorageKey("signatoryData"),
        JSON.stringify(updateData)
      );

      // Dispatch an event to notify other components of the data update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("signatory-data-updated"));
      }

      // For backward compatibility with older code
      if (onDataUpdate) onDataUpdate();

      // Get deed assignment data to include in the API update
      let deedData;
      if (useStore && storeDeedData) {
        deedData = storeDeedData;
      } else {
        const deedDataStr = localStorage.getItem(
          getLocalStorageKey("deedAssignmentData")
        );
        if (!deedDataStr) {
          throw new Error("Deed assignment data is missing");
        }
        deedData = JSON.parse(deedDataStr);
      }

      // Format the data for API submission
      const apiData = {
        // Deed assignment data
        researchTitle: deedData.researchTitle || "",
        creators: deedData.creators || [],
        creatorAddress: deedData.creatorAddress || "",
        assigneeName: deedData.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          deedData.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",

        // Signatory data
        day: updateData.day || "",
        month: updateData.month || "",
        year: updateData.year || "",
        assigneeId: updateData.assigneeId || "M98 – 009",
        assigneeDate: updateData.assigneeDate || "",
        assigneePlace: updateData.assigneePlace || "Butuan City",
        assignorId: updateData.assignorId || "",
        assignorDate: updateData.assignorDate || "",
        assignorPlace: updateData.assignorPlace || "Butuan City",
        docNumber: updateData.docNumber || "",
        pageNumber: updateData.pageNumber || "",
        bookNumber: updateData.bookNumber || "",
        seriesYear: updateData.seriesYear || "",
        notarizedDocumentPath: updateData.notarizedDocumentPath || "",

        // Include application ID
        applicationId: activeApplicationId,
      };

      console.log("[SignatorySection] Sending API update:", apiData);

      // Update the deed of assignment through the API
      const response = await fetch("/api/deed-of-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SignatorySection] API error during update:", errorData);
        throw new Error(
          errorData.error || "Failed to update deed of assignment"
        );
      }

      const result = await response.json();
      console.log("[SignatorySection] API response:", result);

      // Update the loading toast to success
      toast.success("Signatory information updated", {
        id: loadingToastId,
        description: "Your signatory information has been saved successfully.",
        duration: 3000,
      });

      // Optionally update the form completion status
      try {
        if (typeof window !== "undefined" && activeApplicationId) {
          window.dispatchEvent(
            new CustomEvent("form_completed", {
              detail: {
                formId: "deed-assignment",
                completed: true,
                applicationId: activeApplicationId,
              },
            })
          );

          // Update global form status if the function exists
          if (window.updateIPFormStatus) {
            window.updateIPFormStatus(
              "deedOfAssignment",
              true,
              activeApplicationId
            );
          }
        }
      } catch (statusUpdateError) {
        console.error(
          "[SignatorySection] Error updating form status:",
          statusUpdateError
        );
      }
    } catch (err) {
      console.error("[SignatorySection] Error updating form:", err);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      toast.error("Failed to update signatory information", {
        description:
          "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const handleDocumentUpload = async (documentPath: string) => {
    try {
      // Update the form field with the document path
      form.setValue("notarizedDocumentPath", documentPath);

      // Update localStorage
      const formValues = form.getValues();
      localStorage.setItem(
        getLocalStorageKey("signatoryData"),
        JSON.stringify({ ...formValues, notarizedDocumentPath: documentPath })
      );

      // Use the store if enabled
      if (useStore) {
        updateSignatoryData({
          ...form.getValues(),
          notarizedDocumentPath: documentPath,
        });
      }

      // Dispatch an event to notify other components of the data update
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("signatory-data-updated"));
      }

      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error(
        "[SignatorySection] Error handling document upload:",
        error
      );
      toast.error("Failed to record document upload");
    }
  };

  const handlePreviousClick = () => {
    if (!activeApplicationId) {
      toast.error("No application selected", {
        description: "Please select or create an IP application first.",
        duration: 3000,
      });
      return;
    }

    console.log("[SignatorySection] Previous button clicked");

    // Save the current form values to localStorage before navigating
    const formValues = form.getValues();
    localStorage.setItem(
      getLocalStorageKey("signatoryData"),
      JSON.stringify(formValues)
    );

    // Update store if enabled
    if (useStore) {
      updateSignatoryData(formValues);
    }

    // For backward compatibility with older code
    if (onDataUpdate) onDataUpdate();

    // Navigate to the previous tab
    const mainTab = searchParams.get("tab") || "deed-assignment";
    router.push(`?tab=${mainTab}&subTab=royalty`, { scroll: false });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    console.log("[SignatorySection] File upload triggered");
    const file = event.target.files?.[0];
    if (!file) {
      console.log("[SignatorySection] No file selected");
      return;
    }

    // Check file type
    if (file.type !== "application/pdf") {
      toast.error("Invalid file type", {
        description: "Please upload a PDF file only.",
        duration: 5000,
      });
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 5MB.",
        duration: 5000,
      });
      return;
    }

    console.log("[SignatorySection] File selected:", file.name);
    const formData = new FormData();
    formData.append("files", file); // Changed from 'file' to 'files' to match API
    formData.append("projectId", activeApplicationId || "default"); // Add projectId
    formData.append("formName", "Deed of Assignment - Signatory");

    try {
      console.log("[SignatorySection] Uploading file...");
      const response = await fetch("/api/files/upload", {
        // Updated endpoint
        method: "POST",
        body: formData,
      });

      console.log(
        "[SignatorySection] Upload response status:",
        response.status
      );
      if (!response.ok) {
        const errorData = await response.text();
        console.error("[SignatorySection] Upload error:", errorData);
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      console.log("[SignatorySection] Upload successful:", result);

      // Get the first file path from the result
      const uploadedFilePath = result.files[0]?.path;
      if (!uploadedFilePath) {
        throw new Error("No file path returned from server");
      }

      handleDocumentUpload(uploadedFilePath);
      toast.success("File uploaded successfully", {
        description: (
          <div className="flex flex-col gap-1">
            <p>File: {file.name}</p>
            <p className="text-sm text-gray-500">
              The notarized document has been attached to your application.
            </p>
          </div>
        ),
        duration: 5000,
      });
    } catch (err) {
      console.error("[SignatorySection] Error uploading file:", err);
      toast.error("Unable to upload file", {
        description:
          "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    }
  };

         return (
                  <div className="space-y-6">
                    
                    <Form {...form}>
                      <form onSubmit={async (e) => {
                  e.preventDefault(); // 🔥 mao ni importante
                  if (isSubmitting) return;

                  setIsSubmitting(true);
                  await form.handleSubmit(onSubmit)(e);
                  setIsSubmitting(false);
                }}
                className="space-y-8"
              >
{showCompleteModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">

    {/* HEADER ROW */}
<div className="flex items-center justify-end ">
  
  {/* CLOSE (RIGHT) */}
  <button
    type="button"
    onClick={() => setShowCompleteModal(false)}
    className="bg-green-100 rounded-full text-green-700 hover:bg-green-200"
  >
    <X className="h-5 w-5" />
  </button>

      {/* TITLE */}
      <h2 className="text-xl font-bold text-green-700 text-center flex-1">
      COMPLETED!
      </h2>

      {/* spacer para ma-center ang title */}
      <div className="w-6" />
    </div>

    {/* DESCRIPTION */}
    <p className="text-muted-foreground text-center">
      Your IP Application is successfully completed.
    </p>

    {/* BUTTONS */}
    <div className="flex justify-center gap-4 mt-6">
      <Button
        className="bg-green-700 text-white hover:bg-green-800"
        onClick={() => router.push("/forms")}
      >
        Track Application
      </Button>

      <Button
        type="button"
        className="bg-green-700 text-white hover:bg-green-800"
        onClick={() => setShowCompleteModal(false)}
      >
        Close
      </Button>
    </div>

  </div>
</div>
)}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>An error occurred: {error.message}</p>
            </div>
          )}

          {/* Section 1: Signatory Section */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Signatory Section
              </CardTitle>
              <CardDescription>
                Complete the signatory details for the deed of assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground mb-6">
                  This Deed of Assignment shall be subject to the CSU's
                  Intellectual Property (IP) Policy and the Technology Transfer
                  Protocol (BOR Res. No. 54-04, s. 2020).
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm text-yellow-800">
                    Please fill in the date when this deed was executed
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    IN WITNESS WHEREOF, the parties hereto have executed this
                    Deed of Assignment on:
                  </p>
                  <div className="grid grid-cols-3 gap-6 max-w-3xl">
                    <FormField
                      control={form.control}
                      name="day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 15th"
                              {...field}
                              className="text-center"
                              disabled={isDisabled}
                              onChange={(e) => {
                                console.log(
                                  "[SignatorySection] Day field changed:",
                                  e.target.value
                                );
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., March"
                              {...field}
                              className="text-center"
                              disabled={isDisabled}
                              onChange={(e) => {
                                console.log(
                                  "[SignatorySection] Month field changed:",
                                  e.target.value
                                );
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 2024"
                              {...field}
                              className="text-center"
                              disabled={isDisabled}
                              onChange={(e) => {
                                console.log(
                                  "[SignatorySection] Year field changed:",
                                  e.target.value
                                );
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Assignee and Assignors */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Assignee and Assignors
              </CardTitle>
              <CardDescription>
                Enter the details of all parties involved in the assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <p className="text-sm font-medium text-gray-500">
                        Assignee
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">
                        ROLYN C. DAGUIL, PhD
                      </p>
                      <p className="text-sm text-gray-600">
                        University President
                      </p>
                      <p className="text-sm text-gray-600">
                        Caraga State University
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <p className="text-sm font-medium text-gray-500">
                        Inventor(s)/Assignor(s)
                      </p>
                    </div>
                    <div className="space-y-2">
                      {creators.length > 0 ? (
                        <div className="space-y-3">
                          {creators.map((creator, index) => {
                            const fullName = [
                              creator.firstName?.trim(),
                              creator.middleInitial?.trim()
                                ? `${creator.middleInitial.trim()}.`
                                : "",
                              creator.lastName?.trim(),
                            ]
                              .filter(Boolean)
                              .join(" ")
                              .toUpperCase();
                            return (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:border-[#1B5E20]/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
                                    <span className="text-sm font-medium text-[#1B5E20]">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {fullName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Inventor/Assignor
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                          <p className="text-sm text-gray-500">
                            No creators/inventors added in the Deed Details tab.
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Please add creators in the Deed Details tab first.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Identification Details */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Identification Details
              </CardTitle>
              <CardDescription>
                Enter the identification details for the assignee and assignors
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="font-medium">For the Caraga State University</p>
                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID No.</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., M98 – 009"
                            {...field}
                            disabled={isDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assigneeDate"
                    render={({ field }) => {
                      // Ensure we properly initialize the date state from field value
                      // Only try to parse if it's a valid date string
                      const initialDate = field.value
                        ? new Date(field.value)
                        : new Date();
                      const [selectedMonth, setSelectedMonth] =
                        useState<Date>(initialDate);
                      const [isYearView, setIsYearView] =
                        useState<boolean>(false);
                      const years = eachYearOfInterval({
                        start: startOfYear(startDate),
                        end: endOfYear(endDate),
                      });

                      // Log to debug the date initialization
                      useEffect(() => {
                        console.log(
                          "[SignatorySection] assigneeDate field value:",
                          field.value
                        );
                        console.log(
                          "[SignatorySection] assigneeDate initialDate:",
                          initialDate
                        );
                      }, [field.value]);

                      return (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isDisabled}
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
                                  {format(selectedMonth, "MMMM yyyy")}
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
                                          selectedMonth.getFullYear();

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
                                                        setSelectedMonth(month);
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
                                      // Convert Date to string format
                                      field.onChange(
                                        date ? format(date, "yyyy-MM-dd") : ""
                                      );
                                    }}
                                    month={selectedMonth}
                                    onMonthChange={setSelectedMonth}
                                    disabled={isDisabled}
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
                    name="assigneePlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Butuan City"
                            {...field}
                            disabled={isDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <p className="font-medium">For the Inventor(s)/Assignor(s)</p>
                  {creators.length > 0 ? (
                    <div className="space-y-6">
                      {creators.map((creator, index) => {
                        const fullName = [
                          creator.firstName?.trim(),
                          creator.middleInitial?.trim()
                            ? `${creator.middleInitial.trim()}.`
                            : "",
                          creator.lastName?.trim(),
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .toUpperCase();

                        return (
                          <div
                            key={index}
                            className="space-y-2 p-4 bg-gray-50 rounded-md border"
                          >
                            <p className="font-medium text-gray-900">
                              {fullName}
                            </p>

                            <FormField
                              control={form.control}
                              name={
                                `assignorIds.${index}` as `assignorIds.${number}`
                              }
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ID No. for {fullName}</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter ID number"
                                      value={field.value || ""}
                                      onChange={(e) => {
                                        // Update the field directly
                                        field.onChange(e.target.value);

                                        // Get current assignorIds array
                                        const currentIds =
                                          form.getValues("assignorIds") || [];
                                        // Update the array at the specific index
                                        const newIds = [...currentIds];
                                        newIds[index] = e.target.value;
                                        // Update the form value for the whole array
                                        form.setValue("assignorIds", newIds);
                                        // Also update the legacy assignorId field for backward compatibility
                                        form.setValue(
                                          "assignorId",
                                          newIds.join(", ")
                                        );
                                      }}
                                      disabled={isDisabled}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">
                        No creators/inventors added in the Deed Details tab.
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Please add creators in the Deed Details tab first.
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="assignorDate"
                    render={({ field }) => {
                      // Ensure we properly initialize the date state from field value
                      // Only try to parse if it's a valid date string
                      const initialDate = field.value
                        ? new Date(field.value)
                        : new Date();
                      const [selectedMonth, setSelectedMonth] =
                        useState<Date>(initialDate);
                      const [isYearView, setIsYearView] =
                        useState<boolean>(false);
                      const years = eachYearOfInterval({
                        start: startOfYear(startDate),
                        end: endOfYear(endDate),
                      });

                      // Log to debug the date initialization
                      useEffect(() => {
                        console.log(
                          "[SignatorySection] assignorDate field value:",
                          field.value
                        );
                        console.log(
                          "[SignatorySection] assignorDate initialDate:",
                          initialDate
                        );
                      }, [field.value]);

                      return (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={isDisabled}
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
                                  {format(selectedMonth, "MMMM yyyy")}
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
                                          selectedMonth.getFullYear();

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
                                                        setSelectedMonth(month);
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
                                      // Convert Date to string format
                                      field.onChange(
                                        date ? format(date, "yyyy-MM-dd") : ""
                                      );
                                    }}
                                    month={selectedMonth}
                                    onMonthChange={setSelectedMonth}
                                    disabled={isDisabled}
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
                    name="assignorPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Butuan City"
                            {...field}
                            disabled={isDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Notarization and Document Management */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 rounded-t-lg">
              <CardTitle className="text-xl text-[#1B5E20]">
                Notarization and Document Management
              </CardTitle>
              <CardDescription>
                Download the form for printing and notarization
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Notarization Information */}
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Notarization Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p className="text-sm font-medium mb-2">
                      REPUBLIC OF THE PHILIPPINES) BUTUAN CITY ) S.S.
                    </p>
                    <p className="text-sm text-gray-600">
                      PERSONALLY APPEARED before me, a Notary Public for Butuan
                      City this, the above-named persons showing their
                      respective community tax the numbers, places, and dates of
                      issue whereof appearing above below their respective
                      names, known to me and to me known to be the persons who
                      executed the foregoing instrument and made oath that the
                      same is their free and voluntary act and deed.
                    </p>
                    <p className="text-sm font-medium mt-4">
                      WITNESS MY HAND AND SEAL
                    </p>
                  </div>
                  <div className="mt-3 text-sm text-gray-500 italic">
                    <p>
                      Note: The notarization details (Doc. No., Page No., Book
                      No., Series of) will be filled in by the notary public on
                      the printed form.
                    </p>
                  </div>
                </div>

                {/* Document Management */}
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Document Management
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Download Section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 h-[120px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
                            <Download className="h-5 w-5 text-[#1B5E20]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Download Form
                            </p>
                            <p className="text-sm text-gray-500">
                              Download the form for printing and notarization
                            </p>
                          </div>
                        </div>
                        <DeedOfAssignmentPDFComponent />
                      </div>
                    </div>

                    {/* Upload Section */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 h-[120px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-[#1B5E20]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              Upload Notarized Document
                            </p>
                            <p className="text-sm text-gray-500">
                              Upload the scanned copy after notarization
                            </p>
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name="notarizedDocumentPath"
                          render={({ field }) => (
                            <FormItem className="flex-1 max-w-[200px]">
                              <FormControl>
                                <div className="flex flex-col gap-2">
                                  <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    disabled={isDisabled}
                                    className="hidden"
                                    id="file-upload"
                                  />
                                  <label htmlFor="file-upload">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
                                      disabled={isDisabled}
                                      asChild
                                    >
                                      <span className="flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        Upload File
                                      </span>
                                    </Button>
                                  </label>
                                  {field.value && (
                                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <span className="truncate">
                                        File uploaded
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Separator className="my-6" />
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousClick}
                disabled={isSubmitting || isUpdating}
                className="bg-green-50 text-green-700 hover:bg-green-100"
              >
                Previous
              </Button>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
                onClick={handleUpdate}
                disabled={isSubmitting || isUpdating || !form.formState.isValid}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Form"
                )}
              </Button>
             <Button
  type="submit"
  variant="default"
  className="bg-green-700 text-white hover:bg-green-800"
  
  disabled={isSubmitting || isUpdating || !form.formState.isValid}
>
  {isSubmitting ? "Submitting..." : "Submit Form"}
</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
