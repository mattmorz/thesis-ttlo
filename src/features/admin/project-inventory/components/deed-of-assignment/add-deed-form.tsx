import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DeedOfAssignmentType,
  CreatorType,
} from "../../schemas/deed-of-assignment";
import { Loader2, Trash2, PlusCircle } from "lucide-react";

interface AddDeedFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: DeedOfAssignmentType;
  isEditing?: boolean;
  isLoading?: boolean;
}

// Zod schema for validation
const creatorSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  middleInitial: z.string().optional(),
});

const formSchema = z.object({
  researchTitle: z.string().min(2, { message: "Research title is required" }),
  creators: z
    .array(creatorSchema)
    .min(1, { message: "At least one creator is required" }),
  creatorAddress: z.string().optional(),
  assigneeName: z.string().min(1, { message: "Assignee name is required" }),
  assigneeRepresentative: z
    .string()
    .min(1, { message: "Assignee representative is required" }),
  day: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  assigneeId: z.string().optional(),
  assigneeDate: z.string().optional(),
  assigneePlace: z.string().min(1, { message: "Assignee place is required" }),
  assignorId: z.string().optional(),
  assignorDate: z.string().optional(),
  assignorPlace: z.string().min(1, { message: "Assignor place is required" }),
  status: z.string().optional(),
});

export function AddDeedForm({
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
}: AddDeedFormProps) {
  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      researchTitle: initialData?.researchTitle || "",
      creators:
        initialData?.creators &&
        Array.isArray(initialData.creators) &&
        initialData.creators.length > 0
          ? initialData.creators
          : [{ firstName: "", lastName: "", middleInitial: "" }],
      creatorAddress: initialData?.creatorAddress || "",
      assigneeName: initialData?.assigneeName || "CARAGA STATE UNIVERSITY",
      assigneeRepresentative:
        initialData?.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
      day: initialData?.day || "",
      month: initialData?.month || "",
      year: initialData?.year || "",
      assigneeId: initialData?.assigneeId || "M98 – 009",
      assigneeDate: initialData?.assigneeDate || "",
      assigneePlace: initialData?.assigneePlace || "Butuan City",
      assignorId: initialData?.assignorId || "",
      assignorDate: initialData?.assignorDate || "",
      assignorPlace: initialData?.assignorPlace || "Butuan City",
      status: initialData?.status || "draft",
    },
  });

  // Status options
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "pending_revision", label: "Needs Revision" },
  ];

  // Month options
  const monthOptions = [
    { value: "January", label: "January" },
    { value: "February", label: "February" },
    { value: "March", label: "March" },
    { value: "April", label: "April" },
    { value: "May", label: "May" },
    { value: "June", label: "June" },
    { value: "July", label: "July" },
    { value: "August", label: "August" },
    { value: "September", label: "September" },
    { value: "October", label: "October" },
    { value: "November", label: "November" },
    { value: "December", label: "December" },
  ];

  // Handle form submission
  async function handleSubmit(data: z.infer<typeof formSchema>) {
    try {
      await onSubmit({
        ...data,
        userId: initialData?.userId,
        applicationId: initialData?.applicationId,
      });
    } catch (error) {
      console.error("Error submitting deed of assignment form:", error);
    }
  }

  // Function to add a new creator
  const addCreator = () => {
    const creators = form.getValues("creators") || [];
    form.setValue("creators", [
      ...creators,
      { firstName: "", middleInitial: "", lastName: "" },
    ]);
  };

  // Function to remove a creator
  const removeCreator = (index: number) => {
    const creators = form.getValues("creators") || [];
    if (creators.length > 1) {
      form.setValue(
        "creators",
        creators.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Research Title */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="researchTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter research title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Creators Section */}
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-md font-medium">Creators</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCreator}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Creator
              </Button>
            </div>
            {form.getValues("creators")?.map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 mb-3 items-start"
              >
                <div className="col-span-5">
                  <FormField
                    control={form.control}
                    name={`creators.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name={`creators.${index}.middleInitial`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Middle Initial
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="M.I." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`creators.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 flex items-end pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCreator(index)}
                    disabled={form.getValues("creators")?.length === 1}
                    title="Remove Creator"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Creator Address */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="creatorAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creator Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter creator address"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignee Name */}
          <div>
            <FormField
              control={form.control}
              name="assigneeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignee name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignee Representative */}
          <div>
            <FormField
              control={form.control}
              name="assigneeRepresentative"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Representative</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter representative name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignment Date (Day, Month, Year) */}
          <div>
            <FormLabel className="block mb-2">Assignment Date</FormLabel>
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="day"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Day (e.g., 1st)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {monthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Assignee ID */}
          <div>
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignee ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignee Date */}
          <div>
            <FormField
              control={form.control}
              name="assigneeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Date</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="Select date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignee Place */}
          <div>
            <FormField
              control={form.control}
              name="assigneePlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee Place</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter place" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignor ID */}
          <div>
            <FormField
              control={form.control}
              name="assignorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignor ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter assignor ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignor Date */}
          <div>
            <FormField
              control={form.control}
              name="assignorDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignor Date</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="Select date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Assignor Place */}
          <div>
            <FormField
              control={form.control}
              name="assignorPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignor Place</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter place" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status - Only show in edit mode or for admins */}
          {isEditing && (
            <div>
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
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
