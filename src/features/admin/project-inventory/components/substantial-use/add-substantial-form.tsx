"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash, CalendarIcon } from "lucide-react";
import { SubstantialUseFormType } from "../../schemas/substantial-use";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { substantialUseFormSchema } from "../../schemas/substantial-use";
import { useEffect, useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface AddSubstantialFormProps {
  onSubmit: (data: SubstantialUseFormType) => void;
  initialData?: Partial<SubstantialUseFormType>;
  isEditing?: boolean;
}

// Helper to parse string JSON if needed
const parseJsonField = (field: any) => {
  if (!field) return undefined;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.error("Error parsing JSON field:", e);
      return undefined;
    }
  }
  return field;
};

export function AddSubstantialForm({
  onSubmit,
  initialData,
  isEditing = false,
}: AddSubstantialFormProps) {
  // Parse JSON fields if they're strings
  const parsedLabFacilities = parseJsonField(initialData?.laboratoryFacilities);
  const parsedFundingResources = parseJsonField(initialData?.fundingResources);

  // Initialize the form with initial data if provided
  const form = useForm<SubstantialUseFormType>({
    resolver: zodResolver(substantialUseFormSchema),
    defaultValues: {
      researchTitle: initialData?.researchTitle || "",
      applicants: initialData?.applicants || [],
      laboratoryFacilities: parsedLabFacilities || {
        experimentalApparatus: false,
        labInstruments: false,
        dataAnalysisTools: false,
        technicalSupport: false,
        farmMachineShop: false,
        specializedSoftware: { checked: false, specification: "" },
        other: { checked: false, specification: "" },
      },
      fundingResources: parsedFundingResources || {
        personalFunds: false,
        grantsAndWages: false,
        scholarships: false,
        industryPartnerships: false,
        collaboration: false,
        other: { checked: false, specification: "" },
      },
      remarks: initialData?.remarks || "",
      status: initialData?.status || "draft",
      userId: initialData?.userId,
      applicationId: initialData?.applicationId,
    },
  });

  // Set up field array for applicants
  const applicantsFieldArray = useFieldArray({
    control: form.control,
    name: "applicants",
  });

  // Form submission handler
  const handleSubmit = (data: SubstantialUseFormType) => {
    // Make sure laboratoryFacilities and fundingResources are properly serialized
    if (typeof data.laboratoryFacilities === "string") {
      try {
        data.laboratoryFacilities = JSON.parse(
          data.laboratoryFacilities as string
        );
      } catch (e) {
        console.error("Error parsing laboratoryFacilities:", e);
      }
    }

    if (typeof data.fundingResources === "string") {
      try {
        data.fundingResources = JSON.parse(data.fundingResources as string);
      } catch (e) {
        console.error("Error parsing fundingResources:", e);
      }
    }

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="researchTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Research Title*</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormDescription>
                  Add any additional notes or remarks about this research.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Applicants Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Applicants</h3>

          <div className="space-y-4">
            {applicantsFieldArray.fields.map((field, index) => (
              <Card key={field.id} className="overflow-visible">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name={`applicants.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`applicants.${index}.middleInitial`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Initial</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`applicants.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`applicants.${index}.date`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
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
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(date ? date.toISOString() : "")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => applicantsFieldArray.remove(index)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove Applicant
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                applicantsFieldArray.append({
                  firstName: "",
                  lastName: "",
                  middleInitial: "",
                  date: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Applicant
            </Button>
          </div>
        </div>

        {/* Laboratory Facilities Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Laboratory Facilities</h3>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="laboratoryFacilities.experimentalApparatus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Experimental Apparatus</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="laboratoryFacilities.labInstruments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Laboratory Instruments</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="laboratoryFacilities.dataAnalysisTools"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Data Analysis Tools</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="laboratoryFacilities.technicalSupport"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Technical Support</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="laboratoryFacilities.farmMachineShop"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Farm Machine Shop</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="laboratoryFacilities.specializedSoftware.checked"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Specialized Software</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch(
                      "laboratoryFacilities.specializedSoftware.checked"
                    ) && (
                      <FormField
                        control={form.control}
                        name="laboratoryFacilities.specializedSoftware.specification"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Specify software"
                                className="ml-7"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="laboratoryFacilities.other.checked"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Other Facilities</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("laboratoryFacilities.other.checked") && (
                      <FormField
                        control={form.control}
                        name="laboratoryFacilities.other.specification"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Specify other facilities"
                                className="ml-7"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Funding Resources Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Funding Resources</h3>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="fundingResources.personalFunds"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Personal Funds</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundingResources.grantsAndWages"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Grants and Wages</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundingResources.scholarships"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Scholarships</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundingResources.industryPartnerships"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Industry Partnerships</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fundingResources.collaboration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Collaboration</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="fundingResources.other.checked"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Other Funding Sources</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch("fundingResources.other.checked") && (
                      <FormField
                        control={form.control}
                        name="fundingResources.other.specification"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Specify other funding sources"
                                className="ml-7"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Status</h3>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            {isEditing ? "Update Record" : "Create Record"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
