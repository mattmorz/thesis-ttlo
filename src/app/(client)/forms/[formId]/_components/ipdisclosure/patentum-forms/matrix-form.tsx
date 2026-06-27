"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Info, Plus, Trash2, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useFormContext } from "../context/form-context";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import React from "react";
import { usePatentTabsStore } from "./patent-tabs";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { useParams } from "next/navigation";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/ui/fileupload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Store interface for matrix form
interface MatrixFormState {
  data: any;
  setData: (data: any) => void;
}

// Create the store
export const useMatrixFormStore = create<MatrixFormState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "matrix-form-storage",
    }
  )
);

// Define more specific types for the form fields
type PriorArtNumber = 1 | 2 | 3;
type PriorArtField = `priorArt${PriorArtNumber}`;
type PriorArtRemarksField = `${PriorArtField}Remarks`;

const priorArtSchema = z.object({
  title: z.string().optional(),
  reference: z.string().optional(),
});

const featureSchema = z
  .object({
    id: z.string(),
    description: z.string().optional(),
    priorArt1: z.enum(["present", "absent"]),
    priorArt1Remarks: z.string().optional(),
    priorArt2: z.enum(["present", "absent"]),
    priorArt2Remarks: z.string().optional(),
    priorArt3: z.enum(["present", "absent"]),
    priorArt3Remarks: z.string().optional(),
  });

const optionalFileArray = z.array(z.custom<File>()).optional().nullable();

const formSchema = z
  .object({
    inventionTitle: z.string().optional(),

features: z.array(featureSchema).optional(),

priorArts: z.array(priorArtSchema).optional(),
    inventionDocs: optionalFileArray,
    priorArtDocs: z
      .array(
        z.object({
          id: z.string(),
          files: optionalFileArray,
        })
      )
      .optional(),
  });

interface MatrixSampleFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MatrixSampleForm({
  onNext,
  onPrevious,
}: MatrixSampleFormProps) {
  // Get the store data
  const { data, setData } = useMatrixFormStore();
  const { selectedIpTypes } = useFormContext();
  const {
    setActiveTab: setGlobalActiveTab,
    disclosureId,
    patentUtilityModelApplication,
    setPatentUtilityModelApplication,
  } = useIpDisclosureStore();
  const { setActiveTab: setPatentTabsActiveTab } = usePatentTabsStore();
  const { savePatentUtilityModelApplication } = useIpDisclosure();

  // Track if initial data has been loaded
  const initialDataLoaded = React.useRef(false);

  // Function to update the patentUtilityModelApplication in the store
  const updatePatentUtilityModelInStore = (updatedData: any) => {
    useIpDisclosureStore.setState((state) => ({
      ...state,
      patentUtilityModelApplication: updatedData,
    }));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      inventionTitle: "",
      features: [
        {
          id: "1",
          description: "",
          priorArt1: "absent" as const,
          priorArt1Remarks: "",
          priorArt2: "absent" as const,
          priorArt2Remarks: "",
          priorArt3: "absent" as const,
          priorArt3Remarks: "",
        },
      ],
      priorArts: Array(3).fill({ title: "", reference: "" }),
      inventionDocs: [],
      priorArtDocs: Array(3)
        .fill({ id: "", files: [] })
        .map((doc, i) => ({
          ...doc,
          id: (i + 1).toString(),
        })),
    },
  });

