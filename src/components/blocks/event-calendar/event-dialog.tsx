"use client";

import { useEffect } from "react";
import { format, addHours, parseISO } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Event } from "@/components/blocks/event-calendar/types";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DatePicker,
  Switch,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// Form validation schema
const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.string().min(1, "End date is required"),
    endTime: z.string().min(1, "End time is required"),
    isAllDay: z.boolean().default(false),
    eventType: z.enum(["meeting", "phase", "task", "other"] as const),
    status: z.enum([
      "in-progress",
      "completed",
      "cancelled",
      "scheduled",
    ] as const),
    otherEventType: z.string().optional(),
    projectId: z
      .union([z.string().uuid(), z.literal("undefined")])
      .default("undefined")
      .optional(),
  })
  .refine(
    (data) =>
      data.eventType !== "other" ||
      (data.otherEventType && data.otherEventType.trim() !== ""),
    {
      message: "Event type description is required when 'Other' is selected",
      path: ["otherEventType"], // This makes the error appear on the otherEventType field
    }
  )
  .superRefine((data, ctx) => {
    if (data.eventType === "phase" || data.eventType === "task") {
      if (!data.projectId || data.projectId === "undefined") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must assign a project if event type is phase or task",
          path: ["projectId"],
        });
      }
    }
  });

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onDelete: (eventId: string) => void;
  event: Event | null;
  currentDate: Date;
  isSubmitting?: boolean;
}

export function EventDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  currentDate,
  isSubmitting = false,
}: EventDialogProps) {
  const { data: projects, isPending: isLoadingProjects } =
    trpc.projects.get.useQuery();

  // Initialize the form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      isAllDay: false,
      eventType: "meeting",
      status: "scheduled",
      otherEventType: "",
      projectId: "undefined",
    },
  });

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode - populate form with event data
        const startDateTime =
          typeof event.startDate === "string"
            ? parseISO(event.startDate)
            : event.startDate;
        const endDateTime =
          typeof event.endDate === "string"
            ? parseISO(event.endDate)
            : event.endDate;

        form.reset({
          title: event.title,
          description: event.description || "",
          startDate: format(startDateTime, "yyyy-MM-dd"),
          startTime: format(startDateTime, "HH:mm"),
          endDate: format(endDateTime, "yyyy-MM-dd"),
          endTime: format(endDateTime, "HH:mm"),
          isAllDay: event.isAllDay || false,
          eventType: event.eventType,
          status: event.status,
          otherEventType:
            event.otherEventType === null ? "" : event.otherEventType,
          projectId: event.projectId === null ? "undefined" : event.projectId,
        });
      } else {
        // Create mode - set default values
        const defaultStart = new Date(currentDate);
        defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0); // Next hour, 0 minutes
        const defaultEnd = addHours(defaultStart, 1);

        form.reset({
          title: "",
          description: "",
          startDate: format(defaultStart, "yyyy-MM-dd"),
          startTime: format(defaultStart, "HH:mm"),
          endDate: format(defaultEnd, "yyyy-MM-dd"),
          endTime: format(defaultEnd, "HH:mm"),
          isAllDay: false,
          eventType: "meeting",
          status: "scheduled",
          otherEventType: "",
          projectId: "undefined",
        });
      }
    }
  }, [isOpen, event, currentDate, form]);

  // Handle form submission
  const onSubmit = (data: EventFormValues) => {
    // Combine date and time
    const startDateTime = new Date(`${data.startDate}T${data.startTime}:00`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime}:00`);

    // Validate dates
    if (endDateTime < startDateTime) {
      form.setError("endDate", {
        message: "End date cannot be before start date",
      });
      return;
    }

    const newEvent: Event = {
      id: event?.id || crypto.randomUUID(),
      title: data.title,
      description: data.description,
      startDate: startDateTime,
      endDate: endDateTime,
      isAllDay: data.isAllDay,
      eventType: data.eventType,
      status: data.status,
      otherEventType: data.otherEventType,
      projectId: data.projectId,
    };

    onSave(newEvent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle> {event ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="eventType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="meeting">
                                    Meeting
                                  </SelectItem>
                                  <SelectItem value="phase">Phase</SelectItem>
                                  <SelectItem value="task">Task</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {form.watch("eventType") === "other" && (
                          <FormField
                            control={form.control}
                            name="otherEventType"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter event type"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isSubmitting}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scheduled">
                                  Scheduled
                                </SelectItem>
                                <SelectItem value="in-progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelled
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!isLoadingProjects && (
                        <FormField
                          control={form.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Project</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isSubmitting}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="undefined">
                                    Not Associated
                                  </SelectItem>
                                  {projects?.map((project) => (
                                    <SelectItem
                                      key={project.id}
                                      value={project.id}
                                    >
                                      {project.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-[1fr,0.5fr] gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem
                            className={cn(
                              form.watch("isAllDay") && "col-span-2"
                            )}
                          >
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date()
                                } // Convert string to Date, with fallback
                                onSelect={(date) =>
                                  field.onChange(
                                    format(date ?? new Date(), "yyyy-MM-dd")
                                  )
                                } // Convert Date back to string
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem
                            className={cn(form.watch("isAllDay") && "hidden")}
                          >
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={
                                  form.watch("isAllDay") || isSubmitting
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem
                            className={cn(
                              form.watch("isAllDay") && "col-span-2"
                            )}
                          >
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : new Date()
                                } // Convert string to Date, with fallback
                                onSelect={(date) =>
                                  field.onChange(
                                    format(date ?? new Date(), "yyyy-MM-dd")
                                  )
                                } // Convert Date back to string
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem
                            className={cn(form.watch("isAllDay") && "hidden")}
                          >
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                disabled={
                                  form.watch("isAllDay") || isSubmitting
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="isAllDay"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>All day</FormLabel>
                            <FormDescription>
                              Event will last the entire day
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between border-t px-6 py-4">
          {event && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDelete(event.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          )}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={isSubmitting}
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
