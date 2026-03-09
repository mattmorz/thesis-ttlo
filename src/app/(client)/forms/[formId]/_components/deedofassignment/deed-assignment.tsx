/**
 * Deed of Assignment Form Component
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useFormRegistry } from "@/features/client/form-integration/hooks/useFormRegistry";
import { useSession } from "next-auth/react";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDeedAssignmentStore } from "@/lib/store/deed-assignment-store";

interface DeedAssignmentProps {
  initialData?: any;
  isDisabled?: boolean;
  formStatus?: string;
  onDataUpdate?: () => void;
  useStore?: boolean;
}

const formSchema = z.object({
  researchTitle: z.string().min(1, "Research title is required"),
  creators: z
    .array(
      z.object({
        firstName: z.string().trim().min(1, "First name is required"),
        middleInitial: z.string().default(""),
        lastName: z.string().trim().min(1, "Last name is required"),
      })
    )
    .optional()
    .default([]),
  creatorAddress: z.string().min(1, "Creator address is required"),
  assigneeName: z.string().default("CARAGA STATE UNIVERSITY"),
  assigneeRepresentative: z.string().default("ROLYN C. DAGUIL, Ph.D."),
});

// Common styles for the name fields container
const nameFieldsContainerStyles = "grid grid-cols-12 gap-4 w-full";
const firstNameStyles = "col-span-5";
const middleInitialStyles = "col-span-2";
const lastNameStyles = "col-span-5";

export function DeedAssignment({
  initialData,
  isDisabled = false,
  formStatus = "draft",
  onDataUpdate,
  useStore = false,
}: DeedAssignmentProps) {
  console.log("[DeedAssignment] Component mounted");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get active application ID
  const { activeApplicationId } = useActiveApplication();
  const isMountedRef = useRef(true);

  // Get form submission service
  const formSubmission = useFormSubmission();

  // Get form registry functions
  const { registerFormEntry } = useFormRegistry();

  const { data: session } = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: initialData || {
      researchTitle: "",
      creators: [
        {
          firstName: "",
          middleInitial: "",
          lastName: "",
        },
      ],
      creatorAddress: "",
      assigneeName: "CARAGA STATE UNIVERSITY",
      assigneeRepresentative: "ROLYN C. DAGUIL, Ph.D.",
    },
  });

  // Get store functions
  const { updateDeedData, signatory: storeSignatoryData } =
    useDeedAssignmentStore();

  // Function to filter out empty creators and ensure type compatibility with store
  const filterEmptyCreators = (values: z.infer<typeof formSchema>) => {
    // Filter out empty creators
    const filteredCreators =
      values.creators?.filter((creator) => {
        const hasFirstName = creator.firstName?.trim() !== "";
        const hasMiddleInitial = creator.middleInitial?.trim() !== "";
        const hasLastName = creator.lastName?.trim() !== "";
        return hasFirstName || hasMiddleInitial || hasLastName;
      }) || [];

    // Convert to the format expected by the store
    const storeCreators = filteredCreators.map((creator) => ({
      firstName: creator.firstName || "",
      middleInitial: creator.middleInitial || "",
      lastName: creator.lastName || "",
    }));

    // Return new object with updated creators array
    return {
      ...values,
      creators: storeCreators,
    };
  };

  // Set isMounted flag on mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to get application-specific localStorage key
  const getLocalStorageKey = (baseKey: string) => {
    return activeApplicationId ? `${baseKey}_${activeApplicationId}` : baseKey;
  };

  // Load saved data when component mounts or active application changes
  useEffect(() => {
    console.log("[DeedAssignment] Loading saved data");

    // If we have initialData from props, use it as our primary source
    if (initialData && Object.keys(initialData).length > 0) {
      console.log("[DeedAssignment] Using initial data from props");

      // Ensure the creators array is not empty
      let formattedInitialData = { ...initialData };
      if (
        !formattedInitialData.creators ||
        formattedInitialData.creators.length === 0
      ) {
        formattedInitialData.creators = [
          {
            firstName: "",
            middleInitial: "",
            lastName: "",
          },
        ];
      }

      // Ensure researchTitle and creatorAddress are defined
      formattedInitialData.researchTitle =
        formattedInitialData.researchTitle || "";
      formattedInitialData.creatorAddress =
        formattedInitialData.creatorAddress || "";

      form.reset(formattedInitialData);

      // Also save to localStorage for persistence
      localStorage.setItem(
        getLocalStorageKey("deedAssignmentData"),
        JSON.stringify(formattedInitialData)
      );
      return;
    }

    // Otherwise, try to load from localStorage
    const savedData = localStorage.getItem(
      getLocalStorageKey("deedAssignmentData")
    );
    if (savedData) {
      console.log("[DeedAssignment] Found saved data in localStorage");
      try {
        const parsedData = JSON.parse(savedData);

        // Filter out empty creators when loading
        const filteredData = filterEmptyCreators(parsedData);

        // Ensure at least one creator field exists
        if (!filteredData.creators || filteredData.creators.length === 0) {
          filteredData.creators = [
            {
              firstName: "",
              middleInitial: "",
              lastName: "",
            },
          ];
        }

        form.reset(filteredData);
      } catch (err) {
        console.error("[DeedAssignment] Error loading saved data:", err);
        toast.error("Failed to load saved data");
      }
    } else {
      console.log("[DeedAssignment] No saved data found in localStorage");
    }
  }, [form, initialData, activeApplicationId]);

  // Save data when component unmounts
  useEffect(() => {
    return () => {
      if (!isMountedRef.current) return;

      console.log("[DeedAssignment] Component unmounting, saving data");
      try {
        const values = form.getValues();

        const filteredValues = filterEmptyCreators(values);

        // Ensure at least one creator field exists
        if (!filteredValues.creators || filteredValues.creators.length === 0) {
          filteredValues.creators = [
            {
              firstName: "",
              middleInitial: "",
              lastName: "",
            },
          ];
        }

        localStorage.setItem(
          getLocalStorageKey("deedAssignmentData"),
          JSON.stringify(filteredValues)
        );
      } catch (err) {
        console.error("[DeedAssignment] Error saving data:", err);
        toast.error(
          "Your form data couldn't be saved automatically. Please save your work before leaving."
        );
      }
    };
  }, [form, activeApplicationId]);

  // Add a function to log form values when they change
  useEffect(() => {
    // Instead of watching all changes which creates excessive logs,
    // we'll set up a debounced watcher that only logs significant changes
    const subscription = form.watch((value) => {
      // Comment out or remove the log that happens on every keystroke
      // console.log("[DeedAssignment] Form values updated:", value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Show validation errors immediately on load and keep them updated as users type
  useEffect(() => {
    form.trigger();
  }, [form]);

  const {
    fields: creatorFields,
    append: appendCreator,
    remove: removeCreator,
  } = useFieldArray({
    control: form.control,
    name: "creators",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("[DeedAssignment] Form submitted");

    if (!activeApplicationId) {
      toast.error("No application selected", {
        description: "Please select or create an IP application first.",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const filteredValues = filterEmptyCreators(values);

      // Update both localStorage and store
      localStorage.setItem(
        getLocalStorageKey("deedAssignmentData"),
        JSON.stringify(filteredValues)
      );

      if (useStore) {
        updateDeedData(filteredValues);
      }

      // For backward compatibility with older code
      if (onDataUpdate) onDataUpdate();

      // Display loading toast
      const loadingToastId = "submitting-deed-assignment";
      toast.loading("Saving deed assignment data...", { id: loadingToastId });

      // Check if deed of assignment already exists for this application
      console.log(
        "[DeedAssignment] Checking if deed of assignment exists for application:",
        activeApplicationId
      );
      let checkResponse;
      try {
        checkResponse = await fetch(
          `/api/deed-of-assignment?applicationId=${activeApplicationId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        console.log(
          "[DeedAssignment] Check response status:",
          checkResponse.status
        );
      } catch (error) {
        console.error("[DeedAssignment] Error checking existing deed:", error);
        // Assume no existing deed if we can't check
        checkResponse = { status: 404 } as Response;
      }

      let response;

      // Format the data for API submission
      const apiData: {
        researchTitle: string;
        creators: {
          firstName: string;
          middleInitial: string;
          lastName: string;
        }[];
        creatorAddress: string;
        assigneeName: string;
        assigneeRepresentative: string;
        applicationId: string;
        status?: string;
      } = {
        researchTitle: filteredValues.researchTitle,
        creators: filteredValues.creators,
        creatorAddress: filteredValues.creatorAddress,
        assigneeName: filteredValues.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          filteredValues.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
        applicationId: activeApplicationId,
      };

      if (checkResponse.status === 404) {
        // Create new deed of assignment
        console.log(
          "[DeedAssignment] No existing deed found, creating new deed of assignment"
        );

        // Add status for new records
        apiData.status = "draft";

        console.log("[DeedAssignment] POST request data:", apiData);

        response = await fetch("/api/deed-of-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
      } else {
        // Update existing deed of assignment
        console.log(
          "[DeedAssignment] Existing deed found, updating deed of assignment"
        );

        console.log("[DeedAssignment] PUT request data:", apiData);

        response = await fetch("/api/deed-of-assignment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
      }

      console.log("[DeedAssignment] API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DeedAssignment] API error:", errorData);
        throw new Error(
          errorData.error || "Failed to save deed assignment data"
        );
      }

      const result = await response.json();
      console.log("[DeedAssignment] API response data:", result);

      // Update the loading toast to success
      toast.success("Deed details saved successfully", {
        id: loadingToastId,
        description: "Your deed of assignment information has been saved.",
        duration: 3000,
      });

      // Notify the application about form completion
      try {
        if (!session?.user?.id) {
          console.error("[DeedAssignment] No user ID found in session");
          throw new Error("User session not found");
        }

        // Form registry is now handled by the API, so we don't need to check or create entries manually
        console.log("[DeedAssignment] Form registry is now handled by the API");

        // Notify the application about form completion
        if (window.updateIPFormStatus) {
          console.log(
            "[DeedAssignment] Updating form status in parent component"
          );
          window.updateIPFormStatus(
            "deedOfAssignment",
            true,
            activeApplicationId
          );
        } else {
          // Fallback to custom event
          const event = new CustomEvent("deedOfAssignmentFormCompleted", {
            detail: { completed: true, applicationId: activeApplicationId },
          });
          window.dispatchEvent(event);
        }
      } catch (regError) {
        console.error("[DeedAssignment] Error with form registry:", regError);
        // Log detailed error info but don't block the user
        toast.error("Form registry error", {
          description:
            "Your form was saved but there was an issue with registry tracking. This won't affect your submission.",
          duration: 5000,
        });
      }

      // Navigate to the next tab
      console.log("[DeedAssignment] Navigating to royalty tab");
      const formId = searchParams.get("formId");
      const mainTab = searchParams.get("tab") || "deed-assignment";
      router.push(`?tab=${mainTab}&subTab=royalty`, { scroll: false });
    } catch (err) {
      console.error("[DeedAssignment] Error saving deed assignment data:", err);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      toast.error("Unable to save your deed details", {
        description:
          "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate() {
    console.log("[DeedAssignment] Update button clicked");

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

      const filteredValues = filterEmptyCreators(formValues);
      console.log("[DeedAssignment] Updating deed assignment data");

      // Display loading toast
      const loadingToastId = "updating-deed-assignment";
      toast.loading("Updating deed assignment data...", { id: loadingToastId });

      // Update both localStorage and store
      localStorage.setItem(
        getLocalStorageKey("deedAssignmentData"),
        JSON.stringify(filteredValues)
      );

      if (useStore) {
        updateDeedData(filteredValues);
      }

      // For backward compatibility with older code
      if (onDataUpdate) onDataUpdate();

      // Get signatory data to include in the API update
      let signatoryData;
      if (useStore && storeSignatoryData) {
        console.log(
          "[DeedAssignment] Using signatory data from store:",
          storeSignatoryData
        );
        signatoryData = storeSignatoryData;
      } else {
        console.log(
          "[DeedAssignment] Retrieving signatory data from localStorage"
        );
        const signatoryDataStr = localStorage.getItem(
          getLocalStorageKey("signatoryData")
        );
        if (signatoryDataStr) {
          signatoryData = JSON.parse(signatoryDataStr);
        } else {
          console.log(
            "[DeedAssignment] No signatory data found, using empty object"
          );
          signatoryData = {};
        }
      }

      // Format the data for API submission, including all form data
      const apiData = {
        // Deed assignment data
        researchTitle: filteredValues.researchTitle || "",
        creators: filteredValues.creators || [],
        creatorAddress: filteredValues.creatorAddress || "",
        assigneeName: filteredValues.assigneeName || "CARAGA STATE UNIVERSITY",
        assigneeRepresentative:
          filteredValues.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",

        // Include signatory data if available
        day: signatoryData?.day || "",
        month: signatoryData?.month || "",
        year: signatoryData?.year || "",
        assigneeId: signatoryData?.assigneeId || "M98 – 009",
        assigneeDate: signatoryData?.assigneeDate || "",
        assigneePlace: signatoryData?.assigneePlace || "Butuan City",
        assignorId: signatoryData?.assignorId || "",
        assignorDate: signatoryData?.assignorDate || "",
        assignorPlace: signatoryData?.assignorPlace || "Butuan City",
        docNumber: signatoryData?.docNumber || "",
        pageNumber: signatoryData?.pageNumber || "",
        bookNumber: signatoryData?.bookNumber || "",
        seriesYear: signatoryData?.seriesYear || "",

        // Include application ID
        applicationId: activeApplicationId,
      };

      // Update existing deed of assignment
      const response = await fetch("/api/deed-of-assignment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      console.log(
        "[DeedAssignment] Update API response status:",
        response.status
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DeedAssignment] API error during update:", errorData);
        throw new Error(
          errorData.error || "Failed to update deed assignment data"
        );
      }

      const result = await response.json();
      console.log("[DeedAssignment] Update API response data:", result);

      // Update the loading toast to success
      toast.success("Form data updated", {
        id: loadingToastId,
        description:
          "All sections of your deed of assignment have been updated successfully.",
        duration: 3000,
      });

      // Notify the application about form completion
      try {
        if (!session?.user?.id) {
          console.error("[DeedAssignment] No user ID found in session");
          throw new Error("User session not found");
        }

        // Form registry is now handled by the API, so we don't need to check or create entries manually
        console.log("[DeedAssignment] Form registry is now handled by the API");

        // Notify the application about form completion
        if (window.updateIPFormStatus) {
          console.log(
            "[DeedAssignment] Updating form status in parent component"
          );
          window.updateIPFormStatus(
            "deedOfAssignment",
            true,
            activeApplicationId
          );
        } else {
          // Fallback to custom event
          const event = new CustomEvent("deedOfAssignmentFormCompleted", {
            detail: { completed: true, applicationId: activeApplicationId },
          });
          window.dispatchEvent(event);
        }
      } catch (regError) {
        console.error("[DeedAssignment] Error with form registry:", regError);
        // Log detailed error info but don't block the user
        toast.error("Form registry error", {
          description:
            "Your form was saved but there was an issue with registry tracking. This won't affect your submission.",
          duration: 5000,
        });
      }
    } catch (err) {
      console.error(
        "[DeedAssignment] Error updating deed assignment data:",
        err
      );
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      toast.error("Unable to update form information", {
        description:
          "Please try again or contact support if the problem persists.",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const handleNextClick = () => {
    console.log("[DeedAssignment] Next button clicked");

    if (!activeApplicationId) {
      toast.error("No application selected", {
        description: "Please select or create an IP application first.",
        duration: 3000,
      });
      return;
    }

    const values = form.getValues();

    // Validate required fields before proceeding
    if (!values.researchTitle || values.researchTitle.trim() === "") {
      toast.error("Research title is required", {
        description: "Please enter a research title before proceeding.",
        duration: 3000,
      });
      return;
    }

    if (!values.creatorAddress || values.creatorAddress.trim() === "") {
      toast.error("Creator address is required", {
        description: "Please enter a creator address before proceeding.",
        duration: 3000,
      });
      return;
    }

    const filteredValues = filterEmptyCreators(values);

    // Save to localStorage before navigation
    localStorage.setItem(
      getLocalStorageKey("deedAssignmentData"),
      JSON.stringify(filteredValues)
    );

    if (useStore) {
      updateDeedData(filteredValues);
    }

    // For backward compatibility with older code
    if (onDataUpdate) onDataUpdate();

    // Show success toast
    toast.success("Deed details saved", {
      description:
        "Your information is saved. Proceeding to royalty agreement.",
      duration: 3000,
    });

    console.log("[DeedAssignment] Moving to royalty tab");
    const mainTab = searchParams.get("tab") || "deed-assignment";
    router.push(`?tab=${mainTab}&subTab=royalty`, { scroll: false });
  };

  const isFormReady = form.formState.isValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>An error occurred: {error.message}</p>
          </div>
        )}

        <Card className="shadow-sm">
          <CardHeader className="bg-slate-50 rounded-t-lg">
            <CardTitle className="text-xl text-[#1B5E20]">
              Deed of Assignment
            </CardTitle>
            <CardDescription>
              Complete the deed of assignment details for your intellectual
              property
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-xl font-semibold">CARAGA STATE UNIVERSITY</h2>
              <h3 className="text-lg font-semibold">DEED OF ASSIGNMENT</h3>
              <p className="text-sm">(Patent/Utility Model)</p>
            </div>

            <div className="space-y-6">
              <p className="text-sm">
                WHEREAS, the research entitled [Title of the Research] by [Name
                of Creators/Inventors], with its principal address at [Address
                of the Inventor/s], hereinafter referred to as
                <span className="font-bold"> Assignors </span>has developed the
                technology:
              </p>

              <FormField
                control={form.control}
                name="researchTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      Title of the Research/Technology <span className="text-red-500"
                      > *</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter title"
                        className="resize-y min-h-[80px]"
                        disabled={isDisabled}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel className="font-bold">
                    Name of Creator(s)/Inventor(s) <span className="text-red-500"> *</span>
                  </FormLabel>
                  {!isDisabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        appendCreator({
                          firstName: "",
                          middleInitial: "",
                          lastName: "",
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Creator
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {creatorFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className={nameFieldsContainerStyles}>
                        <FormField
                          control={form.control}
                          name={`creators.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem className={firstNameStyles}>
                              <FormControl>
                                <Input
                                  placeholder="First Name"
                                  disabled={isDisabled}
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`creators.${index}.middleInitial`}
                          render={({ field }) => (
                            <FormItem className={middleInitialStyles}>
                              <FormControl>
                                <Input
                                  placeholder="M.I."
                                  maxLength={2}
                                  className="text-center"
                                  disabled={isDisabled}
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`creators.${index}.lastName`}
                          render={({ field }) => (
                            <FormItem className={lastNameStyles}>
                              <FormControl>
                                <Input
                                  placeholder="Last Name"
                                  disabled={isDisabled}
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {index > 0 && !isDisabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-1 hover:bg-red-50 hover:text-red-500"
                          onClick={() => {
                            removeCreator(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="creatorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Address <span className="text-red-500"> *</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter address"
                        className="resize-y min-h-[80px]"
                        disabled={isDisabled}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {/* No Previous button on first tab */}
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleUpdate}
              disabled={isDisabled || isUpdating || !isFormReady}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              {isUpdating ? "Updating..." : "Update Form"}
            </Button>
            <Button
              type="button"
              onClick={handleNextClick}
              disabled={isDisabled || isSubmitting || !isFormReady}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              {isSubmitting ? "Saving..." : "Next"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
