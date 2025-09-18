"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useRef, useCallback, useState } from "react";
import debounce from "lodash/debounce";
import type { DebouncedFunc } from "lodash";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import { ExternalLink, CalendarIcon, ChevronDown } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext } from "../../context/form-context";
import { Textarea } from "@/components/ui/textarea";
import { useTransactionFormPart2Store } from "../transaction-form-part2";
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
import { cn } from "@/lib/utils";

// Define starting and ending dates for the calendar picker
const now = new Date();
const startDate = new Date(now.getFullYear() - 30, 0, 1); // 30 years ago
const endDate = new Date(now.getFullYear(), 11, 31); // Current year

// Add store for data persistence
interface WorkFormState {
  data: any;
  setData: (data: any) => void;
}

// Export the store so it can be imported by other components
export const useWorkFormStore = create<WorkFormState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "work-form-storage",
    }
  )
);

const formSchema = z.object({
  // Basic Work Information
  title: z.string().min(1, "Title is required"),
  dateOfCreation: z.string().min(1, "Date of creation is required"),
  placeOfCreation: z
    .string()
    .min(1, "Place of creation/performance/broadcast is required"),
  classificationOfWork: z.string().min(1, "Classification of work is required"),

  // Submission Type
  submissionType: z.object({
    isLocal: z.boolean(),
    isForeign: z.boolean(),
  }),

  // Registration Status
  registrationStatus: z.object({
    isRegistered: z.boolean(),
    registrationOffice: z.object({
      withIPOPHL: z.boolean(),
      withNLP: z.boolean(),
    }),
  }),

  // Publication Status
  publicationStatus: z.object({
    isPublished: z.enum(["YES", "NO"]),
    publisherInfo: z.string().optional(),
  }),

  // Derivative Work
  derivativeWork: z.object({
    isDerivative: z.enum(["YES", "NO"]),
    originalWorkInfo: z.string().optional(),
  }),

  // Indigenous Knowledge
  indigenousKnowledge: z.object({
    isIndigenous: z.enum(["YES", "NO"]),
    sourceInfo: z.string().optional(),
  }),

  // Government Funded
  governmentFunded: z.object({
    isFunded: z.enum(["YES", "NO"]),
    fundingAgency: z.string().optional(),
  }),

  // Regular Duties
  regularDuties: z.object({
    isRegularDuty: z.enum(["YES", "NO"]),
    employer: z.string().optional(),
  }),

  // Rights Claim
  rightsClaim: z.object({
    isClaimingEntireWork: z.enum(["YES", "NO"]),
    partialRights: z.string().optional(),
  }),
});

function YesNoCheckboxes({
  value,
  onValueChange,
}: {
  value: "YES" | "NO";
  onValueChange: (value: "YES" | "NO") => void;
}) {
  return (
    <>
      <FormItem className="flex items-center gap-2">
        <FormLabel className="font-normal">NO</FormLabel>
        <Checkbox
          checked={value === "NO"}
          onCheckedChange={() => onValueChange("NO")}
          className="text-green-600 border-green-600"
        />
      </FormItem>
      <FormItem className="flex items-center gap-2">
        <FormLabel className="font-normal">YES</FormLabel>
        <Checkbox
          checked={value === "YES"}
          onCheckedChange={() => onValueChange("YES")}
          className="text-green-600 border-green-600"
        />
      </FormItem>
    </>
  );
}

