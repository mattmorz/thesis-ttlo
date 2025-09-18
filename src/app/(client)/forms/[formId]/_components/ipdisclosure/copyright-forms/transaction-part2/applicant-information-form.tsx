"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useRef, useCallback, useState } from "react";
import debounce from "lodash/debounce";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";

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
  // Personal Information
  surname: z.string().min(1, "Surname is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),

  // Company Information
  companyName: z.string().optional(),
  entityType: z.object({
    smallEntity: z.boolean().default(false),
    bigEntity: z.boolean().default(false),
  }),

  // Personal Details
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  civilStatus: z.enum([
    "Single",
    "Married",
    "Widowed",
    "Divorced",
    "Separated",
  ]),
  sex: z.enum(["Male", "Female"]),

  // Location Information
  nationality: z.string().min(1, "Nationality is required"),
  countryOfResidence: z.string().min(1, "Country of residence is required"),
  address: z.string().min(1, "Address is required"),
  municipalityCity: z.string().min(1, "Municipality/City is required"),
  provinceState: z.string().min(1, "Province/State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),

  // Contact Information
  mobileNumber: z.string().min(1, "Mobile/Contact number is required"),
  emailAddress: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

// Add store for data persistence
interface ApplicantFormState {
  data: any;
  setData: (data: any) => void;
}

// Export the store so it can be imported by other components
export const useApplicantFormStore = create<ApplicantFormState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "applicant-form-storage",
    }
  )
);

export function ApplicantInformationForm({ parentData }: { parentData?: any }) {
  const { data, setData } = useApplicantFormStore();
  const formRef = useRef(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surname: data?.surname || "",
      firstName: data?.firstName || "",
      middleName: data?.middleName || "",
      companyName: data?.companyName || "",
      entityType: {
        smallEntity: data?.entityType?.smallEntity || false,
        bigEntity: data?.entityType?.bigEntity || false,
      },
      dateOfBirth: data?.dateOfBirth || "",
      civilStatus: data?.civilStatus || "Single",
      sex: data?.sex || "Male",
      nationality: data?.nationality || "",
      countryOfResidence: data?.countryOfResidence || "",
      address: data?.address || "",
      municipalityCity: data?.municipalityCity || "",
      provinceState: data?.provinceState || "",
      zipCode: data?.zipCode || "",
      mobileNumber: data?.mobileNumber || "",
      emailAddress: data?.emailAddress || "",
    },
  });

  // Load data from store when component mounts or when parent data changes
  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  // Load parent data when it changes (e.g., from parent transaction form)
  useEffect(() => {
    if (parentData && parentData.applicant_info) {
      console.log(
        "Receiving parent data in applicant form:",
        parentData.applicant_info
      );

      // Create a complete data object with fallbacks for all fields
      const completeData = {
        surname:
          parentData.applicant_info.surname ||
          parentData.applicant_info.personalInfo?.surname ||
          "",
        firstName:
          parentData.applicant_info.firstName ||
          parentData.applicant_info.personalInfo?.firstName ||
          "",
        middleName:
          parentData.applicant_info.middleName ||
          parentData.applicant_info.personalInfo?.middleName ||
          "",
        companyName:
          parentData.applicant_info.companyName ||
          parentData.applicant_info.personalInfo?.companyName ||
          "",
        entityType: {
          smallEntity:
            parentData.applicant_info.entityType?.smallEntity || false,
          bigEntity: parentData.applicant_info.entityType?.bigEntity || false,
        },
        dateOfBirth:
          parentData.applicant_info.dateOfBirth ||
          parentData.applicant_info.personalInfo?.dateOfBirth ||
          "",
        civilStatus:
          parentData.applicant_info.civilStatus ||
          parentData.applicant_info.personalInfo?.civilStatus ||
          "Single",
        sex:
          parentData.applicant_info.sex ||
          parentData.applicant_info.personalInfo?.sex ||
          "Male",
        nationality:
          parentData.applicant_info.nationality ||
          parentData.applicant_info.personalInfo?.nationality ||
          "",
        countryOfResidence:
          parentData.applicant_info.countryOfResidence ||
          parentData.applicant_info.personalInfo?.countryOfResidence ||
          "",
        address:
          parentData.applicant_info.address ||
          parentData.applicant_info.personalInfo?.address ||
          "",
        municipalityCity:
          parentData.applicant_info.municipalityCity ||
          parentData.applicant_info.personalInfo?.municipalityCity ||
          "",
        provinceState:
          parentData.applicant_info.provinceState ||
          parentData.applicant_info.personalInfo?.provinceState ||
          "",
        zipCode:
          parentData.applicant_info.zipCode ||
          parentData.applicant_info.personalInfo?.zipCode ||
          "",
        mobileNumber:
          parentData.applicant_info.mobileNumber ||
          parentData.applicant_info.personalInfo?.mobileNumber ||
          "",
        emailAddress:
          parentData.applicant_info.emailAddress ||
          parentData.applicant_info.personalInfo?.emailAddress ||
          "",
      };

      form.reset(completeData);
      setData(completeData);
    }
  }, [parentData, form, setData]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((formData: FormValues) => {
      if (formData && JSON.stringify(formData) !== JSON.stringify(data)) {
        setData(formData);
      }
    }, 1000),
    [data, setData]
  );

  // Watch form changes with debounce
  useEffect(() => {
    const subscription = form.watch((formValue) => {
      if (formValue && Object.keys(formValue).length > 0) {
        debouncedSave(formValue as FormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form, debouncedSave]);

  // Form submission handler
  const onSubmit = (formData: FormValues) => {
    setData(formData);
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Name Fields */}
              <FormField
                control={form.control}
                name="firstName"
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
                name="middleName"
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

              <FormField
                control={form.control}
                name="surname"
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
            </div>

            {/* Company Information */}
            <div className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name of Company / Corporation / Government Agency / School
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[80px] resize-y"
                        placeholder="Enter complete company/organization name..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="entityType.smallEntity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="text-green-600 border-green-600"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Small Entity (Assets less than 100M)
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entityType.bigEntity"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="text-green-600 border-green-600"
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Big Entity (Assets more than 100M)
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="mt-6 grid grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
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
                name="civilStatus"
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
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
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
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information */}
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nationality"
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
                  name="countryOfResidence"
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address (Complete Street info, village, subdivision,
                      barangay)
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

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="municipalityCity"
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
                  name="provinceState"
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
                  name="zipCode"
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
            <div className="mt-6 grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile/Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
