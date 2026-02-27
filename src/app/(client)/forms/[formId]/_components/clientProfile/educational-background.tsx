"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Form schema for educational background
 * All fields are optional to allow navigation between tabs without validation errors
 *
 * The schema includes:
 * 1. Highest Degree Earned (with special handling for "other" option)
 * 2. Degree Program details
 * 3. Professional information
 */
const formSchema = z.object({
  highestDegree: z.object({
    value: z.enum(["bachelor", "master", "doctorate", "other"]),
    otherValue: z.string().optional().nullable(),
  }),
  degree: z.string().min(1, "Degree is required"),
  profession: z.string().min(1, "Profession is required"),
});

// Add these props to the component
interface EducationalBackgroundProps {
  initialData?: any;
  isDisabled?: boolean;
  formStatus?: string;
}

// Add TypeScript declaration for window global methods
declare global {
  interface Window {
    updateIPFormStatus?: (
      formType: string,
      completed: boolean,
      applicationId: string,
    ) => void;
  }
}

/**
 * EducationalBackground Component
 *
 * This component handles the educational background tab of the client profile form.
 * It manages:
 * - Highest degree earned information
 * - Custom degree specification for "other" option
 * - Degree program details
 * - Professional information
 *
 * Features:
 * - Data persistence using localStorage
 * - Conditional rendering for "other" degree option
 * - Form validation
 * - Error handling
 * - Bi-directional navigation (previous/next)
 */
