"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Info, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { debounce } from "lodash";
import React from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUploader, FileUploaderItem } from "@/components/ui/fileupload";
import { useFormContext } from "../context/form-context";
import { usePatentTabsStore } from "./patent-tabs";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";

// Store interface for patent application form
interface PatentApplicationState {
  data: any;
  setData: (data: any) => void;
}

// Create the store
export const usePatentApplicationStore = create<PatentApplicationState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "patent-application-storage",
    }
  )
);

const formSchema = z.object({
  technologyType: z
    .object({
      product: z.boolean().default(false),
      process: z.boolean().default(false),
      material: z.boolean().default(false),
      software: z.boolean().default(false),
    })
    .refine((data) => Object.values(data).some((value) => value === true), {
      message: "Please select at least one technology type",
    }),
  technologyField: z
    .object({
      chemical: z.boolean().default(false),
      mechanical: z.boolean().default(false),
    })
    .refine((data) => Object.values(data).some((value) => value === true), {
      message: "Please select at least one technology field",
    }),
  title: z.string().min(1, "Title is required"),
  problem: z.string().min(1, "Problem description is required"),
  comparison: z.string().min(1, "Comparison is required"),
  novelty: z.string().min(1, "Novelty explanation is required"),
  variations: z.string().min(1, "Other implementations/variations is required"),
  usage: z.string().min(1, "Usage description is required"),
  literature_references: z
    .string()
    .min(1, "Literature references is required"),
  ownPublications: z.string().min(1, "Your publications is required"),
  files: z.array(z.custom<File>()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TECHNOLOGY_TYPES = [
  {
    id: "product" as const,
    label: "Product / Machine / Apparatus / Device / Prototype",
  },
  { id: "process" as const, label: "Process / Method" },
  {
    id: "material" as const,
    label: "Material / Compound / Composition / Formulation",
  },
  { id: "software" as const, label: "Software" },
] as const;

const TECHNOLOGY_FIELDS = [
  { id: "chemical" as const, label: "Chemical" },
  { id: "mechanical" as const, label: "Mechanical" },
] as const;

interface PatentApplicationProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export function PatentApplication({
  onNext,
  onPrevious,
}: PatentApplicationProps) {
  // Get the store data
  const { data, setData } = usePatentApplicationStore();
  const { selectedIpTypes } = useFormContext();
  const {
    setActiveTab: setGlobalActiveTab,
    setPatentUtilityModelApplication,
    disclosureId,
  } = useIpDisclosureStore();
  const { setActiveTab: setPatentTabsActiveTab } = usePatentTabsStore();
  const { savePatentUtilityModelApplication } = useIpDisclosure();

  // Track if initial data has been loaded
  const initialDataLoaded = React.useRef(false);

  // Log when component mounts and when onNext/onPrevious props change
  useEffect(() => {
    console.log("PatentApplication component mounted/updated");
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      technologyType: {
        product: false,
        process: false,
        material: false,
        software: false,
      },
      technologyField: {
        chemical: false,
        mechanical: false,
      },
      title: "",
      problem: "",
      comparison: "",
      novelty: "",
      variations: "",
      usage: "",
      literature_references: "",
      ownPublications: "",
      files: [],
    },
  });

  const [
    title,
    problem,
    comparison,
    novelty,
    variations,
    usage,
    literature_references,
    ownPublications,
    technologyType,
    technologyField,
  ] = form.watch([
    "title",
    "problem",
    "comparison",
    "novelty",
    "variations",
    "usage",
    "literature_references",
    "ownPublications",
    "technologyType",
    "technologyField",
  ]);

  const isTechnologyTypeSelected =
    technologyType && Object.values(technologyType).some(Boolean);
  const isTechnologyFieldSelected =
    technologyField && Object.values(technologyField).some(Boolean);

  const isRequiredFilled =
    Boolean(title?.trim()) &&
    Boolean(problem?.trim()) &&
    Boolean(comparison?.trim()) &&
    Boolean(novelty?.trim()) &&
    Boolean(variations?.trim()) &&
    Boolean(usage?.trim()) &&
    Boolean(literature_references?.trim()) &&
    Boolean(ownPublications?.trim()) &&
    isTechnologyTypeSelected &&
    isTechnologyFieldSelected;

  const handleFieldBlur = async (
    fieldName:
      | "title"
      | "problem"
      | "comparison"
      | "novelty"
      | "variations"
      | "usage"
      | "literature_references"
      | "ownPublications"
  ) => {
    const isValid = await form.trigger(fieldName);
    if (!isValid) {
      const message =
        form.formState.errors?.[fieldName]?.message ||
        "This field is required";
      toast.error(message);
    }
  };

  const handleGroupChange = async (
    groupName: "technologyType" | "technologyField"
  ) => {
    const isValid = await form.trigger(groupName);
    if (!isValid) {
      const message =
        form.formState.errors?.[groupName]?.message ||
        "Please select at least one option";
      toast.error(message);
    }
  };

  // Load saved data on component mount - only once
  useEffect(() => {
    if (data && !initialDataLoaded.current) {
      form.reset(data);
      console.log("Loaded saved patent application data");
      initialDataLoaded.current = true;
    }
  }, [data, form]);

  // Save form data on change (debounced)
  const debouncedSave = useRef(
    debounce((formData: FormValues) => {
      setData(formData);
      console.log("Patent application data auto-saved");
    }, 1000)
  ).current;

  // Watch for form changes and save
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (initialDataLoaded.current) {
        // Only auto-save after initial load
        debouncedSave(value as FormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form.watch, debouncedSave]);

  async function onSubmit(values: FormValues) {
    try {
      console.log("Patent application form submitted");
      setData(values);

      // Format the data to match the database schema
      const patentData = {
        title: values.title,
        description: values.problem, // Map problem to description/solution field
        additionalData: {
          technologyType: values.technologyType,
          technologyField: values.technologyField,
          problem: values.problem,
          comparison: values.comparison,
          novelty: values.novelty,
          variations: values.variations,
          usage: values.usage,
          literature_references: values.literature_references,
          ownPublications: values.ownPublications,
          files: values.files,
          // Determine if it's a patent or utility model based on selected IP types
          isPatent: selectedIpTypes.patent,
          type: selectedIpTypes.patent ? "patent" : "utility_model",
        },
      };

      // Save to the global store
      setPatentUtilityModelApplication(patentData);

      console.log("Patent application data prepared for saving:", patentData);

      // Save directly to the database
      if (disclosureId) {
        console.log(
          "Saving patent application to database with disclosure ID:",
          disclosureId
        );
        const result = await savePatentUtilityModelApplication();
        if (result) {
          console.log("Patent application saved successfully to database");
          toast.success("Patent application data saved to database");

          // Navigate to next tab
          navigateToNext();
        } else {
          console.error("Failed to save patent application to database");
          toast.error("Failed to save patent application to database");
        }
      } else {
        console.error(
          "No disclosure ID available for saving patent application"
        );
        toast.error("Please complete the Applicant's Information tab first");
      }
    } catch (error) {
      console.error("Error submitting patent application:", error);
      toast.error("An error occurred while submitting the patent application");
    }
  }

  const handleSave = async () => {
    try {
      const values = form.getValues();
      setData(values);

      // Format the data to match the database schema
      const patentData = {
        title: values.title,
        description: values.problem, // Map problem to description/solution field
        additionalData: {
          technologyType: values.technologyType,
          technologyField: values.technologyField,
          problem: values.problem,
          comparison: values.comparison,
          novelty: values.novelty,
          variations: values.variations,
          usage: values.usage,
          literature_references: values.literature_references,
          ownPublications: values.ownPublications,
          files: values.files,
          // Determine if it's a patent or utility model based on selected IP types
          isPatent: selectedIpTypes.patent,
          type: selectedIpTypes.patent ? "patent" : "utility_model",
        },
      };

      // Save to the global store
      setPatentUtilityModelApplication(patentData);

      console.log("Patent application data prepared for saving:", patentData);

      // Save directly to the database
      if (disclosureId) {
        console.log(
          "Saving patent application to database with disclosure ID:",
          disclosureId
        );
        // Set registerForm=true to create entry in form_submission_registry
        const result = await savePatentUtilityModelApplication(undefined, true);
        if (result) {
          console.log("Patent application saved successfully to database");
          toast.success("Patent application data saved to database");
        } else {
          console.error("Failed to save patent application to database");
          toast.error("Failed to save patent application to database");
        }
      } else {
        console.error(
          "No disclosure ID available for saving patent application"
        );
        toast.error("Please complete the Applicant's Information tab first");
      }
    } catch (error) {
      console.error("Error saving patent application:", error);
      toast.error("An error occurred while saving the patent application");
    }
  };

  // Function to handle navigation without form submission
  const handleNextWithoutSubmit = async () => {
    try {
      // Save current form data
      const values = form.getValues();
      setData(values);

      // Format the data to match the database schema
      const patentData = {
        title: values.title,
        description: values.problem, // Map problem to description/solution field
        additionalData: {
          technologyType: values.technologyType,
          technologyField: values.technologyField,
          problem: values.problem,
          comparison: values.comparison,
          novelty: values.novelty,
          variations: values.variations,
          usage: values.usage,
          literature_references: values.literature_references,
          ownPublications: values.ownPublications,
          files: values.files,
          // Determine if it's a patent or utility model based on selected IP types
          isPatent: selectedIpTypes.patent,
          type: selectedIpTypes.patent ? "patent" : "utility_model",
        },
      };

      // Save to the global store
      setPatentUtilityModelApplication(patentData);

      console.log("Patent application data prepared for saving:", patentData);

      // Try to save data, but don't block navigation if it fails
      if (disclosureId) {
        console.log(
          "Saving patent application to database with disclosure ID:",
          disclosureId
        );

        try {
          const result = await savePatentUtilityModelApplication();
          if (result) {
            console.log("Patent application saved successfully to database");
            toast.success("Patent application data saved to database");
          } else {
            console.error("Failed to save patent application to database");
            toast.error("Failed to save patent application to database");
          }
        } catch (error) {
          console.error("Error saving patent application:", error);
          toast.error(
            "Error saving patent application, but continuing navigation"
          );
        }
      } else {
        console.error(
          "No disclosure ID available for saving patent application"
        );
        toast.error("Please complete the Applicant's Information tab first");
      }

      // Always navigate to the next tab, even if saving fails
      navigateToNext();
    } catch (error) {
      console.error("Error during navigation:", error);
      toast.error("There was an error, but continuing with navigation");

      // Still try to navigate even if there was an error
      navigateToNext();
    }
  };

  // Function to handle direct navigation to next tab
  const navigateToNext = () => {
    try {
      // For Patent Application, next should always be matrix-sample
      console.log("Navigating to matrix-sample");

      // Save current form data
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("matrix-sample");

      // Log success and show toast
      console.log("Global tab state updated to matrix-sample");
      toast.success("Navigated to Matrix Sample");

      // No need to try clicking DOM elements directly
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Navigation is not available. Please try again later.");
    }
  };

  // Function to handle previous navigation without form submission
  const handlePreviousWithoutSubmit = () => {
    try {
      // Save current form data
      const values = form.getValues();
      setData(values);
      console.log("Patent application data saved before navigation");
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
      // For Patent Application, previous should always be applicants-information
      console.log("Navigating to applicants-information");

      // Save current form data
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("applicants-information");
      console.log("Global active tab set to applicants-information");

      toast.success("Navigated to Applicant's Information");
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Navigation is not available. Please try again later.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            {selectedIpTypes.patent ? "Patent" : "Utility Model"} Application
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete the {selectedIpTypes.patent ? "patent" : "utility model"}{" "}
            application form with details about your invention, its technical
            aspects, and supporting documentation.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please fill out all required fields in the{" "}
            {selectedIpTypes.patent ? "patent" : "utility model"} application
            form. You can also upload supporting documents if needed.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technology Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <FormLabel className="text-base">
                  <span className="font-bold">Type of Technology</span><span className="text-red-500"> *</span>
                </FormLabel>
                <FormDescription>
                  What type of technology are you applying for?
                </FormDescription>
                <div className="grid grid-cols-2 gap-4">
                  {TECHNOLOGY_TYPES.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`technologyType.${item.id}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleGroupChange("technologyType");
                              }}
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
                {form.formState.errors.technologyType && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.technologyType.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <FormLabel className="text-base">
                  <span className="font-bold">Field of Technology</span><span className="text-red-500"> *</span>
                </FormLabel>
                <FormDescription>
                  Which field of technology would you classify your application?
                </FormDescription>
                <div className="flex gap-6">
                  {TECHNOLOGY_FIELDS.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`technologyField.${item.id}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleGroupChange("technologyField");
                              }}
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
                {form.formState.errors.technologyField && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.technologyField.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Invention Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        <span className="font-bold">
                          Title of Invention / Technology
                        </span><span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormDescription>
                        Preferred format: "Type of Technology" followed by its
                        intended "use".
                        <br />
                        For example: "Ultrasonic apparatus for testing welds"
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Enter title..."
                          {...field}
                          onBlur={(event) => {
                            field.onBlur();
                            handleFieldBlur("title");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        <span className="font-bold">
                          What problem does it solve?
                        </span><span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormDescription>
                        For technology that is best explained with drawings:
                        Include perspective view, sectional view, exploded view,
                        etc. For Process/Methods - include flowcharts, schematic
                        diagrams.{" "}
                        <span className="text-[#1B5E20] font-medium">
                          You can upload these files in the Technical Drawings &
                          Diagrams section at the bottom of this form.
                        </span>
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the problem..."
                          className="min-h-[100px]"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur();
                            handleFieldBlur("problem");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparative Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="comparison"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        <span className="font-bold">
                          Advantages and Disadvantages
                        </span><span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormDescription>
                        Compare this technology to existing work
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="List advantages and disadvantages..."
                          className="min-h-[100px]"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur();
                            handleFieldBlur("comparison");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="novelty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        <span className="font-bold">Novelty Explanation</span><span className="text-red-500"> *</span>
                      </FormLabel>
                      <FormDescription>
                        Explain why this invention is novel over the prior art,
                        include a search report
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="Explain novelty..."
                          className="min-h-[100px]"
                          {...field}
                          onBlur={(event) => {
                            field.onBlur();
                            handleFieldBlur("novelty");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Additional fields */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  name: "variations",
                  label: "Other Implementations/Variations",
                  placeholder: "Describe possible variations...",
                  description:
                    "What other implementations/variations of this technology would be possible?",
                  required: true,
                },
                {
                  name: "usage",
                  label: "Final Product Usage",
                  placeholder: "Describe intended usage...",
                  description:
                    "What would the final 'product or technology' be used for?",
                  required: true,
                },
                {
                  name: "literature_references",
                  label: "Literature References",
                  placeholder: "List references...",
                  description:
                    "Include patent applications, key scientific literature and/or public oral communications",
                  required: true,
                },
                {
                  name: "ownPublications",
                  label: "Your Publications",
                  placeholder: "List your publications...",
                  description:
                    "List your own publications in the field (articles, abstracts, posters, www)",
                  required: true,
                },
              ].map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as keyof FormValues}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        <span className="font-bold">{field.label}</span><span className="text-red-500"> *</span>
                        {/* {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )} */}
                      </FormLabel>
                      <FormDescription>{field.description}</FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder={field.placeholder}
                          className="min-h-[100px]"
                          value={formField.value as string}
                          onChange={formField.onChange}
                          onBlur={() => {
                            formField.onBlur();
                            if (field.name === "variations") {
                              handleFieldBlur("variations");
                            }
                            if (field.name === "usage") {
                              handleFieldBlur("usage");
                            }
                            if (field.name === "literature_references") {
                              handleFieldBlur("literature_references");
                            }
                            if (field.name === "ownPublications") {
                              handleFieldBlur("ownPublications");
                            }
                          }}
                          name={formField.name}
                          ref={formField.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Technical Drawings & Diagrams</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormDescription className="space-y-2">
                    <p>For technology that is best explained with drawings:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        Non-chemical – show perspective view, sectional view,
                        exploded view, etc.
                      </li>
                      <li>
                        Process/Methods – flowcharts, schematic diagrams, or the
                        like.
                      </li>
                    </ul>
                    <p>
                      Show in detail all the elements/parts of the invention.
                      Please attach the file of the drawings/diagram.
                    </p>
                  </FormDescription>
                  <FormControl>
                    <FileUploader
                      value={field.value}
                      onValueChange={(files) => {
                        field.onChange(files);
                        console.log(
                          "Files updated:",
                          files.length,
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
                            Supported file types: PDF, DOC, DOCX, JPG, PNG
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

        <Separator />

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
              className="bg-[#1B5E20] hover:bg-[#0A3A10] text-white"
              disabled={!isRequiredFilled || !form.formState.isValid}
            >
              Next
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
