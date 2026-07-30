"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import {
  Info,
  Plus,
  Trash2,
  FileText,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { debounce } from "lodash";
import { useFormContext } from "../context/form-context";
import { usePatentTabsStore } from "./patent-tabs";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import React, { useState } from "react";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";

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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Store interface for patent search form
interface PatentSearchFormState {
  data: any;
  setData: (data: any) => void;
}

// Create the store
export const usePatentSearchFormStore = create<PatentSearchFormState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "patent-search-form-storage",
    }
  )
);

const documentSchema = z.object({
  id: z.string(),
  category: z.string(),
  citation: z.string().min(1, "Citation is required"),
  relevantClaims: z.string(),
});

const searchStringSchema = z.object({
  id: z.string(),
  database: z.string().min(1, "Database is required"),
  customDatabase: z.string().optional(),
  searchString: z.string().min(1, "Search string is required"),
  hits: z.string().min(1, "Number of hits is required"),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateCompleted: z.string().min(1, "Date is required"),
  abstract: z.string().min(1, "Abstract is required"),
  ipcClassification: z.string().min(1, "IPC/CPC classification is required"),
  keywords: z.string().min(1, "Keywords are required"),
  searchStrings: z
    .array(searchStringSchema)
    .min(1, "At least one search string is required"),
  documents: z
    .array(documentSchema)
    .min(1, "At least one document is required"),
  conclusion: z.string().min(1, "Conclusion is required"),
  technicalExpert: z.string().min(1, "Technical expert name is required"),
  files: z.array(z.custom<File>()).optional(),
  certification: z.object({
    technicalExpert: z.string().min(1, "Technical expert name is required"),
    reviewedBy: z.string().min(1, "Reviewer name is required"),
    submittedTo: z.object({
      name: z.string().min(1, "Name is required"),
      position: z.string().min(1, "Position is required"),
    }),
  }),
});

interface PatentSearchFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
}

