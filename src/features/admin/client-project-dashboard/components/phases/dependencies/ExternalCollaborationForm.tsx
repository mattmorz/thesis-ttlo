"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DatePicker, Label, Textarea } from "@/components/ui";
import { trpc } from "@/trpc/client";
import { ExternalCollaborationOutput } from "../../../types";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const formItemSchema = z.object({
  id: z.string().uuid(),
  officeName: z.string().min(1).min(1).max(100),
  task: z.string().min(1),
  contactPerson: z.string().min(1).min(1).max(100),
  status: z.string(),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  responseRequired: z.boolean().optional(),
  remarks: z.string().optional(),
  reminderType: z.string().optional(),
  reminderDay: z.string().optional(),
  reminderTime: z
    .string()
    .regex(
      /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Please enter a valid time in HH:mm format"
    )
    .optional(),
  fileName: z
    .string()
    .nullable()
    .refine((val) => val !== null, {
      message: "File attachment is required",
    }),
  fileSize: z.number().nullable(),
  fileType: z.string().nullable(),
});

const formSchema = z.object({
  items: z.array(formItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  phaseId: string;
  applicationId: string;
  onClose?: () => void;
  initialData?: ExternalCollaborationOutput[];
  isArchived?: boolean;
}

export function ExternalCollaborationForm({
  phaseId,
  applicationId,
  onClose,
  initialData = [],
  isArchived,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);

  // Track original, modified, and deleted items
  const [originalItems] = useState<Record<string, ExternalCollaborationOutput>>(
    () => {
      const originals: Record<string, ExternalCollaborationOutput> = {};
      initialData.forEach((item) => {
        originals[item.collaborationId] = { ...item };
      });
      return originals;
    }
  );
  const [modifiedItemIds, setModifiedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set());
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const trpcUtil = trpc.useUtils();
  const { mutateAsync } =
    trpc.clientProjectDashboard.addUpdateDeleteExternalCollaboration.useMutation();

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: initialData.map((item) => ({
        id: item.collaborationId,
        officeName: item.officeName || "",
        task: item.task || "",
        contactPerson: item.contactPerson || "",
        status: item.status || "",
        dueDate: new Date(item.dueDate),
        responseRequired: item.responseRequired || false,
        remarks: item.remarks || "",
        reminderType: item.reminderType || "none",
        reminderDay: item.reminderDay || "",
        reminderTime: item.reminderTime
          ? item.reminderTime.substring(0, 5)
          : "12:00",
        fileName: item.fileName || undefined,
        fileSize: item.fileSize || undefined,
        fileType: item.fileType || undefined,
      })),
    },
  });

  // Use field array to manage multiple form items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Mark an item as modified
  const markAsModified = (id: string) => {
    // Skip if it's a new item (already tracked)
    if (newItemIds.has(id)) return;

    // Add to modified set if it's an existing item
    if (originalItems[id] && !modifiedItemIds.has(id)) {
      setModifiedItemIds((prev) => new Set(prev).add(id));
    }
  };

  // Add a new form item
  const addNewItem = () => {
    const id = crypto.randomUUID();
    setNewItemIds((prev) => new Set(prev).add(id));
    append({
      id,
      officeName: "",
      task: "",
      contactPerson: "",
      status: "",
      description: "",
      dueDate: new Date(),
      responseRequired: false,
      remarks: "",
      reminderType: "none",
      reminderDay: "mon",
      reminderTime: "12:00",
      fileName: "",
      fileSize: 0,
      fileType: "",
    });
  };

  // Handle item deletion
  const handleDelete = (index: number) => {
    const item = form.getValues().items[index];

    // If it's an existing item, add to deletedItemIds
    if (originalItems[item.id]) {
      setDeletedItemIds((prev) => new Set(prev).add(item.id));

      // Remove from modified if it was there
      if (modifiedItemIds.has(item.id)) {
        setModifiedItemIds((prev) => {
          const updated = new Set(prev);
          updated.delete(item.id);
          return updated;
        });
      }
    } else if (newItemIds.has(item.id)) {
      // Remove from new items if it was a new item
      setNewItemIds((prev) => {
        const updated = new Set(prev);
        updated.delete(item.id);
        return updated;
      });
    }

    remove(index);
  };

  // Get item status for display
  const getItemStatus = (id: string) => {
    if (newItemIds.has(id)) return "new";
    if (modifiedItemIds.has(id)) return "modified";
    return "existing";
  };

  // Prepare changes for submission
  const getChanges = (formData: FormValues) => {
    const itemsById = formData.items.reduce(
      (acc, item) => {
        acc[item.id] = {
          status: item.status || "pending", // Ensure status is never null
          task: item.task,
          officeName: item.officeName,
          contactPerson: item.contactPerson,
          dueDate: item.dueDate.toISOString(),
          description: item.description || "",
          remarks: item.remarks || "",
          fileName: item.fileName || "",
          fileSize: item.fileSize || 0,
          fileType: item.fileType || "",
          collaborationId: item.id,
          responseRequired: item.responseRequired || false,
          reminderType: item.reminderType || "none",
          reminderDay: item.reminderDay || "mon",
          reminderTime: item.reminderTime || "12:00",
        };
        return acc;
      },
      {} as Record<
        string,
        {
          status: string;
          task: string;
          officeName: string;
          contactPerson: string;
          dueDate: string;
          description: string;
          remarks: string;
          fileName: string;
          fileSize: number;
          fileType: string;
          collaborationId: string;
          responseRequired: boolean;
          reminderType: string;
          reminderDay: string;
          reminderTime: string;
        }
      >
    );

    const added = Array.from(newItemIds)
      .filter((id) => itemsById[id])
      .map((id) => itemsById[id]);

    const modified = Array.from(modifiedItemIds)
      .filter((id) => itemsById[id] && !deletedItemIds.has(id))
      .map((id) => itemsById[id]);

    return {
      added,
      modified,
      deleted: Array.from(deletedItemIds),
      phaseId,
    };
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      const changes = getChanges(data);
      console.log(changes);

      // Only proceed if there are changes
      if (
        changes.added.length ||
        changes.modified.length ||
        changes.deleted.length
      ) {
        const promise = mutateAsync(changes);
        toast.promise(promise, {
          loading: "Saving changes...",
          success: () => {
            trpcUtil.clientProjectDashboard.getExternalCollaborations.invalidate(
              phaseId
            );
            return "Changes saved successfully!";
          },
          error: "Failed to save changes",
        });
      } else {
        toast.info("No Changes", {
          description: "No changes were detected",
        });
        // onClose();
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setModifiedItemIds(new Set());
      setDeletedItemIds(new Set());
      setNewItemIds(new Set());
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (index: number, files: FileList) => {
    try {
      const file = files[0]; // Only take the first file
      if (!file) return;

      // Create form data for upload
      const formData = new FormData();
      formData.append("files", file);
      formData.append("projectId", applicationId);

      // Upload to your API endpoint
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      // Update form with uploaded file info
      form.setValue(`items.${index}.fileName`, file.name);
      form.setValue(`items.${index}.fileSize`, file.size);
      form.setValue(`items.${index}.fileType`, file.type);

      markAsModified(form.getValues().items[index].id);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          (data) => {
            console.log("Form is valid, submitting:", data);
            onSubmit(data);
          },
          (errors) => {
            console.log("Form validation failed:", errors);
          }
        )}
        className="space-y-6"
      >
        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="py-8 text-muted-foreground h-full min-h-96 flex items-center justify-center">
              <div>No items. Add a new one below.</div>
            </div>
          ) : (
            fields.map((field, index) => {
              const status = getItemStatus(field.id);

              return (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {status !== "existing" && (
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {status === "new" ? "New" : "Modified"}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.fileName`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Attachment</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                {field.value ? (
                                  <div className="flex items-center justify-between p-2 border rounded">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm truncate">
                                        {field.value}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        (
                                        {(
                                          form.getValues().items[index]
                                            .fileSize! / 1024
                                        ).toFixed(2)}{" "}
                                        KB)
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        form.setValue(
                                          `items.${index}.fileName`,
                                          ""
                                        );
                                        form.setValue(
                                          `items.${index}.fileSize`,
                                          0
                                        );
                                        form.setValue(
                                          `items.${index}.fileType`,
                                          ""
                                        );
                                        markAsModified(
                                          form.getValues().items[index].id
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Input
                                    type="file"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        handleFileUpload(index, e.target.files);
                                      }
                                    }}
                                    className="cursor-pointer"
                                    accept="application/pdf"
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.task`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Task</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter task name"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter a description"
                                className="resize-none"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.officeName`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Office Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter office name"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.contactPerson`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter contact person"
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.status`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                markAsModified(
                                  form.getValues().items[index].id
                                );
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                  Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.dueDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.responseRequired`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-4 rounded-lg border h-fit px-4 py-[0.325rem] mt-auto">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                                aria-readonly
                              />
                            </FormControl>
                            <FormLabel className="translate-y-[-3.7px] w-full">
                              Require response from external office
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.remarks`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any remarks"
                                className="resize-none"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.reminderType`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Reminder</FormLabel>
                            <FormControl>
                              <RadioGroup
                                className="gap-0 -space-y-px rounded-md shadow-xs"
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                                defaultValue={field.value}
                              >
                                {[
                                  ["none", "No Reminder", "Do not remind"],
                                  [
                                    "daily",
                                    "Daily Reminder",
                                    "Get reminded every day at a specific time",
                                  ],
                                  [
                                    "weekly",
                                    "Weekly Reminder",
                                    "Get reminded once a week",
                                  ],
                                ].map((item, index) => {
                                  const generateId = `${item[0]}-${index}`;
                                  return (
                                    <div
                                      key={generateId}
                                      className="border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col gap-4 border p-4 outline-none first:rounded-t-md last:rounded-b-md has-data-[state=checked]:z-10"
                                    >
                                      <div className="flex items-center gap-4">
                                        <RadioGroupItem
                                          id={generateId}
                                          value={item[0]}
                                          className="after:absolute after:inset-0"
                                          aria-describedby={generateId}
                                        />
                                        <div className="flex flex-col gap-2">
                                          <Label
                                            className="inline-flex items-start"
                                            htmlFor={generateId}
                                          >
                                            {item[1]}
                                          </Label>
                                          <div
                                            id={generateId}
                                            className="text-muted-foreground text-xs leading-[inherit]"
                                          >
                                            {item[2]}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch(`items.${index}.reminderType`) ===
                        "weekly" && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.reminderDay`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Which day of the week?</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mon">Monday</SelectItem>
                                  <SelectItem value="tue">Tuesday</SelectItem>
                                  <SelectItem value="wed">Wednesday</SelectItem>
                                  <SelectItem value="thu">Thursday</SelectItem>
                                  <SelectItem value="fri">Friday</SelectItem>
                                  <SelectItem value="sat">Saturday</SelectItem>
                                  <SelectItem value="sun">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose which day you would like to be reminded
                                weekly
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {(form.watch(`items.${index}.reminderType`) === "daily" ||
                        form.watch(`items.${index}.reminderType`) ===
                          "weekly") && (
                        <FormField
                          control={form.control}
                          name={`items.${index}.reminderTime`}
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                form.watch(`items.${index}.reminderType`) ===
                                  "daily" && "col-span-full"
                              )}
                            >
                              <FormLabel>Time of day?</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    markAsModified(
                                      form.getValues().items[index].id
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Choose a time works best for your schedule
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {!isArchived && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addNewItem}
            >
              <PlusCircle />
              Add Another Form
            </Button>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
