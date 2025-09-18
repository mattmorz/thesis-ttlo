"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Plus, X, CalendarIcon, ChevronDown } from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
const startDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
const endDate = new Date(now.getFullYear(), 11, 31); // Current year

const formSchema = z.object({
  isSameAsApplicant: z.boolean(),
  authors: z.array(
    z.object({
      surname: z.string().min(1, "Surname is required"),
      firstName: z.string().min(1, "First name is required"),
      middleName: z.string().optional(),
      dateOfBirth: z.string().min(1, "Date of birth is required"),
      civilStatus: z.string().min(1, "Civil status is required"),
      sex: z.string().min(1, "Sex is required"),
      nationality: z.string().min(1, "Nationality is required"),
      countryOfResidence: z.string().min(1, "Country of residence is required"),
      address: z.string().min(1, "Address is required"),
      municipalityCity: z.string().min(1, "Municipality/City is required"),
      provinceState: z.string().min(1, "Province/State is required"),
      zipCode: z.string().min(1, "ZIP code is required"),
      mobileNumber: z.string().min(1, "Mobile number is required"),
      emailAddress: z.string().email("Invalid email address"),
    })
  ),
});

// Add store for data persistence
interface AuthorFormState {
  data: any;
  setData: (data: any) => void;
}

// Export the store so it can be imported by other components
export const useAuthorFormStore = create<AuthorFormState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "author-form-storage",
    }
  )
);