const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [inventionTitle, priorArts, features, inventionDocs, priorArtDocs] =
    form.watch([
      "inventionTitle",
      "priorArts",
      "features",
      "inventionDocs",
      "priorArtDocs",
    ]);

  const hasPriorArts =
    Array.isArray(priorArts) &&
    priorArts.length >= 3 &&
    priorArts.every(
      (item) => Boolean(item?.title?.trim()) && Boolean(item?.reference?.trim())
    );

  const hasFeatures =
    Array.isArray(features) &&
    features.length >= 1 &&
    features.every((item) => Boolean(item?.description?.trim()));

  const isRequiredFilled =
    Boolean(inventionTitle?.trim()) &&
    hasPriorArts &&
    hasFeatures;

  const getErrorMessage = (path: string) => {
    return path
      .split(".")
      .reduce(
        (acc: any, key) => (acc ? acc[key] : undefined),
        form.formState.errors as any
      )?.message;
  };

  const handleFieldBlur = async (fieldName: string) => {
    const isValid = await form.trigger(fieldName as any);
    if (!isValid) {
      const message = getErrorMessage(fieldName) || "This field is required";
      toast.error(message);
    }
  };

  // Load saved data on component mount - only once
  useEffect(() => {
    if (data && !initialDataLoaded.current) {
      form.reset(data);
      form.trigger();
      console.log("Loaded saved matrix form data");
      initialDataLoaded.current = true;
    }
  }, [data, form]);

  // Save form data on change (debounced)
  const debouncedSave = useRef(
    debounce((formData: z.infer<typeof formSchema>) => {
      setData(formData);
      console.log("Matrix form data auto-saved");
    }, 1000)
  ).current;

  // Watch for form changes and save
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (initialDataLoaded.current) {
        // Only auto-save after initial load
        debouncedSave(value as z.infer<typeof formSchema>);
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form.watch, debouncedSave]);

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const {
    fields: priorArtFields,
    append: appendPriorArt,
    remove: removePriorArt,
  } = useFieldArray({
    control: form.control,
    name: "priorArts",
  });
  const {
    fields: priorArtDocFields,
    append: appendPriorArtDoc,
    remove: removePriorArtDoc,
  } = useFieldArray({
    control: form.control,
    name: "priorArtDocs",
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Matrix form submitted");
    setData(values);
    toast.success("Matrix form data saved");

    // Navigate to next tab
    navigateToNext();
  }

  const handleSave = async () => {
    try {
      const values = form.getValues();
      setData(values);
      console.log("Matrix form data prepared for saving:", values);

      if (disclosureId) {
        console.log(
          "Saving matrix data to database with disclosure ID:",
          disclosureId
        );

        // Update the patentUtilityModelApplication with matrix data
        if (patentUtilityModelApplication) {
          // First, get the current state to ensure we have the latest data
          const currentPatentData = { ...patentUtilityModelApplication };

          // Create a proper additionalData structure
          const additionalData = {
            ...(currentPatentData.additionalData || {}),
            matrixSample: {
              inventionTitle: values.inventionTitle,
              priorArts: values.priorArts,
              features: values.features,
              inventionDocs: values.inventionDocs || [],
              priorArtDocs: values.priorArtDocs || [],
            },
          };

          // Create the updated patent data with the new additionalData
          const updatedPatentData = {
            ...currentPatentData,
            additionalData: additionalData,
          };

          console.log(
            "Updated patent data with matrix sample:",
            JSON.stringify(updatedPatentData).substring(0, 200) + "..."
          );

          // Update the store with the new data
          updatePatentUtilityModelInStore(updatedPatentData);

          // Save to database using the existing patent utility model mutation
          // Include registerForm=true to create/update the form registry entry
          console.log(
            "Saving updated patent data to database with registry entry..."
          );
          const result = await savePatentUtilityModelApplication(
            undefined,
            true
          );

          if (result) {
            console.log("Matrix data saved successfully to database");
            toast.success("Matrix data saved to database");
          } else {
            console.error("Failed to save matrix data to database");
            toast.error("Failed to save matrix data to database");
          }
        } else {
          console.error(
            "No patent application data found to update with matrix data"
          );
          toast.error("Please complete the Patent Application tab first");
        }
      } else {
        console.error("No disclosure ID available for saving matrix data");
        toast.error("Please complete the Applicant's Information tab first");
      }
    } catch (error) {
      console.error("Error saving matrix data:", error);
      toast.error("An error occurred while saving the matrix data");
    }
  };

  // Function to handle navigation without form submission
  const handleNextWithoutSubmit = async () => {
  if (isSubmitting) return; // para dili ma double click

  setIsSubmitting(true);

  try {
    const values = form.getValues();
    setData(values);

    if (disclosureId && patentUtilityModelApplication) {
      await savePatentUtilityModelApplication();
    }

    navigateToNext();
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};

  // Function to handle direct navigation to next tab
  const navigateToNext = () => {
    try {
      // For Matrix Sample, next should Disclosure and Confirmation
      console.log("Navigating to Disclosure and Confirmation");

      // Save current form data
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("confirmation");
      console.log("Global active tab set to patent-search");

      toast.success("Navigated to Disclosure and Confirmation");
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Navigation is not available. Please try again later.");
    }
  };

  const handlePreviousWithoutSubmit = () => {
    try {
      // Save current form data
      const values = form.getValues();
      setData(values);
      console.log("Matrix form data saved before navigation");
      console.log("Attempting to navigate to previous tab");

      // Navigate to previous tab
      navigateToPrevious();
    } catch (error) {
      console.error("Error during navigation:", error);
      toast.error("There was an error saving your data. Please try again.");
    }
  };

  // Function to handle direct navigation to previous tab
  const navigateToPrevious = () => {
    try {
      // For Matrix Sample, previous should always be patent-application
      console.log("Navigating to patent-application");

      // Save current form data
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("patent-application");
      console.log("Global active tab set to patent-application");

      toast.success("Navigated to Patent Application");
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Navigation is not available. Please try again later.");
    }
  };

  const handleAddFeature = () => {
    appendFeature({
      id: (featureFields.length + 1).toString(),
      description: "",
      priorArt1: "absent" as const,
      priorArt1Remarks: "",
      priorArt2: "absent" as const,
      priorArt2Remarks: "",
      priorArt3: "absent" as const,
      priorArt3Remarks: "",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Matrix Sample
          </h3>
          <p className="text-sm text-muted-foreground">
            Create a comparison matrix to analyze your{" "}
            {selectedIpTypes.patent ? "patent" : "utility model"} invention
            against existing prior art and establish its novelty.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Compare your invention's features with existing prior art. This
            helps establish the novelty and inventive step of your technology.
          </AlertDescription>
        </Alert>

        {/* Invention Title */}
        <Card>
          <CardHeader>
            <CardTitle>Invention Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="inventionTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title of Your Invention/Technology</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the title of your invention"
                      className="min-h-[80px]"
                      rows={2}
                      onBlur={() => {
                        field.onBlur();
                        handleFieldBlur("inventionTitle");
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

{/* Prior Art Info Card */}
<Card className="bg-yellow-50 border border-yellow-200">
  <CardHeader>
    <CardTitle>What is Prior Art?</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2 text-sm text-muted-foreground">
    <p>
      Prior art refers to any existing knowledge, publication, or invention
      that is already available before your invention. It is used to determine
      if your invention is new and original.
    </p>
    <p className="font-medium text-[#1B5E20]">
  Note: TTLO also offers Prior Art Services.{" "}
  <Link href="/contact" className="underline hover:text-[#0A3A10]">
    Contact us
  </Link>{" "}
  for details.
</p>
  </CardContent>
</Card>
        <Card> 
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prior Art References</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const nextIndex = priorArtFields.length + 1;
                appendPriorArt({ title: "", reference: "" });
                appendPriorArtDoc({ id: nextIndex.toString(), files: [] });
              }}
              disabled={priorArtFields.length >= 5}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prior Art
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {priorArtFields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Prior Art {index + 1} 
                  </CardTitle>
                  {index >= 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removePriorArt(index);
                        removePriorArtDoc(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name={`priorArts.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prior Art {index + 1} Title</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={`Enter prior art ${index + 1} title`}
                            className="min-h-[80px]"
                            rows={2}
                            onBlur={() => {
                              field.onBlur();
                              handleFieldBlur(`priorArts.${index}.title`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`priorArts.${index}.reference`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Patent/Publication number or URL"
                            className="min-h-[80px]"
                            rows={2}
                            onBlur={() => {
                              field.onBlur();
                              handleFieldBlur(`priorArts.${index}.reference`);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Features Comparison Matrix */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Features Comparison Matrix</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddFeature}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {featureFields.map((field, featureIndex) => (
                <Card key={field.id} className="relative">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">
                        Feature {featureIndex + 1}
                      </span>
                      {featureIndex > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(featureIndex)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Feature Description */}
                    <FormField
                      control={form.control}
                      name={`features.${featureIndex}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the feature"
                              className="min-h-[80px]"
                              rows={2}
                              onBlur={() => {
                                field.onBlur();
                                handleFieldBlur(
                                  `features.${featureIndex}.description`
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Prior Arts Comparison */}
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((priorArtNum) => {
                        const fieldName =
                          `priorArt${priorArtNum}` as PriorArtField;
                        const remarksFieldName =
                          `${fieldName}Remarks` as PriorArtRemarksField;

                        return (
                          <div
                            key={`${featureIndex}-${priorArtNum}`}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-medium">
                                Prior Art {priorArtNum}
                              </FormLabel>
                            </div>

                            <FormField
                              control={form.control}
                              name={`features.${featureIndex}.${fieldName}`}
                              render={({
                                field: { value, onChange, ...field },
                              }) => (
                                <FormItem>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={onChange}
                                      value={value}
                                      className="flex gap-4"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="present"
                                          id={`${field.name}-present`}
                                        />
                                        <Label
                                          htmlFor={`${field.name}-present`}
                                        >
                                          Present
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="absent"
                                          id={`${field.name}-absent`}
                                        />
                                        <Label htmlFor={`${field.name}-absent`}>
                                          Absent
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            {/* Remarks field that appears when "absent" is selected */}
                            <FormField
                              control={form.control}
                              name={`features.${featureIndex}.${remarksFieldName}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      value={field.value || ""} // Ensure value is always a string
                                      placeholder="Add remarks for this prior art..."
                                      className={cn(
                                        "min-h-[80px] transition-all",
                                        form.watch(
                                          `features.${featureIndex}.${fieldName}`
                                        ) === "present"
                                          ? "opacity-50"
                                          : "opacity-100"
                                      )}
                                      disabled={
                                        form.watch(
                                          `features.${featureIndex}.${fieldName}`
                                        ) === "present"
                                      }
                                      rows={2}
                                      onBlur={() => {
                                        field.onBlur();
                                        handleFieldBlur(
                                          `features.${featureIndex}.${remarksFieldName}`
                                        );
                                      }}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supporting Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            {/* <span className="text-red-500"> *</span> */}
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invention Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Documents of Your Invention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="inventionDocs"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUploader
                          value={field.value}
                          onValueChange={(files) => {
                            field.onChange(files ?? []);
                            console.log(
                              "Invention docs updated:",
                              (files ?? []).length,
                              "files remaining"
                            );
                          }}
                          multiple
                          dropzoneOptions={{
                            accept: {
                              "application/pdf": [".pdf"],
                              "application/msword": [".doc"],
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                                [".docx"],
                              "image/*": [".jpg", ".jpeg", ".png"],
                            },
                          }}
                        >
                          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex flex-col items-center justify-center text-center">
                              <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                              <p className="mb-1 text-sm text-muted-foreground">
                                <span className="font-semibold">
                                  Click to upload
                                </span>{" "}
                                or drag and drop
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF, DOC, DOCX, JPG, PNG (up to 10MB each)
                              </p>
                            </div>
                          </div>
                        </FileUploader>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Prior Art Documents */}
            {priorArtFields.map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">
                    Documents of Prior Art {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name={`priorArtDocs.${index}.files`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                        <FileUploader
                          value={field.value}
                          onValueChange={(files) => {
                            field.onChange(files ?? []);
                            console.log(
                              "Prior art docs updated:",
                              (files ?? []).length,
                              "files remaining"
                            );
                          }}
                          multiple
                            dropzoneOptions={{
                              accept: {
                                "application/pdf": [".pdf"],
                                "application/msword": [".doc"],
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                                  [".docx"],
                                "image/*": [".jpg", ".jpeg", ".png"],
                              },
                            }}
                          >
                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:bg-accent/50 transition-colors">
                              <div className="flex flex-col items-center justify-center text-center">
                                <FileText className="h-8 w-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground">
                                  <span className="font-semibold">
                                    Click to upload
                                  </span>{" "}
                                  or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDF, DOC, DOCX, JPG, PNG (up to 10MB each)
                                </p>
                              </div>
                            </div>
                          </FileUploader>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Separator />
{/* Debugger for the form  */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base">Debug Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div>isRequiredFilled: {String(isRequiredFilled)}</div>
              <div>formState.isValid: {String(form.formState.isValid)}</div>
              <div>Errors:</div>
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-3 rounded">
                {JSON.stringify(form.formState.errors, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card> */}

        <div className="flex justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={handlePreviousWithoutSubmit}
            className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
          >
            Previous
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleSave}
              className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] hover:text-[#1B5E20]"
            >
              Update Form
            </Button>
            <Button
              type="button"
              onClick={handleNextWithoutSubmit}
              disabled={isSubmitting}
              className="bg-[#1B5E20] hover:bg-[#0A3A10] text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