export function WorkCreationForm() {
  const { setCurrentTransactionSubTab } = useFormContext();
  const { data, setData } = useWorkFormStore();
  const formRef = useRef(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data || {
      title: "",
      dateOfCreation: "",
      placeOfCreation: "",
      classificationOfWork: "",
      submissionType: {
        isLocal: false,
        isForeign: false,
      },
      registrationStatus: {
        isRegistered: false,
        registrationOffice: {
          withIPOPHL: false,
          withNLP: false,
        },
      },
      publicationStatus: {
        isPublished: "NO",
        publisherInfo: "",
      },
      derivativeWork: {
        isDerivative: "NO",
        originalWorkInfo: "",
      },
      indigenousKnowledge: {
        isIndigenous: "NO",
        sourceInfo: "",
      },
      governmentFunded: {
        isFunded: "NO",
        fundingAgency: "",
      },
      regularDuties: {
        isRegularDuty: "NO",
        employer: "",
      },
      rightsClaim: {
        isClaimingEntireWork: "NO",
        partialRights: "",
      },
    },
  });

  // Load data from store when component mounts
  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  // Form submission handler
  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    console.log("[WorkCreationForm] Form submitted with data:", formData);

    // Ensure we're storing critical fields in a format that matches what's expected by copyright application
    const enhancedData = {
      ...formData,
      // Add any additional mappings needed for compatibility
      _metadata: {
        lastSaved: Date.now(),
        source: "work-creation-form",
      },
    };

    setData(enhancedData);

    // Dispatch event for parent components to know data is ready
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("work-form-submitted", {
          detail: enhancedData,
        })
      );
    }
  };

  // Debounced save function with proper typing
  const debouncedSave: DebouncedFunc<
    (formData: z.infer<typeof formSchema>) => void
  > = useCallback(
    debounce((formData: z.infer<typeof formSchema>) => {
      if (formData && JSON.stringify(formData) !== JSON.stringify(data)) {
        setData(formData);
      }
    }, 1000),
    [data, setData]
  );

  // Watch form changes with debounce
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value && Object.keys(value).length > 0) {
        // Log what's changing for debugging
        console.log("[WorkCreationForm] Form values changed:", value);

        debouncedSave(value as z.infer<typeof formSchema>);

        // Ensure we're capturing essential fields properly
        // (title, dateOfCreation, classification, publicationStatus)
        if (form.formState.isValid) {
          // Save data to the store immediately for critical fields
          const currentValues = form.getValues();

          // Check if critical fields have been filled
          const hasCriticalFields =
            currentValues.title ||
            currentValues.dateOfCreation ||
            currentValues.classificationOfWork;

          if (hasCriticalFields) {
            console.log(
              "[WorkCreationForm] Saving critical field data:",
              currentValues
            );
            setData(currentValues);

            // Also dispatch a custom event to notify parent components
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("work-form-data-updated", {
                  detail: currentValues,
                })
              );
            }
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form, debouncedSave]);

  // Add an additional effect to force save data on component unmount
  useEffect(() => {
    return () => {
      const currentValues = form.getValues();
      // Only save if we have meaningful data
      if (
        currentValues &&
        Object.keys(currentValues).length > 0 &&
        (currentValues.title || currentValues.dateOfCreation)
      ) {
        console.log(
          "[WorkCreationForm] Saving data on unmount:",
          currentValues
        );
        setData(currentValues);
      }
    };
  }, [form, setData]);

  return (
    <Form {...form}>
      <div ref={formRef} className="space-y-8">
        <Alert>
          <AlertDescription>
            For bulk applications, minimum of 10 works of the same class, use
            additional transaction forms
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Basic Work Information */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Title
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[80px] resize-y"
                        placeholder="Enter complete title of the work..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dateOfCreation"
                  render={({ field }) => {
                    const [month, setMonth] = useState<Date>(
                      field.value ? new Date(field.value) : new Date()
                    );
                    const [isYearView, setIsYearView] =
                      useState<boolean>(false);
                    const years = eachYearOfInterval({
                      start: startOfYear(startDate),
                      end: endOfYear(endDate),
                    });

                    return (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Date of Creation/Performance/Broadcast
                        </FormLabel>
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
                                        year.getFullYear() ===
                                        month.getFullYear();

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
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
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
                  name="placeOfCreation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Place of Creation/Performance/Broadcast
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[80px] resize-y"
                          placeholder="Enter complete place details (City/Municipality)..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Classification of Work */}
            <div className="border-t pt-6">
              <FormField
                control={form.control}
                name="classificationOfWork"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-medium">
                          Classification of Work
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setCurrentTransactionSubTab("reference");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <span className="text-sm">View Classifications</span>
                        </Button>
                      </div>
                      <div className="flex gap-4 items-start">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter letter"
                            className="w-[100px] text-center uppercase"
                            maxLength={1}
                          />
                        </FormControl>
                        <FormDescription className="flex-1 text-sm text-muted-foreground mt-2">
                          Enter the letter corresponding to your work's
                          classification (A-Q). Click "View Classifications" to
                          see the complete list of classifications and their
                          descriptions.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Question Sections */}
            <div className="space-y-4">
              {/* Local/Foreign Submission */}
              <div className="flex items-center justify-between py-4 border-t">
                <FormLabel className="text-base">
                  Is the work a local or foreign submission?
                </FormLabel>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">Local</FormLabel>
                    <Checkbox
                      checked={form.watch("submissionType.isLocal")}
                      onCheckedChange={(checked: boolean) => {
                        form.setValue("submissionType.isLocal", checked);
                        if (checked)
                          form.setValue("submissionType.isForeign", false);
                      }}
                      className="text-green-600 border-green-600"
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">Foreign</FormLabel>
                    <Checkbox
                      checked={form.watch("submissionType.isForeign")}
                      onCheckedChange={(checked: boolean) => {
                        form.setValue("submissionType.isForeign", checked);
                        if (checked)
                          form.setValue("submissionType.isLocal", false);
                      }}
                      className="text-green-600 border-green-600"
                    />
                  </FormItem>
                </div>
              </div>

              {/* Registration Status */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Copyright registered with the IPOPHL or the National Library
                    of the Philippines (NLP)?
                  </FormLabel>
                  {form.watch("registrationStatus.isRegistered") && (
                    <div className="flex gap-8 mt-2">
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="font-normal">
                          with IPOPHL
                        </FormLabel>
                        <Checkbox
                          checked={form.watch(
                            "registrationStatus.registrationOffice.withIPOPHL"
                          )}
                          onCheckedChange={(checked: boolean) =>
                            form.setValue(
                              "registrationStatus.registrationOffice.withIPOPHL",
                              checked
                            )
                          }
                          className="text-green-600 border-green-600"
                        />
                      </FormItem>
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="font-normal">with NLP</FormLabel>
                        <Checkbox
                          checked={form.watch(
                            "registrationStatus.registrationOffice.withNLP"
                          )}
                          onCheckedChange={(checked: boolean) =>
                            form.setValue(
                              "registrationStatus.registrationOffice.withNLP",
                              checked
                            )
                          }
                          className="text-green-600 border-green-600"
                        />
                      </FormItem>
                    </div>
                  )}
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={!form.watch("registrationStatus.isRegistered")}
                      onCheckedChange={(checked: boolean) => {
                        form.setValue(
                          "registrationStatus.isRegistered",
                          !checked
                        );
                        if (checked) {
                          form.setValue(
                            "registrationStatus.registrationOffice.withIPOPHL",
                            false
                          );
                          form.setValue(
                            "registrationStatus.registrationOffice.withNLP",
                            false
                          );
                        }
                      }}
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={form.watch("registrationStatus.isRegistered")}
                      onCheckedChange={(checked: boolean) => {
                        form.setValue(
                          "registrationStatus.isRegistered",
                          checked
                        );
                      }}
                    />
                  </FormItem>
                </div>
              </div>

              {/* Publication Status */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is the work published?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="publicationStatus.publisherInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate publisher"
                              className="w-full"
                              disabled={
                                form.watch("publicationStatus.isPublished") !==
                                "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <YesNoCheckboxes
                    value={form.watch("publicationStatus.isPublished")}
                    onValueChange={(value) => {
                      form.setValue("publicationStatus.isPublished", value);
                      if (value === "YES") {
                        form.setValue("publicationStatus.publisherInfo", "");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Derivative Work */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is this a derivative work?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="derivativeWork.originalWorkInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate original work"
                              className="w-full"
                              disabled={
                                form.watch("derivativeWork.isDerivative") !==
                                "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("derivativeWork.isDerivative") === "NO"
                      }
                      onCheckedChange={() =>
                        form.setValue("derivativeWork.isDerivative", "NO")
                      }
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("derivativeWork.isDerivative") === "YES"
                      }
                      onCheckedChange={() =>
                        form.setValue("derivativeWork.isDerivative", "YES")
                      }
                    />
                  </FormItem>
                </div>
              </div>

              {/* Indigenous Knowledge */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is the work derived from an indigenous knowledge & system &
                    practice (IKSP)?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="indigenousKnowledge.sourceInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate source"
                              className="w-full"
                              disabled={
                                form.watch(
                                  "indigenousKnowledge.isIndigenous"
                                ) !== "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("indigenousKnowledge.isIndigenous") === "NO"
                      }
                      onCheckedChange={() =>
                        form.setValue("indigenousKnowledge.isIndigenous", "NO")
                      }
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("indigenousKnowledge.isIndigenous") === "YES"
                      }
                      onCheckedChange={() =>
                        form.setValue("indigenousKnowledge.isIndigenous", "YES")
                      }
                    />
                  </FormItem>
                </div>
              </div>

              {/* Government Funded */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is the work a product of a government funded research
                    project?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="governmentFunded.fundingAgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate Government Funding Agency"
                              className="w-full"
                              disabled={
                                form.watch("governmentFunded.isFunded") !==
                                "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={form.watch("governmentFunded.isFunded") === "NO"}
                      onCheckedChange={() =>
                        form.setValue("governmentFunded.isFunded", "NO")
                      }
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("governmentFunded.isFunded") === "YES"
                      }
                      onCheckedChange={() =>
                        form.setValue("governmentFunded.isFunded", "YES")
                      }
                    />
                  </FormItem>
                </div>
              </div>

              {/* Regular Duties */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is the work part of the regular duties of the author as an
                    employee?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="regularDuties.employer"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate employer"
                              className="w-full"
                              disabled={
                                form.watch("regularDuties.isRegularDuty") !==
                                "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("regularDuties.isRegularDuty") === "NO"
                      }
                      onCheckedChange={() =>
                        form.setValue("regularDuties.isRegularDuty", "NO")
                      }
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("regularDuties.isRegularDuty") === "YES"
                      }
                      onCheckedChange={() =>
                        form.setValue("regularDuties.isRegularDuty", "YES")
                      }
                    />
                  </FormItem>
                </div>
              </div>

              {/* Rights Claim */}
              <div className="flex items-start justify-between py-4 border-t">
                <div className="flex-1">
                  <FormLabel className="text-base">
                    Is the Author/creator/performer claiming copyright/related
                    right for the entire work?
                  </FormLabel>
                  <div className="mt-2">
                    <FormField
                      control={form.control}
                      name="rightsClaim.partialRights"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Indicate part(s)/role(s)"
                              className="w-full"
                              disabled={
                                form.watch(
                                  "rightsClaim.isClaimingEntireWork"
                                ) === "YES"
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 min-w-[200px] justify-end">
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">NO</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("rightsClaim.isClaimingEntireWork") === "NO"
                      }
                      onCheckedChange={() => {
                        form.setValue("rightsClaim.isClaimingEntireWork", "NO");
                        // Enable input field when NO is selected
                        form.setValue("rightsClaim.partialRights", "");
                      }}
                    />
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormLabel className="font-normal">YES</FormLabel>
                    <Checkbox
                      checked={
                        form.watch("rightsClaim.isClaimingEntireWork") === "YES"
                      }
                      onCheckedChange={() => {
                        form.setValue(
                          "rightsClaim.isClaimingEntireWork",
                          "YES"
                        );
                        // Clear and disable input field when YES is selected
                        form.setValue("rightsClaim.partialRights", "");
                      }}
                    />
                  </FormItem>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
