"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Path, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { CloudUpload, Paperclip, Plus, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { v4 as uuidv4 } from "uuid";

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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/fileupload";

const formSchema = z.object({
  researchTitle: z.string().min(1, { message: "Research title is required" }),
  labFacilities: z.object({
    experimentalApparatus: z.boolean().default(false),
    labInstruments: z.boolean().default(false),
    dataAnalysisTools: z.boolean().default(false),
    technicalSupport: z.boolean().default(false),
    farmMachineShop: z.boolean().default(false),
    showSpecializedSoftware: z.boolean().default(false),
    specializedSoftware: z.string().optional(),
    showOtherFacilities: z.boolean().default(false),
    otherFacilities: z.string().optional(),
  }),
  fundingResources: z.object({
    personalFunds: z.boolean().default(false),
    grantsAndFunding: z.boolean().default(false),
    scholarships: z.boolean().default(false),
    industryPartnerships: z.boolean().default(false),
    institutionCollaboration: z.boolean().default(false),
    showOtherFunding: z.boolean().default(false),
    otherFunding: z.string().optional(),
  }),
  remarks: z.string().optional(),
  signatures: z.array(
    z.object({
      firstName: z
        .string()
        .min(1, { message: "First name is required" })
        .transform((val) => val.toUpperCase()),
      middleInitial: z
        .string()
        .optional()
        .transform((val) => (val ? val.toUpperCase() : val)),
      lastName: z
        .string()
        .min(1, { message: "Last name is required" })
        .transform((val) => val.toUpperCase()),
      signature: z.string(),
      files: z.array(z.custom<File>()).optional(),
      date: z.string(),
    })
  ),
});

// Add this interface for tracking minimized states
interface SignatureState {
  isMinimized: boolean;
  isComplete: boolean;
}