export function EducationalBackground({
  initialData,
  isDisabled = false,
  formStatus = "draft",
}: EducationalBackgroundProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "education";
  const { data: session } = useSession();
  const [formData, setFormData] = useState<z.infer<typeof formSchema> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [isFormLoaded, setIsFormLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clickedButton, setClickedButton] = useState<string | null>(null);

  // Get active application for registry integration
  const { activeApplicationId } = useActiveApplication();

  // Initialize form submission hook for registry
  const formSubmission = useFormSubmission({
    showToasts: false, // We'll handle toasts ourselves
  });

  // Create a safe wrapper for the registerForm function
  const safeRegisterForm = async (
    userId: string,
    sourceId: string,
    formTitle: string,
    formDescription: string,
  ) => {
    // Skip registration completely if any dependencies are missing
    if (!formSubmission || !activeApplicationId) {
      return null;
    }

    // Skip if the registerForm function isn't available (prevents runtime errors)
    if (typeof formSubmission.registerForm !== "function") {
      return null;
    }

    try {
      return await formSubmission.registerForm(
        userId,
        "client_profile",
        sourceId,
        {
          title: formTitle,
          description: formDescription,
          applicationId: activeApplicationId,
        },
        false, // Don't immediately submit - just register
      );
    } catch (error) {
      console.error("Error registering form with registry:", error);
      return null;
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      highestDegree: { value: "bachelor", otherValue: null },
      degree: "",
      profession: "",
    },
  });

  // Watch highest degree field for conditional rendering
  const selectedDegree = form.watch("highestDegree.value");

  // Watch fields for disabling the "Next" button
  const degree = form.watch("degree");
  const profession = form.watch("profession");
  const highestDegree = form.watch("highestDegree");

  const isNextDisabled =
    !degree?.trim() ||
    !profession?.trim() ||
    (highestDegree?.value === "other" && !highestDegree?.otherValue?.trim());

  // Make sure the otherValue field is displayed when selectedDegree is "other"
  useEffect(() => {
    if (selectedDegree === "other" && formData?.highestDegree?.otherValue) {
      // Ensure otherValue is set in the form when "other" is selected
      form.setValue(
        "highestDegree.otherValue",
        formData.highestDegree.otherValue,
      );
    }
  }, [selectedDegree, formData, form]);

  // Load initial data or saved data on component mount
  useEffect(() => {
    try {
      // First try to load from localStorage to get the most recent changes
      const savedData = localStorage.getItem("educationalBackgroundData");
      let formattedData;

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(
          "Found saved educational background data in localStorage:",
          parsedData,
        );

        // Apply the same correction to data from localStorage
        formattedData = { ...parsedData };

        if (parsedData.highestDegree) {
          // Ensure highestDegree.value is one of the allowed values
          if (
            !["bachelor", "master", "doctorate", "other"].includes(
              parsedData.highestDegree.value,
            )
          ) {
            formattedData.highestDegree.value = "bachelor";
          }

          // If highestDegree.value is empty but otherValue exists, set value to "other"
          if (
            (!parsedData.highestDegree.value ||
              parsedData.highestDegree.value === "") &&
            parsedData.highestDegree.otherValue
          ) {
            formattedData.highestDegree = {
              value: "other",
              otherValue: parsedData.highestDegree.otherValue,
            };
            console.log(
              "Corrected saved highestDegree with empty value to 'other':",
              formattedData.highestDegree,
            );
          }
        } else {
          // If no highestDegree object at all, initialize with defaults
          formattedData.highestDegree = {
            value: "bachelor",
            otherValue: null,
          };
        }

        console.log("Using localStorage data as priority:", formattedData);
      }
      // If no localStorage data but initialData exists, use that
      else if (initialData) {
        console.log(
          "No localStorage data found, using initialData:",
          initialData,
        );

        // Handle the case where highestDegree.value is empty but otherValue exists
        // This typically means it should be treated as "other"
        formattedData = { ...initialData };

        if (initialData.highestDegree) {
          // Ensure highestDegree.value is one of the allowed values
          if (
            !["bachelor", "master", "doctorate", "other"].includes(
              initialData.highestDegree.value,
            )
          ) {
            formattedData.highestDegree.value = "bachelor";
          }

          // If highestDegree.value is empty but otherValue exists, set value to "other"
          if (
            (!initialData.highestDegree.value ||
              initialData.highestDegree.value === "") &&
            initialData.highestDegree.otherValue
          ) {
            formattedData.highestDegree = {
              value: "other",
              otherValue: initialData.highestDegree.otherValue,
            };
            console.log(
              "Corrected highestDegree with empty value to 'other':",
              formattedData.highestDegree,
            );
          }
        } else {
          // If no highestDegree object at all, initialize with defaults
          formattedData.highestDegree = {
            value: "bachelor",
            otherValue: null,
          };
        }

        // Also save initialData to localStorage for consistency
        localStorage.setItem(
          "educationalBackgroundData",
          JSON.stringify(formattedData),
        );
      }

      // If we have data from either source, use it
      if (formattedData) {
        console.log("Setting form with data:", formattedData);

        // Ensure the form is reset with the correct data
        setTimeout(() => {
          form.reset({
            ...formattedData,
            highestDegree: {
              value: formattedData.highestDegree?.value || "bachelor",
              otherValue: formattedData.highestDegree?.otherValue || null,
            },
          });

          // For "other" values, make sure the otherValue is explicitly set
          if (formattedData.highestDegree?.value === "other") {
            form.setValue(
              "highestDegree.otherValue",
              formattedData.highestDegree.otherValue,
            );
          }

          setFormData(formattedData);
        }, 0);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error("Error loading saved data:", errorObj);
      setError(errorObj);
    } finally {
      setIsFormLoaded(true);
    }
  }, [initialData, form]);

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

      // Store form data in localStorage for persistence
      localStorage.setItem("educationalBackgroundData", JSON.stringify(values));
      setFormData(values);

      // Show loading toast
      const toastId = toast.loading("Submitting Educational Background", {
        description: "Please wait while we process your submission...",
      });

      // First, check if a profile already exists for this application
      console.log(
        `Checking if profile exists for application: ${applicationId}`,
      );
      const checkResponse = await fetch(
        `/api/client-profile/exists/${applicationId}`,
      );
      const checkData = await checkResponse.json();

      // Format data for API submission
      const apiData = {
        educationalBackground: values,
        status: "draft",
        applicationId: applicationId, // Include the application ID for registry tracking
      };

      // Determine whether to use POST (create) or PUT (update)
      const method = checkData.exists ? "PUT" : "POST";
      console.log(
        `Using ${method} method for client profile submission. Profile exists: ${checkData.exists}`,
      );

      // Submit to API
      const response = await fetch("/api/client-profile", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to save educational background",
        );
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
      toast.dismiss(toastId);

      // Show success toast
      toast.success("Educational background saved successfully");

      // If button click was "next", navigate to the next tab
      if (clickedButton === "next") {
        handleNextClick();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while saving your data",
      );
    } finally {
      setIsSubmitting(false);
      setClickedButton(null);
    }
  }

  // Handle update without submission
  async function handleUpdate() {
    try {
      setIsUpdating(true);

      // Get active application ID
      const applicationId = activeApplicationId;

      if (!applicationId) {
        toast.error("No active application selected");
        setIsUpdating(false);
        return;
      }

      // Get form values from current tab
      const currentFormValues = form.getValues();

      // Ensure proper formatting for highestDegree
      let formattedEducationalData = { ...currentFormValues };
      if (formattedEducationalData.highestDegree) {
        // For "other" values, make sure the otherValue is properly set
        if (
          formattedEducationalData.highestDegree.value === "other" &&
          !formattedEducationalData.highestDegree.otherValue
        ) {
          formattedEducationalData.highestDegree.otherValue = "";
        }
        // For non-"other" values, set otherValue to null
        if (formattedEducationalData.highestDegree.value !== "other") {
          formattedEducationalData.highestDegree.otherValue = null;
        }
      }

      // Store form data in localStorage
      localStorage.setItem(
        "educationalBackgroundData",
        JSON.stringify(formattedEducationalData),
      );
      setFormData(formattedEducationalData);

      // Load data from all tabs via localStorage
      let personalInfo = {};
      let backgroundIP = {};

      try {
        // Get personal information data
        const personalData = localStorage.getItem("clientInformationData");
        if (personalData) {
          personalInfo = JSON.parse(personalData);
          console.log(
            "Loaded personal information data for update:",
            personalInfo,
          );
        }

        // Get background IP data
        const backgroundData = localStorage.getItem("clientBackgroundIPData");
        if (backgroundData) {
          backgroundIP = JSON.parse(backgroundData);
          console.log("Loaded background IP data for update:", backgroundIP);
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
      const checkResponse = await fetch(
        `/api/client-profile/exists/${applicationId}`,
      );
      const checkData = await checkResponse.json();

      // Format data for API - include data from all tabs
      const apiData = {
        personalInfo: personalInfo,
        educationalBackground: formattedEducationalData,
        backgroundIP: backgroundIP,
        status: "draft",
        applicationId: applicationId, // Include application ID
      };

      // Determine whether to use POST (create) or PUT (update)
      const method = checkData.exists ? "PUT" : "POST";
      console.log(
        `Using ${method} method for complete profile update. Profile exists: ${checkData.exists}`,
      );

      // Submit to API for update
      const response = await fetch("/api/client-profile", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update form");
      }

      const result = await response.json();

      // Dismiss loading toast
      toast.dismiss();

      // Show success toast
      toast.success("All Profile Data Updated", {
        description: "Your changes for all tabs have been saved.",
      });

      console.log("Form updated successfully:", result);
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

  // Fix handleNextClick
  const handleNextClick = () => {
    try {
      // Get the current form values
      const values = form.getValues();

      // Format and validate the data before saving
      let formattedValues = { ...values };

      // Ensure proper formatting for highestDegree
      if (formattedValues.highestDegree) {
        // For "other" values, make sure the otherValue is properly set
        if (
          formattedValues.highestDegree.value === "other" &&
          !formattedValues.highestDegree.otherValue
        ) {
          formattedValues.highestDegree.otherValue = "";
        }

        // For non-"other" values, set otherValue to null
        if (formattedValues.highestDegree.value !== "other") {
          formattedValues.highestDegree.otherValue = null;
        }
      }

      // Save to localStorage without making an API call
      localStorage.setItem(
        "educationalBackgroundData",
        JSON.stringify(formattedValues),
      );
      console.log(
        "Educational background saved to localStorage:",
        formattedValues,
      );

      // Navigate to the next tab by updating URL params
      const url = new URL(window.location.href);
      url.searchParams.set("clientTab", "background");
      window.history.pushState({}, "", url);

      // Trigger a navigation event to ensure the UI updates
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      console.error("Error saving form data or navigating:", error);
    }
  };

  // Fix handlePreviousClick
  const handlePreviousClick = () => {
    try {
      // Get the current form values
      const values = form.getValues();

      // Format and validate the data before saving
      let formattedValues = { ...values };

      // Ensure proper formatting for highestDegree
      if (formattedValues.highestDegree) {
        // For "other" values, make sure the otherValue is properly set
        if (
          formattedValues.highestDegree.value === "other" &&
          !formattedValues.highestDegree.otherValue
        ) {
          formattedValues.highestDegree.otherValue = "";
        }

        // For non-"other" values, set otherValue to null
        if (formattedValues.highestDegree.value !== "other") {
          formattedValues.highestDegree.otherValue = null;
        }
      }

      // Save to localStorage without making an API call
      localStorage.setItem(
        "educationalBackgroundData",
        JSON.stringify(formattedValues),
      );
      console.log(
        "Educational background saved to localStorage before navigating back:",
        formattedValues,
      );

      // Navigate to the previous tab by updating URL params
      const url = new URL(window.location.href);
      url.searchParams.set("clientTab", "personal");
      window.history.pushState({}, "", url);

      // Trigger a navigation event to ensure the UI updates
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      console.error("Error saving form data or navigating:", error);
    }
  };

  // Save state when leaving the education tab
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // or when the currentTab changes
      if (currentTab !== "education" && isFormLoaded) {
        // Save current form state to localStorage before unmounting
        try {
          const values = form.getValues();
          localStorage.setItem(
            "educationalBackgroundData",
            JSON.stringify(values),
          );
          console.log(
            "Saved educational background data on tab change:",
            values,
          );
        } catch (error) {
          console.error("Error saving educational data:", error);
        }
      }
    };
  }, [currentTab, form, isFormLoaded]);

  if (error) {
    console.error("EducationalBackground component error:", error);
  }

  return (
    <div className="space-y-6">
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
                Educational Background
              </CardTitle>
              <CardDescription>
                Please provide information about your educational qualifications
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* 1️⃣ Highest Degree / Education Level */}
                <FormField
                  control={form.control}
                  name="highestDegree.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Highest Degree Earned{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset subType if switching to higher degrees
                          if (
                            !["associate", "vocational", "highschool"].includes(
                              value,
                            )
                          ) {
                            form.setValue("subType", null);
                          }
                          // Update formData
                          const currentValues = form.getValues();
                          setFormData({
                            ...currentValues,
                            highestDegree: {
                              ...currentValues.highestDegree,
                              value,
                            },
                          });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select highest degree" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="doctorate">
                            Doctorate Degree
                          </SelectItem>
                          <SelectItem value="master">
                            Master's Degree
                          </SelectItem>
                          <SelectItem value="bachelor">
                            Bachelor's Degree
                          </SelectItem>
                          <SelectItem value="associate">
                            Associate Degree/Vocational/Senior High
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 2️⃣ Sub-type for lower levels */}
                {["associate", "vocational", "highschool"].includes(
                  form.getValues("highestDegree.value"),
                ) && (
                  <FormField
                    control={form.control}
                    name="subType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Sub-type / Program Type{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex flex-col space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="associate"
                              checked={field.value === "associate"}
                              onChange={() => field.onChange("associate")}
                            />
                            Associate Degree
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="vocational"
                              checked={field.value === "vocational"}
                              onChange={() => field.onChange("vocational")}
                            />
                            Vocational / Technical Education
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="highschool"
                              checked={field.value === "highschool"}
                              onChange={() => field.onChange("highschool")}
                            />
                            Senior High / High School Diploma
                          </label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* 3️⃣ Degree Program input with dynamic placeholder */}
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => {
                    const degreeLevel = form.getValues("highestDegree.value");
                    const subType = form.getValues("subType");

                    let placeholder = "Enter your program/strand";
                    if (degreeLevel === "doctorate")
                      placeholder = "e.g. PhD in Computer Science";
                    else if (degreeLevel === "master")
                      placeholder =
                        "e.g. Master of Science in Information Technology";
                    else if (degreeLevel === "bachelor")
                      placeholder =
                        "e.g. Bachelor of Science in Information Technology";
                    else if (subType === "associate")
                      placeholder =
                        "e.g. Associate in IT, Associate in Nursing";
                    else if (subType === "vocational")
                      placeholder =
                        "e.g. STEM, Computer Technician, Culinary Arts";
                    else if (subType === "highschool")
                      placeholder = "e.g. STEM, ABM, HUMSS, GAS, TVL";

                    return (
                      <FormItem>
                        <FormLabel>
                          Degree Program <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={placeholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* 4️⃣ Current Profession */}
                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Current Profession{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Software Engineer, Student"
                          {...field}
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

          <div className="flex justify-between gap-4">
            <Button
              type="button"
              onClick={handlePreviousClick}
              variant="outline"
              className="text-[#1B5E20] border-[#1B5E20] hover:bg-[#1B5E20]/10"
            >
              Previous
            </Button>
            <div className="flex-1"></div>
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