export function AuthorCreatorForm() {
  const { data, setData } = useAuthorFormStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: data || {
      isSameAsApplicant: false,
      authors: [{}],
    },
  });

  // Add effect to log initial state for debugging
  useEffect(() => {
    console.log("[AuthorCreatorForm] Component mounted, initial state:", {
      isSameAsApplicant: form.getValues().isSameAsApplicant,
      hasAuthors:
        Array.isArray(form.getValues().authors) &&
        form.getValues().authors.length > 0,
      storeData: data,
    });

    // If isSameAsApplicant is true on mount, ensure form has proper empty state
    if (form.getValues().isSameAsApplicant === true) {
      console.log(
        "[AuthorCreatorForm] Found isSameAsApplicant=true on mount, ensuring clean state"
      );

      // Reset to clean state with just the flag
      form.reset({
        isSameAsApplicant: true,
        authors: [],
      });

      // Update store with clean data
      setData({
        isSameAsApplicant: true,
        authors: [],
      });
    }
  }, []);

  // Add effect to load persisted data
  useEffect(() => {
    if (data) {
      // If data.isSameAsApplicant is true, make sure we don't load any author data
      if (data.isSameAsApplicant === true) {
        console.log(
          "[AuthorCreatorForm] Loading data with isSameAsApplicant=true, ensuring clean state"
        );
        form.reset({
          isSameAsApplicant: true,
          authors: [],
        });
      } else {
        // Normal data loading
        form.reset(data);
      }
    }
  }, [data, form]);

  // Add effect to save data on form changes
  useEffect(() => {
    // Use a more selective approach to watching form changes
    const subscription = form.watch((value) => {
      // Don't update the store if the data is the same
      if (
        value &&
        Object.keys(value).length > 0 &&
        JSON.stringify(value) !== JSON.stringify(data)
      ) {
        // Use a timeout to debounce frequent updates
        const timeoutId = setTimeout(() => {
          // Ensure consistent field naming
          const updatedData = {
            ...value,
            isSameAsApplicant: value.isSameAsApplicant,
          };

          setData(updatedData);
        }, 500);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, setData, data]);

  // Add an effect to reset form data when isSameAsApplicant changes
  useEffect(() => {
    const isSameAsApplicantValue = form.watch("isSameAsApplicant");

    // Convert to explicit boolean to avoid undefined/null issues
    const isSameAsApplicant = Boolean(isSameAsApplicantValue);

    // Log the current state
    console.log(
      `[Effect] isSameAsApplicant changed to: ${
        isSameAsApplicant ? "CHECKED" : "UNCHECKED"
      }`
    );

    // If checked, we need to reset the form to clear any author data
    if (isSameAsApplicant) {
      // Reset the form with only the isSameAsApplicant flag
      form.reset({
        isSameAsApplicant: true,
        authors: [],
      });

      // Create clean data object for the store
      const cleanData = {
        isSameAsApplicant: true,
        authors: [],
      };

      // Update the store
      setData(cleanData);

      console.log(
        "[Effect] Reset form and store with clean data - isSameAsApplicant is true"
      );
    }
  }, [form.watch("isSameAsApplicant")]);

  // Add an effect to notify parent component when isSameAsApplicant changes
  useEffect(() => {
    const isSameAsApplicantValue = form.watch("isSameAsApplicant");

    // Convert to explicit boolean to avoid undefined/null issues
    const isSameAsApplicant = Boolean(isSameAsApplicantValue);

    // Get current data safely
    const currentData = data || {};

    // Only update if the value actually changed
    if (currentData.isSameAsApplicant !== isSameAsApplicant) {
      console.log(
        `AuthorCreatorForm effect: isSameAsApplicant changed to ${isSameAsApplicant}`
      );

      const updatedData = {
        ...currentData,
        isSameAsApplicant,
      };

      // If it's now checked, clear any author data
      if (isSameAsApplicant) {
        updatedData.authors = [];
      }

      // Immediately update the store
      setData(updatedData);
    }
  }, [form.watch("isSameAsApplicant"), data, setData]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "authors",
  });

  const handleAddAuthor = () => {
    append({
      surname: "",
      firstName: "",
      middleName: "",
      dateOfBirth: "",
      civilStatus: "",
      sex: "",
      nationality: "",
      countryOfResidence: "",
      address: "",
      municipalityCity: "",
      provinceState: "",
      zipCode: "",
      mobileNumber: "",
      emailAddress: "",
    });
  };

  // Update form submission to save data and force correct state
  const onSubmit = (formData: z.infer<typeof formSchema>) => {
    console.log("[AuthorCreatorForm] Form submitted with data:", {
      isSameAsApplicant: formData.isSameAsApplicant,
      hasAuthors:
        Array.isArray(formData.authors) && formData.authors.length > 0,
      formData: formData,
    });

    // If isSameAsApplicant is true, ensure we only save that flag
    if (formData.isSameAsApplicant === true) {
      // Create clean data with just the flag
      const cleanData = {
        isSameAsApplicant: true,
        authors: [], // Empty authors array
      };

      // Force update the store DIRECTLY to ensure consistency
      useAuthorFormStore.setState({ data: cleanData });

      console.log(
        "[AuthorCreatorForm] Setting clean data on submit with isSameAsApplicant=true:",
        useAuthorFormStore.getState().data
      );
    } else {
      // For non-checked state, update normally
      useAuthorFormStore.setState({ data: formData });
      console.log(
        "[AuthorCreatorForm] Setting regular data on submit with isSameAsApplicant=false:",
        formData
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <AlertDescription>
            Skip this if same as applicant info tab. Include all author(s) /
            creator(s) using the supplemental sheet(s), if applicable
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="isSameAsApplicant"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 mb-6">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        // Convert to explicit boolean to avoid any type issues
                        const isChecked = checked === true;

                        // Debug check
                        console.log(
                          "[CHECKBOX DEBUG] Checkbox changed to:",
                          isChecked,
                          "Previous state:",
                          field.value
                        );

                        // Update the form field - use setValue to update immediately
                        form.setValue("isSameAsApplicant", isChecked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });

                        // Log current change clearly
                        console.log(
                          `AuthorCreatorForm: Checkbox changed to ${
                            isChecked ? "CHECKED" : "UNCHECKED"
                          }`
                        );

                        if (isChecked) {
                          // When checked, create a clean object with ONLY the flag
                          const cleanData = {
                            isSameAsApplicant: true,
                            authors: [], // Empty authors array
                          };

                          // First reset the form completely - no debouncing
                          form.reset(cleanData, { keepDefaultValues: false });

                          // Then update the store DIRECTLY with the clean data
                          // Use setState directly to bypass any hydration issues
                          useAuthorFormStore.setState({ data: cleanData });

                          // Verify store update
                          console.log(
                            "AuthorCreatorForm: Checkbox checked, store and form state updated:",
                            {
                              formState: form.getValues(),
                              storeState: useAuthorFormStore.getState().data,
                            }
                          );
                        } else {
                          // When unchecked, start with a fresh form with empty authors array
                          const uncheckedData = {
                            isSameAsApplicant: false,
                            authors: [{}], // Start with one empty author
                          };

                          // Reset form with empty author
                          form.reset(uncheckedData, {
                            keepDefaultValues: false,
                          });

                          // Update store DIRECTLY
                          useAuthorFormStore.setState({ data: uncheckedData });

                          console.log(
                            "AuthorCreatorForm: Checkbox unchecked, reset with empty author and store updated:",
                            {
                              formState: form.getValues(),
                              storeState: useAuthorFormStore.getState().data,
                            }
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Same as Applicant Information</FormLabel>
                    <FormDescription>
                      Check this if the author/creator information is the same
                      as the applicant
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!form.watch("isSameAsApplicant") && (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-6">
                    {/* Author Name Fields */}
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`authors.${index}.surname`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surname</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`authors.${index}.firstName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`authors.${index}.middleName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Middle Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Personal Details */}
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`authors.${index}.dateOfBirth`}
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
                              <FormLabel>Date of Birth</FormLabel>
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
                                                            setIsYearView(
                                                              false
                                                            );
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
                                            date
                                              ? format(date, "yyyy-MM-dd")
                                              : ""
                                          );
                                        }}
                                        month={month}
                                        onMonthChange={setMonth}
                                        className="border-none p-0"
                                        classNames={{
                                          day_selected:
                                            "bg-[#1B5E20] text-white hover:bg-[#1B5E20]/90",
                                          day_today:
                                            "bg-slate-100 text-slate-900",
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
                        name={`authors.${index}.civilStatus`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Civil Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married</SelectItem>
                                <SelectItem value="widowed">Widowed</SelectItem>
                                <SelectItem value="divorced">
                                  Divorced
                                </SelectItem>
                                <SelectItem value="separated">
                                  Separated
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`authors.${index}.sex`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sex</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Location Information */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`authors.${index}.nationality`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`authors.${index}.countryOfResidence`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country of Residence</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`authors.${index}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Address (Complete Street info, village,
                              subdivision, barangay)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-[100px] resize-y"
                                placeholder="Enter complete address details..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`authors.${index}.municipalityCity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Municipality/City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`authors.${index}.provinceState`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province/State</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`authors.${index}.zipCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`authors.${index}.mobileNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`authors.${index}.emailAddress`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Author
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAuthor}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Author
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
