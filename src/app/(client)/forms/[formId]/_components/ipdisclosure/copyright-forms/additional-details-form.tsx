"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import {
  eachYearOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
} from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

const formSchema = z.object({
  // Work Information
  titleOfWork: z.string().min(1, "Title of work is required"),
  natureOfWork: z.string().min(1, "Nature of work is required"),
  dateOfCreation: z.string().min(1, "Date of creation is required"),
  dateOfPublication: z.string().optional(),
  placeOfPublication: z.string().optional(),

  // Additional Work Details
  mediumOfExpression: z.string().min(1, "Medium of expression is required"),
  languageUsed: z.string().min(1, "Language used is required"),
  isDerivativeWork: z.boolean().default(false),
  originalWorkTitle: z.string().optional(),
  originalWorkAuthor: z.string().optional(),
  modifications: z.string().optional(),

  // Special Circumstances
  isAnonymousWork: z.boolean().default(false),
  isPseudonymousWork: z.boolean().default(false),
  pseudonym: z.string().optional(),
  isPosthumousWork: z.boolean().default(false),
  dateOfAuthorDeath: z.string().optional(),

  // Additional Notes
  specialRemarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define starting and ending dates for the calendar picker
const now = new Date();
const startDate = new Date(now.getFullYear() - 30, 0, 1); // 30 years ago
const endDate = new Date(now.getFullYear() + 1, 11, 31); // 1 year in future

export function AdditionalDetailsForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isDerivativeWork: false,
      isAnonymousWork: false,
      isPseudonymousWork: false,
      isPosthumousWork: false,
    },
  });

  function onSubmit(data: FormValues) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Work Information */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="titleOfWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title of Work</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter the title of your work"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="natureOfWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Work</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nature of work" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="literary">Literary Work</SelectItem>
                        <SelectItem value="musical">Musical Work</SelectItem>
                        <SelectItem value="artistic">Artistic Work</SelectItem>
                        <SelectItem value="audiovisual">
                          Audiovisual Work
                        </SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="sound">Sound Recording</SelectItem>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
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
                        <FormLabel>Date of Creation</FormLabel>
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
                  name="dateOfPublication"
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
                        <FormLabel>
                          Date of Publication (if published)
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
              </div>

              <FormField
                control={form.control}
                name="placeOfPublication"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place of Publication (if published)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter place of publication"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Work Details */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mediumOfExpression"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medium of Expression</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Digital, Print, Audio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languageUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language Used</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter language(s) used"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isDerivativeWork"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is this a derivative work?</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "true")
                      }
                      defaultValue={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("isDerivativeWork") && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="originalWorkTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Work Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter original work title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalWorkAuthor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Work Author</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter original author name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modifications Made</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the modifications made to the original work"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Special Circumstances */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isAnonymousWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anonymous Work</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        defaultValue={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yes or no" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPseudonymousWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pseudonymous Work</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        defaultValue={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yes or no" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("isPseudonymousWork") && (
                <FormField
                  control={form.control}
                  name="pseudonym"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pseudonym Used</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter pseudonym" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isPosthumousWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posthumous Work</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        defaultValue={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yes or no" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("isPosthumousWork") && (
                  <FormField
                    control={form.control}
                    name="dateOfAuthorDeath"
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
                          <FormLabel>Date of Author's Death</FormLabel>
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="specialRemarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any additional notes or special remarks"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