export function PatentSearchForm({
  onNext,
  onPrevious,
}: PatentSearchFormProps) {
  // Get the store data
  const { data, setData } = usePatentSearchFormStore();
  const { selectedIpTypes } = useFormContext();
  const {
    setActiveTab: setGlobalActiveTab,
    disclosureId,
    patentUtilityModelApplication,
  } = useIpDisclosureStore();
  const { setActiveTab: setPatentTabsActiveTab } = usePatentTabsStore();
  const { savePatentUtilityModelApplication } = useIpDisclosure();

  // Implement a local version of checkPatentSearchReportExists to avoid linter errors
  const checkPatentSearchReportExists = async (
    patentId: string
  ): Promise<boolean> => {
    console.log("Checking if patent search report exists for ID:", patentId);
    try {
      // Construct a URL to check the patent search report existence
      const url = `/api/trpc/ipDisclosure.checkPatentSearchReportExists?input=${encodeURIComponent(
        JSON.stringify({ patentId })
      )}`;

      // Make the request
      const response = await fetch(url);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // Parse the response
      if (data && data.result && data.result.data) {
        return !!data.result.data.exists;
      }

      return false;
    } catch (error) {
      console.error("Error checking patent search report:", error);
      return false;
    }
  };

  // Track if initial data has been loaded
  const initialDataLoaded = React.useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      dateCompleted: "",
      abstract: "",
      ipcClassification: "",
      keywords: "",
      searchStrings: [
        {
          id: "1",
          database: "",
          customDatabase: "",
          searchString: "",
          hits: "",
        },
      ],
      documents: [
        { id: "D1", category: "", citation: "", relevantClaims: "N/A" },
      ],
      conclusion: "",
      technicalExpert: "",
      files: [],
      certification: {
        technicalExpert: "",
        reviewedBy: "",
        submittedTo: {
          name: "",
          position: "Director, TILO Manager, ITSO",
        },
      },
    },
  });

  // Load saved data on component mount - only once
  useEffect(() => {
    if (data && !initialDataLoaded.current) {
      form.reset(data);

      // Ensure technicalExpert is synchronized with certification.technicalExpert
      if (data.certification?.technicalExpert && !data.technicalExpert) {
        form.setValue("technicalExpert", data.certification.technicalExpert);
      } else if (data.technicalExpert && !data.certification?.technicalExpert) {
        form.setValue("certification.technicalExpert", data.technicalExpert);
      }

      console.log("Loaded saved patent search data");
      initialDataLoaded.current = true;
    }
  }, [data, form]);

  // Save form data on change (debounced)
  const debouncedSave = useRef(
    debounce((formData: z.infer<typeof formSchema>) => {
      setData(formData);
      console.log("Patent search data auto-saved");
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
    fields: searchFields,
    append: appendSearch,
    remove: removeSearch,
  } = useFieldArray({
    control: form.control,
    name: "searchStrings",
  });

  const {
    fields: documentFields,
    append: appendDocument,
    remove: removeDocument,
  } = useFieldArray({
    control: form.control,
    name: "documents",
  });

  // Function to update the patentUtilityModelApplication in the store
  const updatePatentUtilityModelInStore = (updatedData: any) => {
    useIpDisclosureStore.setState((state) => ({
      ...state,
      patentUtilityModelApplication: updatedData,
    }));
  };

  // Function to handle form submission
  const handleSave = async () => {
    try {
      // Validate the form
      const values = await form.trigger();
      if (!form.formState.isValid) {
        console.error("Form validation failed:", form.formState.errors);
        toast.error("Please fix the errors in the form before saving");
        return;
      }

      const formData = form.getValues();
      console.log("Form data:", formData);

      // Format the search report data
      const searchReport = {
        title: formData.title,
        dateCompleted: formData.dateCompleted,
        abstract: formData.abstract,
        ipcClassification: formData.ipcClassification,
        keywords: formData.keywords,
        searchStrings: formData.searchStrings.map((s) => ({
          ...s,
          hits: parseInt(s.hits) || 0,
        })),
        documents: formData.documents,
        conclusion: formData.conclusion,
        technicalExpert: formData.technicalExpert,
        files: [], // Files will be handled separately
        certification: {
          ...formData.certification,
          // Ensure technicalExpert is set in both places
          technicalExpert:
            formData.technicalExpert ||
            formData.certification.technicalExpert ||
            "",
        },
      };

      console.log("Formatted search report data:", searchReport);

      // Save the data to the store
      setData(formData);

      // Update the patent utility model application with the search report
      const updatedSearchReport = {
        ...searchReport,
        lastUpdated: new Date().toISOString(),
      };

      // Get the current patent utility model application data
      const currentPatentData = patentUtilityModelApplication || {
        title: "",
        description: "",
        additionalData: {},
      };

      // Update the patent utility model application with the search report
      const updatedPatentData = {
        ...currentPatentData,
        additionalData: {
          ...currentPatentData.additionalData,
          searchReport: updatedSearchReport,
        },
      };

      // Update the store with the updated data
      updatePatentUtilityModelInStore(updatedPatentData);

      // Save the updated data to the database with registry entry creation
      console.log(
        "Calling savePatentUtilityModelApplication with registerForm=true"
      );
      const saveResult = await savePatentUtilityModelApplication(
        undefined,
        true
      );
      console.log("Save result:", saveResult);

      if (saveResult && saveResult.success) {
        toast.success("Patent search report saved successfully");

        // Get the patent ID from the result or from the store
        const patentId =
          saveResult.patentId || patentUtilityModelApplication?.patent_id;

        console.log(`FORM: Patent ID from saveResult: ${saveResult.patentId}`);
        console.log(
          `FORM: Patent ID from store: ${patentUtilityModelApplication?.patent_id}`
        );
        console.log(`FORM: Final patent ID used: ${patentId}`);

        if (patentId) {
          console.log(
            `FORM: Verifying search report for patent ID: ${patentId}`
          );
          console.log(`FORM: Patent ID type: ${typeof patentId}`);
          console.log(`FORM: Patent ID length: ${patentId.length}`);

          try {
            // Add a delay before checking to allow database operations to complete
            console.log(
              "FORM: Waiting 2 seconds before verifying search report..."
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Check if the search report was saved to the database
            const reportExists = await checkPatentSearchReportExists(patentId);
            console.log(`FORM: Report exists check result: ${reportExists}`);

            if (reportExists) {
              console.log("FORM: Search report verification successful");
              toast.success("Search report verified in database");

              // If successful, navigate to the next tab if onNext is provided
              if (onNext) {
                onNext();
              }
            } else {
              console.error("FORM: Search report verification failed");
              toast.warning(
                "Search report verification failed, but data was likely saved. Continuing..."
              );

              // Even if verification fails, we know the data was saved to the database
              // because we got a success response from savePatentUtilityModelApplication
              // So we'll still navigate to the next tab
              if (onNext) {
                console.log(
                  "FORM: Continuing to next tab despite verification failure"
                );
                onNext();
              }
            }
          } catch (verificationError) {
            console.error(
              "FORM: Error during search report verification:",
              verificationError
            );
            toast.warning(
              "Error verifying search report, but data was likely saved. Continuing..."
            );

            // Even if verification throws an error, we'll still navigate to the next tab
            // since we know the data was saved to the database
            if (onNext) {
              console.log(
                "FORM: Continuing to next tab despite verification error"
              );
              onNext();
            }
          }
        } else {
          console.error(
            "FORM: Cannot verify search report: No patent ID available"
          );
          toast.error("Cannot verify search report: No patent ID available");
        }
      } else {
        console.error("FORM: Failed to save patent utility model application");
        toast.error("Failed to save patent search report");
      }
    } catch (error) {
      console.error("Error saving patent search report:", error);
      toast.error("An error occurred while saving the patent search report");
    }
  };

  // Function to handle navigation without form submission
  const handleNextWithoutSubmit = async () => {
    try {
      // Save current form data
      const values = form.getValues();
      setData(values);

      console.log("Patent search data prepared for saving before navigation:", {
        title: values.title,
        dateCompleted: values.dateCompleted,
        abstract: values.abstract,
        ipcClassification: values.ipcClassification,
        keywords: values.keywords,
        searchStrings: values.searchStrings.length,
        documents: values.documents.length,
        conclusion: values.conclusion,
        certification: values.certification,
        files: values.files?.length || 0,
      });

      // Try to save data, but don't block navigation if it fails
      if (disclosureId) {
        console.log(
          "Saving patent search report to database with disclosure ID:",
          disclosureId
        );

        // Update the patentUtilityModelApplication with search data
        if (patentUtilityModelApplication) {
          // First, get the current state to ensure we have the latest data
          const currentPatentData = { ...patentUtilityModelApplication };
          console.log(
            "Current patent data ID:",
            currentPatentData.patent_id || "No ID"
          );

          // Create a proper additionalData structure
          const searchReportData = {
            title: values.title,
            dateCompleted: values.dateCompleted,
            abstract: values.abstract,
            ipcClassification: values.ipcClassification,
            keywords: values.keywords,
            searchStrings: values.searchStrings,
            documents: values.documents,
            conclusion: values.conclusion || "No conclusion provided",
            certification: values.certification || {
              technicalExpert: "",
              reviewedBy: "",
              submittedTo: {
                name: "",
                position: "Director, TILO Manager, ITSO",
              },
            },
            files: values.files || [],
          };

          console.log(
            "Search report data prepared:",
            JSON.stringify(searchReportData).substring(0, 200) + "..."
          );

          const additionalData = {
            ...(currentPatentData.additionalData || {}),
            searchReport: searchReportData,
          };

          // Create the updated patent data with the new additionalData
          const updatedPatentData = {
            ...currentPatentData,
            additionalData: additionalData,
          };

          console.log(
            "Updated patent data with search report:",
            JSON.stringify(updatedPatentData).substring(0, 200) + "..."
          );

          // Update the store with the new data
          updatePatentUtilityModelInStore(updatedPatentData);

          try {
            // Save to database using the existing patent utility model mutation
            console.log("Saving updated patent data to database...");
            const result = await savePatentUtilityModelApplication();

            if (result && result.success) {
              console.log(
                "Patent search report saved successfully to database"
              );
              toast.success("Patent search report saved to database");
            } else {
              console.error("Failed to save patent search report to database");
              toast.error("Failed to save patent search report to database");
            }
          } catch (error) {
            console.error("Error saving patent search report:", error);
            toast.error(
              "Error saving patent search report, but continuing navigation"
            );
          }
        } else {
          console.error(
            "No patent application data found to update with search report"
          );
          toast.error("Please complete the Patent Application tab first");
        }
      } else {
        console.error(
          "No disclosure ID available for saving patent search report"
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

  // Function to handle direct navigation to previous tab
  const navigateToPrevious = () => {
    try {
      // For Patent Search, previous should always be matrix-sample
      console.log("Navigating to matrix-sample");

      // Save current form data
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("matrix-sample");
      console.log("Global active tab set to matrix-sample");

      toast.success("Navigated to Matrix Sample");
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Navigation is not available. Please try again later.");
    }
  };

  // Function to handle direct navigation to next tab
  const navigateToNext = () => {
    try {
      // For Patent Search, next should always be confirmation
      console.log("Navigating to confirmation");

      // Save form data before navigation
      const values = form.getValues();
      setData(values);

      // Use only the global tab state for navigation
      setGlobalActiveTab("confirmation");
      console.log("Global active tab set to confirmation");

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
      console.log("Patent search data saved before navigation");
      console.log("Attempting to navigate to previous tab");

      // Navigate to previous tab
      navigateToPrevious();
    } catch (error) {
      console.error("Error during navigation:", error);
      toast.error("There was an error saving your data. Please try again.");
    }
  };

  const handleAddSearchString = () => {
    appendSearch({
      id: (searchFields.length + 1).toString(),
      database: "",
      customDatabase: "",
      searchString: "",
      hits: "",
    });
  };

  // Define starting and ending dates for the calendar picker
  const now = new Date();
  const startDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
  const endDate = new Date(now.getFullYear() + 2, 11, 31); // 2 years from now

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-8"
      >
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            Patent Search Report
          </h3>
          <p className="text-sm text-muted-foreground">
            Document your {selectedIpTypes.patent ? "patent" : "utility model"}{" "}
            search findings, analyze prior art, and provide recommendations
            based on your search results.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Complete the patent search report form to document your search
            findings and analysis.
          </AlertDescription>
        </Alert>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter the title of your invention/technology"
                      className="min-h-[80px]"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateCompleted"
              render={({ field }) => {
                const [month, setMonth] = useState<Date>(
                  field.value ? new Date(field.value) : new Date()
                );
                const [isYearView, setIsYearView] = useState<boolean>(false);
                const years = eachYearOfInterval({
                  start: startOfYear(startDate),
                  end: endOfYear(endDate),
                });

                return (
                  <FormItem>
                    <FormLabel>Date of Search Completion</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mb-3 justify-between text-left font-normal"
                            onClick={() => setIsYearView(!isYearView)}
                          >
                            {format(month, "MMMM yyyy")}
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
                                    year.getFullYear() === month.getFullYear();

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
                                                  setMonth(month);
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
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(date) => {
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                );
                              }}
                              month={month}
                              onMonthChange={setMonth}
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
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abstract</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a brief summary of your search findings"
                      className="min-h-[120px]"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Classification and Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Classification and Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="ipcClassification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>International Patent Classification/CPC</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter IPC/CPC classification"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter search keywords (comma separated)"
                      className="min-h-[80px]"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Search Strings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Search Strings</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSearchString}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Search String
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Database</TableHead>
                  <TableHead className="w-[25%]">Custom Database</TableHead>
                  <TableHead className="w-[35%]">Search String</TableHead>
                  <TableHead className="w-[15%]">Number of Hits</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`searchStrings.${index}.database`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-2">
                                <select
                                  {...field}
                                  className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value === "other") {
                                      form.setValue(
                                        `searchStrings.${index}.customDatabase`,
                                        ""
                                      );
                                    }
                                  }}
                                >
                                  <option value="">Select Database</option>
                                  <option value="patentscope">
                                    Patentscope
                                  </option>
                                  <option value="espacenet">Espacenet</option>
                                  <option value="ipophl">IPOPHL</option>
                                  <option value="uspto">USPTO</option>
                                  <option value="google-patents">
                                    Google Patents
                                  </option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`searchStrings.${index}.customDatabase`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter database name"
                                className={`w-full transition-all duration-200 ${
                                  form.watch(
                                    `searchStrings.${index}.database`
                                  ) !== "other"
                                    ? "opacity-50 bg-muted cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={
                                  form.watch(
                                    `searchStrings.${index}.database`
                                  ) !== "other"
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`searchStrings.${index}.searchString`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter search string"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`searchStrings.${index}.hits`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter number of hits"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSearch(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documents Considered to Be Relevant */}
        <Card>
          <CardHeader>
            <CardTitle>Documents Considered to Be Relevant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendDocument({
                    id: `D${documentFields.length + 1}`,
                    category: "",
                    citation: "",
                    relevantClaims: "N/A",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Category*</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead>
                    Citation of Documents, with indication, where appropriate,
                    of the relevant pages
                    <div className="text-xs text-muted-foreground mt-1">
                      Ex. Patent number/ Title/ Date filed or published
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    Relevant to claim No.
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`documents.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <select
                                {...field}
                                className="w-full p-2 border rounded-md bg-background"
                              >
                                <option value="">Select</option>
                                <option value="A">A</option>
                                <option value="E">E</option>
                                <option value="L">L</option>
                                <option value="O">O</option>
                                <option value="P">P</option>
                                <option value="T">T</option>
                                <option value="X">X</option>
                                <option value="Y">Y</option>
                                <option value="&">&</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium">D{index + 1}</TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`documents.${index}.citation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter document citation and relevant pages"
                                className="min-h-[80px]"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`documents.${index}.relevantClaims`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="N/A" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Categories Explanation Card */}
            <Card id="categories-explanation">
              <CardHeader>
                <CardTitle className="text-base">
                  Special Categories of Cited Documents:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-semibold">"A"</span>
                    <span>
                      document defining the general state of the art which is
                      not considered to be of particular relevance
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"E"</span>
                    <span>
                      earlier document but published on or after the
                      international filing date
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"L"</span>
                    <span>
                      document which may throw doubts on priority claim(s) or
                      which is cited to establish the publication date of
                      another citation or other special reason (as specified)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"O"</span>
                    <span>
                      document referring to an oral disclosure, use, exhibition
                      or other means
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"P"</span>
                    <span>
                      document published prior to the international filing date
                      but later than the priority date claimed
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"T"</span>
                    <span>
                      later document published after the international filing
                      date or priority date and not in conflict with the
                      application but cited to understand the principle or
                      theory underlying the invention
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"X"</span>
                    <span>
                      document of particular relevance; the claimed invention
                      cannot be considered novel or cannot be considered to
                      involve an inventive step when the document is taken alone
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"Y"</span>
                    <span>
                      document of particular relevance; the claimed invention
                      cannot be considered to involve an inventive step when the
                      document is combined with one or more other such
                      documents, such combination being obvious to a person
                      skilled in the art
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">"&"</span>
                    <span>document member of the same patent family</span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground italic">
                  Note: Further references not indicated in this search report
                  may be cited during substantive examination.
                </div>
              </CardContent>
            </Card>

            {/* Conclusion Section */}
            <Card>
              <CardHeader>
                <CardTitle>Conclusion</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="conclusion"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter your conclusion and recommendations"
                          className="min-h-[120px]"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="mt-2 italic">
                        Note: Further references not indicated in this search
                        report may be cited during substantive examination.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Certification Section */}
        <Card>
          <CardHeader>
            <CardTitle>Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Search Conducted By */}
            <div className="space-y-4">
              <div className="text-center">
                <FormField
                  control={form.control}
                  name="certification.technicalExpert"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className="text-center border-0 border-b rounded-none focus-visible:ring-0 px-0"
                          placeholder="Enter name"
                          onChange={(e) => {
                            field.onChange(e);
                            // Sync with the technicalExpert field
                            form.setValue("technicalExpert", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="mt-2 font-normal text-muted-foreground">
                        Technical Expert
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Reviewed By */}
            <div className="space-y-4">
              <div className="text-center">
                <FormField
                  control={form.control}
                  name="certification.reviewedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full text-center border-0 border-b rounded-none focus-visible:ring-0 px-0 py-2 bg-transparent"
                        >
                          <option value="">Select Head Technical Expert</option>
                          <option value="JOY LYN A. DELA CRUZ">
                            JOY LYN A. DELA CRUZ
                          </option>
                          <option value="Other">Other (Type Below)</option>
                        </select>
                      </FormControl>
                      <FormLabel className="mt-2 font-normal text-muted-foreground">
                        Head Technical Expert
                      </FormLabel>
                      <FormMessage />
                      {field.value === "Other" && (
                        <Input
                          placeholder="Enter name"
                          className="mt-2 text-center"
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submitted To */}
            <div className="space-y-4">
              <div className="text-center">
                <FormField
                  control={form.control}
                  name="certification.submittedTo.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full text-center border-0 border-b rounded-none focus-visible:ring-0 px-0 py-2 bg-transparent"
                        >
                          <option value="">Select Director</option>
                          <option value="PROF. KENNETH L. CIUDAD">
                            PROF. KENNETH L. CIUDAD
                          </option>
                          <option value="Other">Other (Type Below)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                      {field.value === "Other" && (
                        <Input
                          placeholder="Enter name"
                          className="mt-2 text-center"
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certification.submittedTo.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className="text-center border-0 border-b rounded-none focus-visible:ring-0 px-0"
                          placeholder="Enter position"
                          disabled
                          value="Director, TILO Manager, ITSO"
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
            >
              Next
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