export function SubstantialUse() {
  const router = useRouter();
  const { data: session } = useSession();
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  // Add refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const formSubmission = useFormSubmission({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error submitting form: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Extract functions from formSubmission
  const { registerForm } = formSubmission;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      researchTitle: "",
      labFacilities: {
        experimentalApparatus: false,
        labInstruments: false,
        dataAnalysisTools: false,
        technicalSupport: false,
        farmMachineShop: false,
        showSpecializedSoftware: false,
        specializedSoftware: "",
        showOtherFacilities: false,
        otherFacilities: "",
      },
      fundingResources: {
        personalFunds: false,
        grantsAndFunding: false,
        scholarships: false,
        industryPartnerships: false,
        institutionCollaboration: false,
        showOtherFunding: false,
        otherFunding: "",
      },
      remarks: "",
      signatures: [
        {
          firstName: "",
          middleInitial: "",
          lastName: "",
          signature: "",
          files: [],
          date: "",
        },
      ],
    },
  });

  // Add this helper function to convert form field names to API field names
  const mapFormFieldsToApiFields = (
    formValues: z.infer<typeof formSchema>,
    isSubmitting = false
  ) => {
    return {
      userId: session?.user?.id || "",
      researchTitle: formValues.researchTitle?.trim(),
      laboratoryFacilities: formValues.labFacilities,
      fundingResources: formValues.fundingResources,
      remarks: formValues.remarks?.trim(),
      signatures: formValues.signatures.map((signature) => ({
        firstName: signature.firstName?.trim(),
        lastName: signature.lastName?.trim(),
        middleInitial: signature.middleInitial?.trim(),
        date: signature.date,
        files: signature.files,
      })),
      status: isSubmitting ? "submitted" : "draft",
    };
  };

  // Add this helper function to convert API field names to form field names
  const mapApiFieldsToFormFields = (apiData: any) => {
    return {
      researchTitle: apiData.researchTitle || "",
      labFacilities: apiData.laboratoryFacilities || {
        experimentalApparatus: false,
        labInstruments: false,
        dataAnalysisTools: false,
        technicalSupport: false,
        farmMachineShop: false,
        showSpecializedSoftware: false,
        specializedSoftware: "",
        showOtherFacilities: false,
        otherFacilities: "",
      },
      fundingResources: apiData.fundingResources || {
        personalFunds: false,
        grantsAndFunding: false,
        scholarships: false,
        industryPartnerships: false,
        institutionCollaboration: false,
        showOtherFunding: false,
        otherFunding: "",
      },
      remarks: apiData.remarks || "",
      signatures:
        apiData.signatures?.length > 0
          ? apiData.signatures.map((sig: any) => ({
              firstName: sig.firstName || "",
              middleInitial: sig.middleInitial || "",
              lastName: sig.lastName || "",
              signature: sig.signature || "",
              files: sig.files || [],
              date: sig.date || "",
            }))
          : [
              {
                firstName: "",
                middleInitial: "",
                lastName: "",
                signature: "",
                files: [],
                date: "",
              },
            ],
    };
  };

  // Modify the useEffect dependency array
  useEffect(() => {
    const loadExistingFormData = async () => {
      try {
        const applicationId = localStorage.getItem("activeApplicationId");
        if (!applicationId) return;

        setIsLoading(true);

        // Skip localStorage cache if this is a refresh triggered by a submission
        if (refreshTrigger === 0) {
          // Check if we have data in localStorage first
          const storedData = localStorage.getItem("substantialUseFormData");
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData);
              if (parsedData && parsedData.applicationId === applicationId) {
                // Map stored data to form fields using the helper function
                form.reset(mapApiFieldsToFormFields(parsedData));
                console.log("Loaded form data from localStorage");
                return;
              }
            } catch (error) {
              console.error("Error parsing stored form data:", error);
            }
          }
        } else {
          console.log("Refresh triggered, skipping localStorage cache");
        }

        // If no localStorage data or this is a refresh, fetch from API
        const url = new URL("/api/substantial-use", window.location.origin);
        url.searchParams.append("applicationId", applicationId);

        const response = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No existing form data found");
            return;
          }
          throw new Error(`API error: ${response.status}`);
        }

        const responseData = await response.json();
        if (responseData && responseData.data) {
          // Map API data to form fields using the helper function
          form.reset(mapApiFieldsToFormFields(responseData.data));
          console.log("Loaded form data from API");
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingFormData();
  }, [form, session?.user?.id, refreshTrigger]);

  // Add event listener for the submission event
  useEffect(() => {
    // Function to handle substantialUseSubmitted event
    const handleSubmissionEvent = (event: Event) => {
      // Type the event correctly
      const customEvent = event as CustomEvent<{ applicationId: string }>;
      console.log(
        "Submission event received for application ID:",
        customEvent.detail.applicationId
      );

      // Increment refresh trigger to force a reload
      setRefreshTrigger((prev) => prev + 1);
    };

    // Add event listener
    window.addEventListener("substantialUseSubmitted", handleSubmissionEvent);

    // Cleanup
    return () => {
      window.removeEventListener(
        "substantialUseSubmitted",
        handleSubmissionEvent
      );
    };
  }, []);

  const {
    fields: signatureFields,
    append: appendSignature,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "signatures",
  });

  // Initialize state with one signature
  const [signatureStates, setSignatureStates] = useState<SignatureState[]>([
    { isMinimized: false, isComplete: false },
  ]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Get the application ID from localStorage or context
      const applicationId = localStorage.getItem("activeApplicationId");

      if (!applicationId) {
        toast({
          title: "Error",
          description:
            "No application selected. Please select or create an application first.",
          variant: "destructive",
        });
        return;
      }

      // Remove generated sourceId - we'll use the substantialUseId instead
      // Map form fields to API fields using the helper function with isSubmitting=true
      const preparedData = {
        ...mapFormFieldsToApiFields(values, true),
        applicationId: applicationId,
      };

      // Save form data to localStorage with consistent field naming
      localStorage.setItem(
        "substantialUseFormData",
        JSON.stringify(preparedData)
      );

      // Show loading toast
      const submitToastId = "submitting-form";
      toast({
        title: "Submitting form...",
        description: "Please wait while we submit your form.",
      });

      // First, submit the form data to the API to get the substantialUseId
      let formData;
      // Initialize registryResult variable
      let registryResult = null;

      try {
        const response = await fetch("/api/substantial-use", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preparedData),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        formData = await response.json();

        if (!formData?.data?.substantialUseId) {
          throw new Error("No substantialUseId returned from API");
        }

        // Check if registry was created on the server side
        if (formData.registry?.success) {
          console.log(
            "Form registry created on server side:",
            formData.registry
          );
          // Use the registry ID from the API response
          registryResult = {
            registryId: formData.registry.registryId,
          };
          console.log(
            "Using server-created registry ID:",
            registryResult.registryId
          );
        } else {
          console.warn(
            "Server-side registry creation failed:",
            formData.registry?.message || "Unknown reason"
          );
        }

        // Display success message
        toast({
          title: "Success",
          description: "Form submitted successfully",
        });

        console.log(
          "Form submitted, got substantialUseId:",
          formData.data.substantialUseId
        );
      } catch (error) {
        console.error("Error submitting form:", error);
        toast({
          title: "Error",
          description: "Failed to submit form. Please try again.",
          variant: "destructive",
        });
        return; // Exit if form submission fails
      }

      // Try to use the client-side hook for backward compatibility only if the server-side registry was not created
      try {
        if (registerForm && !registryResult?.registryId) {
          console.log("Attempting client-side form registration as fallback");
          // Use the substantialUseId as sourceId for registry
          const clientRegistryResult = await registerForm(
            session?.user?.id || "",
            "substantial_use",
            formData.data.substantialUseId, // Use the substantialUseId as sourceId
            {
              title: values.researchTitle || "Substantial Use Certification",
              description: "Certification of Substantial Use form submission",
              applicationId: applicationId,
              inventorsCreators: values.signatures?.map((s) => ({
                name: `${s.firstName} ${s.lastName}`,
                role: s.middleInitial ? "Applicant" : undefined,
              })),
            },
            true // Submit immediately parameter
          );
          console.log(
            "Form registered successfully with client registration:",
            clientRegistryResult
          );

          // Only use client-side result if we don't have a server-side one
          if (!registryResult?.registryId && clientRegistryResult?.registryId) {
            registryResult = clientRegistryResult;
          }
        }
      } catch (regError) {
        console.error("Error with client-side registration:", regError);
        console.log(
          "Continuing with submission - using server-side registry if available"
        );
        // Continue with submission as the server-side integration should have handled it
      }

      // If we still don't have a registry ID but have a substantialUseId, try a direct POST to the form-registry API
      if (!registryResult?.registryId && formData?.data?.substantialUseId) {
        try {
          console.log(
            "Attempting direct form registry API call as final fallback"
          );
          const directRegistryResponse = await fetch("/api/form-registry", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sourceType: "substantial_use",
              sourceId: formData.data.substantialUseId,
              ipApplicationId: applicationId,
              status: "submitted",
              title: values.researchTitle || "Substantial Use Certification",
            }),
          });

          if (directRegistryResponse.ok) {
            const directRegistryResult = await directRegistryResponse.json();
            if (directRegistryResult?.data?.registryId) {
              console.log(
                "Direct registry API call successful:",
                directRegistryResult
              );
              registryResult = {
                registryId: directRegistryResult.data.registryId,
              };
            }
          }
        } catch (directRegError) {
          console.error("Error with direct registry API call:", directRegError);
          // Continue with submission regardless
        }
      }

      // Create a custom event for other parts of the app to know data was submitted
      const submissionEvent = new CustomEvent("substantialUseSubmitted", {
        detail: {
          applicationId,
          substantialUseId: formData.data.substantialUseId, // Include substantialUseId in event data
          registryId: registryResult?.registryId, // Include registry ID if available
        },
      });
      window.dispatchEvent(submissionEvent);

      // Update form status in registry
      const event = new CustomEvent("formCompleted", {
        detail: {
          formType: "substantialUse",
          completed: true,
          applicationId,
          substantialUseId: formData.data.substantialUseId, // Include substantialUseId in event data
          registryId: registryResult?.registryId, // Include registry ID if available
        },
      });
      window.dispatchEvent(event);

      // Also dispatch substantialUseFormCompleted event that PageContent.tsx listens for
      const formCompletedEvent = new CustomEvent(
        "substantialUseFormCompleted",
        {
          detail: {
            completed: true,
            applicationId,
            substantialUseId: formData.data.substantialUseId, // Include substantialUseId in event data
            registryId: registryResult?.registryId, // Include registry ID if available
          },
        }
      );
      window.dispatchEvent(formCompletedEvent);

      // Clear localStorage cache to force a fresh fetch on next load
      localStorage.removeItem("substantialUseFormData");

      // Navigate to forms page after a short delay and force a hard reload
      // Include a cache-busting query parameter
      setTimeout(() => {
        router.refresh();
        router.push(`/forms?tab=substantial-use&t=${Date.now()}`);
      }, 1000);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  // Fixed handleDone function
  const handleDone = (index: number) => {
    setSignatureStates((prev) => {
      const newStates = [...prev];
      newStates[index] = { isMinimized: true, isComplete: true };
      return newStates;
    });
  };

  // Add this when appending new signature
  const appendSignatureWithState = () => {
    appendSignature({
      firstName: "",
      middleInitial: "",
      lastName: "",
      signature: "",
      files: [],
      date: "",
    });
    setSignatureStates((prev) => [
      ...prev,
      { isMinimized: false, isComplete: false },
    ]);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="researchTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Research Title</FormLabel>
                    <FormDescription>
                      This is to certify that aside from the ordinarily
                      available resources of the University such as office,
                      library, computers and storage servers during the course
                      of the development of the research entitled:
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="Enter research title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <FormLabel className="text-base">
                    Laboratory Facilities
                  </FormLabel>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "experimentalApparatus",
                        label: "Experimental Apparatus",
                      },
                      { id: "labInstruments", label: "Lab Instruments" },
                      { id: "dataAnalysisTools", label: "Data Analysis Tools" },
                      { id: "technicalSupport", label: "Technical Support" },
                      { id: "farmMachineShop", label: "Farm/Machine Shop" },
                    ].map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name={
                          `labFacilities.${item.id}` as Path<
                            z.infer<typeof formSchema>
                          >
                        }
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="labFacilities.showSpecializedSoftware"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Specialized Software
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch("labFacilities.showSpecializedSoftware") && (
                    <FormField
                      control={form.control}
                      name="labFacilities.specializedSoftware"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="List specialized software used..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="labFacilities.showOtherFacilities"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Other Facilities
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch("labFacilities.showOtherFacilities") && (
                    <FormField
                      control={form.control}
                      name="labFacilities.otherFacilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="List other facilities used..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <FormLabel className="text-base">Funding Resources</FormLabel>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "personalFunds",
                        label: "Personal Funds/Resources",
                      },
                      {
                        id: "grantsAndFunding",
                        label: "Grants/Funding/Wages/Allowances/Stipend/Salary",
                      },
                      { id: "scholarships", label: "Scholarships" },
                      {
                        id: "industryPartnerships",
                        label: "Industry Partnerships",
                      },
                      {
                        id: "institutionCollaboration",
                        label: "Collaboration with Other Institutions",
                      },
                    ].map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name={
                          `fundingResources.${item.id}` as Path<
                            z.infer<typeof formSchema>
                          >
                        }
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="fundingResources.showOtherFunding"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Other Funding Sources
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {form.watch("fundingResources.showOtherFunding") && (
                    <FormField
                      control={form.control}
                      name="fundingResources.otherFunding"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Specify other funding sources..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional remarks..."
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

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base">Signatures</FormLabel>
                {signatureFields.length === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={appendSignatureWithState}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Signature
                  </Button>
                )}
              </div>

              {signatureFields.map((field, index) => {
                const name =
                  form.getValues(`signatures.${index}.firstName`) ?? "";
                const middleInitial =
                  form.getValues(`signatures.${index}.middleInitial`) ?? "";
                const lastName =
                  form.getValues(`signatures.${index}.lastName`) ?? "";
                const files = form.getValues(`signatures.${index}.files`) ?? [];
                const fileName = files[0]?.name;

                return (
                  <div
                    key={field.id}
                    className="space-y-4 border rounded-lg p-4"
                  >
                    {signatureStates[index]?.isMinimized ? (
                      // Minimized View
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {name} {middleInitial} {lastName}
                          </span>
                          {fileName && (
                            <span className="text-sm text-gray-500">
                              - {fileName}
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSignatureStates((prev) => {
                              const newStates = [...prev];
                              newStates[index].isMinimized = false;
                              return newStates;
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      // Full View
                      <>
                        <div className="flex justify-between">
                          <FormLabel>Signature {index + 1}</FormLabel>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                remove(index);
                                const newStates = [...signatureStates];
                                newStates.splice(index, 1);
                                setSignatureStates(newStates);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {/* Left Column - Name and Date */}
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`signatures.${index}.firstName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter first name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`signatures.${index}.middleInitial`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Middle Initial</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter middle initial"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`signatures.${index}.lastName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter last name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`signatures.${index}.date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Right Column - File Upload */}
                          <FormField
                            control={form.control}
                            name={`signatures.${index}.files`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Upload Signature</FormLabel>
                                <FormControl>
                                  {field.value && field.value.length > 0 ? (
                                    <div className="flex items-center space-x-2 p-2 border rounded-md">
                                      <Paperclip className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm truncate">
                                        {field.value[0].name}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => field.onChange([])}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <FileUploader
                                      value={field.value}
                                      onValueChange={(files) =>
                                        field.onChange(files)
                                      }
                                      dropzoneOptions={{
                                        maxFiles: 1,
                                        maxSize: 1024 * 1024 * 2,
                                        accept: {
                                          "image/*": [".png", ".jpg", ".jpeg"],
                                        },
                                      }}
                                      className="bg-background rounded-lg"
                                    >
                                      <FileInput className="outline-dashed outline-1 outline-slate-500">
                                        <div className="flex items-center justify-center flex-col p-4">
                                          <CloudUpload className="text-gray-500 w-6 h-6 mb-2" />
                                          <p className="text-sm text-gray-500">
                                            <span className="font-semibold">
                                              Click to upload
                                            </span>
                                            &nbsp;or drag and drop
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            PNG, JPG up to 2MB
                                          </p>
                                        </div>
                                      </FileInput>
                                    </FileUploader>
                                  )}
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Add Done button */}
                        <div className="flex justify-end mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDone(index)}
                            disabled={!name || files.length === 0}
                          >
                            Done
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Separator />

          <div className="flex gap-4">
            <Button type="submit">Submit</Button>
            <Button variant="outline" type="button">
              Save Draft
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
